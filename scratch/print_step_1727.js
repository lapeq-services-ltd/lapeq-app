const fs = require('fs');

const logPath = 'C:\\Users\\PAP AMNESTY\\.gemini\\antigravity-ide\\brain\\6795a66a-f3d9-434d-b4a8-180fff88dba1\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;

  try {
    const data = JSON.parse(line);
    if (data.step_index === 1727 || data.step_index === 1732 || data.step_index === 1734) {
      console.log(`Found step ${data.step_index}! Type: ${data.type}`);
      if (data.tool_calls) {
        console.log("  Tool calls count:", data.tool_calls.length);
        data.tool_calls.forEach(c => {
          console.log(`    Tool name: ${c.name}`);
          console.log(`    Args:`, JSON.stringify(c.args));
        });
      }
      if (data.content) {
        console.log(`  Content length: ${data.content.length}`);
        console.log(`  Content preview: ${data.content.slice(0, 300)}...`);
      }
    }
  } catch(e) {}
}
