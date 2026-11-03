# Lecture des outputs de l'environnement shared (le registre et la plateforme)
data "terraform_remote_state" "shared" {
  backend = "azurerm"

  config = {
    resource_group_name  = "rg-gar-tfstate"
    storage_account_name = "sttfstategar10137"
    container_name       = "tfstate"
    key                  = "shared.tfstate"
  }
}

resource "azurerm_resource_group" "main" {
  name     = "rg-${local.name_prefix}"
  location = var.location
  tags     = local.tags
}

module "monitoring" {
  source = "../../modules/monitoring"

  name_prefix         = local.name_prefix
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  retention_in_days   = var.log_retention_days
  tags                = local.tags

  # Test de disponibilité et alerte sur l'URL réelle de l'application
  enable_availability_test = var.enable_availability_test
  availability_url         = "https://${module.app.fqdn}/healthz"
  alert_email              = var.alert_email
}

module "app" {
  source = "../../modules/container_app"

  name_prefix         = local.name_prefix
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  # Environnement Container Apps partagé, lu dans l'état de shared
  container_app_environment_id = data.terraform_remote_state.shared.outputs.container_app_environment_id

  acr_id           = data.terraform_remote_state.shared.outputs.acr_id
  acr_login_server = data.terraform_remote_state.shared.outputs.acr_login_server
  container_image  = var.container_image

  min_replicas  = var.min_replicas
  max_replicas  = var.max_replicas
  revision_mode = var.revision_mode

  tags = local.tags
}