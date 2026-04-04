# Wavult DNS — Terraform

Manages all Cloudflare DNS zones and records for the Wavult Group.

## Domains managed

- wavult.com
- quixzoom.com
- landvex.com + landvex.se
- apifly.com
- dissg.com, dissg.app, dissg.io, dissg.digital, dissg.network, dissg.systems, dissg.world
- uapix.com
- hypbit.com, pixdrift.com, quixom.com, opticinsights.com, clearneural.com, mlcs.com, strim.se, corpfitt.com, supportfounds.com, apbxp.*

## Setup

```bash
export TF_VAR_cloudflare_email="wolfoftyreso@gmail.com"
export TF_VAR_cloudflare_api_key="$CF_GLOBAL_KEY"
```

## Commands

```bash
cd infrastructure/terraform/dns

terraform init
terraform plan
terraform apply
```

## Remote State

Stored in S3: `wavult-terraform-state/dns/terraform.tfstate` (eu-north-1)

## Structure

| File | Description |
|---|---|
| `main.tf` | Provider config + S3 backend |
| `variables.tf` | Input variables (email, api_key, account_id) |
| `zones.tf` | All Cloudflare zone resources |
| `records-wavult.tf` | wavult.com records |
| `records-quixzoom.tf` | quixzoom.com records |
| `records-landvex.tf` | landvex.com + landvex.se records |
| `records-apifly.tf` | apifly.com records |
| `records-dissg.tf` | All dissg.* records |
| `records-uapix.tf` | uapix.com records |
| `records-misc.tf` | All other domains |
| `outputs.tf` | Zone IDs + nameservers for all zones |

## Notes

- ACM validation records (long `_xxx` prefixed CNAMEs) are excluded — managed by AWS Certificate Manager
- SRV records are commented out — configure manually if needed
- `proxied = true` records route through Cloudflare CDN/proxy
- Zone status: most new domains are `pending` until NS is updated at registrar
