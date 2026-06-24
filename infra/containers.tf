# Backend NestJS Container App
resource "azurerm_container_app" "backend" {
  name                         = "ca-game-backlog-backend-${var.environment}"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  # System-assigned identity for Key Vault access
  identity {
    type = "SystemAssigned"
  }

  registry {
    server               = azurerm_container_registry.main.login_server
    username             = azurerm_container_registry.main.admin_username
    password_secret_name = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.main.admin_password
  }

  template {
    container {
      name   = "backend"
      image  = "${azurerm_container_registry.main.login_server}/backend:latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }
    }
  }
}

# One-off job that applies pending Prisma migrations to the database.
# Triggered manually from the CI/CD pipeline after `terraform apply`,
# before the backend container app starts serving the new image.
resource "azurerm_container_app_job" "migrate" {
  name                         = "ca-game-backlog-migrate-${var.environment}"
  location                     = azurerm_resource_group.main.location
  resource_group_name          = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.main.id

  replica_timeout_in_seconds = 300
  replica_retry_limit        = 1

  manual_trigger_config {
    parallelism              = 1
    replica_completion_count = 1
  }

  registry {
    server               = azurerm_container_registry.main.login_server
    username             = azurerm_container_registry.main.admin_username
    password_secret_name = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.main.admin_password
  }

  secret {
    name  = "database-url"
    value = "postgresql://gamebacklog_admin:${var.db_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${var.db_name}"
  }

  template {
    container {
      name   = "migrate"
      image  = "${azurerm_container_registry.main.login_server}/backend-migrate:latest"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }
    }
  }
}