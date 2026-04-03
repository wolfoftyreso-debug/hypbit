#!/usr/bin/env node
/**
 * UX Audit Pipeline — Wavult OS (command-center)
 * Analyserar alla feature-moduler och genererar strukturerade rapporter.
 * Node.js ESM, inga externa dependencies.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Paths ────────────────────────────────────────────────────────────────────
const FEATURES_DIR = '/mnt/c/Users/erik/Desktop/Wavult/apps/command-center/src/features';
const MATURITY_FILE = '/mnt/c/Users/erik/Desktop/Wavult/apps/command-center/src/shared/maturity/maturityModel.ts';
const OUTPUT_DIR = path.resolve(__dirname);
const REPORT_JSON = path.join(OUTPUT_DIR, 'audit-report.json');
const REPORT_MD   = path.join(OUTPUT_DIR, 'audit-summary.md');

// ── Maturity registry parser ─────────────────────────────────────────────────
function parseMaturityRegistry(tsSource) {
  const registry = [];
  // Extract each object literal inside MODULE_REGISTRY array
  const arrayMatch = tsSource.match(/MODULE_REGISTRY[^=]*=\s*\[([\s\S]*)\]/);
  if (!arrayMatch) return registry;

  const content = arrayMatch[1];

  // Extract id, name, path, level, dataSource fields per entry
  const entryRegex = /\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let m;
  while ((m = entryRegex.exec(content)) !== null) {
    const block = m[1];
    const get = (key) => {
      const r = new RegExp(`${key}:\\s*['"\`]([^'"\`]+)['"\`]`);
      const hit = block.match(r);
      return hit ? hit[1] : null;
    };
    const id = get('id');
    if (!id) continue;
    registry.push({
      id,
      name: get('name') || id,
      path: get('path') || `/${id}`,
      level: get('level') || 'skeleton',
      dataSource: get('dataSource') || 'mock',
    });
  }
  return registry;
}

// ── TSX file collector ───────────────────────────────────────────────────────
function collectTsxFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsxFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
}

// ── Code analyzer ────────────────────────────────────────────────────────────
function analyzeFiles(tsxFiles) {
  // Concatenate all source for this module
  let source = '';
  for (const f of tsxFiles) {
    try {
      source += fs.readFileSync(f, 'utf8') + '\n';
    } catch {
      // skip unreadable files
    }
  }

  // ── Events ────────────────────────────────────────────────────────────────
  const eventPatterns = {
    onClick:    /onClick\s*[={]/g,
    onChange:   /onChange\s*[={]/g,
    onSubmit:   /onSubmit\s*[={]/g,
    onHover:    /onHover|onMouseEnter|onMouseLeave/g,
    onKeyDown:  /onKeyDown|onKeyUp|onKeyPress/g,
    onFocus:    /onFocus|onBlur/g,
    onScroll:   /onScroll/g,
    onDrop:     /onDrop|onDragOver|onDragStart/g,
  };
  const events = {};
  let totalEvents = 0;
  for (const [name, re] of Object.entries(eventPatterns)) {
    const matches = (source.match(re) || []).length;
    if (matches > 0) events[name] = matches;
    totalEvents += matches;
  }

  // ── State hooks ──────────────────────────────────────────────────────────
  const useStateCount   = (source.match(/useState\s*[(<]/g) || []).length;
  const useEffectCount  = (source.match(/useEffect\s*\(/g) || []).length;
  const useReducerCount = (source.match(/useReducer\s*\(/g) || []).length;
  const stateCount = useStateCount + useEffectCount + useReducerCount;

  // ── Empty state detection ─────────────────────────────────────────────────
  const emptyStatePatterns = [
    /\.length\s*===?\s*0/,
    /\.length\s*==\s*0/,
    /!\s*data(?:\b|\s)/,
    /data\s*===?\s*null/,
    /data\s*===?\s*undefined/,
    /isEmpty\b/,
    /empty[\s-_]?state/i,
    /EmptyState/,
    /no[\s-]?data/i,
    /No\s+\w+\s+found/i,
    /Inga\s+\w+/i,
    /Tomt\b/i,
    /\.length\s*<\s*1/,
    /items\.length\s*===?\s*0/,
    /results\.length\s*===?\s*0/,
  ];
  const hasEmptyState = emptyStatePatterns.some(p => p.test(source));

  // ── Loading state detection ───────────────────────────────────────────────
  const loadingPatterns = [
    /isLoading\b/,
    /loading\s*[=:?]/i,
    /\bLoading\b/,
    /Spinner/i,
    /skeleton/i,
    /Skeleton/,
    /isFetching\b/,
    /isPending\b/,
    /Laddar/i,
    /loading={true}/i,
    /<Loader/i,
    /CircularProgress/i,
  ];
  const hasLoadingState = loadingPatterns.some(p => p.test(source));

  // ── Error state detection ─────────────────────────────────────────────────
  const errorPatterns = [
    /isError\b/,
    /\berror\b/i,
    /try\s*\{[\s\S]*?\}\s*catch/,
    /ErrorBoundary/,
    /error boundary/i,
    /onError\b/,
    /catch\s*\(/,
    /\.catch\s*\(/,
    /Fel\b/i,
    /error state/i,
    /errorMessage/i,
    /hasError/i,
    /showError/i,
  ];
  const hasErrorState = errorPatterns.some(p => p.test(source));

  // ── Data source detection ─────────────────────────────────────────────────
  // Look for indicators of live data vs mock
  const liveIndicators = [
    /fetch\s*\(/,
    /axios\./,
    /useSWR\b/,
    /useQuery\b/,
    /useInfiniteQuery\b/,
    /supabase\./,
    /api\./,
    /apiClient\./,
    /\.get\s*\(/,
    /\.post\s*\(/,
    /\.put\s*\(/,
    /\.delete\s*\(/,
    /https?:\/\//,
    /NEXT_PUBLIC_/,
    /process\.env\./,
    /import\.meta\.env\./,
    /useWebSocket/,
    /socket\./,
  ];
  const mockIndicators = [
    /mockData\b/i,
    /MOCK_DATA\b/,
    /mock_/i,
    /hardcoded/i,
    /\bfakeData\b/i,
    /dummyData\b/i,
    /stub\b/i,
    // Static arrays with many items inline
    /\[\s*\{[^[\]]{200,}\}\s*\]/,
  ];

  const liveScore  = liveIndicators.filter(p => p.test(source)).length;
  const mockScore  = mockIndicators.filter(p => p.test(source)).length;

  let detectedDataSource = 'mock';
  if (liveScore >= 3 && mockScore === 0) {
    detectedDataSource = 'live';
  } else if (liveScore >= 1) {
    detectedDataSource = 'partial';
  } else {
    detectedDataSource = 'mock';
  }

  return {
    events,
    totalEvents,
    useStateCount,
    useEffectCount,
    useReducerCount,
    stateCount,
    hasEmptyState,
    hasLoadingState,
    hasErrorState,
    detectedDataSource,
  };
}

// ── Scoring engine ───────────────────────────────────────────────────────────
function computeScore(analysis, maturityDataSource) {
  // Use maturity registry data source as ground truth if available, fallback to detected
  const dataSource = maturityDataSource || analysis.detectedDataSource;

  // Event coverage (25p): scale based on distinct event types and total count
  const distinctEventTypes = Object.keys(analysis.events).length;
  let eventScore = 0;
  if (analysis.totalEvents > 0) {
    // Base: having any events at all = 10p
    // Each distinct type adds up to 5p more, max 25p total
    eventScore = Math.min(25, 10 + (distinctEventTypes * 3) + Math.min(analysis.totalEvents * 0.5, 9));
  }

  // State coverage (45p: 15p each)
  const emptyScore   = analysis.hasEmptyState   ? 15 : 0;
  const loadingScore = analysis.hasLoadingState  ? 15 : 0;
  const errorScore   = analysis.hasErrorState    ? 15 : 0;

  // Data source quality (30p)
  const dataScore = dataSource === 'live' ? 30 : dataSource === 'partial' ? 15 : 0;

  const total = Math.round(eventScore + emptyScore + loadingScore + errorScore + dataScore);
  return { total: Math.min(100, total), eventScore, emptyScore, loadingScore, errorScore, dataScore, dataSource };
}

// ── Level label ──────────────────────────────────────────────────────────────
function scoreLevel(score) {
  if (score >= 95) return 'LOCKED';
  if (score >= 80) return 'BRA';
  if (score >= 60) return 'ACCEPTABEL';
  if (score >= 40) return 'SVAG';
  return 'KRITISK';
}

function levelEmoji(level) {
  return { LOCKED: '🔵', BRA: '🟢', ACCEPTABEL: '🟡', SVAG: '🟠', KRITISK: '🔴' }[level] || '⚪';
}

// ── Issues & strengths generator ─────────────────────────────────────────────
function deriveIssuesAndStrengths(analysis, scoring) {
  const issues = [];
  const strengths = [];

  if (!analysis.hasEmptyState)   issues.push('Saknar empty state-hantering');
  if (!analysis.hasLoadingState) issues.push('Saknar loading state');
  if (!analysis.hasErrorState)   issues.push('Saknar error handling');
  if (scoring.dataSource === 'mock')    issues.push('Enbart mockdata — ingen live-integration');
  if (analysis.totalEvents === 0) issues.push('Inga interaktiva events identifierade');
  if (analysis.stateCount === 0)  issues.push('Inga React state hooks (useState/useEffect)');

  if (analysis.hasEmptyState)   strengths.push('Empty state implementerat');
  if (analysis.hasLoadingState) strengths.push('Loading state implementerat');
  if (analysis.hasErrorState)   strengths.push('Error handling implementerat');
  if (scoring.dataSource === 'live')    strengths.push('Live data-integration aktiv');
  if (scoring.dataSource === 'partial') strengths.push('Delvis live data-integration');
  if (analysis.totalEvents >= 5) strengths.push(`Events väl täckta (${analysis.totalEvents} st)`);
  if (analysis.stateCount >= 5)  strengths.push(`Rikt state-hantering (${analysis.stateCount} hooks)`);

  return { issues, strengths };
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  console.log('🔍 UX Audit Pipeline startar...\n');

  // Load maturity registry
  let maturityMap = {};
  try {
    const tsSource = fs.readFileSync(MATURITY_FILE, 'utf8');
    const registry = parseMaturityRegistry(tsSource);
    for (const entry of registry) {
      maturityMap[entry.id] = entry;
    }
    console.log(`📋 Maturity registry laddad: ${registry.length} moduler\n`);
  } catch (e) {
    console.warn(`⚠️  Kunde inte läsa maturity model: ${e.message}`);
  }

  // Get all feature dirs
  const featureDirs = fs.readdirSync(FEATURES_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();

  console.log(`📁 Feature-mappar hittade: ${featureDirs.length}\n`);

  const moduleResults = [];

  for (const dirName of featureDirs) {
    const modulePath = path.join(FEATURES_DIR, dirName);
    const tsxFiles = collectTsxFiles(modulePath);

    const maturity = maturityMap[dirName] || null;

    if (tsxFiles.length === 0) {
      // Module dir with no TSX files — skeleton
      const result = {
        id: dirName,
        name: maturity?.name || dirName,
        path: maturity?.path || `/${dirName}`,
        score: 0,
        level: 'KRITISK',
        maturityLevel: maturity?.level || 'skeleton',
        dataSource: maturity?.dataSource || 'mock',
        events: {},
        states: {
          hasEmptyState: false,
          hasLoadingState: false,
          hasErrorState: false,
          stateCount: 0,
        },
        issues: ['Inga TSX-filer hittade — modul är ett skeleton'],
        strengths: [],
        filesAnalyzed: 0,
      };
      moduleResults.push(result);
      console.log(`  ${levelEmoji('KRITISK')} [  0] ${dirName.padEnd(30)} — 0 filer`);
      continue;
    }

    const analysis = analyzeFiles(tsxFiles);
    const scoring = computeScore(analysis, maturity?.dataSource);
    const level = scoreLevel(scoring.total);
    const { issues, strengths } = deriveIssuesAndStrengths(analysis, scoring);

    const result = {
      id: dirName,
      name: maturity?.name || dirName,
      path: maturity?.path || `/${dirName}`,
      score: scoring.total,
      level,
      maturityLevel: maturity?.level || 'skeleton',
      dataSource: scoring.dataSource,
      events: analysis.events,
      states: {
        hasEmptyState: analysis.hasEmptyState,
        hasLoadingState: analysis.hasLoadingState,
        hasErrorState: analysis.hasErrorState,
        stateCount: analysis.stateCount,
      },
      scoring: {
        eventScore: Math.round(scoring.eventScore),
        emptyScore: scoring.emptyScore,
        loadingScore: scoring.loadingScore,
        errorScore: scoring.errorScore,
        dataScore: scoring.dataScore,
      },
      issues,
      strengths,
      filesAnalyzed: tsxFiles.length,
    };

    moduleResults.push(result);
    console.log(`  ${levelEmoji(level)} [${String(scoring.total).padStart(3)}] ${dirName.padEnd(30)} — ${tsxFiles.length} fil(er)`);
  }

  // ── Aggregate summary ──────────────────────────────────────────────────────
  const avgScore = Math.round(moduleResults.reduce((s, m) => s + m.score, 0) / moduleResults.length);
  const byLevel = (lv) => moduleResults.filter(m => m.level === lv).map(m => m.id);

  const summary = {
    locked:     byLevel('LOCKED'),
    bra:        byLevel('BRA'),
    acceptabel: byLevel('ACCEPTABEL'),
    svag:       byLevel('SVAG'),
    critical:   byLevel('KRITISK'),
    avgScore,
    totalFiles: moduleResults.reduce((s, m) => s + m.filesAnalyzed, 0),
    levelCounts: {
      LOCKED:     byLevel('LOCKED').length,
      BRA:        byLevel('BRA').length,
      ACCEPTABEL: byLevel('ACCEPTABEL').length,
      SVAG:       byLevel('SVAG').length,
      KRITISK:    byLevel('KRITISK').length,
    },
  };

  const report = {
    generatedAt: new Date().toISOString(),
    totalModules: moduleResults.length,
    modules: moduleResults,
    summary,
  };

  // ── Write JSON ─────────────────────────────────────────────────────────────
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n✅ JSON-rapport sparad: ${REPORT_JSON}`);

  // ── Write Markdown ─────────────────────────────────────────────────────────
  const now = new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' });

  const levelBlock = (label, emoji, ids, modules) => {
    if (ids.length === 0) return '';
    const rows = ids.map(id => {
      const m = modules.find(x => x.id === id);
      if (!m) return '';
      const stateIcons = [
        m.states.hasEmptyState   ? '✅' : '❌',
        m.states.hasLoadingState ? '✅' : '❌',
        m.states.hasErrorState   ? '✅' : '❌',
      ].join(' ');
      const dsIcon = m.dataSource === 'live' ? '🟢' : m.dataSource === 'partial' ? '🟡' : '🔴';
      return `| ${m.name.padEnd(28)} | ${String(m.score).padStart(3)} | ${m.maturityLevel.padEnd(10)} | ${stateIcons} | ${dsIcon} ${m.dataSource} |`;
    }).filter(Boolean);
    if (rows.length === 0) return '';
    return `\n## ${emoji} ${label} (${ids.length})\n\n| Modul | Score | Maturity | Empty/Load/Error | Data |\n|---|---|---|---|---|\n${rows.join('\n')}\n`;
  };

  const topIssues = moduleResults
    .filter(m => m.score < 40)
    .sort((a, b) => a.score - b.score)
    .slice(0, 15)
    .map(m => `- **${m.name}** (${m.score}p): ${m.issues.join(', ')}`)
    .join('\n');

  const mdContent = `# UX Audit — Wavult OS Command Center
_Genererad: ${now}_

## Sammanfattning

| Metrik | Värde |
|---|---|
| Totalt moduler | ${report.totalModules} |
| Analyserade filer | ${summary.totalFiles} |
| Genomsnittlig score | **${avgScore}/100** |
| 🔵 LOCKED | ${summary.levelCounts.LOCKED} |
| 🟢 BRA | ${summary.levelCounts.BRA} |
| 🟡 ACCEPTABEL | ${summary.levelCounts.ACCEPTABEL} |
| 🟠 SVAG | ${summary.levelCounts.SVAG} |
| 🔴 KRITISK | ${summary.levelCounts.KRITISK} |

---
${levelBlock('LOCKED — Enterprise-standard', '🔵', summary.locked, moduleResults)}
${levelBlock('BRA — Nästan komplett', '🟢', summary.bra, moduleResults)}
${levelBlock('ACCEPTABEL — De flesta states täckta', '🟡', summary.acceptabel, moduleResults)}
${levelBlock('SVAG — Partial coverage', '🟠', summary.svag, moduleResults)}
${levelBlock('KRITISK — Saknar grundläggande states', '🔴', summary.critical, moduleResults)}

---

## Top-prioritet: Kritiska moduler att åtgärda

${topIssues || '_Inga kritiska moduler!_'}

---

## Alla moduler — komplett lista

| Modul | ID | Score | Nivå | Maturity | Empty | Load | Error | Data |
|---|---|---|---|---|---|---|---|---|
${moduleResults
  .sort((a, b) => b.score - a.score)
  .map(m => {
    const e = m.states.hasEmptyState   ? '✅' : '❌';
    const l = m.states.hasLoadingState ? '✅' : '❌';
    const er = m.states.hasErrorState  ? '✅' : '❌';
    const ds = m.dataSource === 'live' ? '🟢' : m.dataSource === 'partial' ? '🟡' : '🔴';
    const lv = levelEmoji(m.level);
    return `| ${m.name} | \`${m.id}\` | ${m.score} | ${lv} ${m.level} | ${m.maturityLevel} | ${e} | ${l} | ${er} | ${ds} ${m.dataSource} |`;
  }).join('\n')}

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

_Script: \`/mnt/c/Users/erik/Desktop/Wavult/ux-audit/run-audit.mjs\`_
`;

  fs.writeFileSync(REPORT_MD, mdContent, 'utf8');
  console.log(`✅ Markdown-rapport sparad: ${REPORT_MD}`);

  // ── Console summary ────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 AUDIT KLAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Moduler:        ${report.totalModules}
  Filer:          ${summary.totalFiles}
  Avg score:      ${avgScore}/100

  🔵 LOCKED:      ${summary.levelCounts.LOCKED}
  🟢 BRA:         ${summary.levelCounts.BRA}
  🟡 ACCEPTABEL:  ${summary.levelCounts.ACCEPTABEL}
  🟠 SVAG:        ${summary.levelCounts.SVAG}
  🔴 KRITISK:     ${summary.levelCounts.KRITISK}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main();
