const fs = require('fs');

const logPath = 'C:\\Users\\PAP AMNESTY\\.gemini\\antigravity-ide\\brain\\6795a66a-f3d9-434d-b4a8-180fff88dba1\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

console.log("Steps before 1244:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;
  
  try {
    const data = JSON.parse(line);
    if (data.step_index < 1244 && line.includes('diaspora-support.tsx')) {
      console.log(`Step ${data.step_index} | Type: ${data.type} | Time: ${data.created_at}`);
      if (data.tool_calls) {
        for (const call of data.tool_calls) {
          console.log(`  Tool call: ${call.name}`);
          let args = call.args;
          if (typeof args === 'string') {
            try { args = JSON.parse(args); } catch(e) {}
          }
          if (args.ReplacementContent) {
            console.log(`  Has ReplacementContent (length: ${args.ReplacementContent.length})`);
            fs.writeFileSync(`rep_${data.step_index}.json`, JSON.stringify(args, null, 2), 'utf8');
          }
          if (args.ReplacementChunks) {
            console.log(`  Has ReplacementChunks (count: ${args.ReplacementChunks.length})`);
            fs.writeFileSync(`rep_${data.step_index}.json`, JSON.stringify(args, null, 2), 'utf8');
          }
        }
      }
    }
  } catch(e) {}
}
