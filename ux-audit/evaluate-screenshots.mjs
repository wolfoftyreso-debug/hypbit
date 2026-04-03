/**
 * evaluate-screenshots.mjs
 * Wavult OS — OpenAI Vision UX Evaluering (Steg 5)
 *
 * Läser screenshots från ./screenshots/manifest.json,
 * skickar till GPT-4o Vision API, aggregerar och sparar vision-report.json.
 * Mergar även resultaten in i audit-report.json om det finns.
 *
 * API-nyckel: läses från /home/erikwsl/.openclaw/secrets/credentials.env
 *
 * Användning:
 *   node evaluate-screenshots.mjs
 *
 * Alternativ: kör specifika moduler:
 *   node evaluate-screenshots.mjs crm finance dashboard
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Konfiguration ───────────────────────────────────────────────────────────

const SCREENSHOTS_DIR  = join(__dirname, 'screenshots');
const MANIFEST_PATH    = join(SCREENSHOTS_DIR, 'manifest.json');
const VISION_REPORT    = join(__dirname, 'vision-report.json');
const AUDIT_REPORT     = join(__dirname, 'audit-report.json');
const CREDENTIALS_FILE = '/home/erikwsl/.openclaw/secrets/credentials.env';
const OPENAI_MODEL     = 'gpt-4o';
const REQUEST_DELAY_MS = 1_200;  // Rate limit: ~50 req/min för tier-1

// ─── Ladda API-nyckel ────────────────────────────────────────────────────────

function loadApiKey() {
  // Prioritet 1: miljövariabel (om source:ad i shell)
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;

  // Prioritet 2: parsa credentials.env direkt
  if (!existsSync(CREDENTIALS_FILE)) {
    console.error(`❌ credentials.env saknas: ${CREDENTIALS_FILE}`);
    process.exit(1);
  }

  const content = readFileSync(CREDENTIALS_FILE, 'utf8');
  for (const line of content.split('\n')) {
    const match = line.match(/^(?:export\s+)?OPENAI_API_KEY=["']?([^"'\s#]+)["']?/);
    if (match) return match[1];
  }

  console.error('❌ OPENAI_API_KEY saknas i credentials.env');
  process.exit(1);
}

// ─── Hjälpfunktioner ─────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function imageToBase64(filePath) {
  const data = readFileSync(filePath);
  return data.toString('base64');
}

function buildPrompt(name, description) {
  return `You are a UX evaluator for enterprise business applications.

Look at this screenshot of a business application page.

Module name: ${name}
Expected purpose: ${description}

Evaluate the page and respond ONLY with a valid JSON object (no markdown, no explanation, just JSON):

{
  "understands_purpose": true,
  "has_clear_visual_hierarchy": true,
  "has_empty_state_visible": false,
  "has_loading_indicator": false,
  "has_error_handling_visible": false,
  "overall_ux_score": 72,
  "primary_issue": "One sentence describing the biggest UX problem visible.",
  "ai_understanding": "One sentence describing what this page does based on what you see."
}

Field definitions:
- understands_purpose: Can you clearly tell what this page does from the visual content alone?
- has_clear_visual_hierarchy: Is there a clear visual structure (headings, sections, priority)?
- has_empty_state_visible: Is an empty state / "no data" UI currently shown?
- has_loading_indicator: Is a loading spinner or skeleton visible?
- has_error_handling_visible: Is an error message or error state visible?
- overall_ux_score: 0–100 overall UX quality score based on clarity, hierarchy, feedback, consistency
- primary_issue: The single most important UX problem (or "None" if excellent)
- ai_understanding: Your one-sentence summary of what this page does

Respond with ONLY the JSON object.`;
}

async function evaluateModule(apiKey, module) {
  const { id, name, description, screenshot } = module;

  if (!existsSync(screenshot)) {
    return {
      id,
      name,
      status: 'missing_screenshot',
      error: `Screenshot saknas: ${screenshot}`,
    };
  }

  const base64Image = imageToBase64(screenshot);
  const prompt      = buildPrompt(name, description ?? '');

  const requestBody = {
    model: OPENAI_MODEL,
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url:    `data:image/png;base64,${base64Image}`,
              detail: 'high',
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API ${response.status}: ${errorText}`);
  }

  const data   = await response.json();
  const raw    = data.choices?.[0]?.message?.content ?? '';
  const tokens = data.usage?.total_tokens ?? 0;

  // Parsa JSON från svaret
  let evaluation;
  try {
    // Rensa bort eventuell markdown-wrapper
    const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
    evaluation = JSON.parse(cleaned);
  } catch {
    throw new Error(`Kunde inte parsa JSON från GPT-svar: ${raw.slice(0, 200)}`);
  }

  return {
    id,
    name,
    description,
    screenshot: module.filename,
    timestamp:  module.timestamp,
    status:     'ok',
    tokens_used: tokens,
    evaluation,
  };
}

// ─── Huvud-pipeline ──────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Wavult OS — Vision UX Evaluering');
  console.log('=====================================\n');

  // Ladda API-nyckel
  const apiKey = loadApiKey();
  console.log('🔑 OpenAI API-nyckel laddad\n');

  // Ladda manifest
  if (!existsSync(MANIFEST_PATH)) {
    console.error(`❌ Manifest saknas: ${MANIFEST_PATH}`);
    console.error('   Kör screenshot-pipeline.mjs först.\n');
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  let modules    = Object.values(manifest);

  // Filtrera på specifika moduler om angivna via CLI
  const filterIds = process.argv.slice(2);
  if (filterIds.length > 0) {
    modules = modules.filter(m => filterIds.includes(m.id));
    console.log(`🔎 Filtrerar till: ${filterIds.join(', ')}`);
  }

  console.log(`📸 Utvärderar ${modules.length} screenshots med ${OPENAI_MODEL}...\n`);

  const results = [];
  let totalTokens = 0;

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    process.stdout.write(`  [${(i + 1).toString().padStart(2)}/${modules.length}] ${mod.name.padEnd(25)} `);

    try {
      const result = await evaluateModule(apiKey, mod);
      results.push(result);
      totalTokens += result.tokens_used ?? 0;

      if (result.status === 'ok') {
        const score = result.evaluation?.overall_ux_score ?? '?';
        console.log(`✅ UX score: ${score}/100  (${result.tokens_used} tokens)`);
      } else {
        console.log(`⚠️  ${result.status}: ${result.error}`);
      }
    } catch (err) {
      console.log(`❌ ${err.message}`);
      results.push({
        id:     mod.id,
        name:   mod.name,
        status: 'error',
        error:  err.message,
      });
    }

    // Rate limit: vänta mellan requests
    if (i < modules.length - 1) await sleep(REQUEST_DELAY_MS);
  }

  // ─── Aggregering ────────────────────────────────────────────────────────────

  const successful = results.filter(r => r.status === 'ok');
  const failed     = results.filter(r => r.status !== 'ok');
  const scores     = successful.map(r => r.evaluation?.overall_ux_score ?? 0).filter(s => s > 0);
  const avgScore   = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  // Sortera efter score (lägsta först = mest behöver förbättring)
  const sorted = [...successful].sort(
    (a, b) => (a.evaluation?.overall_ux_score ?? 0) - (b.evaluation?.overall_ux_score ?? 0)
  );

  const visionReport = {
    generated_at:     new Date().toISOString(),
    model:            OPENAI_MODEL,
    total_modules:    modules.length,
    evaluated:        successful.length,
    failed:           failed.length,
    total_tokens:     totalTokens,
    average_ux_score: avgScore,
    lowest_scoring:   sorted.slice(0, 5).map(r => ({
      id:    r.id,
      name:  r.name,
      score: r.evaluation?.overall_ux_score,
      issue: r.evaluation?.primary_issue,
    })),
    highest_scoring: sorted.slice(-5).reverse().map(r => ({
      id:    r.id,
      name:  r.name,
      score: r.evaluation?.overall_ux_score,
    })),
    modules: results,
  };

  // Spara vision-report.json
  writeFileSync(VISION_REPORT, JSON.stringify(visionReport, null, 2));
  console.log(`\n📄 Vision-rapport sparad: ${VISION_REPORT}`);

  // ─── Merga med audit-report.json ────────────────────────────────────────────

  if (existsSync(AUDIT_REPORT)) {
    try {
      const auditData = JSON.parse(readFileSync(AUDIT_REPORT, 'utf8'));
      const auditArray = Array.isArray(auditData) ? auditData : auditData.modules ?? [];
      let updated = 0;

      for (const auditModule of auditArray) {
        const match = results.find(r => r.id === auditModule.id && r.status === 'ok');
        if (match) {
          auditModule.visionScore      = match.evaluation?.overall_ux_score ?? null;
          auditModule.aiUnderstanding  = match.evaluation?.ai_understanding ?? null;
          auditModule.primaryUxIssue   = match.evaluation?.primary_issue ?? null;
          auditModule.visionEvaluatedAt = match.timestamp;
          updated++;
        }
      }

      const updatedAudit = Array.isArray(auditData)
        ? auditArray
        : { ...auditData, modules: auditArray };

      writeFileSync(AUDIT_REPORT, JSON.stringify(updatedAudit, null, 2));
      console.log(`📊 audit-report.json uppdaterad med vision-data för ${updated} moduler`);
    } catch (err) {
      console.warn(`⚠️  Kunde inte merga med audit-report.json: ${err.message}`);
    }
  } else {
    console.log('ℹ️  audit-report.json saknas — ingen merge utförd');
  }

  // ─── Summering ───────────────────────────────────────────────────────────────

  console.log('\n═══════════════════════════════════════');
  console.log(`  📊 Genomsnittlig UX-score: ${avgScore}/100`);
  console.log(`  ✅ Utvärderade:  ${successful.length}/${modules.length}`);
  if (failed.length > 0) {
    console.log(`  ❌ Misslyckades: ${failed.length}`);
    failed.forEach(r => console.log(`     - ${r.name}: ${r.error}`));
  }
  console.log(`  🔢 Tokens totalt: ${totalTokens.toLocaleString()}`);
  console.log('\n  📉 Lägsta UX-score (behöver mest arbete):');
  sorted.slice(0, 5).forEach(r => {
    const score = r.evaluation?.overall_ux_score ?? '?';
    const issue = r.evaluation?.primary_issue ?? '';
    console.log(`     ${String(score).padStart(3)}/100  ${r.name}: ${issue}`);
  });
  console.log('\n  📈 Högsta UX-score:');
  sorted.slice(-3).reverse().forEach(r => {
    const score = r.evaluation?.overall_ux_score ?? '?';
    console.log(`     ${String(score).padStart(3)}/100  ${r.name}`);
  });
  console.log('═══════════════════════════════════════\n');
  console.log(`🎉 Vision-evaluering klar!`);
  console.log(`📁 Rapport: ${VISION_REPORT}\n`);
}

main().catch(err => {
  console.error('💥 Oväntat fel:', err);
  process.exit(1);
});
