# Retrieve current Azure client identity
data "azurerm_client_config" "current" {}

# Key Vault to store all application secrets
resource "azurerm_key_vault" "main" {
  name                      = "kv-game-backlog-${var.environment}"
  resource_group_name       = azurerm_resource_group.main.name
  location                  = azurerm_resource_group.main.location
  tenant_id                 = data.azurerm_client_config.current.tenant_id
  sku_name                  = "standard"
  soft_delete_retention_days = 7

  # Grant the current user (who runs terraform) full secrets permissions
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = [
      "Get", "List", "Set", "Delete", "Purge"
    ]
  }
}

# Store the database connection string as a secret
resource "azurerm_key_vault_secret" "db_url" {
  name         = "DATABASE-URL"
  value        = "postgresql://game-backlog_admin:${var.db_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/game-backlog"
  key_vault_id = azurerm_key_vault.main.id
}
