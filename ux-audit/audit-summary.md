# UX Audit — Wavult OS Command Center
_Genererad: 2026-04-03 11:32:24_

## Sammanfattning

| Metrik | Värde |
|---|---|
| Totalt moduler | 75 |
| Analyserade filer | 186 |
| Genomsnittlig score | **48/100** |
| 🔵 LOCKED | 5 |
| 🟢 BRA | 8 |
| 🟡 ACCEPTABEL | 14 |
| 🟠 SVAG | 21 |
| 🔴 KRITISK | 27 |

---

## 🔵 LOCKED — Enterprise-standard (5)

| Modul | Score | Maturity | Empty/Load/Error | Data |
|---|---|---|---|---|
| company-launch               | 100 | skeleton   | ✅ ✅ ✅ | 🟢 live |
| infrastructure               | 100 | skeleton   | ✅ ✅ ✅ | 🟢 live |
| landvex-portal               | 100 | skeleton   | ✅ ✅ ✅ | 🟢 live |
| LLM Hub                      |  98 | beta       | ✅ ✅ ✅ | 🟢 live |
| quixzoom-app                 |  96 | skeleton   | ✅ ✅ ✅ | 🟢 live |


## 🟢 BRA — Nästan komplett (8)

| Modul | Score | Maturity | Empty/Load/Error | Data |
|---|---|---|---|---|
| automation                   |  89 | skeleton   | ✅ ✅ ✅ | 🟢 live |
| git                          |  85 | skeleton   | ✅ ✅ ✅ | 🟡 partial |
| governance                   |  81 | skeleton   | ✅ ✅ ✅ | 🟡 partial |
| identity                     |  85 | skeleton   | ✅ ✅ ✅ | 🟡 partial |
| media-pipeline               |  89 | skeleton   | ✅ ✅ ✅ | 🟢 live |
| travel                       |  85 | skeleton   | ✅ ✅ ✅ | 🟡 partial |
| venture-engine               |  85 | skeleton   | ✅ ✅ ✅ | 🟡 partial |
| WHOOP Team Pulse             |  91 | beta       | ✅ ✅ ✅ | 🟢 live |


## 🟡 ACCEPTABEL — De flesta states täckta (14)

| Modul | Score | Maturity | Empty/Load/Error | Data |
|---|---|---|---|---|
| API Hub                      |  66 | beta       | ✅ ❌ ✅ | 🟡 partial |
| Kommunikation                |  70 | alpha      | ✅ ✅ ✅ | 🔴 mock |
| CRM                          |  70 | alpha      | ✅ ✅ ✅ | 🔴 mock |
| Dashboard                    |  63 | beta       | ✅ ✅ ✅ | 🔴 mock |
| database                     |  70 | skeleton   | ✅ ❌ ✅ | 🟡 partial |
| deployments                  |  60 | skeleton   | ❌ ✅ ✅ | 🟡 partial |
| domains                      |  63 | skeleton   | ❌ ✅ ✅ | 🟡 partial |
| Finance                      |  70 | alpha      | ✅ ✅ ✅ | 🔴 mock |
| Knowledge Hub                |  70 | alpha      | ✅ ✅ ✅ | 🔴 mock |
| network-map                  |  61 | skeleton   | ❌ ❌ ✅ | 🟢 live |
| onboarding                   |  70 | skeleton   | ❌ ✅ ✅ | 🟡 partial |
| org-graph                    |  67 | skeleton   | ✅ ❌ ❌ | 🟢 live |
| Lön & Personal               |  68 | alpha      | ✅ ✅ ✅ | 🔴 mock |
| submissions                  |  79 | skeleton   | ✅ ✅ ✅ | 🟡 partial |


## 🟠 SVAG — Partial coverage (21)

| Modul | Score | Maturity | Empty/Load/Error | Data |
|---|---|---|---|---|
| bernt                        |  54 | skeleton   | ❌ ❌ ✅ | 🟡 partial |
| campaign-os                  |  52 | skeleton   | ✅ ❌ ❌ | 🟡 partial |
| causal-os                    |  51 | skeleton   | ✅ ❌ ❌ | 🟡 partial |
| cockpit                      |  46 | skeleton   | ❌ ❌ ✅ | 🟡 partial |
| Bolagsadmin                  |  40 | alpha      | ✅ ❌ ❌ | 🔴 mock |
| decisions                    |  55 | skeleton   | ✅ ❌ ✅ | 🔴 mock |
| entity                       |  48 | skeleton   | ✅ ✅ ❌ | 🔴 mock |
| Legal Hub                    |  53 | beta       | ✅ ❌ ❌ | 🟡 partial |
| Media & Ads                  |  40 | skeleton   | ✅ ❌ ❌ | 🔴 mock |
| Milestones                   |  46 | beta       | ✅ ❌ ❌ | 🟡 partial |
| mission-control              |  44 | skeleton   | ✅ ❌ ✅ | 🔴 mock |
| operations-center            |  44 | skeleton   | ✅ ❌ ❌ | 🟡 partial |
| People Intelligence          |  47 | alpha      | ✅ ❌ ✅ | 🔴 mock |
| Inköp                        |  54 | alpha      | ✅ ✅ ❌ | 🔴 mock |
| Rapporter                    |  52 | alpha      | ✅ ❌ ✅ | 🔴 mock |
| Inställningar                |  54 | beta       | ❌ ❌ ✅ | 🟡 partial |
| system-audit                 |  59 | skeleton   | ✅ ✅ ✅ | 🔴 mock |
| Team Map                     |  45 | beta       | ✅ ❌ ✅ | 🔴 mock |
| transactions                 |  55 | skeleton   | ✅ ❌ ❌ | 🟡 partial |
| visa                         |  47 | skeleton   | ✅ ❌ ❌ | 🟡 partial |
| voice                        |  44 | skeleton   | ❌ ❌ ✅ | 🟡 partial |


## 🔴 KRITISK — Saknar grundläggande states (27)

| Modul | Score | Maturity | Empty/Load/Error | Data |
|---|---|---|---|---|
| agent                        |  15 | skeleton   | ✅ ❌ ❌ | 🔴 mock |
| apifly                       |   0 | skeleton   | ❌ ❌ ❌ | 🔴 mock |
| command-view                 |   0 | skeleton   | ❌ ❌ ❌ | 🔴 mock |
| corpfitt-platform            |  30 | skeleton   | ❌ ❌ ✅ | 🟡 partial |
| dissg                        |   0 | skeleton   | ❌ ❌ ❌ | 🔴 mock |
| entity-switcher              |  14 | skeleton   | ❌ ❌ ❌ | 🔴 mock |
| exports                      |   0 | skeleton   | ❌ ❌ ❌ | 🔴 mock |
| finance-flow                 |   0 | skeleton   | ❌ ❌ ❌ | 🔴 mock |
| incidents                    |  16 | skeleton   | ❌ ❌ ❌ | 🔴 mock |
| Insurance Hub                |  14 | beta       | ❌ ❌ ❌ | 🔴 mock |
| intelligence                 |   0 | skeleton   | ❌ ❌ ❌ | 🔴 mock |
| market-sites                 |  36 | skeleton   | ✅ ❌ ❌ | 🔴 mock |
| mlcs-platform                |  15 | skeleton   | ❌ ❌ ❌ | 🟡 partial |
| openclaw                     |  29 | skeleton   | ✅ ❌ ❌ | 🔴 mock |
| people                       |  29 | skeleton   | ✅ ❌ ❌ | 🔴 mock |
| people-governance            |  36 | skeleton   | ✅ ❌ ❌ | 🔴 mock |
| projects                     |  30 | skeleton   | ✅ ❌ ❌ | 🟡 partial |
| quicklinks                   |  15 | skeleton   | ❌ ❌ ❌ | 🟡 partial |
| quixzoom-ads                 |  14 | skeleton   | ❌ ❌ ❌ | 🔴 mock |
| system-graph                 |  30 | skeleton   | ❌ ❌ ✅ | 🔴 mock |
| System Intelligence          |  29 | alpha      | ✅ ❌ ❌ | 🔴 mock |
| system-status                |  33 | skeleton   | ❌ ✅ ❌ | 🔴 mock |
| Talent Radar                 |  30 | alpha      | ✅ ❌ ❌ | 🔴 mock |
| tasks                        |  30 | skeleton   | ✅ ❌ ❌ | 🔴 mock |
| team                         |  15 | skeleton   | ✅ ❌ ❌ | 🔴 mock |
| thailand                     |   0 | skeleton   | ❌ ❌ ❌ | 🔴 mock |
| uapix                        |  15 | skeleton   | ❌ ❌ ❌ | 🟡 partial |


---

## Top-prioritet: Kritiska moduler att åtgärda

- **apifly** (0p): Saknar empty state-hantering, Saknar loading state, Saknar error handling, Enbart mockdata — ingen live-integration, Inga interaktiva events identifierade, Inga React state hooks (useState/useEffect)
- **command-view** (0p): Saknar empty state-hantering, Saknar loading state, Saknar error handling, Enbart mockdata — ingen live-integration, Inga interaktiva events identifierade, Inga React state hooks (useState/useEffect)
- **dissg** (0p): Saknar empty state-hantering, Saknar loading state, Saknar error handling, Enbart mockdata — ingen live-integration, Inga interaktiva events identifierade, Inga React state hooks (useState/useEffect)
- **exports** (0p): Inga TSX-filer hittade — modul är ett skeleton
- **finance-flow** (0p): Saknar empty state-hantering, Saknar loading state, Saknar error handling, Enbart mockdata — ingen live-integration, Inga interaktiva events identifierade, Inga React state hooks (useState/useEffect)
- **intelligence** (0p): Inga TSX-filer hittade — modul är ett skeleton
- **thailand** (0p): Saknar empty state-hantering, Saknar loading state, Saknar error handling, Enbart mockdata — ingen live-integration, Inga interaktiva events identifierade
- **entity-switcher** (14p): Saknar empty state-hantering, Saknar loading state, Saknar error handling, Enbart mockdata — ingen live-integration
- **Insurance Hub** (14p): Saknar empty state-hantering, Saknar loading state, Saknar error handling, Enbart mockdata — ingen live-integration
- **quixzoom-ads** (14p): Saknar empty state-hantering, Saknar loading state, Saknar error handling, Enbart mockdata — ingen live-integration
- **agent** (15p): Saknar loading state, Saknar error handling, Enbart mockdata — ingen live-integration, Inga interaktiva events identifierade, Inga React state hooks (useState/useEffect)
- **mlcs-platform** (15p): Saknar empty state-hantering, Saknar loading state, Saknar error handling, Inga interaktiva events identifierade, Inga React state hooks (useState/useEffect)
- **quicklinks** (15p): Saknar empty state-hantering, Saknar loading state, Saknar error handling, Inga interaktiva events identifierade, Inga React state hooks (useState/useEffect)
- **team** (15p): Saknar loading state, Saknar error handling, Enbart mockdata — ingen live-integration, Inga interaktiva events identifierade, Inga React state hooks (useState/useEffect)
- **uapix** (15p): Saknar empty state-hantering, Saknar loading state, Saknar error handling, Inga interaktiva events identifierade, Inga React state hooks (useState/useEffect)

---

## Alla moduler — komplett lista

| Modul | ID | Score | Nivå | Maturity | Empty | Load | Error | Data |
|---|---|---|---|---|---|---|---|---|
| company-launch | `company-launch` | 100 | 🔵 LOCKED | skeleton | ✅ | ✅ | ✅ | 🟢 live |
| infrastructure | `infrastructure` | 100 | 🔵 LOCKED | skeleton | ✅ | ✅ | ✅ | 🟢 live |
| landvex-portal | `landvex-portal` | 100 | 🔵 LOCKED | skeleton | ✅ | ✅ | ✅ | 🟢 live |
| LLM Hub | `llm-hub` | 98 | 🔵 LOCKED | beta | ✅ | ✅ | ✅ | 🟢 live |
| quixzoom-app | `quixzoom-app` | 96 | 🔵 LOCKED | skeleton | ✅ | ✅ | ✅ | 🟢 live |
| WHOOP Team Pulse | `whoop` | 91 | 🟢 BRA | beta | ✅ | ✅ | ✅ | 🟢 live |
| automation | `automation` | 89 | 🟢 BRA | skeleton | ✅ | ✅ | ✅ | 🟢 live |
| media-pipeline | `media-pipeline` | 89 | 🟢 BRA | skeleton | ✅ | ✅ | ✅ | 🟢 live |
| git | `git` | 85 | 🟢 BRA | skeleton | ✅ | ✅ | ✅ | 🟡 partial |
| identity | `identity` | 85 | 🟢 BRA | skeleton | ✅ | ✅ | ✅ | 🟡 partial |
| travel | `travel` | 85 | 🟢 BRA | skeleton | ✅ | ✅ | ✅ | 🟡 partial |
| venture-engine | `venture-engine` | 85 | 🟢 BRA | skeleton | ✅ | ✅ | ✅ | 🟡 partial |
| governance | `governance` | 81 | 🟢 BRA | skeleton | ✅ | ✅ | ✅ | 🟡 partial |
| submissions | `submissions` | 79 | 🟡 ACCEPTABEL | skeleton | ✅ | ✅ | ✅ | 🟡 partial |
| Kommunikation | `communications` | 70 | 🟡 ACCEPTABEL | alpha | ✅ | ✅ | ✅ | 🔴 mock |
| CRM | `crm` | 70 | 🟡 ACCEPTABEL | alpha | ✅ | ✅ | ✅ | 🔴 mock |
| database | `database` | 70 | 🟡 ACCEPTABEL | skeleton | ✅ | ❌ | ✅ | 🟡 partial |
| Finance | `finance` | 70 | 🟡 ACCEPTABEL | alpha | ✅ | ✅ | ✅ | 🔴 mock |
| Knowledge Hub | `knowledge` | 70 | 🟡 ACCEPTABEL | alpha | ✅ | ✅ | ✅ | 🔴 mock |
| onboarding | `onboarding` | 70 | 🟡 ACCEPTABEL | skeleton | ❌ | ✅ | ✅ | 🟡 partial |
| Lön & Personal | `payroll` | 68 | 🟡 ACCEPTABEL | alpha | ✅ | ✅ | ✅ | 🔴 mock |
| org-graph | `org-graph` | 67 | 🟡 ACCEPTABEL | skeleton | ✅ | ❌ | ❌ | 🟢 live |
| API Hub | `api-hub` | 66 | 🟡 ACCEPTABEL | beta | ✅ | ❌ | ✅ | 🟡 partial |
| Dashboard | `dashboard` | 63 | 🟡 ACCEPTABEL | beta | ✅ | ✅ | ✅ | 🔴 mock |
| domains | `domains` | 63 | 🟡 ACCEPTABEL | skeleton | ❌ | ✅ | ✅ | 🟡 partial |
| network-map | `network-map` | 61 | 🟡 ACCEPTABEL | skeleton | ❌ | ❌ | ✅ | 🟢 live |
| deployments | `deployments` | 60 | 🟡 ACCEPTABEL | skeleton | ❌ | ✅ | ✅ | 🟡 partial |
| system-audit | `system-audit` | 59 | 🟠 SVAG | skeleton | ✅ | ✅ | ✅ | 🔴 mock |
| decisions | `decisions` | 55 | 🟠 SVAG | skeleton | ✅ | ❌ | ✅ | 🔴 mock |
| transactions | `transactions` | 55 | 🟠 SVAG | skeleton | ✅ | ❌ | ❌ | 🟡 partial |
| bernt | `bernt` | 54 | 🟠 SVAG | skeleton | ❌ | ❌ | ✅ | 🟡 partial |
| Inköp | `procurement` | 54 | 🟠 SVAG | alpha | ✅ | ✅ | ❌ | 🔴 mock |
| Inställningar | `settings` | 54 | 🟠 SVAG | beta | ❌ | ❌ | ✅ | 🟡 partial |
| Legal Hub | `legal` | 53 | 🟠 SVAG | beta | ✅ | ❌ | ❌ | 🟡 partial |
| campaign-os | `campaign-os` | 52 | 🟠 SVAG | skeleton | ✅ | ❌ | ❌ | 🟡 partial |
| Rapporter | `reports` | 52 | 🟠 SVAG | alpha | ✅ | ❌ | ✅ | 🔴 mock |
| causal-os | `causal-os` | 51 | 🟠 SVAG | skeleton | ✅ | ❌ | ❌ | 🟡 partial |
| entity | `entity` | 48 | 🟠 SVAG | skeleton | ✅ | ✅ | ❌ | 🔴 mock |
| People Intelligence | `people-intelligence` | 47 | 🟠 SVAG | alpha | ✅ | ❌ | ✅ | 🔴 mock |
| visa | `visa` | 47 | 🟠 SVAG | skeleton | ✅ | ❌ | ❌ | 🟡 partial |
| cockpit | `cockpit` | 46 | 🟠 SVAG | skeleton | ❌ | ❌ | ✅ | 🟡 partial |
| Milestones | `milestones` | 46 | 🟠 SVAG | beta | ✅ | ❌ | ❌ | 🟡 partial |
| Team Map | `team-map` | 45 | 🟠 SVAG | beta | ✅ | ❌ | ✅ | 🔴 mock |
| mission-control | `mission-control` | 44 | 🟠 SVAG | skeleton | ✅ | ❌ | ✅ | 🔴 mock |
| operations-center | `operations-center` | 44 | 🟠 SVAG | skeleton | ✅ | ❌ | ❌ | 🟡 partial |
| voice | `voice` | 44 | 🟠 SVAG | skeleton | ❌ | ❌ | ✅ | 🟡 partial |
| Bolagsadmin | `corporate` | 40 | 🟠 SVAG | alpha | ✅ | ❌ | ❌ | 🔴 mock |
| Media & Ads | `media` | 40 | 🟠 SVAG | skeleton | ✅ | ❌ | ❌ | 🔴 mock |
| market-sites | `market-sites` | 36 | 🔴 KRITISK | skeleton | ✅ | ❌ | ❌ | 🔴 mock |
| people-governance | `people-governance` | 36 | 🔴 KRITISK | skeleton | ✅ | ❌ | ❌ | 🔴 mock |
| system-status | `system-status` | 33 | 🔴 KRITISK | skeleton | ❌ | ✅ | ❌ | 🔴 mock |
| corpfitt-platform | `corpfitt-platform` | 30 | 🔴 KRITISK | skeleton | ❌ | ❌ | ✅ | 🟡 partial |
| projects | `projects` | 30 | 🔴 KRITISK | skeleton | ✅ | ❌ | ❌ | 🟡 partial |
| system-graph | `system-graph` | 30 | 🔴 KRITISK | skeleton | ❌ | ❌ | ✅ | 🔴 mock |
| Talent Radar | `talent-radar` | 30 | 🔴 KRITISK | alpha | ✅ | ❌ | ❌ | 🔴 mock |
| tasks | `tasks` | 30 | 🔴 KRITISK | skeleton | ✅ | ❌ | ❌ | 🔴 mock |
| openclaw | `openclaw` | 29 | 🔴 KRITISK | skeleton | ✅ | ❌ | ❌ | 🔴 mock |
| people | `people` | 29 | 🔴 KRITISK | skeleton | ✅ | ❌ | ❌ | 🔴 mock |
| System Intelligence | `system-intelligence` | 29 | 🔴 KRITISK | alpha | ✅ | ❌ | ❌ | 🔴 mock |
| incidents | `incidents` | 16 | 🔴 KRITISK | skeleton | ❌ | ❌ | ❌ | 🔴 mock |
| agent | `agent` | 15 | 🔴 KRITISK | skeleton | ✅ | ❌ | ❌ | 🔴 mock |
| mlcs-platform | `mlcs-platform` | 15 | 🔴 KRITISK | skeleton | ❌ | ❌ | ❌ | 🟡 partial |
| quicklinks | `quicklinks` | 15 | 🔴 KRITISK | skeleton | ❌ | ❌ | ❌ | 🟡 partial |
| team | `team` | 15 | 🔴 KRITISK | skeleton | ✅ | ❌ | ❌ | 🔴 mock |
| uapix | `uapix` | 15 | 🔴 KRITISK | skeleton | ❌ | ❌ | ❌ | 🟡 partial |
| entity-switcher | `entity-switcher` | 14 | 🔴 KRITISK | skeleton | ❌ | ❌ | ❌ | 🔴 mock |
| Insurance Hub | `insurance` | 14 | 🔴 KRITISK | beta | ❌ | ❌ | ❌ | 🔴 mock |
| quixzoom-ads | `quixzoom-ads` | 14 | 🔴 KRITISK | skeleton | ❌ | ❌ | ❌ | 🔴 mock |
| apifly | `apifly` | 0 | 🔴 KRITISK | skeleton | ❌ | ❌ | ❌ | 🔴 mock |
| command-view | `command-view` | 0 | 🔴 KRITISK | skeleton | ❌ | ❌ | ❌ | 🔴 mock |
| dissg | `dissg` | 0 | 🔴 KRITISK | skeleton | ❌ | ❌ | ❌ | 🔴 mock |
| exports | `exports` | 0 | 🔴 KRITISK | skeleton | ❌ | ❌ | ❌ | 🔴 mock |
| finance-flow | `finance-flow` | 0 | 🔴 KRITISK | skeleton | ❌ | ❌ | ❌ | 🔴 mock |
| intelligence | `intelligence` | 0 | 🔴 KRITISK | skeleton | ❌ | ❌ | ❌ | 🔴 mock |
| thailand | `thailand` | 0 | 🔴 KRITISK | skeleton | ❌ | ❌ | ❌ | 🔴 mock |

---

## Score-förklaring

Varje modul poängsätts 0–100:

| Komponent | Max | Kriterier |
|---|---|---|
| Event coverage | 25p | Antal och bredd på interaktiva events |
| Empty state | 15p | Hanterar tom datamängd |
| Loading state | 15p | Spinner/skeleton under datahämtning |
| Error state | 15p | Felhantering vid misslyckade anrop |
| Data source | 30p | Mock=0p, Partial=15p, Live=30p |

_Script: `/mnt/c/Users/erik/Desktop/Wavult/ux-audit/run-audit.mjs`_
