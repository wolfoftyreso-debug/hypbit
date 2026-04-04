# DNS records for landvex.com

resource "cloudflare_record" "landvex_com__cname" {
  zone_id = cloudflare_zone.landvex_com.id
  name    = "@"
  type    = "CNAME"
  value   = "d19i2xvp4n5r1i.cloudfront.net"
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "landvex_com_www_cname" {
  zone_id = cloudflare_zone.landvex_com.id
  name    = "www"
  type    = "CNAME"
  value   = "d19i2xvp4n5r1i.cloudfront.net"
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "landvex_com__txt" {
  zone_id = cloudflare_zone.landvex_com.id
  name    = "@"
  type    = "TXT"
  value   = "google-site-verification=6e8FjB-LWL0u1hH-tRWDZTbX2_4-pKQKAKC2bGLpKec"
  proxied = false
  ttl     = 300
}

# DNS records for landvex.se

resource "cloudflare_record" "landvex_se__cname" {
  zone_id = cloudflare_zone.landvex_se.id
  name    = "@"
  type    = "CNAME"
  value   = "landvex.pages.dev"
  proxied = true
}

resource "cloudflare_record" "landvex_se_www_cname" {
  zone_id = cloudflare_zone.landvex_se.id
  name    = "www"
  type    = "CNAME"
  value   = "landvex.pages.dev"
  proxied = true
}
