const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../assets/logo/logoanimate.svg');
const outputPath = path.join(__dirname, '../assets/logo/logoPaths.ts');

const svgText = fs.readFileSync(svgPath, 'utf8');
const matches = svgText.match(/<path[^>]+>/g) || [];

const parsed = matches.map(tag => {
  const fillMatch = tag.match(/fill="([^"]+)"/);
  const dMatch = tag.match(/d="([^"]+)"/);
  if (fillMatch && dMatch) {
    return { fill: fillMatch[1], d: dMatch[1] };
  }
  return null;
}).filter(Boolean);

const tsContent = `// Generated vector paths from logoanimate.svg
export const LOGO_PATHS = ${JSON.stringify(parsed, null, 2)};
`;

fs.writeFileSync(outputPath, tsContent, 'utf8');
console.log(`Successfully generated ${parsed.length} paths at ${outputPath}`);
