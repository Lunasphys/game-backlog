# Resource group for all game-backlog resources
resource "azurerm_resource_group" "main" {
  name     = "rg-game-backlog-${var.environment}"
  location = var.location
  tags = {
    Environment = var.environment
    Project     = "game-backlog"
    ManagedBy   = "terraform"
  }
}

# Private container registry to store Docker images
resource "azurerm_container_registry" "main" {
  name                = "acrgamebacklog${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true
}

# Log Analytics workspace for ACA observability
resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-game-backlog-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# Azure Container Apps environment (shared network for all containers)
resource "azurerm_container_app_environment" "main" {
  name                       = "cae-game-backlog-${var.environment}"
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
}