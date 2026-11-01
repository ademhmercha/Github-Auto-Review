# Groupe de ressources des éléments partagés entre dev et prod
resource "azurerm_resource_group" "shared" {
  name     = "rg-${local.name_prefix}"
  location = var.location
  tags     = local.tags
}

# Registre unique : l'image est construite une fois, puis promue de dev à prod
resource "azurerm_container_registry" "acr" { # NOSONAR : pas d'identité nécessaire, voir commentaire plus bas
  name                = "acr${var.project}${var.suffix}"
  resource_group_name = azurerm_resource_group.shared.name
  location            = azurerm_resource_group.shared.location
  sku                 = var.acr_sku

  # Pas de compte admin avec mot de passe : accès uniquement par identités Azure
  admin_enabled = false

  # Choix assumé : accès réseau public conservé. Désactiver l'accès public exige le SKU
  # Premium et des endpoints privés (coûteux), et les agents hébergés d'Azure Pipelines
  # doivent pouvoir pousser les images. Chaque accès reste authentifié par Entra ID.
  public_network_access_enabled = true # NOSONAR : choix assumé, voir commentaire au-dessus

  # Pas de bloc identity : il ne servirait que si le registre devait lui-même accéder à
  # d'autres ressources (ex : clé de chiffrement dans Key Vault). Ce sont les applications
  # qui accèdent au registre, avec leur propre identité (module container_app).

  tags = local.tags
}

# ---------------------------------------------------------------------------
# Plateforme Container Apps partagée
# L'abonnement Azure for Students n'autorise qu'un seul environnement Container
# Apps (hors mode Express) : dev et prod y déploient chacun leur application.
# ---------------------------------------------------------------------------

# Espace Log Analytics de la plateforme : reçoit les logs de tous les conteneurs
resource "azurerm_log_analytics_workspace" "platform" {
  name                = "law-${local.name_prefix}"
  location            = azurerm_resource_group.shared.location
  resource_group_name = azurerm_resource_group.shared.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.tags
}

# Environnement Container Apps partagé (plan Consumption, facturé à l'usage)
resource "azurerm_container_app_environment" "platform" {
  name                       = "cae-${local.name_prefix}"
  location                   = azurerm_resource_group.shared.location
  resource_group_name        = azurerm_resource_group.shared.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.platform.id
  tags                       = local.tags

  # Profil ajouté par Azure : le déclarer évite que Terraform veuille le retirer à chaque plan
  workload_profile {
    name                  = "Consumption"
    workload_profile_type = "Consumption"
  }
}

# Azure crée désormais les environnements en mode "Express", qui ne permet ni
# plusieurs révisions actives ni la répartition du trafic (blue-green).
# Le provider azurerm ne gère pas encore ce réglage : on le force avec azapi.
resource "azapi_resource_action" "environment_mode" {
  type        = "Microsoft.App/managedEnvironments@2025-10-02-preview"
  resource_id = azurerm_container_app_environment.platform.id
  method      = "PATCH"

  body = {
    properties = {
      environmentMode = "WorkloadProfiles"
    }
  }
}