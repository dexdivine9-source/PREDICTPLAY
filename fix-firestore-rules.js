const fs = require('fs');
const file = '/app/applet/firestore.rules';
let content = fs.readFileSync(file, 'utf8');

const oldProfileRule = `    match /player_profiles/{profileId} {
      allow read: if true;
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update: if false; 
      allow delete: if false;
    }`;

const newProfileRule = `    match /player_profiles/{profileId} {
      allow read: if true;
      allow create: if isSignedIn() 
                    && request.resource.data.userId == request.auth.uid
                    && (!('reputation' in request.resource.data) || request.resource.data.reputation == 100)
                    && (!('isVerified' in request.resource.data) || request.resource.data.isVerified == false)
                    && (!('trustScore' in request.resource.data) || request.resource.data.trustScore == 0)
                    && (!('verificationStatus' in request.resource.data) || request.resource.data.verificationStatus == 'PENDING');
      allow update: if false; 
      allow delete: if false;
    }`;

content = content.replace(oldProfileRule, newProfileRule);
fs.writeFileSync(file, content);
