# DNS records for quixzoom.com

resource "cloudflare_record" "quixzoom_com_ads_cname" {
  zone_id = cloudflare_zone.quixzoom_com.id
  name    = "ads"
  type    = "CNAME"
  value   = "quixzoom-landing.pages.dev"
  proxied = true
}

resource "cloudflare_record" "quixzoom_com_api_cname" {
  zone_id = cloudflare_zone.quixzoom_com.id
  name    = "api"
  type    = "CNAME"
  value   = "wavult-api-alb-2055020040.eu-north-1.elb.amazonaws.com"
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "quixzoom_com_app_cname" {
  zone_id = cloudflare_zone.quixzoom_com.id
  name    = "app"
  type    = "CNAME"
  value   = "dewrtqzc20flx.cloudfront.net"
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "quixzoom_com_portal_cname" {
  zone_id = cloudflare_zone.quixzoom_com.id
  name    = "portal"
  type    = "CNAME"
  value   = "quixzoom-landing.pages.dev"
  proxied = true
}

resource "cloudflare_record" "quixzoom_com__cname" {
  zone_id = cloudflare_zone.quixzoom_com.id
  name    = "@"
  type    = "CNAME"
  value   = "d3nf5qp2za1hod.cloudfront.net"
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "quixzoom_com_www_cname" {
  zone_id = cloudflare_zone.quixzoom_com.id
  name    = "www"
  type    = "CNAME"
  value   = "d3nf5qp2za1hod.cloudfront.net"
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "quixzoom_com__mx" {
  zone_id = cloudflare_zone.quixzoom_com.id
  name    = "@"
  type    = "MX"
  value   = "inbound-smtp.eu-north-1.amazonaws.com"
  proxied = false
  priority = 10
  ttl     = 300
}

resource "cloudflare_record" "quixzoom_com_dmarc_txt" {
  zone_id = cloudflare_zone.quixzoom_com.id
  name    = "_dmarc"
  type    = "TXT"
  value   = "v=DMARC1; p=quarantine; rua=mailto:dmarc@wavult.com; fo=1"
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "quixzoom_com__txt" {
  zone_id = cloudflare_zone.quixzoom_com.id
  name    = "@"
  type    = "TXT"
  value   = "\"google-site-verification=hjqZIE0-bvEWphSKgqmPISLzyCh_BEl2S7bk1A3wxM0\""
  proxied = false
  ttl     = 3600
}

resource "cloudflare_record" "quixzoom_com__txt_1" {
  zone_id = cloudflare_zone.quixzoom_com.id
  name    = "@"
  type    = "TXT"
  value   = "v=spf1 include:amazonses.com ~all"
  proxied = false
  ttl     = 300
}
