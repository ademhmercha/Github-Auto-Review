# Groupe de ressources des éléments partagés entre dev et prod
resource "azurerm_resource_group" "shared" {
  name     = "rg-${local.name_prefix}"
  location = var.location
  tags     = local.tags
}

# Registre unique : l'image est construite une fois, puis promue de dev à prod
resource "azurerm_container_registry" "acr" { # NOSONAR : pas d'identité nécessaire, voir commentaire plus bas
  # Exceptions Checkov, revues et justifiées (contexte : abonnement étudiant, SKU Basic)
  #checkov:skip=CKV_AZURE_139:Accès public requis par les agents hébergés d'Azure Pipelines. Désactivation possible uniquement en Premium avec endpoints privés. Accès authentifié par Entra ID, compte admin désactivé.
  #checkov:skip=CKV_AZURE_163:Risque couvert : chaque image est scannée par Trivy dans le pipeline (bloquant sur HIGH et CRITICAL) avant publication.
  #checkov:skip=CKV_AZURE_164:Content trust réservé au SKU Premium. Évolution prévue : signature des images dans le pipeline.
  #checkov:skip=CKV_AZURE_165:Sans objet : application déployée dans une seule région.
  #checkov:skip=CKV_AZURE_166:Risque couvert : seules des images déjà scannées par Trivy sont publiées par le pipeline.
  #checkov:skip=CKV_AZURE_167:Politique de rétention réservée au SKU Premium. Volume d'images faible dans ce projet.
  #checkov:skip=CKV_AZURE_233:Redondance de zone réservée au SKU Premium. Une indisponibilité du registre n'interrompt pas l'application déjà déployée.
  #checkov:skip=CKV_AZURE_237:Points de terminaison de données dédiés réservés au SKU Premium, utiles surtout avec des réseaux privés.

  name                = "acr${var.project}${var.suffix}"
  resource_group_name = azurerm_resource_group.shared.name
  location            = azurerm_resource_group.shared.location
  sku                 = var.acr_sku

  # Pas de compte admin avec mot de passe : accès uniquement par identités Azure
  admin_enabled = false

  # Choix assumé : accès réseau public conservé (voir l'exception CKV_AZURE_139 ci-dessus)
  public_network_access_enabled = true # NOSONAR : choix assumé, voir les exceptions Checkov ci-dessus

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