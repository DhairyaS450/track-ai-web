const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('../config/firebase-service-account.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // TODO: Add check to ensure code uniqueness in the database if necessary
  return code;
}

async function generateAndStoreInviteCodes(count = 1) {
  try {
    const inviteCodesCollection = db.collection('inviteCodes');

    for (let i = 0; i < count; i++) {
      const code = generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await inviteCodesCollection.add({
        code,
        createdAt: new Date(),
        expiresAt,
        used: false,
        usedBy: null,
        usedAt: null
      });
      console.log(`Generated invite code: ${code}`);
    }

    console.log(`Successfully generated ${count} invite code(s)`);
  } catch (error) {
    console.error('Error generating invite codes:', error);
  }
}

async function main() {
  console.log('Using Firebase Admin SDK to generate codes...');
  await generateAndStoreInviteCodes(5);
  console.log('Script finished.');
}

main().catch(error => {
  console.error("Script failed:", error);
  process.exit(1);
});