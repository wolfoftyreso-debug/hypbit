/**
 * Wavult OS — Illustration Map
 * Maps every module route to its dedicated illustration from the brief-characters library.
 * Base URL: https://d14gf6x22fx96q.cloudfront.net/brief/brief-characters/
 *
 * Illustration library:
 *   scenario_001–060:  quiXzoom (zoomer, photography, missions)
 *   scenario_061–120:  LandveX (infrastructure, municipalities)
 *   scenario_121–180:  System (servers, networks, code)
 *   scenario_181–240:  Team (people, meetings, collaboration)
 *   scenario_241–300:  World (global, expansion, markets)
 *   scenario_301+:     Extended library
 */

export const ILLUST_BASE = 'https://d14gf6x22fx96q.cloudfront.net/brief/brief-characters'

export function illustrationUrl(id: number): string {
  return `${ILLUST_BASE}/scenario_${String(id).padStart(3, '0')}.png`
}

/** Module → illustration ID mapping */
export const MODULE_ILLUSTRATIONS: Record<string, number | number[]> = {
  // ── Infrastructure & System ─────────────────────────────
  '/infrastructure':        121, // server rack
  '/system-status':         122, // data center row
  '/system-graph':          126, // network diagram
  '/system-intelligence':   128, // firewall / intelligence
  '/openclaw':              130, // VPN / connection
  '/deployments':           132, // CI/CD pipeline
  '/domains':               129, // CDN network
  '/network-map':           127, // network topology Sweden

  // ── Finance ─────────────────────────────────────────────
  '/finance':               142,
  '/finance-flow':          143,
  '/transactions':          144,

  // ── Team & People ─────────────────────────────────────
  '/team':                  181, // team meeting
  '/people':                182, // team roster
  '/people-governance':     185,
  '/org-graph':             186,
  '/identity':              188,
  '/talent-radar':          191,

  // ── quiXzoom ────────────────────────────────────────────
  '/quixzoom-app':            1, // Alex Gamla Stan
  '/quixzoom-ads':           15, // ads/marketplace
  '/market-sites':           20,

  // ── LandveX / Optical Insight ───────────────────────────
  '/landvex-portal':         61,
  '/intelligence':           68,
  '/incidents':              75,

  // ── OS Modules ─────────────────────────────────────────
  '/dashboard':             241, // global overview
  '/agent':                 133, // agent/AI
  '/command-view':          134,
  '/automation':            135,
  '/git':                   136,
  '/governance':            157,
  '/database':              123,
  '/exports':               145,

  // ── Companies ───────────────────────────────────────────
  '/company-launch':        251,
  '/entity':                252,
  '/entity-switcher':       253,

  // ── External platforms ─────────────────────────────────
  '/apifly':                137,
  '/dissg':                 138,
  '/uapix':                 139,
  '/mlcs-platform':         140,
  '/corpfitt-platform':     192,
  '/insurance':             158,

  // ── Thailand ────────────────────────────────────────────
  '/thailand':              [202, 203, 204], // multiple illustrations

  // ── Media & Communication ───────────────────────────────
  '/media-pipeline':        160,
  '/communications':        161,
  '/knowledge-hub':         162,

  // ── Projects & Tasks ───────────────────────────────────
  '/projects':              245,
  '/tasks':                 246,
  '/milestones':            247,
  '/decisions':             248,
}

/** Get the best illustration for a route (returns primary or random if array) */
export function getModuleIllustration(route: string): string {
  const id = MODULE_ILLUSTRATIONS[route]
  if (!id) return illustrationUrl(121) // default: server
  if (Array.isArray(id)) return illustrationUrl(id[Math.floor(Math.random() * id.length)])
  return illustrationUrl(id)
}
