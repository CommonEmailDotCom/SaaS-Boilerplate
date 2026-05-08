const {execSync} = require('child_process');
const fs = require('fs');
const T = process.env.COOLIFY_API_TOKEN;
const U = process.env.COOLIFY_URL || 'http://coolify:8080';

async function getEnv(uuid, key) {
  const envs = await fetch(U+'/api/v1/applications/'+uuid+'/envs', {
    headers: {'Authorization': 'Bearer '+T}
  }).then(r => r.json());
  return envs.find(e => e.key === key)?.real_value || '';
}

async function main() {
  const env = {
    ...process.env,
    CLERK_SECRET_KEY: await getEnv('tuk1rcjj16vlk33jrbx3c9d3', 'CLERK_SECRET_KEY'),
    QA_GMAIL_EMAIL: 'testercuttingedgechat@gmail.com',
    CLERK_PUBLISHABLE_KEY: 'pk_test_c21hc2hpbmctYmlzb24tNzIuY2xlcmsuYWNjb3VudHMuZGV2JA',
    AUTHENTIK_TEST_USERNAME: 'testercuttingedgechat',
    AUTHENTIK_TEST_PASSWORD: 'Hbj6ZVk5fHXhstz',
  };

  const start = new Date().toISOString();
  let output, exitCode;

  try {
    output = execSync(
      'npx playwright test e2e/t001-auth.spec.ts --grep "B2" --config=playwright.local.config.ts --project=chromium',
      { cwd: '/repo-observer', env, timeout: 120000, stdio: 'pipe' }
    ).toString();
    exitCode = 0;
  } catch(e) {
    output = (e.stdout ? e.stdout.toString() : '') + (e.stderr ? e.stderr.toString() : '');
    exitCode = e.status || 1;
  }

  const result = { start, end: new Date().toISOString(), exitCode, output };
  fs.writeFileSync('/tmp/b2-result.json', JSON.stringify(result, null, 2));
  console.log('done, exit:', exitCode);
}
main();
