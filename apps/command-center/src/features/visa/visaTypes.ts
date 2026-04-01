export type VisaStatus =
  | "not_started" | "in_progress" | "submitted" | "approved" | "rejected" | "expired"

export type DocStatus = "needed" | "gathering" | "ready" | "submitted" | "approved"

export interface VisaDocument {
  id:          string
  name:        string
  required:    boolean
  status:      DocStatus
  fileUrl?:    string       // S3 URL via identity-core
  uploadedAt?: string
  notes?:      string
}

export interface VisaStep {
  id:          string
  phase:       string
  title:       string
  owner:       string       // person id
  status:      "todo" | "in_progress" | "done" | "blocked"
  est_days:    number
  cost_usd?:   number
  blocker?:    string
  documents:   VisaDocument[]
  notes:       string
  deadline?:   string
  completedAt?: string
}

export interface VisaApplication {
  id:           string
  person_id:    string      // links to People module
  person_name:  string
  visa_type:    "investor_visa" | "golden_visa" | "tourist" | "entry_permit" | "residency_renewal"
  country:      "UAE" | "TH" | "SE" | "US" | "other"
  target_date:  string
  status:       VisaStatus
  steps:        VisaStep[]
  created_at:   string
  updated_at:   string
  pro_agent?:   string      // Virtuzone, etc
  notes:        string
}
