############################################
# SSM Parameter Store — secret storage read by the connector at
# startup via the ECS task secrets field (see ecs.tf).
#
# These parameters are created empty here and written out-of-band via
# `aws ssm put-parameter --overwrite`. Terraform deliberately does NOT
# manage the value to avoid leaking secrets into the state file.
############################################

resource "aws_ssm_parameter" "mapbox_token" {
  name  = "/${var.service_name}/${var.environment}/mapbox_token"
  type  = "SecureString"
  value = "placeholder"

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "api_keys" {
  name  = "/${var.service_name}/${var.environment}/api_keys"
  type  = "SecureString"
  value = "placeholder"

  lifecycle {
    ignore_changes = [value]
  }
}

# Grant the task role read access to these parameters.
data "aws_iam_policy_document" "ssm_read" {
  statement {
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
    ]
    resources = [
      aws_ssm_parameter.mapbox_token.arn,
      aws_ssm_parameter.api_keys.arn,
    ]
  }

  statement {
    actions   = ["kms:Decrypt"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "ssm_read_exec" {
  name   = "${var.service_name}-ssm-read"
  role   = aws_iam_role.execution.id
  policy = data.aws_iam_policy_document.ssm_read.json
}

output "ssm_parameters" {
  value = {
    mapbox_token = aws_ssm_parameter.mapbox_token.name
    api_keys     = aws_ssm_parameter.api_keys.name
  }
  description = "SSM parameter paths — populate values with put-parameter --overwrite"
}
