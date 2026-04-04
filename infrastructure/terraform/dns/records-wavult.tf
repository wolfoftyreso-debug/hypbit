# DNS records for wavult.com

resource "cloudflare_record" "wavult_com_admin_cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "admin"
  type    = "CNAME"
  value   = "wavult-admin.pages.dev"
  proxied = true
}

resource "cloudflare_record" "wavult_com_api_cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "api"
  type    = "CNAME"
  value   = "wavult-api-alb-2055020040.eu-north-1.elb.amazonaws.com"
  proxied = false
}

resource "cloudflare_record" "wavult_com_app_cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "app"
  type    = "CNAME"
  value   = "wavult-app.pages.dev"
  proxied = true
}

resource "cloudflare_record" "wavult_com_bernt_cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "bernt"
  type    = "CNAME"
  value   = "5b5a0e81-d22c-4dac-8203-e2e31040aa76.cfargotunnel.com"
  proxied = true
}

resource "cloudflare_record" "wavult_com_brief_cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "brief"
  type    = "CNAME"
  value   = "d14gf6x22fx96q.cloudfront.net"
  proxied = false
}

resource "cloudflare_record" "wavult_com_c5jp7uswcajermjbig5mtbfdfuwmojlb__domainkey_cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "c5jp7uswcajermjbig5mtbfdfuwmojlb._domainkey"
  type    = "CNAME"
  value   = "c5jp7uswcajermjbig5mtbfdfuwmojlb.dkim.amazonses.com"
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "wavult_com_careers_cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "careers"
  type    = "CNAME"
  value   = "wavult-group.pages.dev"
  proxied = true
}

resource "cloudflare_record" "wavult_com_developers_cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "developers"
  type    = "CNAME"
  value   = "wavult-api-docs.pages.dev"
  proxied = true
}

resource "cloudflare_record" "wavult_com_docs_cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "docs"
  type    = "CNAME"
  value   = "wavult-group.pages.dev"
  proxied = true
}

resource "cloudflare_record" "wavult_com_git_cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "git"
  type    = "CNAME"
  value   = "d1ugweiji9520r.cloudfront.net"
  proxied = true
}

resource "cloudflare_record" "wavult_com_invest_cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "invest"
  type    = "CNAME"
  value   = "wavult-group.pages.dev"
  proxied = true
}

resource "cloudflare_record" "wavult_com_mn6nfifhv3ldzsye4sjcsyiwwazmdpii__domainkey_cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "mn6nfifhv3ldzsye4sjcsyiwwazmdpii._domainkey"
  type    = "CNAME"
  value   = "mn6nfifhv3ldzsye4sjcsyiwwazmdpii.dkim.amazonses.com"
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "wavult_com_n8n_cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "n8n"
  type    = "CNAME"
  value   = "wavult-api-alb-2055020040.eu-north-1.elb.amazonaws.com"
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "wavult_com_ops_cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "ops"
  type    = "CNAME"
  value   = "d1moyzq0r9e8tq.cloudfront.net"
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "wavult_com_os_cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "os"
  type    = "CNAME"
  value   = "wavult-os.pages.dev"
  proxied = true
}

resource "cloudflare_record" "wavult_com_sqnzblgb7ajul3vgelqju3j4fhqrqnh6__domainkey_cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "sqnzblgb7ajul3vgelqju3j4fhqrqnh6._domainkey"
  type    = "CNAME"
  value   = "sqnzblgb7ajul3vgelqju3j4fhqrqnh6.dkim.amazonses.com"
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "wavult_com_status_cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "status"
  type    = "CNAME"
  value   = "wavult-status.pages.dev"
  proxied = true
}

resource "cloudflare_record" "wavult_com_supabase_cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "supabase"
  type    = "CNAME"
  value   = "wavult-api-alb-2055020040.eu-north-1.elb.amazonaws.com"
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "wavult_com__cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "@"
  type    = "CNAME"
  value   = "dmc6o3jsimtv5.cloudfront.net"
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "wavult_com_www_cname" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "www"
  type    = "CNAME"
  value   = "dmc6o3jsimtv5.cloudfront.net"
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "wavult_com_send_mx" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "send"
  type    = "MX"
  value   = "feedback-smtp.eu-west-1.amazonses.com"
  proxied = false
  priority = 10
}

resource "cloudflare_record" "wavult_com__mx" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "@"
  type    = "MX"
  value   = "inbound-smtp.eu-north-1.amazonaws.com"
  proxied = false
  priority = 10
  ttl     = 300
}

resource "cloudflare_record" "wavult_com_dmarc_txt" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "_dmarc"
  type    = "TXT"
  value   = "v=DMARC1; p=quarantine; rua=mailto:dmarc@wavult.com; ruf=mailto:dmarc@wavult.com; fo=1"
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "wavult_com_resend__domainkey_txt" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "resend._domainkey"
  type    = "TXT"
  value   = "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC0jNpvRAbO7EYisQ+R0s"
  proxied = false
}

resource "cloudflare_record" "wavult_com_send_txt" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "send"
  type    = "TXT"
  value   = "v=spf1 include:amazonses.com ~all"
  proxied = false
}

resource "cloudflare_record" "wavult_com__txt" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "@"
  type    = "TXT"
  value   = "google-site-verification=6e8FjB-LWL0u1hH-tRWDZTbX2_4-pKQKAKC2bGLpKec"
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "wavult_com__txt_1" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "@"
  type    = "TXT"
  value   = "\"google-site-verification=m3e6a3vh4tuRmQBJckzijnbk3EJid36IwIqAMomCuC4\""
  proxied = false
  ttl     = 3600
}

resource "cloudflare_record" "wavult_com__txt_2" {
  zone_id = cloudflare_zone.wavult_com.id
  name    = "@"
  type    = "TXT"
  value   = "v=spf1 include:amazonses.com ~all"
  proxied = false
  ttl     = 300
}
