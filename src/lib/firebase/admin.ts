import admin from "firebase-admin";

export const isFirebaseAdminConfigured = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID || "";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "";
  const privateKey = process.env.FIREBASE_PRIVATE_KEY || "";

  return !!(
    projectId &&
    clientEmail &&
    privateKey &&
    !projectId.includes("your_") &&
    !clientEmail.includes("your_") &&
    !clientEmail.includes("xxxxx") &&
    !privateKey.includes("...") &&
    privateKey.includes("BEGIN PRIVATE KEY")
  );
};

if (isFirebaseAdminConfigured() && !admin.apps.length) {
  try {
    const rawKey = process.env.FIREBASE_PRIVATE_KEY || "";
    // Clean outer quotes and escape sequence newlines
    const privateKey = (rawKey.startsWith('"') && rawKey.endsWith('"')
      ? rawKey.slice(1, -1)
      : rawKey
    ).replace(/\\n/g, "\n");

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
  }
}

// Ensure the SDK can export null placeholders if not configured
const adminAuth = isFirebaseAdminConfigured() ? admin.auth() : null;
const adminDb = isFirebaseAdminConfigured() ? admin.firestore() : null;

export { adminAuth, adminDb, admin };

