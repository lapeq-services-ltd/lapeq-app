const fs = require('fs');
const path = require('path');

const files = ['full_replacement_1319.txt', 'full_replacement_1419.txt'];

for (const file of files) {
  const filePath = path.join('c:\\Users\\PAP AMNESTY\\Documents\\lapeq-app\\scratch', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`${file}: length ${content.length} characters.`);
    if (content.includes('<truncated')) {
      console.log(`  -> WARNING: contains truncation marker!`);
    } else {
      console.log(`  -> Perfect: no truncation marker!`);
    }
  } else {
    console.log(`File not found: ${filePath}`);
  }
}
