import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import {
  AggregateField,
  AggregateQuerySnapshot,
  Firestore,
  QuerySnapshot,
  getFirestore,
} from "firebase-admin/firestore";
import { Database, getDatabase } from "firebase-admin/database";
import { firebaseLogger, firebaseMarkerLog } from "../utils/logger.js";

var auth: Auth;
var firestore: Firestore;
var database: Database;

function startFirebaseApp() {
  const accountKeyJson = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
  );
  const credential = cert(accountKeyJson);
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

async function getFirestoreCollection(
  collectionPath: string
): Promise<QuerySnapshot> {
  if (!firestore) {
    throw new Error(
      "Failed to get collection. firestore object does not exist. Call startFirebaseApp before calling any other functions."
    );
  }

  const colRef = firestore.collection(collectionPath);
  const col = await colRef.get();
  return col;
}

async function getFirestoreCollectionSize(
  collectionPath: string
): Promise<number> {
  if (!firestore) {
    throw new Error(
      "Failed to get collection. firestore object does not exist. Call startFirebaseApp before calling any other functions."
    );
  }

  const colRef = firestore.collection(collectionPath);
  return (await colRef.count().get()).data().count;
}

function listenToFirestoreCollection(
  collectionPath: string,
  onChange: (snapshot: QuerySnapshot) => void
): () => void {
  const query = firestore.collection(collectionPath);

  const unsubscribe = query.onSnapshot(
    (querySnapshot) => {
      firebaseLogger.debug(
        `Received query snapshot of size ${querySnapshot.size}`
      );
      onChange(querySnapshot);
    },
    (error) => {
      console.error(error);
    }
  );
  return unsubscribe;
}

async function batchSetFirestoreCollection(
  collectionPath: string,
  collectionData: Map<string, object>
): Promise<void> {
  if (!firestore) {
    throw new Error(
      "Failed to set collection. firestore object does not exist. Call startFirebaseApp before calling any other functions."
    );
  }

  const batch = firestore.batch();
  const colRef = firestore.collection(collectionPath);
  collectionData.forEach((value, key) => {
    const docRef = colRef.doc(key);
    batch.set(docRef, value);
  });
  await batch.commit();
  firebaseMarkerLog(`Batch set firebase docs at ${collectionPath}.`);
  return;
}

async function getFirestoreDoc<T>(docPath: string): Promise<T | null> {
  if (!firestore) {
    throw new Error(
      "Failed to get doc. firestore object does not exist. Call startFirebaseApp before calling any other functions."
    );
  }

  const docRef = firestore.doc(docPath);
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
  const statusDatabaseRef = database.ref("/status");
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
  const statusDatabaseRef = database.ref("/status");
  statusDatabaseRef.off(); // Removes ALL callbacks attached to this ref.
}

export {
  startFirebaseApp,
  createFirebaseCustomToken,
  exchangeFirebaseIdTokenForUserId,
  getFirestoreCollection,
  getFirestoreCollectionSize,
  listenToFirestoreCollection,
  batchSetFirestoreCollection,
  getFirestoreDoc,
  setFirestoreDoc,
  deleteFirestoreDoc,
  attachPresenceWatcher,
  detachAllPresenceWatchers,
  PresenceStatus,
};
