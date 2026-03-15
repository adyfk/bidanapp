variable "db_url" {
  type    = string
  default = "postgres://postgres:postgres@host.docker.internal:5432/bidanapp?sslmode=disable"
}

env "local" {
  src = "file://db/schema.sql"
  dev = "docker://postgres/18/dev?search_path=public"
  url = var.db_url

  migration {
    dir = "file://db/migrations"
  }

  format {
    migrate {
      diff = "{{ sql . \"  \" }}"
    }
  }
}
