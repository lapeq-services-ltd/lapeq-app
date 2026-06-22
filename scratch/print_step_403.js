const fs = require('fs');

const otherConvoId = 'c63074bb-5dd2-40f6-affe-cb9a1c413a2f';
const logPath = `C:\\Users\\PAP AMNESTY\\.gemini\\antigravity-ide\\brain\\${otherConvoId}\\.system_generated\\logs\\transcript.jsonl`;

const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;

  try {
    const data = JSON.parse(line);
    if (data.step_index === 403) {
      console.log("Found step 403!");
      console.log(JSON.stringify(data, null, 2));
    }
  } catch(e) {}
}
