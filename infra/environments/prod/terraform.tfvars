project         = "gar"
environment     = "prod"
location        = "francecentral"
container_image = "github-auto-review:initial"

# La prod reste toujours allumée et peut monter à 2 instances
min_replicas  = 1
max_replicas  = 2
revision_mode = "Multiple" # plusieurs révisions actives pour le blue-green

# Supervision : test de disponibilité toutes les 15 minutes et alerte e-mail
enable_availability_test = true