variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
  default     = "dev"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "francecentral"
}

variable "db_admin_password" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true
}

# RAWG API key used by the backend
variable "rawg_api_key" {
  description = "RAWG.io API key"
  type        = string
  sensitive   = true
}

variable "kv_admin_object_id" {
  description = "Object ID of the admin user for Key Vault access"
  type        = string
  sensitive   = true
}

variable "github_sp_object_id" {
  description = "Object ID of the GitHub Actions Service Principal"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "gamebacklog"
}