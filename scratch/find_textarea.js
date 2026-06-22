const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\PAP AMNESTY\\Documents\\lapeq-app\\scratch\\committed_diaspora.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('textarea')) {
    console.log(`Line ${idx + 1}: ${l}`);
  }
});
