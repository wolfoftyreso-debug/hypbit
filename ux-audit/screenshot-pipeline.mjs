/**
 * screenshot-pipeline.mjs
 * Wavult OS — Automated Screenshot Pipeline (Steg 4)
 *
 * Startar dev-servern, tar fullpage screenshots per route, sparar med timestamp.
 * Kräver: playwright installerat i /mnt/c/Users/erik/Desktop/Wavult
 *
 * Användning:
 *   node screenshot-pipeline.mjs
 *
 * Resultat sparas i: ./screenshots/{module-id}_{timestamp}.png
 * Manifest sparas i: ./screenshots/manifest.json (senaste screenshot per modul)
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Konfiguration ───────────────────────────────────────────────────────────

const DEV_SERVER_PORT = 5175;
const DEV_SERVER_URL  = `http://localhost:${DEV_SERVER_PORT}`;
const APP_ROOT        = '/mnt/c/Users/erik/Desktop/Wavult/apps/command-center';
const SCREENSHOTS_DIR = join(__dirname, 'screenshots');
const AUDIT_REPORT    = join(__dirname, 'audit-report.json');
const SERVER_TIMEOUT_MS = 30_000;
const SCREENSHOT_DELAY_MS = 1_500;  // Vänta på att sidan renderas klart

// ─── Moduler (fallback om audit-report.json saknas) ──────────────────────────

const FALLBACK_MODULES = [
  { id: 'dashboard',           name: 'Dashboard',           path: '/dashboard',           description: 'Systemoversikt, team-aktivitet, status och snabblänkar' },
  { id: 'crm',                 name: 'CRM',                 path: '/crm',                 description: 'Pipeline-vy, prospects, kontakter och aktivitetslogg' },
  { id: 'finance',             name: 'Finance',             path: '/finance',             description: 'Kontoplan, transaktioner, fakturor och kassaflödesdiagram' },
  { id: 'payroll',             name: 'Lön & Personal',      path: '/payroll',             description: 'Löneöversikt, anställningslista, lönespecar och semesterspårning' },
  { id: 'legal',               name: 'Legal Hub',           path: '/legal',               description: 'Dokumentlista, signeringsflöden och kontraktshantering' },
  { id: 'corporate',           name: 'Bolagsadmin',         path: '/corporate',           description: 'Ägarstruktur, jurisdiktioner och compliance-tracker' },
  { id: 'milestones',          name: 'Milestones',          path: '/milestones',          description: 'Thailand prep checklista, bolagsstruktur och roadmap Q2-Q4' },
  { id: 'communications',      name: 'Kommunikation',       path: '/communications',      description: 'Inbox, API-statusöversikt och webhook-logg' },
  { id: 'procurement',         name: 'Inköp',               path: '/procurement',         description: 'Leverantörslista, inköpsordrar och godkännandeflöde' },
  { id: 'reports',             name: 'Rapporter',           path: '/reports',             description: 'Executive Summary, P&L och säljrapporter' },
  { id: 'settings',            name: 'Inställningar',       path: '/settings',            description: 'API-nyckelöversikt, rollhantering och systeminformation' },
  { id: 'media',               name: 'Media & Ads',         path: '/media',               description: 'Kampanjstruktur, kanallista och budgetöversikt' },
  { id: 'org',                 name: 'Corporate Graph',     path: '/org',                 description: 'Org-graf, hierarki och entity-switcher' },
  { id: 'knowledge',           name: 'Knowledge Hub',       path: '/knowledge',           description: 'Kunskapsbas, kunskapsgraf, Academy och Zoomer-certifiering' },
  { id: 'people-intelligence', name: 'People Intelligence', path: '/people-intelligence', description: 'DISC-profiler, energi- och fokustracking, beslutsarkitektur' },
  { id: 'talent-radar',        name: 'Talent Radar',        path: '/talent-radar',        description: 'Elite target list, GitHub star rankings och status pipeline' },
  { id: 'system-intelligence', name: 'System Intelligence', path: '/system-intelligence', description: 'Koncernhälsa, strategisk riskmatris, beslutslogg och marknadssignaler' },
  { id: 'api-hub',             name: 'API Hub',             path: '/api-hub',             description: 'Integrationskatalog med 100+ APIs, aktiva integrationer och providernyheter' },
  { id: 'llm-hub',             name: 'LLM Hub',             path: '/llm-hub',             description: 'Chat-gränssnitt, playground, provider-status och LLM-fallback-kedja' },
  { id: 'insurance',           name: 'Insurance Hub',       path: '/insurance',           description: 'Försäkringskatalog, veckorevision, täckningsöversikt och gap-notifieringar' },
  { id: 'whoop',               name: 'WHOOP Team Pulse',    path: '/whoop',               description: 'OAuth2-koppling, recovery score, sömn & strain-data och team-aggregering' },
  { id: 'team-map',            name: 'Team Map',            path: '/team-map',            description: 'Mapbox karta, teammedlemmar som avatar-bubblor och positionsuppdatering' },
];

// ─── Hjälpfunktioner ─────────────────────────────────────────────────────────

function loadModules() {
  if (existsSync(AUDIT_REPORT)) {
    try {
      const data = JSON.parse(readFileSync(AUDIT_REPORT, 'utf8'));
      const modules = Array.isArray(data) ? data : data.modules ?? data;
      if (Array.isArray(modules) && modules.length > 0) {
        console.log(`📋 Laddar ${modules.length} moduler från audit-report.json`);
        return modules.map(m => ({
          id:          m.id,
          name:        m.name,
          path:        m.path ?? `/${m.id}`,
          description: m.description ?? m.notes ?? '',
        }));
      }
    } catch (e) {
      console.warn('⚠️  Kunde inte parsa audit-report.json, använder fallback:', e.message);
    }
  }
  console.log(`📋 Använder fallback: ${FALLBACK_MODULES.length} moduler från maturityModel.ts`);
  return FALLBACK_MODULES;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs) {
  const start = Date.now();
  const interval = 500;
  console.log(`⏳ Väntar på ${url} (timeout: ${timeoutMs / 1000}s)...`);

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status < 500) {
        console.log(`✅ Dev-server svarar (${Date.now() - start}ms)`);
        return true;
      }
    } catch {
      // fortsätt försöka
    }
    await sleep(interval);
  }

  console.error(`❌ Dev-server svarade inte inom ${timeoutMs / 1000}s — avbryter.`);
  process.exit(1);
}

// ─── Huvud-pipeline ──────────────────────────────────────────────────────────

async function main() {
  const ts = timestamp();
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  // Starta dev-server
  console.log(`🚀 Startar dev-server: npm run dev (${APP_ROOT})`);
  const server = spawn('npm', ['run', 'dev'], {
    cwd: APP_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
    shell: true,
  });

  let serverOutput = '';
  server.stdout.on('data', d => { serverOutput += d.toString(); });
  server.stderr.on('data', d => { serverOutput += d.toString(); });
  server.on('error', err => {
    console.error('❌ Kunde inte starta dev-server:', err.message);
    process.exit(1);
  });

  // Vänta på dev-server
  await waitForServer(DEV_SERVER_URL, SERVER_TIMEOUT_MS);

  // Starta browser
  console.log('🌐 Startar Chromium...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
    locale: 'sv-SE',
  });

  const modules = loadModules();
  const manifest = {};
  const results  = [];

  console.log(`\n📸 Tar screenshots av ${modules.length} moduler...\n`);

  for (const mod of modules) {
    const page     = await context.newPage();
    const url      = `${DEV_SERVER_URL}${mod.path}`;
    const filename = `${mod.id}_${ts}.png`;
    const filepath = join(SCREENSHOTS_DIR, filename);

    try {
      console.log(`  → ${mod.name.padEnd(25)} ${url}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15_000 });
      await sleep(SCREENSHOT_DELAY_MS);
      await page.screenshot({ path: filepath, fullPage: true });

      manifest[mod.id] = {
        id:          mod.id,
        name:        mod.name,
        path:        mod.path,
        description: mod.description,
        screenshot:  filepath,
        filename,
        timestamp:   new Date().toISOString(),
        url,
      };

      results.push({ id: mod.id, name: mod.name, status: 'ok', file: filename });
      console.log(`     ✅ Sparad: ${filename}`);
    } catch (err) {
      console.error(`     ❌ Misslyckades: ${err.message}`);
      results.push({ id: mod.id, name: mod.name, status: 'error', error: err.message });
    } finally {
      await page.close();
    }
  }

  // Spara manifest
  const manifestPath = join(SCREENSHOTS_DIR, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n📝 Manifest sparat: ${manifestPath}`);

  // Summering
  const ok     = results.filter(r => r.status === 'ok').length;
  const failed = results.filter(r => r.status === 'error').length;
  console.log(`\n✅ ${ok} screenshots tagna`);
  if (failed > 0) {
    console.log(`❌ ${failed} misslyckades:`);
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }

  // Stäng browser
  await browser.close();
  console.log('\n🌐 Browser stängd');

  // Stäng dev-server
  console.log('🛑 Stänger dev-server...');
  server.kill('SIGTERM');
  await sleep(1000);
  if (server.exitCode === null) server.kill('SIGKILL');

  console.log('\n🎉 Pipeline klar!');
  console.log(`📁 Screenshots: ${SCREENSHOTS_DIR}`);
  console.log(`📋 Manifest:    ${manifestPath}`);
  console.log('\nKör nästa steg:');
  console.log('  node evaluate-screenshots.mjs\n');
}

main().catch(err => {
  console.error('💥 Oväntat fel:', err);
  process.exit(1);
});
