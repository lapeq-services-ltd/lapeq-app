const fs = require('fs');

const logPath = 'C:\\Users\\PAP AMNESTY\\.gemini\\antigravity-ide\\brain\\6795a66a-f3d9-434d-b4a8-180fff88dba1\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

const steps = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;
  
  try {
    const data = JSON.parse(line);
    if (line.includes('diaspora-support.tsx')) {
      steps.push({
        index: data.step_index,
        source: data.source,
        type: data.type,
        timestamp: data.created_at,
        hasToolCalls: !!data.tool_calls
      });
    }
  } catch(e) {}
}

console.log(`Found ${steps.length} occurrences in logs:`);
steps.forEach(s => {
  console.log(`Step ${s.index} | Source: ${s.source} | Type: ${s.type} | Time: ${s.timestamp} | HasTool: ${s.hasToolCalls}`);
});
