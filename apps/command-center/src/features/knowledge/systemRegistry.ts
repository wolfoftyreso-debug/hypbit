export type SystemCategory = "Core" | "Dev" | "Finance" | "Legal" | "Ops" | "Comms"
export type AccessStatus = "ACTIVE" | "MISSING" | "PENDING" | "RESTRICTED"

export interface SystemAction {
  label: string
  variant: "primary" | "secondary" | "danger"
  action: "open" | "request" | "fix" | "deploy"
  url?: string
}

export interface SystemEntry {
  id: string
  name: string
  description: string
  category: SystemCategory
  url?: string
  status: AccessStatus
  icon: string
  isInternal: boolean
  actions: SystemAction[]
  kafkaEvent?: string
}

export const SYSTEM_REGISTRY: SystemEntry[] = [
  // CORE
  {
    id: "wavult-os",
    name: "Wavult OS",
    category: "Core",
    icon: "⚙️",
    description: "Enterprise operativsystem. Denna applikation.",
    url: "https://999c2665.wavult-os.pages.dev",
    status: "ACTIVE",
    isInternal: true,
    actions: [{ label: "Öppen", variant: "primary", action: "open" }],
  },
  {
    id: "eos-engine",
    name: "EOS Engine",
    category: "Core",
    icon: "🧠",
    description: "Enterprise Operating System. Autonomous control loop, legal intelligence, sovereign engine.",
    url: "/eos",
    status: "ACTIVE",
    isInternal: true,
    actions: [{ label: "Öppna EOS", variant: "primary", action: "open" }],
    kafkaEvent: "system.opened",
  },

  // DEV
  {
    id: "code-deploy",
    name: "Code & Deploy",
    category: "Dev",
    icon: "🔧",
    description: "GitHub Actions CI/CD. Alla repos, deployments, build-pipelines.",
    url: "https://github.com/wolfoftyreso-debug",
    status: "ACTIVE",
    isInternal: false,
    actions: [
      { label: "GitHub", variant: "primary", action: "open", url: "https://github.com/wolfoftyreso-debug" },
      { label: "CF Pages", variant: "secondary", action: "open", url: "https://dash.cloudflare.com" },
    ],
  },
  {
    id: "aws-console",
    name: "AWS Infrastructure",
    category: "Dev",
    icon: "☁️",
    description: "ECS, RDS, S3, CloudFront. eu-north-1 primär. Cluster: hypbit.",
    url: "https://console.aws.amazon.com",
    status: "ACTIVE",
    isInternal: false,
    actions: [{ label: "AWS Console", variant: "primary", action: "open" }],
  },
  {
    id: "cloudflare",
    name: "Cloudflare Edge",
    category: "Dev",
    icon: "🌐",
    description: "DNS, CDN, WAF, Pages deployments. wavult.com zone.",
    url: "https://dash.cloudflare.com",
    status: "ACTIVE",
    isInternal: false,
    actions: [{ label: "Dashboard", variant: "primary", action: "open" }],
  },
  {
    id: "n8n-workflows",
    name: "n8n Automation",
    category: "Dev",
    icon: "⚡",
    description: "All automationslogik. Morning brief pipeline, EOS execution. api.hypbit.com/n8n.",
    url: "https://api.hypbit.com/n8n",
    status: "ACTIVE",
    isInternal: true,
    actions: [{ label: "Öppna n8n", variant: "primary", action: "open" }],
  },

  // FINANCE
  {
    id: "revolut-business",
    name: "Revolut Business",
    category: "Finance",
    icon: "💳",
    description: "Primärt bankkonto. OAuth-integration i Wavult OS via /banking.",
    url: "/banking",
    status: "ACTIVE",
    isInternal: true,
    actions: [{ label: "Öppna Banking", variant: "primary", action: "open", url: "/banking" }],
  },
  {
    id: "stripe-atlas",
    name: "Stripe Atlas",
    category: "Finance",
    icon: "🏦",
    description: "quiXzoom Inc. Delaware. 83(b) inlämnad 30 mars. EIN inväntas.",
    url: "https://atlas.stripe.com",
    status: "ACTIVE",
    isInternal: false,
    actions: [{ label: "Stripe Atlas", variant: "primary", action: "open" }],
  },

  // LEGAL
  {
    id: "northwest-agent",
    name: "Northwest Registered Agent",
    category: "Legal",
    icon: "📋",
    description: "Landvex Inc. Texas. Registered agent. EIN-ansökan pågår.",
    url: "https://www.northwestregisteredagent.com",
    status: "PENDING",
    isInternal: false,
    actions: [
      { label: "Logga in", variant: "primary", action: "open" },
      { label: "Fyll i EIN-data", variant: "danger", action: "fix" },
    ],
  },
  {
    id: "identity-core",
    name: "Identity Core (KYC)",
    category: "Legal",
    icon: "🪪",
    description: "Passhantering, KYC-flöde, MRZ-läsning via AWS Textract. ECS eu-north-1.",
    url: "/onboarding",
    status: "ACTIVE",
    isInternal: true,
    actions: [{ label: "KYC-vy", variant: "primary", action: "open", url: "/onboarding" }],
  },

  // OPS
  {
    id: "wavult-os-api",
    name: "Wavult Core API",
    category: "Ops",
    icon: "🔌",
    description: "Node.js/Express API. ECS eu-north-1. api.wavult.com / api.hypbit.com.",
    url: "https://api.hypbit.com/health",
    status: "ACTIVE",
    isInternal: true,
    actions: [{ label: "Health check", variant: "secondary", action: "open" }],
  },
  {
    id: "quixzoom-platform",
    name: "quiXzoom Platform",
    category: "Ops",
    icon: "📷",
    description: "Crowdsourcad kamerainfrastruktur. Missions, zoomers, kartor. app.quixzoom.com.",
    url: "https://app.quixzoom.com",
    status: "ACTIVE",
    isInternal: true,
    actions: [{ label: "Öppna quiXzoom", variant: "primary", action: "open" }],
  },
  {
    id: "landvex-platform",
    name: "LandveX Platform",
    category: "Ops",
    icon: "🗺️",
    description: "Optical Intelligence mot infrastrukturägare. Händelselarm, analysrapporter.",
    url: "https://landvex.com",
    status: "ACTIVE",
    isInternal: true,
    actions: [{ label: "Öppna LandveX", variant: "primary", action: "open" }],
  },

  // COMMS
  {
    id: "bernt-ai",
    name: "Bernt (AI)",
    category: "Comms",
    icon: "🤖",
    description: "Wavult Groups AI-agent. OpenClaw. Mail, cron, kodning, beslutsstöd.",
    url: "/",
    status: "ACTIVE",
    isInternal: true,
    actions: [{ label: "Chatta med Bernt", variant: "primary", action: "open", url: "/" }],
  },
  {
    id: "morning-brief",
    name: "Morning Brief",
    category: "Comms",
    icon: "☀️",
    description: "Dagligt nyhetsbrev kl 08:00. brief.wavult.com. Skickas via Resend.",
    url: "https://brief.wavult.com",
    status: "ACTIVE",
    isInternal: true,
    actions: [{ label: "Senaste brief", variant: "secondary", action: "open" }],
  },
]
