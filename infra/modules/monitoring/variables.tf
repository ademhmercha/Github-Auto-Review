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