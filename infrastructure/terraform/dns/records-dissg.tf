# DNS records for dissg.app

resource "cloudflare_record" "dissg_app__cname" {
  zone_id = cloudflare_zone.dissg_app.id
  name    = "@"
  type    = "CNAME"
  value   = "dissg.pages.dev"
  proxied = true
}

resource "cloudflare_record" "dissg_app_www_cname" {
  zone_id = cloudflare_zone.dissg_app.id
  name    = "www"
  type    = "CNAME"
  value   = "dissg.pages.dev"
  proxied = true
}

# DNS records for dissg.com

resource "cloudflare_record" "dissg_com__cname" {
  zone_id = cloudflare_zone.dissg_com.id
  name    = "@"
  type    = "CNAME"
  value   = "dissg.pages.dev"
  proxied = true
}

resource "cloudflare_record" "dissg_com_www_cname" {
  zone_id = cloudflare_zone.dissg_com.id
  name    = "www"
  type    = "CNAME"
  value   = "dissg.pages.dev"
  proxied = true
}

# DNS records for dissg.digital

resource "cloudflare_record" "dissg_digital__cname" {
  zone_id = cloudflare_zone.dissg_digital.id
  name    = "@"
  type    = "CNAME"
  value   = "dissg.pages.dev"
  proxied = true
}

resource "cloudflare_record" "dissg_digital_www_cname" {
  zone_id = cloudflare_zone.dissg_digital.id
  name    = "www"
  type    = "CNAME"
  value   = "dissg.pages.dev"
  proxied = true
}

# DNS records for dissg.io

resource "cloudflare_record" "dissg_io__cname" {
  zone_id = cloudflare_zone.dissg_io.id
  name    = "@"
  type    = "CNAME"
  value   = "dissg.pages.dev"
  proxied = true
}

resource "cloudflare_record" "dissg_io_www_cname" {
  zone_id = cloudflare_zone.dissg_io.id
  name    = "www"
  type    = "CNAME"
  value   = "dissg.pages.dev"
  proxied = true
}

# DNS records for dissg.network

resource "cloudflare_record" "dissg_network__cname" {
  zone_id = cloudflare_zone.dissg_network.id
  name    = "@"
  type    = "CNAME"
  value   = "dissg.pages.dev"
  proxied = true
}

resource "cloudflare_record" "dissg_network_www_cname" {
  zone_id = cloudflare_zone.dissg_network.id
  name    = "www"
  type    = "CNAME"
  value   = "dissg.pages.dev"
  proxied = true
}

# DNS records for dissg.systems

resource "cloudflare_record" "dissg_systems__cname" {
  zone_id = cloudflare_zone.dissg_systems.id
  name    = "@"
  type    = "CNAME"
  value   = "dissg.pages.dev"
  proxied = true
}

resource "cloudflare_record" "dissg_systems_www_cname" {
  zone_id = cloudflare_zone.dissg_systems.id
  name    = "www"
  type    = "CNAME"
  value   = "dissg.pages.dev"
  proxied = true
}

# DNS records for dissg.world

resource "cloudflare_record" "dissg_world__cname" {
  zone_id = cloudflare_zone.dissg_world.id
  name    = "@"
  type    = "CNAME"
  value   = "dissg.pages.dev"
  proxied = true
}

resource "cloudflare_record" "dissg_world_www_cname" {
  zone_id = cloudflare_zone.dissg_world.id
  name    = "www"
  type    = "CNAME"
  value   = "dissg.pages.dev"
  proxied = true
}
