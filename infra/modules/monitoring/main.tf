# Espace de travail qui centralise les logs (Container Apps, Application Insights)
resource "azurerm_log_analytics_workspace" "main" {
  name                = "law-${var.name_prefix}"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = var.retention_in_days
  tags                = var.tags
}

# Supervision applicative : visites, erreurs, performances, tests de disponibilité
resource "azurerm_application_insights" "main" {
  name                = "appi-${var.name_prefix}"
  location            = var.location
  resource_group_name = var.resource_group_name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"
  tags                = var.tags
}

# ---------------------------------------------------------------------------
# Disponibilité et alertes (uniquement si enable_availability_test = true)
# ---------------------------------------------------------------------------

# Destinataires des alertes
resource "azurerm_monitor_action_group" "main" {
  count = var.enable_availability_test ? 1 : 0

  name                = "ag-${var.name_prefix}"
  resource_group_name = var.resource_group_name
  short_name          = substr(var.name_prefix, 0, 12)
  tags                = var.tags

  email_receiver {
    name                    = "equipe"
    email_address           = var.alert_email
    use_common_alert_schema = true
  }

  lifecycle {
    precondition {
      condition     = var.alert_email != null && var.alert_email != ""
      error_message = "alert_email est obligatoire quand le test de disponibilité est activé (variable TF_VAR_alert_email)."
    }
  }
}

# Test de disponibilité : Azure appelle l'URL depuis 3 régions, toutes les 15 minutes
resource "azurerm_application_insights_standard_web_test" "availability" {
  count = var.enable_availability_test ? 1 : 0

  name                    = "webtest-${var.name_prefix}"
  description             = "Vérifie que l'application répond sur /healthz."
  resource_group_name     = var.resource_group_name
  location                = var.location
  application_insights_id = azurerm_application_insights.main.id
  frequency               = var.availability_frequency
  timeout                 = 30
  enabled                 = true
  retry_enabled           = true

  # France Central, Europe de l'Ouest (Pays-Bas), Europe du Nord (Irlande)
  geo_locations = ["emea-fr-pra-edge", "emea-nl-ams-azr", "emea-gb-db3-azr"]

  request {
    url = var.availability_url
  }

  validation_rules {
    expected_status_code        = 200
    ssl_check_enabled           = true
    ssl_cert_remaining_lifetime = 7
  }

  # Azure ajoute ce tag pour relier le test à Application Insights : le déclarer
  # évite une modification fantôme à chaque plan.
  tags = merge(var.tags, {
    "hidden-link:${azurerm_application_insights.main.id}" = "Resource"
  })
}

# Alerte : si le test échoue depuis au moins 2 régions sur 3
resource "azurerm_monitor_metric_alert" "availability" {
  count = var.enable_availability_test ? 1 : 0

  name                = "alert-disponibilite-${var.name_prefix}"
  description         = "L'application ${var.name_prefix} ne répond plus depuis au moins 2 régions."
  resource_group_name = var.resource_group_name
  severity            = 1
  frequency           = "PT1M"
  window_size         = "PT15M"
  auto_mitigate       = true
  tags                = var.tags

  scopes = [
    azurerm_application_insights_standard_web_test.availability[0].id,
    azurerm_application_insights.main.id,
  ]

  application_insights_web_test_location_availability_criteria {
    web_test_id           = azurerm_application_insights_standard_web_test.availability[0].id
    component_id          = azurerm_application_insights.main.id
    failed_location_count = 2
  }

  action {
    action_group_id = azurerm_monitor_action_group.main[0].id
  }
}