output "log_analytics_workspace_id" {
  description = "Identifiant de l'espace Log Analytics."
  value       = azurerm_log_analytics_workspace.main.id
}

output "app_insights_id" {
  description = "Identifiant d'Application Insights."
  value       = azurerm_application_insights.main.id
}

output "app_insights_connection_string" {
  description = "Chaîne de connexion d'Application Insights."
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}