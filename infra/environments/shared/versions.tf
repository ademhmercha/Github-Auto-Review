terraform {
  required_version = ">= 1.9.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  # État distant : stocké dans le compte de stockage créé à la main (bootstrap)
  backend "azurerm" {
    resource_group_name  = "rg-gar-tfstate"
    storage_account_name = "sttfstategar10137"
    container_name       = "tfstate"
    key                  = "shared.tfstate"
  }
}

provider "azurerm" {
  features {}

  # Les fournisseurs de ressources ont déjà été enregistrés à la main
  resource_provider_registrations = "none"

  # L'ID d'abonnement est lu depuis la variable d'environnement ARM_SUBSCRIPTION_ID
}