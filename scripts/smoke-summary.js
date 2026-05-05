#!/usr/bin/env node
// Called by smoke-test.yml to generate a GitHub Actions job summary via Claude API
// Usage: node scripts/smoke-summary.js <sha> <deploy_seconds> <exit_code> <playwright_output_file>

const fs = require('fs');

const [,, sha, deploySeconds, exitCode, outputFile] = process.argv;
const passed = exitCode === '0';
const playwrightOutput = fs.readFileSync(outputFile, 'utf8');

const minutes = Math.floor(deploySeconds / 60);
const seconds = deploySeconds % 60;
const deployStr = minutes > 0 ? `${minutes} min ${seconds}s` : `${seconds}s`;

async function main() {
  let summary;

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
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Analyze this Playwright smoke test output and generate a GitHub Actions job summary in markdown.

Include:
- A header with pass/fail status emoji (🟢 or 🔴), the SHA (${sha}), and deploy time (${deployStr})
- A table of each test.step() result with ✅ or ❌
- If there are failures: a brief plain-english explanation of what broke and whether it looks like a real regression or an infrastructure flap

Keep it concise. Output only the markdown, no preamble.

Playwright output:
${playwrightOutput}`,
        }],
      }),
    });

    const data = await response.json();
    summary = data.content[0].text;
  } catch (err) {
    // Fallback if Claude API fails
    const icon = passed ? '🟢' : '🔴';
    const status = passed ? 'Passed' : 'Failed';
    summary = `## ${icon} Smoke Test ${status} — \`${sha}\`\n\n**Deploy time:** ${deployStr}\n\n\`\`\`\n${playwrightOutput}\n\`\`\``;
  }

  // Write to GitHub Step Summary (renders in UI)
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(summaryFile, summary + '\n');
  }

  // Write to file so it can be uploaded as artifact and read via API
  fs.writeFileSync('/tmp/smoke-summary.md', summary + '\n');

  // Print to stdout so it appears in the job log too
  console.log(summary);
}

main();
