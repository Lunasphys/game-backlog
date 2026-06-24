data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  name                       = "kv-game-backlog-${var.environment}"
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7

  # Access policy for your personal account (local terraform runs)
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = "11f09bfe-e5b8-4edd-ad7b-98a2db551100"

    secret_permissions = [
      "Get", "List", "Set", "Delete", "Purge"
    ]
  }

  # Access policy for GitHub Actions Service Principal
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = "b690c54a-4ea6-4495-a354-7e9492590329"

    secret_permissions = [
      "Get", "List", "Set", "Delete", "Purge"
    ]
  }
}

resource "azurerm_key_vault_secret" "db_url" {
  name         = "DATABASE-URL"
  value        = "postgresql://gamebacklog_admin:${var.db_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/gamebacklog_dev"
  key_vault_id = azurerm_key_vault.main.id
}