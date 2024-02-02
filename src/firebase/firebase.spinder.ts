import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";
import { Database, getDatabase } from "firebase-admin/database";
import { firebaseLogger, firebaseMarkerLog } from "../utils/logger.js";

var auth: Auth;
var firestore: Firestore;
var database: Database;

function startFirebaseApp() {
  var credential = applicationDefault();

  const accountKeyJson = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
  );
  credential = cert(accountKeyJson);
  firebaseLogger.debug(
    `Initializing firebase app with, Project ID - ${accountKeyJson.project_id}...`
  );

  const appConfig = {
    credential: credential,
    databaseURL:
      "https://spinder-e2ede-default-rtdb.europe-west1.firebasedatabase.app",
  };

  const app = initializeApp(appConfig, "Spinder");
  auth = getAuth(app);
  firestore = getFirestore(app);
  database = getDatabase(app);
  firebaseLogger.success(`Initialized firebase app ${app.name}.`);
}

async function createFirebaseCustomToken(userId: string) {
  if (!auth) {
    throw new Error(
      "Failed to create custom token. Auth object does not exist. Call startFirebaseApp before calling any other functions."
    );
  }

  firebaseLogger.debug(`Trying to sign user id - ${userId}...`);
  const customToken = await auth.createCustomToken(userId);
  firebaseLogger.success(`Sucessfully signed user id - ${userId}.`);
  return customToken;
}

async function exchangeFirebaseIdTokenForUserId(
  idToken: string
): Promise<string> {
  if (!auth) {
    throw new Error(
      "Failed to verify id token. Auth object does not exist. Call startFirebaseApp before calling any other functions."
    );
  }

  const decodedToken = await auth.verifyIdToken(idToken, true);
  return decodedToken.uid;
}

async function getFirestoreDoc<T>(docPath: string): Promise<T | null> {
  if (!firestore) {
    throw new Error(
      "Failed to get doc. firestore object does not exist. Call startFirebaseApp before calling any other functions."
    );
  }

  var docRef = firestore.doc(docPath);
  const doc = await docRef.get();
  return doc.exists ? (doc.data() as T) : null;
}

async function setFirestoreDoc(
  docPath: string,
  data: any,
  merge: boolean = true
) {
  if (!firestore) {
    throw new Error(
      "Failed to set doc data. firestore object does not exist. Call startFirebaseApp before calling any other functions."
    );
  }

  const docRef = firestore.doc(docPath);
  await docRef.set(data, { merge: merge });

  firebaseMarkerLog(
    `Set firebase doc at ${docPath}, data - ${JSON.stringify(
      data
    )}, merge - ${merge}`
  );
}

async function deleteFirestoreDoc(docPath: string) {
  if (!firestore) {
    throw new Error(
      "Failed to delete doc. firestore object does not exist. Call startFirebaseApp before calling any other functions."
    );
  }

  const docRef = firestore.doc(docPath);
  await docRef.delete();

  firebaseMarkerLog(`Deleted firebase doc at ${docPath}.}`);
}

interface PresenceStatus {
  state: "offline" | "online";
  lastChanged: object;
}

function attachPresenceWatcher(
  onPresenceChanged: (userId: string, isOnline: boolean) => void
) {
  var statusDatabaseRef = database.ref("/status");
  statusDatabaseRef.on("child_added", (snapshot) => {
    const newUserStatus: PresenceStatus = snapshot.val();
    firebaseLogger.debug(
      `Presence watcher found user: ${
        snapshot.key
      }, with status: ${JSON.stringify(newUserStatus)}`
    );
    onPresenceChanged(snapshot.key ?? "", newUserStatus.state === "online");
  });
  statusDatabaseRef.on("child_changed", (snapshot) => {
    const newUserStatus: PresenceStatus = snapshot.val();
    firebaseLogger.debug(
      `Presence watcher found a change for user: ${
        snapshot.key
      }, with presence: ${JSON.stringify(newUserStatus)}`
    );
    onPresenceChanged(snapshot.key ?? "", newUserStatus.state === "online");
  });
}

function detachAllPresenceWatchers() {
  var statusDatabaseRef = database.ref("/status");
  statusDatabaseRef.off(); // Removes ALL callbacks attached to this ref.
}

export {
  startFirebaseApp,
  createFirebaseCustomToken,
  exchangeFirebaseIdTokenForUserId,
  getFirestoreDoc,
  setFirestoreDoc,
  deleteFirestoreDoc,
  attachPresenceWatcher,
  detachAllPresenceWatchers,
  PresenceStatus,
};
