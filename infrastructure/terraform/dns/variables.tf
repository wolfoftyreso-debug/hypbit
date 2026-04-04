variable "cloudflare_email" {
  description = "Cloudflare account email"
  type        = string
  sensitive   = true
}

variable "cloudflare_api_key" {
  description = "Cloudflare Global API Key"
  type        = string
  sensitive   = true
}

variable "account_id" {
  description = "Cloudflare Account ID"
  type        = string
  default     = "b65ff6fbc9b5a7a7da71bb0d3f1beb28"
}
