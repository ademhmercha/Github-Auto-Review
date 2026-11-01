# Identité de l'application : lui permet de lire les images du registre sans mot de passe
resource "azurerm_user_assigned_identity" "app" {
  name                = "id-${var.name_prefix}"
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

# Droit minimal : lecture seule (AcrPull) sur le registre
resource "azurerm_role_assignment" "acr_pull" {
  scope                = var.acr_id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}

# L'application, déployée dans l'environnement Container Apps partagé
resource "azurerm_container_app" "app" {
  name                         = "ca-${var.name_prefix}"
  container_app_environment_id = var.container_app_environment_id
  resource_group_name          = var.resource_group_name
  revision_mode                = var.revision_mode
  workload_profile_name        = "Consumption"
  tags                         = var.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.app.id]
  }

  registry {
    server   = var.acr_login_server
    identity = azurerm_user_assigned_identity.app.id
  }

  ingress {
    external_enabled           = true
    target_port                = var.target_port
    allow_insecure_connections = false

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    container {
      name   = "web"
      image  = "${var.acr_login_server}/${var.container_image}"
      cpu    = var.cpu
      memory = var.memory

      liveness_probe {
        transport = "HTTP"
        port      = var.target_port
        path      = "/healthz"
      }

      readiness_probe {
        transport = "HTTP"
        port      = var.target_port
        path      = "/healthz"
      }
    }
  }

  # Terraform crée l'application, mais c'est le pipeline qui déploie les nouvelles
  # images et répartit le trafic (blue-green). Terraform ne doit pas annuler ces changements.
  lifecycle {
    ignore_changes = [
      template[0].container[0].image,
      ingress[0].traffic_weight,
    ]
  }

  # Le droit de lecture sur le registre doit exister avant le premier téléchargement d'image
  depends_on = [azurerm_role_assignment.acr_pull]
}