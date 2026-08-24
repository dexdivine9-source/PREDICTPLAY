const fs = require('fs');
const file = '/app/applet/components/evidence-upload.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'import { Button } from "@/components/ui/button";',
  '// import { Button } from "@/components/ui/button";\nconst Button = (props: any) => <button {...props} />;'
);
fs.writeFileSync(file, content);
