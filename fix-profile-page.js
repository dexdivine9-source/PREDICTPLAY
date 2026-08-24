const fs = require('fs');
const file = '/app/applet/app/profile/create/page.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'await createWalletAction(user.uid);',
  'await createWalletAction();'
);
fs.writeFileSync(file, content);
