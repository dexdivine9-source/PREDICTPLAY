const fs = require('fs');
const file = '/app/applet/components/evidence-upload.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'await registerEvidenceAction(userId, matchId, phase, storagePath);',
  'await registerEvidenceAction(matchId, phase, storagePath);'
);
fs.writeFileSync(file, content);
