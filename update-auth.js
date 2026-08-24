const fs = require('fs');
const file = '/app/applet/components/AuthProvider.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  `      if (user) {
        await fetchProfile(user.uid);
      } else {
        setProfile(null);
        setWallet(null);
      }`,
  `      if (user) {
        const token = await user.getIdToken();
        document.cookie = \`auth_token=\${token}; path=/; max-age=3600; Secure; SameSite=Strict\`;
        await fetchProfile(user.uid);
      } else {
        document.cookie = \`auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Strict\`;
        setProfile(null);
        setWallet(null);
      }`
);
fs.writeFileSync(file, content);
