// backend/firebase.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('./myredditapp-1f3ad-firebase-adminsdk-fbsvc-9094b3e295.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
