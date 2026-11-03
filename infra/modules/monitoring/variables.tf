variable "name_prefix" {
  type        = string
  description = "Préfixe des noms de ressources (ex : gar-dev)."
}

variable "location" {
  type        = string
  description = "Région Azure."
}

variable "resource_group_name" {
  type        = string
  description = "Groupe de ressources dans lequel créer la supervision."
}

variable "retention_in_days" {
  type        = number
  description = "Durée de conservation des logs, en jours (30 minimum)."
  default     = 30
}

variable "tags" {
  type        = map(string)
  description = "Tags appliqués aux ressources."
  default     = {}
}

variable "enable_availability_test" {
  type        = bool
  description = "Active le test de disponibilité et l'alerte (à éviter sur un environnement qui s'éteint quand il n'est pas utilisé)."
  default     = false
}

variable "availability_url" {
  type        = string
  description = "URL testée par le test de disponibilité (ex : https://.../healthz)."
  default     = null
}

variable "availability_frequency" {
  type        = number
  description = "Fréquence du test en secondes (300, 600 ou 900). Chaque exécution est facturée, par région."
  default     = 900

  validation {
    condition     = contains([300, 600, 900], var.availability_frequency)
    error_message = "La fréquence doit valoir 300, 600 ou 900 secondes."
  }
}

variable "alert_email" {
  type        = string
  description = "Adresse e-mail qui reçoit les alertes. Fournie par le pipeline, jamais écrite dans le dépôt."
  default     = null
}