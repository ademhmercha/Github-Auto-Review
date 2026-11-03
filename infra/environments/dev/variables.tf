variable "project" {
  type        = string
  description = "Nom court du projet."
}

variable "environment" {
  type        = string
  description = "Nom de l'environnement."

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "L'environnement doit être dev ou prod."
  }
}

variable "location" {
  type        = string
  description = "Région Azure."

  validation {
    condition = contains(
      ["francecentral", "germanywestcentral", "italynorth", "polandcentral", "austriaeast"],
      var.location
    )
    error_message = "Région non autorisée par l'abonnement Azure for Students."
  }
}

variable "container_image" {
  type        = string
  description = "Image initiale au format nom:tag."
}

variable "min_replicas" {
  type        = number
  description = "Nombre minimum d'instances."
}

variable "max_replicas" {
  type        = number
  description = "Nombre maximum d'instances."
}

variable "revision_mode" {
  type        = string
  description = "Single ou Multiple."
}

variable "log_retention_days" {
  type        = number
  description = "Durée de conservation des logs, en jours."
  default     = 30
}

variable "enable_availability_test" {
  type        = bool
  description = "Active le test de disponibilité et l'alerte e-mail."
  default     = false
}

variable "alert_email" {
  type        = string
  description = "Adresse e-mail des alertes, fournie par la variable d'environnement TF_VAR_alert_email."
  default     = null
}