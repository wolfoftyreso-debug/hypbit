# Wavult OS — Infrastructure Execution Lifecycle (IEL)
**Version:** 1.0.0  
**Status:** CANONICAL  
**Owner:** Wavult OS Infrastructure  
**Applies to:** Cloudflare, AWS, Internal Services, CI/CD, Security Policies

---

## DESIGN PRINCIPLES

1. **No implicit steps** — every action is declared before execution
2. **Deterministic transitions** — every phase has a binary exit (PASS / FAIL)
3. **Full auditability** — every phase produces a structured log entry
4. **Domain-agnostic** — same lifecycle for CF, AWS, services, secrets, CI/CD
5. **Blast radius control** — each phase is scoped and reversible where possible
6. **No "seems fine"** — validation is automated, not human judgment

---

## THE 18 PHASES

---

### PHASE 01 — TRIGGER
**Purpose:** Formalize intent. Convert a request into an auditable work item.

| Field | Detail |
|---|---|
| **Input** | Change request (human, cron, CI/CD event, alert) |
| **Process** | Assign ID, classify type (migration/deploy/patch/rotate/audit), record requester, timestamp |
| **Output** | `WorkItem { id, type, domain, requestedBy, requestedAt, status: "queued" }` |
| **Validation** | ID is unique, type is in allowed enum, requester is authenticated principal |
| **Failure** | Reject with structured error — no work item created |
| **Log** | `{ phase: "TRIGGER", workItemId, type, domain, requestedBy }` |

---

### PHASE 02 — SCOPE DEFINITION
**Purpose:** Declare exactly what will change and what will not.

| Field | Detail |
|---|---|
| **Input** | WorkItem from Phase 01 |
| **Process** | Define: target systems, target resources, explicit exclusions, affected principals/services |
| **Output** | `Scope { systems[], resources[], exclusions[], affectedServices[] }` |
| **Validation** | No resource appears in both included and excluded lists. Scope is non-empty. |
| **Failure** | Scope conflict → reject. Empty scope → reject. |
| **Log** | Full scope object, diff from any prior scope on same resources |

---

### PHASE 03 — FULL DISCOVERY
**Purpose:** Build ground truth. Enumerate everything that exists — not just what is expected.

| Field | Detail |
|---|---|
| **Input** | Scope from Phase 02 |
| **Process** | API enumeration of all resources in scope. Scan codebases, env files, CI configs for direct references. Build dependency graph. |
| **Output** | `Inventory { resources[], dependencies[], unknowns[], criticalUnknowns[] }` |
| **Validation** | All `criticalUnknowns[]` must be resolved before proceeding. Inventory must not be empty for non-trivial scopes. |
| **Failure** | Unresolved critical unknowns → BLOCK. Partial discovery → flag and retry. |
| **Log** | Full inventory JSON, discovery timestamp, data sources used |

---

### PHASE 04 — CLASSIFICATION
**Purpose:** Assign risk, criticality, and ownership to every discovered resource.

| Field | Detail |
|---|---|
| **Input** | Inventory from Phase 03 |
| **Process** | For each resource: assign tier (CORE/EDGE/STATE/EPHEMERAL), criticality (P0–P3), blast radius (GLOBAL/SERVICE/LOCAL), owner |
| **Output** | `ClassifiedInventory { resource, tier, criticality, blastRadius, owner }[]` |
| **Validation** | Every resource has a tier and criticality. No P0 resource proceeds without explicit sign-off. |
| **Failure** | Unclassified resource → BLOCK. P0 without sign-off → BLOCK. |
| **Log** | Classification decisions + rationale for P0/P1 items |

---

### PHASE 05 — DEPENDENCY MAPPING
**Purpose:** Understand what breaks if this resource changes.

| Field | Detail |
|---|---|
| **Input** | ClassifiedInventory from Phase 04 |
| **Process** | Build directed graph: `SYSTEM → SERVICE → RESOURCE → API/TOKEN`. Identify shared dependencies. Identify hidden couplings. |
| **Output** | `DependencyGraph { nodes[], edges[], sharedDeps[], hiddenCouplings[] }` |
| **Validation** | No circular dependencies in migration path. All consumers of changing resources are identified. |
| **Failure** | Circular dependency → BLOCK and redesign. Unresolved hidden coupling → flag as CRITICAL UNKNOWN, return to Phase 03. |
| **Log** | Graph as adjacency list, shared deps highlighted, hidden couplings documented |

---

### PHASE 06 — RISK ASSESSMENT
**Purpose:** Quantify the risk of proceeding. Make the go/no-go decision explicit.

| Field | Detail |
|---|---|
| **Input** | DependencyGraph + ClassifiedInventory |
| **Process** | Score each risk: probability × impact. Identify rollback feasibility. Estimate blast radius if failure. Identify time-sensitivity windows. |
| **Output** | `RiskMatrix { risks[], overallScore, rollbackFeasible, blockers[], recommendedWindow }` |
| **Validation** | If overallScore > threshold AND rollbackFeasible = false → BLOCK. All blockers must have mitigation or be accepted by INFRA_ADMIN. |
| **Failure** | Non-mitigated blocker → BLOCK. Rollback not feasible on P0 resource → escalate. |
| **Log** | Full risk matrix, score calculation, blocker dispositions |

---

### PHASE 07 — DESIGN
**Purpose:** Specify the target state completely before touching anything.

| Field | Detail |
|---|---|
| **Input** | Scope + ClassifiedInventory + RiskMatrix |
| **Process** | Define: target architecture, token/secret structure, permission model, rollback procedure, success criteria |
| **Output** | `DesignSpec { targetState, tokenMap, permissionModel, rollbackPlan, successCriteria[] }` |
| **Validation** | Target state is fully specified (no "TBD"). Rollback plan covers all P0/P1 resources. Success criteria are measurable (not subjective). |
| **Failure** | Incomplete target state → return to design. Unmeasurable success criteria → reject. |
| **Log** | Full DesignSpec, review timestamp, approver |

---

### PHASE 08 — APPROVAL GATE
**Purpose:** Enforce human authorization before any mutation.

| Field | Detail |
|---|---|
| **Input** | DesignSpec + RiskMatrix |
| **Process** | Route to required approvers based on risk score and blast radius. P0 = INFRA_ADMIN required. P1 = DEPLOY_AGENT sufficient. Record approval/rejection with timestamp. |
| **Output** | `Approval { approved: boolean, approvedBy, approvedAt, conditions[] }` |
| **Validation** | Approver has IAM permission `iam:admin` or `deploy:trigger` (context-dependent). Approval is not self-approval for P0. |
| **Failure** | Rejected → work item status = "rejected", archived. Expired (>24h) → auto-reject. |
| **Log** | Approval decision, approver identity, conditions, timestamp |

---

### PHASE 09 — ENVIRONMENT PREPARATION
**Purpose:** Prepare secrets, tokens, and infrastructure before any deployment begins.

| Field | Detail |
|---|---|
| **Input** | DesignSpec + Approval |
| **Process** | Create/rotate secrets. Store in vault. Provision new tokens with minimum scopes. Verify target environment exists (green env for blue-green). |
| **Output** | `EnvPrep { secretsCreated[], tokensCreated[], envReady: boolean }` |
| **Validation** | All secrets stored in vault (never plaintext). All tokens verified as callable (test request). Target environment responds. |
| **Failure** | Secret creation failure → BLOCK, alert. Token verification failure → BLOCK. Environment not ready → BLOCK. |
| **Log** | Secret IDs (not values), token IDs, environment health response |

---

### PHASE 10 — PRE-FLIGHT CHECK
**Purpose:** Validate that the current state matches what Phase 03 discovered — no drift.

| Field | Detail |
|---|---|
| **Input** | Inventory from Phase 03 + current live state |
| **Process** | Re-enumerate critical resources. Compare to Phase 03 snapshot. Detect drift. Run pre-conditions checklist. |
| **Output** | `PreFlight { driftDetected: boolean, driftItems[], preConditionsMet: boolean, checklist[] }` |
| **Validation** | No unexpected drift on in-scope resources. All pre-conditions met. System is in known state. |
| **Failure** | Drift detected → BLOCK, return to Phase 03 for re-discovery. Pre-condition failure → BLOCK. |
| **Log** | Drift diff, pre-condition results, timestamp |

---

### PHASE 11 — STAGED EXECUTION
**Purpose:** Execute the change in controlled stages with checkpoints between each.

| Field | Detail |
|---|---|
| **Input** | DesignSpec + EnvPrep + PreFlight |
| **Process** | Execute steps in order. After each step: verify partial state. On failure: stop, do not proceed to next step. Each step is atomic where possible. |
| **Output** | `ExecutionLog { steps[], stepsCompleted, stepsFailed, partialState }` |
| **Validation** | Each step has a defined success condition checked immediately after execution. No step is skipped. |
| **Failure** | Step failure → stop execution, record partial state, trigger Phase 15 (Rollback). |
| **Log** | Per-step: action, parameters (no secrets), result, duration, timestamp |

---

### PHASE 12 — HEALTH VALIDATION
**Purpose:** Verify that the changed system behaves correctly under real conditions.

| Field | Detail |
|---|---|
| **Input** | ExecutionLog + SuccessCriteria from DesignSpec |
| **Process** | Run all success criteria checks: HTTP health, service availability, auth flows, data integrity, latency thresholds. |
| **Output** | `HealthReport { criteria[], passed[], failed[], overallHealthy: boolean }` |
| **Validation** | All P0/P1 criteria must pass. P2/P3 failures are flagged but non-blocking (with INFRA_ADMIN acceptance). |
| **Failure** | Any P0/P1 criterion fails → trigger Phase 15 (Rollback). |
| **Log** | Per-criterion: check, result, response time, timestamp |

---

### PHASE 13 — INTEGRATION VALIDATION
**Purpose:** Verify that dependent systems still work correctly after the change.

| Field | Detail |
|---|---|
| **Input** | DependencyGraph + HealthReport |
| **Process** | For each consumer in the dependency graph: run smoke test against the changed resource. Verify no regression. |
| **Output** | `IntegrationReport { consumers[], tested[], regressions[], clean: boolean }` |
| **Validation** | All P0/P1 consumers pass smoke tests. No silent failures (timeouts counted as failures). |
| **Failure** | Regression detected → trigger Phase 15 (Rollback). Untestable consumer → flag as risk, require manual verification. |
| **Log** | Per-consumer: test, result, regression diff |

---

### PHASE 14 — CUTOVER
**Purpose:** Make the change permanent and switch production traffic.

| Field | Detail |
|---|---|
| **Input** | HealthReport + IntegrationReport (both clean) |
| **Process** | Execute final switch (DNS, ALB, token revocation, etc.). Remove old resources/tokens. Update Wavult OS state store. |
| **Output** | `CutoverResult { switched: boolean, oldResourcesRemoved[], stateUpdated: boolean }` |
| **Validation** | Production traffic confirmed on new configuration. Old tokens/resources confirmed revoked. State store reflects new state. |
| **Failure** | Switch failure → immediate rollback. Revocation failure → alert, manual intervention required. |
| **Log** | Switch timestamp, old resource removal confirmation, state store diff |

---

### PHASE 15 — ROLLBACK
**Purpose:** Return to the last known good state. Triggered automatically on Phase 11/12/13/14 failure.

| Field | Detail |
|---|---|
| **Input** | ExecutionLog + partial state snapshot from Phase 10 |
| **Process** | Execute rollback plan from DesignSpec in reverse order. Restore old tokens/secrets if revoked. Verify rollback success. |
| **Output** | `RollbackResult { restored: boolean, stepsRolledBack[], residualRisk[] }` |
| **Validation** | System returns to pre-Phase 11 state. All health checks pass against original state. |
| **Failure** | Rollback failure → CRITICAL ALERT. Escalate to INFRA_ADMIN. System may be in unknown state — freeze all changes. |
| **Log** | Rollback trigger reason, steps reversed, final state verification, residual risks |

---

### PHASE 16 — MONITORING WINDOW
**Purpose:** Observe the system under real load after cutover to detect latent failures.

| Field | Detail |
|---|---|
| **Input** | CutoverResult |
| **Process** | Monitor key metrics for defined window (default: 60 min for P1, 24h for P0). Alert on anomalies. Keep rollback ready. |
| **Output** | `MonitoringReport { duration, anomalies[], alertsFired[], stable: boolean }` |
| **Validation** | No P0/P1 anomalies during monitoring window. Error rates within SLO. |
| **Failure** | P0/P1 anomaly → trigger Phase 15 (Rollback). P2 anomaly → log and investigate. |
| **Log** | Time-series metrics snapshot, anomaly details, alert history |

---

### PHASE 17 — CLEANUP
**Purpose:** Remove all temporary artifacts created during the lifecycle.

| Field | Detail |
|---|---|
| **Input** | CutoverResult + MonitoringReport (stable) |
| **Process** | Revoke temporary tokens. Remove staging environments. Delete old secrets. Archive work item. Purge sensitive data from logs. |
| **Output** | `CleanupReport { revokedTokens[], removedEnvs[], archivedSecrets[], logsPurged: boolean }` |
| **Validation** | No temporary artifacts remain active. Old global tokens confirmed revoked. Audit log purged of secret values. |
| **Failure** | Revocation failure → alert and retry. Failed cleanup is non-blocking but logged as tech debt. |
| **Log** | Cleanup actions, confirmation of revocation, tech debt items |

---

### PHASE 18 — POST-MORTEM & KNOWLEDGE CAPTURE
**Purpose:** Institutionalize learnings. Update the system to prevent recurrence of issues found.

| Field | Detail |
|---|---|
| **Input** | All phase logs from this lifecycle run |
| **Process** | Review: what went as planned, what deviated, what failed, what was undiscovered. Update INFRA_LIFECYCLE.md if gaps found. Update runbooks. Add new test cases. |
| **Output** | `PostMortem { deviations[], gaps[], improvements[], updatedDocs[] }` |
| **Validation** | All P0/P1 deviations have a documented root cause. At least one improvement action per deviation. |
| **Failure** | No failure condition — this phase always completes. |
| **Log** | Post-mortem document, linked to work item ID |

---

## PHASE TRANSITION MAP

```
TRIGGER (01)
  └── SCOPE DEFINITION (02)
        └── FULL DISCOVERY (03) ←────────────────────────┐
              └── CLASSIFICATION (04)                      │
                    └── DEPENDENCY MAPPING (05)            │
                          └── RISK ASSESSMENT (06)         │
                                └── DESIGN (07)            │
                                      └── APPROVAL GATE (08)
                                            └── ENV PREPARATION (09)
                                                  └── PRE-FLIGHT CHECK (10) → drift? → back to (03)
                                                        └── STAGED EXECUTION (11)
                                                              ├── HEALTH VALIDATION (12)
                                                              │     ├── INTEGRATION VALIDATION (13)
                                                              │     │     └── CUTOVER (14)
                                                              │     │           └── MONITORING WINDOW (16)
                                                              │     │                 └── CLEANUP (17)
                                                              │     │                       └── POST-MORTEM (18)
                                                              │     └── [FAIL] ──────────────────────────────┐
                                                              └── [FAIL] ───────────────────────────────────┐│
                                                                                                             ││
                                                                                          ROLLBACK (15) ←───┘┘
                                                                                                │
                                                                                          POST-MORTEM (18)
```

---

## CLOUDFLARE MIGRATION — MAPPED TO IEL

| IEL Phase | CF Migration Status | Notes |
|---|---|---|
| 01 TRIGGER | ✅ DONE | Erik's request 2026-04-03 |
| 02 SCOPE DEFINITION | ✅ DONE | CF global key → scoped tokens |
| 03 FULL DISCOVERY | ✅ DONE | 29 zones, 10 Pages projects, 5 tokens, 1 tunnel, 0 Workers/R2/KV |
| 04 CLASSIFICATION | ✅ DONE | CORE: DNS/WAF. EDGE: Pages proxy. STATE: none in CF |
| 05 DEPENDENCY MAPPING | ✅ DONE | 5 scripts + 2 desktop scripts mapped |
| 06 RISK ASSESSMENT | ⚠️ PARTIAL | Zone:Create gap identified. 2FA off = unmitigated risk |
| 07 DESIGN | ✅ DONE | 4 scoped tokens, CF adapter, IAM model |
| 08 APPROVAL GATE | ⚠️ IMPLICIT | Erik gave verbal approval — not formally logged in system |
| 09 ENV PREPARATION | ✅ DONE | 3 tokens created, stored in credentials.env |
| 10 PRE-FLIGHT CHECK | ✅ DONE | Token verification passed all 3 |
| 11 STAGED EXECUTION | ✅ DONE | Scripts updated, adapter built |
| 12 HEALTH VALIDATION | ✅ DONE | All 3 tokens verified callable |
| 13 INTEGRATION VALIDATION | ⚠️ PENDING | Scripts not test-run against new tokens |
| 14 CUTOVER | ❌ PENDING | Global key NOT revoked yet |
| 15 ROLLBACK | ✅ READY | Old tokens still active — rollback available |
| 16 MONITORING WINDOW | ❌ PENDING | Post-cutover monitoring not started |
| 17 CLEANUP | ❌ PENDING | Old tokens (Claw, CRAAA, etc.) not revoked |
| 18 POST-MORTEM | ❌ PENDING | To be done after Phase 17 |

---

## IDENTIFIED GAPS IN CF MIGRATION

| Gap | Severity | Phase | Action |
|---|---|---|---|
| 2FA off on CF account | **P0** | Phase 06 | Erik must enable — blocks Phase 14 |
| Zone:Create not covered by scoped token | P1 | Phase 07 | Create `wavult-zone-creator` token OR policy: zone creation = manual dashboard only |
| Approval Gate not formally logged | P1 | Phase 08 | Implement WorkItem approval record in Wavult OS |
| Scripts not integration-tested with new tokens | P1 | Phase 13 | Run each script in dry-run mode |
| pixdrift wildcard IPs (194.9.94.85/86) unknown | P1 | Phase 03 | Identify before Phase 14 |
| bernt.hypbit.com trycloudflare CNAME stale | P2 | Phase 17 | Remove as part of cleanup |
| credentials.env line 180 parse error | P2 | Phase 09 | Fix malformed line in credentials file |

---

## REUSE: APPLYING IEL TO OTHER DOMAINS

### AWS Migration / Service Deployment
- Phase 03: `aws ec2 describe-*`, `aws ecs list-*`, `aws s3api list-buckets`
- Phase 09: SSM Parameter Store instead of credentials.env
- Phase 12: ALB health checks + ECS service stability check
- Phase 14: ALB target group swap (blue/green)
- Phase 16: CloudWatch alarm monitoring

### Secret Rotation
- Phases 01–06: identify all consumers of secret
- Phase 09: generate new secret, store in SSM
- Phase 11: update each consumer (ECS task def redeploy)
- Phase 12: verify each consumer can auth with new secret
- Phase 14: revoke old secret
- Phase 17: confirm old secret returns 401

### CI/CD Pipeline Change
- Phase 03: scan all `.github/workflows/`, `trigger/`, n8n workflows for pipeline references
- Phase 07: new pipeline design with test gates
- Phase 11: deploy to staging pipeline first
- Phase 13: run full test suite against new pipeline
- Phase 14: enable for production branch

### Security Policy Update (WAF/IAM)
- Phase 04: classify rules as ALLOW/DENY, scope = zone or account
- Phase 06: risk = potential for self-lockout or traffic block
- Phase 11: apply in "monitor" mode before "block" mode
- Phase 12: verify legitimate traffic still passes
- Phase 13: verify blocked patterns are actually blocked

---

## ENFORCEMENT IN WAVULT OS

This lifecycle should be implemented as:

```
packages/
  infra-lifecycle/
    src/
      lifecycle.engine.ts    — orchestrates phases, enforces transitions
      work-item.ts           — WorkItem type + state machine
      phase-runner.ts        — executes individual phases with logging
      approval.service.ts    — approval gate integration with wavult-iam
      audit.service.ts       — structured log per phase
    phases/
      01-trigger.ts
      02-scope.ts
      03-discovery.ts
      ... (one file per phase)
```

Every infrastructure change in Wavult OS — CF, AWS, services, secrets — runs through this engine.

---

*Wavult OS Infrastructure Execution Lifecycle v1.0.0 — 2026-04-03*
