const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\PAP AMNESTY\\.gemini\\antigravity-ide\\brain\\6795a66a-f3d9-434d-b4a8-180fff88dba1\\.system_generated\\logs\\transcript.jsonl';
if (!fs.existsSync(logPath)) {
  console.error("Log file does not exist at:", logPath);
  process.exit(1);
}

const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;
  
  try {
    const data = JSON.parse(line);
    if (data.tool_calls) {
      for (const call of data.tool_calls) {
        let args = call.args;
        if (typeof args === 'string') {
          try { args = JSON.parse(args); } catch(e) {}
        }
        
        const target = args.TargetFile || args.Target || "";
        if (target.toLowerCase().includes('diaspora-support.tsx')) {
          const stepIndex = data.step_index;
          console.log(`Step ${stepIndex}: Tool ${call.name}`);
          
          // Dump raw arguments to a text file
          fs.writeFileSync(`c:\\Users\\PAP AMNESTY\\Documents\\lapeq-app\\scratch\\step_${stepIndex}_raw.txt`, JSON.stringify(args, null, 2), 'utf8');
        }
      }
    }
  } catch (err) {}
}
console.log("Done dumping raw step arguments.");
