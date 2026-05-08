const t = require('fs').readFileSync('/tmp/pw-out.txt', 'utf8');
if (t.includes(' passed') || t.includes(' failed')) {
  const lines = t.split('\n').filter(l => l.trim());
  lines.forEach(l => {
    if (l.includes('Error:') || l.includes('switchToProvider') || l.includes(' passed') || l.includes(' failed') || l.includes('✓') || l.includes('✘'))
      console.log(l);
  });
} else {
  const lines = t.split('\n').filter(l => l.trim());
  console.log('still running... last:', lines[lines.length - 1]);
}
