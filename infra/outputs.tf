output "acr_login_server" {
  description = "Container Registry URL"
  value       = azurerm_container_registry.main.login_server
}

output "backend_url" {
  description = "Backend public URL"
  value       = "https://${azurerm_container_app.backend.latest_revision_fqdn}"
}

output "database_fqdn" {
  description = "PostgreSQL server FQDN"
  value       = azurerm_postgresql_flexible_server.main.fqdn
  sensitive   = true
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}