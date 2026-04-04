# Cloudflare zones — one resource per domain

resource "cloudflare_zone" "apbxp_cloud" {
  account_id = var.account_id
  zone       = "apbxp.cloud"
}

resource "cloudflare_zone" "apbxp_com" {
  account_id = var.account_id
  zone       = "apbxp.com"
}

resource "cloudflare_zone" "apbxp_dev" {
  account_id = var.account_id
  zone       = "apbxp.dev"
}

resource "cloudflare_zone" "apbxp_io" {
  account_id = var.account_id
  zone       = "apbxp.io"
}

resource "cloudflare_zone" "apbxp_online" {
  account_id = var.account_id
  zone       = "apbxp.online"
}

resource "cloudflare_zone" "apbxp_org" {
  account_id = var.account_id
  zone       = "apbxp.org"
}

resource "cloudflare_zone" "apbxp_tech" {
  account_id = var.account_id
  zone       = "apbxp.tech"
}

resource "cloudflare_zone" "apifly_com" {
  account_id = var.account_id
  zone       = "apifly.com"
}

resource "cloudflare_zone" "clearneural_com" {
  account_id = var.account_id
  zone       = "clearneural.com"
}

resource "cloudflare_zone" "corpfitt_com" {
  account_id = var.account_id
  zone       = "corpfitt.com"
}

resource "cloudflare_zone" "dissg_app" {
  account_id = var.account_id
  zone       = "dissg.app"
}

resource "cloudflare_zone" "dissg_com" {
  account_id = var.account_id
  zone       = "dissg.com"
}

resource "cloudflare_zone" "dissg_digital" {
  account_id = var.account_id
  zone       = "dissg.digital"
}

resource "cloudflare_zone" "dissg_io" {
  account_id = var.account_id
  zone       = "dissg.io"
}

resource "cloudflare_zone" "dissg_network" {
  account_id = var.account_id
  zone       = "dissg.network"
}

resource "cloudflare_zone" "dissg_systems" {
  account_id = var.account_id
  zone       = "dissg.systems"
}

resource "cloudflare_zone" "dissg_world" {
  account_id = var.account_id
  zone       = "dissg.world"
}

resource "cloudflare_zone" "hypbit_com" {
  account_id = var.account_id
  zone       = "hypbit.com"
}

resource "cloudflare_zone" "landvex_com" {
  account_id = var.account_id
  zone       = "landvex.com"
}

resource "cloudflare_zone" "landvex_se" {
  account_id = var.account_id
  zone       = "landvex.se"
}

resource "cloudflare_zone" "mlcs_com" {
  account_id = var.account_id
  zone       = "mlcs.com"
}

resource "cloudflare_zone" "opticinsights_com" {
  account_id = var.account_id
  zone       = "opticinsights.com"
}

resource "cloudflare_zone" "pixdrift_com" {
  account_id = var.account_id
  zone       = "pixdrift.com"
}

resource "cloudflare_zone" "quixom_com" {
  account_id = var.account_id
  zone       = "quixom.com"
}

resource "cloudflare_zone" "quixzoom_com" {
  account_id = var.account_id
  zone       = "quixzoom.com"
}

resource "cloudflare_zone" "strim_se" {
  account_id = var.account_id
  zone       = "strim.se"
}

resource "cloudflare_zone" "supportfounds_com" {
  account_id = var.account_id
  zone       = "supportfounds.com"
}

resource "cloudflare_zone" "uapix_com" {
  account_id = var.account_id
  zone       = "uapix.com"
}

resource "cloudflare_zone" "wavult_com" {
  account_id = var.account_id
  zone       = "wavult.com"
}
