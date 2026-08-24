const fs = require('fs');
const file = '/app/applet/app/matches/[id]/verify/page.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'await submitMatchResultAction(matchId, user.uid, reportedScore1, reportedScore2, isCreator, evidenceUrl);',
  'await submitMatchResultAction(matchId, reportedScore1, reportedScore2, evidenceUrl);'
);
fs.writeFileSync(file, content);
