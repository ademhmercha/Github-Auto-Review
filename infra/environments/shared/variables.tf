variable "project" {
  type        = string
  description = "Nom court du projet, utilisé dans le nom de toutes les ressources."
}

variable "location" {
  type        = string
  description = "Région Azure où créer les ressources."

  validation {
    condition = contains(
      ["francecentral", "germanywestcentral", "italynorth", "polandcentral", "austriaeast"],
      var.location
    )
    error_message = "Région non autorisée par l'abonnement Azure for Students."
  }
}

variable "suffix" {
  type        = string
  description = "Suffixe unique pour les ressources dont le nom doit être unique dans tout Azure."
}

variable "acr_sku" {
  type        = string
  description = "Niveau de service du registre de conteneurs."
  default     = "Basic"

  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.acr_sku)
    error_message = "Le SKU doit être Basic, Standard ou Premium."
  }
}