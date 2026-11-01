output "resource_group_name" {
  description = "Groupe de ressources de l'environnement."
  value       = azurerm_resource_group.main.name
}

output "container_app_name" {
  description = "Nom de la Container App (utilisé par le pipeline pour déployer)."
  value       = module.app.container_app_name
}

output "app_url" {
  description = "URL publique de l'application."
  value       = "https://${module.app.fqdn}"
}

output "app_insights_connection_string" {
  description = "Chaîne de connexion d'Application Insights."
  value       = module.monitoring.app_insights_connection_string
  sensitive   = true
}