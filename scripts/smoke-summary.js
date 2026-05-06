#!/usr/bin/env node
// Called by smoke-test.yml to generate a GitHub Actions job summary via Claude API
// Usage: node scripts/smoke-summary.js <sha> <deploy_seconds> <exit_code> <playwright_output_file> <run_url> <run_id>

const fs = require('fs');

const [,, sha, deploySeconds, exitCode, outputFile, runUrl, runId] = process.argv;
const passed = exitCode === '0';
const playwrightOutput = fs.readFileSync(outputFile, 'utf8');

const minutes = Math.floor(deploySeconds / 60);
const seconds = deploySeconds % 60;
const deployStr = minutes > 0 ? `${minutes} min ${seconds}s` : `${seconds}s`;

const REPO = 'CommonEmailDotCom/SaaS-Boilerplate';
const commitUrl = `https://github.com/${REPO}/commit/${sha}`;

async function getCommitMessage(sha) {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/commits/${sha}`, {
      headers: {
        'Authorization': 'Bearer ' + process.env.GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    const data = await res.json();
    return data.commit?.message?.split('\n')[0] || '';
  } catch (err) {
    return '';
  }
}

async function main() {
  const commitMessage = await getCommitMessage(sha);
  const shaLink = `[\`${sha}\`](${commitUrl})`;
  const commitInfo = commitMessage ? `${shaLink} — ${commitMessage}` : shaLink;

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
- A header with pass/fail status emoji (🟢 or 🔴), then this exact markdown for the commit (do not modify it): ${commitInfo}, and deploy time (${deployStr})
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
    const icon = passed ? '🟢' : '🔴';
    const status = passed ? 'Passed' : 'Failed';
    summary = `## ${icon} Smoke Test ${status} — ${commitInfo}\n\n**Deploy time:** ${deployStr}\n\n\`\`\`\n${playwrightOutput}\n\`\`\``;
  }

  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(summaryFile, summary + '\n');
  }

  fs.writeFileSync('/tmp/smoke-summary.md', summary + '\n');

  // Include runId so the commit step can use it as a monotonic guard
  const status = {
    status: passed ? 'passing' : 'failing',
    sha,
    runId: runId ? parseInt(runId, 10) : 0,
    deployTime: deployStr,
    runUrl: runUrl || '',
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync('smoke-status.json', JSON.stringify(status, null, 2) + '\n');

  console.log(summary);
}

main();
