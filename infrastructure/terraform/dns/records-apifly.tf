# DNS records for apifly.com

resource "cloudflare_record" "apifly_com__cname" {
  zone_id = cloudflare_zone.apifly_com.id
  name    = "@"
  type    = "CNAME"
  value   = "apifly.pages.dev"
  proxied = true
}

resource "cloudflare_record" "apifly_com_portal_cname" {
  zone_id = cloudflare_zone.apifly_com.id
  name    = "portal"
  type    = "CNAME"
  value   = "apifly.pages.dev"
  proxied = true
}

resource "cloudflare_record" "apifly_com_www_cname" {
  zone_id = cloudflare_zone.apifly_com.id
  name    = "www"
  type    = "CNAME"
  value   = "apifly.pages.dev"
  proxied = true
}
