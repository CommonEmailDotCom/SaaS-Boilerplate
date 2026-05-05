const deploymentUuid = process.argv[2];
const token = process.env.COOLIFY_API_TOKEN;
const url = `http://10.0.1.5:8080/api/v1/deployments/${deploymentUuid}`;

async function poll() {
  for (let i = 0; i < 30; i++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    const status = data.status;
    console.log(`[${new Date().toISOString()}] status: ${status}`);
    if (status === 'finished' || status === 'failed' || status === 'error') {
      console.log(`\nDone! Final status: ${status}`);
      process.exit(status === 'finished' ? 0 : 1);
    }
    await new Promise(r => setTimeout(r, 15000));
  }
  console.log('Timed out waiting for deployment');
  process.exit(1);
}

poll().catch(e => { console.error(e); process.exit(1); });
