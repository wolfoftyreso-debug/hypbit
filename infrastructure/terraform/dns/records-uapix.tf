# DNS records for uapix.com

resource "cloudflare_record" "uapix_com_api_cname" {
  zone_id = cloudflare_zone.uapix_com.id
  name    = "api"
  type    = "CNAME"
  value   = "api.hypbit.com"
  proxied = true
}

resource "cloudflare_record" "uapix_com_portal_cname" {
  zone_id = cloudflare_zone.uapix_com.id
  name    = "portal"
  type    = "CNAME"
  value   = "uapix.pages.dev"
  proxied = true
}

resource "cloudflare_record" "uapix_com__cname" {
  zone_id = cloudflare_zone.uapix_com.id
  name    = "@"
  type    = "CNAME"
  value   = "uapix.pages.dev"
  proxied = true
}

resource "cloudflare_record" "uapix_com_www_cname" {
  zone_id = cloudflare_zone.uapix_com.id
  name    = "www"
  type    = "CNAME"
  value   = "uapix.pages.dev"
  proxied = true
}
