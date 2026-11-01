variable "name_prefix" {
  type        = string
  description = "Préfixe des noms de ressources (ex : gar-dev)."
}

variable "location" {
  type        = string
  description = "Région Azure (doit être celle de l'environnement Container Apps)."
}

variable "resource_group_name" {
  type        = string
  description = "Groupe de ressources de l'application."
}

variable "container_app_environment_id" {
  type        = string
  description = "Identifiant de l'environnement Container Apps partagé dans lequel déployer l'application."
}

variable "acr_id" {
  type        = string
  description = "Identifiant du registre, pour donner le droit d'y lire les images."
}

variable "acr_login_server" {
  type        = string
  description = "Adresse du registre (ex : acrgar10137.azurecr.io)."
}

variable "container_image" {
  type        = string
  description = "Image initiale au format nom:tag. Ensuite, c'est le pipeline qui la met à jour."
}

variable "target_port" {
  type        = number
  description = "Port écouté par le conteneur."
  default     = 8080
}

variable "cpu" {
  type        = number
  description = "Nombre de vCPU alloués au conteneur."
  default     = 0.25
}

variable "memory" {
  type        = string
  description = "Mémoire allouée au conteneur (doit correspondre au CPU, ex : 0.5Gi pour 0.25 vCPU)."
  default     = "0.5Gi"
}

variable "min_replicas" {
  type        = number
  description = "Nombre minimum d'instances (0 = l'appli s'éteint quand elle n'est pas utilisée)."
  default     = 0
}

variable "max_replicas" {
  type        = number
  description = "Nombre maximum d'instances."
  default     = 1
}

variable "revision_mode" {
  type        = string
  description = "Single (une version active) ou Multiple (plusieurs versions, pour le blue-green)."
  default     = "Single"

  validation {
    condition     = contains(["Single", "Multiple"], var.revision_mode)
    error_message = "revision_mode doit valoir Single ou Multiple."
  }
}

variable "tags" {
  type        = map(string)
  description = "Tags appliqués aux ressources."
  default     = {}
}