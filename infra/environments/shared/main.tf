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