#!/usr/bin/env node
/**
 * qa-report.js — called by observer-qa.yml after Playwright run
 * Reads Playwright output, calls Claude API for analysis,
 * writes structured report to agent_sync/QA_REPORT_ACTIONS.md
 * so the MCP Observer loop can pick it up on next trigger.
 */

const fs = require('fs');
const path = require('path');

const [,, sha, exitCode, outputFile] = process.argv;
const passed = exitCode === '0';
const playwrightOutput = fs.readFileSync(outputFile, 'utf8');
const shortSha = sha?.substring(0, 7) ?? 'unknown';
const timestamp = new Date().toISOString();

const REPO = 'CommonEmailDotCom/SaaS-Boilerplate';

async function main() {
  let report;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `You are the Observer Agent. Analyze this Playwright test output from the T-001 auth flow test run and produce a structured QA report in markdown.

SHA under test: ${shortSha}
Timestamp: ${timestamp}
Overall result: ${passed ? 'PASSED' : 'FAILED'}

Format the report as follows:
1. Header with status emoji, SHA, and timestamp
2. Per-test table: Test name | Status (✅/❌/⏭ skipped) | Key finding
3. Findings section using categories: [CRITICAL], [VISUAL_GLITCH], [UX_SUGGESTION], [PASS]
4. "Blocked / Skipped" section noting any tests that were skipped due to missing credentials
5. "Next actions" — what the Manager or Operator needs to do

Be concise and factual. Use only what's in the output — do not invent findings.
Output only the markdown report, no preamble.

Playwright output:
${playwrightOutput}`,
        }],
      }),
    });

    const data = await response.json();
    report = data.content[0].text;
  } catch (err) {
    // Fallback — write raw output if Claude API fails
    const icon = passed ? '✅' : '❌';
    report = [
      `# ${icon} T-001 QA Report — Observer Agent`,
      ``,
      `_SHA: ${shortSha} | ${timestamp}_`,
      `_Claude API summary unavailable: ${err.message}_`,
      ``,
      `## Raw Playwright Output`,
      ``,
      '```',
      playwrightOutput,
      '```',
    ].join('\n');
  }

  // Write to agent_sync for MCP Observer loop
  const dir = path.join(process.cwd(), 'agent_sync');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'QA_REPORT_ACTIONS.md'), report + '\n');

  // Also append a timestamped entry to the main QA_REPORT.md
  const mainReport = path.join(dir, 'QA_REPORT.md');
  const existing = fs.existsSync(mainReport) ? fs.readFileSync(mainReport, 'utf8') : '';
  const entry = [
    ``,
    `---`,
    ``,
    `## Actions Run — ${shortSha} — ${timestamp}`,
    ``,
    report,
  ].join('\n');

  // Append after the first heading so it doesn't replace the existing report
  const updated = existing.includes('## Actions Run')
    ? existing.replace(/\n---\n\n## Actions Run.*$/s, entry)
    : existing + entry;
  fs.writeFileSync(mainReport, updated);

  console.log(`QA report written to agent_sync/QA_REPORT_ACTIONS.md`);
  console.log(report);
}

main();
