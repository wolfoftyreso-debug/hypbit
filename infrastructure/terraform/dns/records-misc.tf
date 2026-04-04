# DNS records for apbxp.cloud

# DNS records for apbxp.com

# DNS records for apbxp.dev

# DNS records for apbxp.io

# DNS records for apbxp.online

# DNS records for apbxp.org

# DNS records for apbxp.tech

# DNS records for clearneural.com

resource "cloudflare_record" "clearneural_com__cname" {
  zone_id = cloudflare_zone.clearneural_com.id
  name    = "@"
  type    = "CNAME"
  value   = "clearneural.pages.dev"
  proxied = true
}

resource "cloudflare_record" "clearneural_com_www_cname" {
  zone_id = cloudflare_zone.clearneural_com.id
  name    = "www"
  type    = "CNAME"
  value   = "clearneural.pages.dev"
  proxied = true
}

# DNS records for corpfitt.com

# DNS records for hypbit.com

resource "cloudflare_record" "hypbit_com_api_cname" {
  zone_id = cloudflare_zone.hypbit_com.id
  name    = "api"
  type    = "CNAME"
  value   = "wavult-api-alb-2055020040.eu-north-1.elb.amazonaws.com"
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "hypbit_com_app_cname" {
  zone_id = cloudflare_zone.hypbit_com.id
  name    = "app"
  type    = "CNAME"
  value   = "d1kvtgf5i55aab.cloudfront.net"
  proxied = false
}

resource "cloudflare_record" "hypbit_com_autoconfig_cname" {
  zone_id = cloudflare_zone.hypbit_com.id
  name    = "autoconfig"
  type    = "CNAME"
  value   = "autoconfig.loopia.com"
  proxied = true
}

resource "cloudflare_record" "hypbit_com_bernt_cname" {
  zone_id = cloudflare_zone.hypbit_com.id
  name    = "bernt"
  type    = "CNAME"
  value   = "paste-karma-performer-referring.trycloudflare.com"
  proxied = false
}

resource "cloudflare_record" "hypbit_com__cname" {
  zone_id = cloudflare_zone.hypbit_com.id
  name    = "@"
  type    = "CNAME"
  value   = "d14gf6x22fx96q.cloudfront.net"
  proxied = true
}

resource "cloudflare_record" "hypbit_com_os_cname" {
  zone_id = cloudflare_zone.hypbit_com.id
  name    = "os"
  type    = "CNAME"
  value   = "wolfoftyreso-debug.github.io"
  proxied = true
}

resource "cloudflare_record" "hypbit_com_www_cname" {
  zone_id = cloudflare_zone.hypbit_com.id
  name    = "www"
  type    = "CNAME"
  value   = "hypbit.com"
  proxied = true
}

resource "cloudflare_record" "hypbit_com__mx" {
  zone_id = cloudflare_zone.hypbit_com.id
  name    = "@"
  type    = "MX"
  value   = "mailcluster.loopia.se"
  proxied = false
  priority = 10
}

resource "cloudflare_record" "hypbit_com__mx_1" {
  zone_id = cloudflare_zone.hypbit_com.id
  name    = "@"
  type    = "MX"
  value   = "mail2.loopia.se"
  proxied = false
  priority = 20
}

resource "cloudflare_record" "hypbit_com_send_mx" {
  zone_id = cloudflare_zone.hypbit_com.id
  name    = "send"
  type    = "MX"
  value   = "feedback-smtp.eu-west-1.amazonses.com"
  proxied = false
  priority = 10
}

resource "cloudflare_record" "hypbit_com_bernt_test_txt" {
  zone_id = cloudflare_zone.hypbit_com.id
  name    = "bernt-test"
  type    = "TXT"
  value   = "test-123"
  proxied = false
  ttl     = 120
}

resource "cloudflare_record" "hypbit_com__txt" {
  zone_id = cloudflare_zone.hypbit_com.id
  name    = "@"
  type    = "TXT"
  value   = "\"google-site-verification=BbCxczBYNcKyz7LM7tESxllvttV7cESYfGz0mkUBGHE\""
  proxied = false
}

resource "cloudflare_record" "hypbit_com__txt_1" {
  zone_id = cloudflare_zone.hypbit_com.id
  name    = "@"
  type    = "TXT"
  value   = "\"v=spf1 include:spf.loopia.se -all\""
  proxied = false
}

resource "cloudflare_record" "hypbit_com_resend__domainkey_txt" {
  zone_id = cloudflare_zone.hypbit_com.id
  name    = "resend._domainkey"
  type    = "TXT"
  value   = "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDNkVhkFItCKN4TWtjqbORNb0gDBS9+QDvRWtseRnTTi+gCtlA2ML9UxGVxA+qCx7DI3MZoq+nSjQkS7k9Y5A9CkRlw2pk+zknKhZYb1aNJIy/4OEXuFN9IvphhlaqKa/8tXeFoXf/AEpMfHAS6Dd6lZGtkXXV2o79832PR00/2XQIDAQAB"
  proxied = false
}

resource "cloudflare_record" "hypbit_com_send_txt" {
  zone_id = cloudflare_zone.hypbit_com.id
  name    = "send"
  type    = "TXT"
  value   = "v=spf1 include:amazonses.com ~all"
  proxied = false
}

# DNS records for mlcs.com

# DNS records for opticinsights.com

resource "cloudflare_record" "opticinsights_com__cname" {
  zone_id = cloudflare_zone.opticinsights_com.id
  name    = "@"
  type    = "CNAME"
  value   = "opticinsights.pages.dev"
  proxied = true
}

resource "cloudflare_record" "opticinsights_com_www_cname" {
  zone_id = cloudflare_zone.opticinsights_com.id
  name    = "www"
  type    = "CNAME"
  value   = "opticinsights.pages.dev"
  proxied = true
}

# DNS records for pixdrift.com

resource "cloudflare_record" "pixdrift_com__a" {
  zone_id = cloudflare_zone.pixdrift_com.id
  name    = "*"
  type    = "A"
  value   = "194.9.94.85"
  proxied = true
}

resource "cloudflare_record" "pixdrift_com__a_1" {
  zone_id = cloudflare_zone.pixdrift_com.id
  name    = "*"
  type    = "A"
  value   = "194.9.94.86"
  proxied = true
}

resource "cloudflare_record" "pixdrift_com_admin_bc_cname" {
  zone_id = cloudflare_zone.pixdrift_com.id
  name    = "admin.bc"
  type    = "CNAME"
  value   = "d1lxaupcjwd2y0.cloudfront.net"
  proxied = false
  ttl     = 60
}

resource "cloudflare_record" "pixdrift_com_api_bc_cname" {
  zone_id = cloudflare_zone.pixdrift_com.id
  name    = "api.bc"
  type    = "CNAME"
  value   = "hypbit-api-alb-1238636464.eu-north-1.elb.amazonaws.com"
  proxied = false
  ttl     = 60
}

resource "cloudflare_record" "pixdrift_com_app_bc_cname" {
  zone_id = cloudflare_zone.pixdrift_com.id
  name    = "app.bc"
  type    = "CNAME"
  value   = "d2bmqxzyhu2af4.cloudfront.net"
  proxied = false
  ttl     = 60
}

resource "cloudflare_record" "pixdrift_com_bc_cname" {
  zone_id = cloudflare_zone.pixdrift_com.id
  name    = "bc"
  type    = "CNAME"
  value   = "d2bmqxzyhu2af4.cloudfront.net"
  proxied = false
  ttl     = 60
}

resource "cloudflare_record" "pixdrift_com_crm_bc_cname" {
  zone_id = cloudflare_zone.pixdrift_com.id
  name    = "crm.bc"
  type    = "CNAME"
  value   = "d270h53fvn20bu.cloudfront.net"
  proxied = false
  ttl     = 60
}

resource "cloudflare_record" "pixdrift_com_developers_cname" {
  zone_id = cloudflare_zone.pixdrift_com.id
  name    = "developers"
  type    = "CNAME"
  value   = "d2nvngupq3fkcm.cloudfront.net"
  proxied = false
  ttl     = 60
}

resource "cloudflare_record" "pixdrift_com__cname" {
  zone_id = cloudflare_zone.pixdrift_com.id
  name    = "@"
  type    = "CNAME"
  value   = "d32vz1dqlzn29d.cloudfront.net"
  proxied = false
  ttl     = 60
}

resource "cloudflare_record" "pixdrift_com_press_cname" {
  zone_id = cloudflare_zone.pixdrift_com.id
  name    = "press"
  type    = "CNAME"
  value   = "d1jehmey81q5ys.cloudfront.net"
  proxied = false
  ttl     = 60
}

resource "cloudflare_record" "pixdrift_com_sales_bc_cname" {
  zone_id = cloudflare_zone.pixdrift_com.id
  name    = "sales.bc"
  type    = "CNAME"
  value   = "d1r8hyoqjmk0sj.cloudfront.net"
  proxied = false
  ttl     = 60
}

resource "cloudflare_record" "pixdrift_com_status_cname" {
  zone_id = cloudflare_zone.pixdrift_com.id
  name    = "status"
  type    = "CNAME"
  value   = "api.bc.pixdrift.com"
  proxied = false
}

resource "cloudflare_record" "pixdrift_com_www_cname" {
  zone_id = cloudflare_zone.pixdrift_com.id
  name    = "www"
  type    = "CNAME"
  value   = "d32vz1dqlzn29d.cloudfront.net"
  proxied = true
}

resource "cloudflare_record" "pixdrift_com__txt" {
  zone_id = cloudflare_zone.pixdrift_com.id
  name    = "@"
  type    = "TXT"
  value   = "\"google-site-verification=OOVTWDi2ghepJbFV7rCWpmhQRNWS7-nImYMw8bxiSn8\""
  proxied = false
  ttl     = 3600
}

# DNS records for quixom.com

resource "cloudflare_record" "quixom_com__cname" {
  zone_id = cloudflare_zone.quixom_com.id
  name    = "@"
  type    = "CNAME"
  value   = "quixom.pages.dev"
  proxied = true
}

resource "cloudflare_record" "quixom_com_www_cname" {
  zone_id = cloudflare_zone.quixom_com.id
  name    = "www"
  type    = "CNAME"
  value   = "quixom.pages.dev"
  proxied = true
}

# DNS records for strim.se

# DNS records for supportfounds.com
