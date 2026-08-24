const fs = require('fs');
const file = '/app/applet/app/matches/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'await placePredictionAction(user.uid, matchId, predictOutcome, amountNum);',
  'await placePredictionAction(matchId, predictOutcome, amountNum);'
);
fs.writeFileSync(file, content);
