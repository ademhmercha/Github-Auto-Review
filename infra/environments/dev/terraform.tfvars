project         = "gar"
environment     = "dev"
location        = "francecentral"
container_image = "github-auto-review:initial"

# Le dev s'éteint quand personne ne l'utilise : coût quasi nul
min_replicas  = 0
max_replicas  = 1
revision_mode = "Single"