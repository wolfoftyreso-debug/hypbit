export type PersonFeatureProps = {
  id: string;
  name: string;
  influence_score: number;
  relevance_score: number;
};

export type PersonFeature = {
  type: "Feature";
  properties: PersonFeatureProps;
  geometry: { type: "Point"; coordinates: [number, number] };
};

export type FeatureCollection = {
  type: "FeatureCollection";
  features: PersonFeature[];
};

// --- Influence Monitoring wire types (mirror packages/events) ---

export type ImpactLevel = "LOW" | "MEDIUM" | "HIGH";
export type Severity = "INFO" | "IMPORTANT" | "CRITICAL";

export type EnrichedEvent = {
  event_id: string;
  title: string;
  body: string;
  url?: string;
  source: string;
  event_type: string;
  impact_level: ImpactLevel;
  entity_id: string;
  entity_type: string;
  person_ids: string[];
  org_ids: string[];
  tags: string[];
  enrichment: {
    relevance_score: number;
    impact_on_us: ImpactLevel;
    summary: string;
    recommended_actions: string[];
    risk: ImpactLevel;
    opportunity: ImpactLevel;
    confidence: number;
    model: string;
  };
};

export type Alert = {
  id: string;
  ts: number;
  rule_id: string;
  rule_name: string;
  severity: Severity;
  alert_score: number;
  matched_person_id?: string;
  matched_person_name?: string;
  matched_influence_score?: number;
  matched_relevance_score?: number;
  event: EnrichedEvent;
};

export type Action = {
  id: string;
  ts: number;
  alert_id: string;
  action_type:
    | "INTRO_REQUEST"
    | "ATTEND_EVENT"
    | "REVIEW_STRATEGY"
    | "MONITOR"
    | "CONTACT_PARTNER"
    | "CREATE_CRM_TASK";
  title: string;
  description: string;
  target_person_id?: string;
  target_person_name?: string;
  path: string[];
  priority: Severity;
  deadline_ts?: number;
};

export type Notification = {
  id: string;
  ts: number;
  kind: "ALERT" | "ACTION";
  severity: Severity;
  title: string;
  body: string;
  alert?: Alert;
  action?: Action;
  read: boolean;
};
