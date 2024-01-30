import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";

var defaultAuth: Auth;
var db: Firestore;

function startFirebaseApp() {
  var credential = applicationDefault();

  const accountKeyJson = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
  );
  credential = cert(accountKeyJson);
  console.log(
    `Initializing firebase app with, Project ID - ${accountKeyJson.project_id}...`
  );

  const defaultAppConfig = {
    credential: credential,
  };

  const defaultApp = initializeApp(defaultAppConfig);
  defaultAuth = getAuth(defaultApp);
  db = getFirestore(defaultApp);
  console.log(`Initialized firebase app ${defaultApp.name}`);
}

async function createFirebaseCustomToken(userId: string) {
  if (!defaultAuth) {
    throw new Error(
      "Failed to create custom token. Auth object does not exist. Call startFirebaseApp before calling any other functions."
    );
  }

  console.log(`Trying to sign user id - ${userId}...`);
  const customToken = await defaultAuth.createCustomToken(userId);
  console.log(`Sucessfully signed user id - ${userId}.`);
  return customToken;
}

async function exchangeFirebaseIdTokenForUserId(
  idToken: string
): Promise<string> {
  if (!defaultAuth) {
    throw new Error(
      "Failed to verify id token. Auth object does not exist. Call startFirebaseApp before calling any other functions."
    );
  }

  const decodedToken = await defaultAuth.verifyIdToken(idToken, true);
  return decodedToken.uid;
}

async function getFirestoreDocData<T>(docPath: string): Promise<T | null> {
  if (!db) {
    throw new Error(
      "Failed to get doc data. db object does not exist. Call startFirebaseApp before calling any other functions."
    );
  }

  var docRef = db.doc(docPath);
  const doc = await docRef.get();
  return doc.exists ? (doc.data() as T) : null;
}

async function setFirestoreDocData(docPath: string, data: any, merge: boolean) {
  if (!db) {
    throw new Error(
      "Failed to set doc data. db object does not exist. Call startFirebaseApp before calling any other functions."
    );
  }

  const docRef = db.doc(docPath);
  await docRef.set(data, { merge: merge });
}

export {
  startFirebaseApp,
  createFirebaseCustomToken,
  getFirestoreDocData,
  setFirestoreDocData,
  exchangeFirebaseIdTokenForUserId,
};
