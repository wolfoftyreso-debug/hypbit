resource "aws_security_group" "msk" {
  name_prefix = "amos-msk-${var.environment}-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 9092
    to_port         = 9098
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_msk_cluster" "amos" {
  cluster_name           = "amos-${var.environment}"
  kafka_version          = "3.7.x"
  number_of_broker_nodes = length(var.private_subnet_ids)

  broker_node_group_info {
    instance_type   = var.environment == "prod" ? "kafka.m5.large" : "kafka.t3.small"
    client_subnets  = var.private_subnet_ids
    security_groups = [aws_security_group.msk.id]

    storage_info {
      ebs_storage_info {
        volume_size = 100
      }
    }
  }

  encryption_info {
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }
}

output "msk_bootstrap_brokers_tls" {
  value = aws_msk_cluster.amos.bootstrap_brokers_tls
}
