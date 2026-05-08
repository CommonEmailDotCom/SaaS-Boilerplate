let n = 0;
const iv = setInterval(() => {
  n++;
  try {
    const d = JSON.parse(require('fs').readFileSync('/tmp/playwright-result.json', 'utf8'));
    console.log('Exit:', d.exitCode);
    console.log(d.output.split('\n').filter(l => l.trim()).slice(-20).join('\n'));
    clearInterval(iv);
  } catch(e) {
    console.log('waiting...', n * 15 + 's');
    if (n >= 20) clearInterval(iv);
  }
}, 15000);
