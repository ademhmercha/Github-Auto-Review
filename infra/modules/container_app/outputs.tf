output "container_app_name" {
  description = "Nom de la Container App."
  value       = azurerm_container_app.app.name
}

output "container_app_id" {
  description = "Identifiant de la Container App."
  value       = azurerm_container_app.app.id
}

output "fqdn" {
  description = "Nom de domaine public de l'application."
  value       = azurerm_container_app.app.ingress[0].fqdn
}

output "environment_id" {
  description = "Identifiant de l'environnement Container Apps."
  value       = azurerm_container_app_environment.main.id
}