locals {
  name_prefix = "${var.project}-shared"

  # Tags appliqués à toutes les ressources, pour savoir d'où elles viennent
  tags = {
    project     = var.project
    environment = "shared"
    managed_by  = "terraform"
  }
}