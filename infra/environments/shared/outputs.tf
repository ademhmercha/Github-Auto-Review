output "resource_group_name" {
  description = "Nom du groupe de ressources partagé."
  value       = azurerm_resource_group.shared.name
}

output "acr_id" {
  description = "Identifiant Azure du registre (utilisé pour donner des droits)."
  value       = azurerm_container_registry.acr.id
}

output "acr_name" {
  description = "Nom du registre."
  value       = azurerm_container_registry.acr.name
}

output "acr_login_server" {
  description = "Adresse du registre, utilisée pour pousser et tirer les images."
  value       = azurerm_container_registry.acr.login_server
}