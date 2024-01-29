import admin from "firebase-admin";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";

var defaultAuth: Auth;

function startFirebaseApp() {
  var credential = applicationDefault();

  try {
    const accountKeyJson = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
    );
    credential = admin.credential.cert(accountKeyJson);
    console.log(
      `Initializing firebase app with, Project ID - ${accountKeyJson.project_id}`
    );
  } catch (error) {
    console.log(
      `Failed to get Spinder Firebase App Credentials. Error - ${error}.\nUsing default app credentials...`
    );
  }

  const defaultAppConfig = {
    credential: credential,
  };

  const defaultApp = initializeApp(defaultAppConfig);
  console.log(`Initialized firebase app ${defaultApp.name}`);
  defaultAuth = getAuth(defaultApp);
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

export { startFirebaseApp, createFirebaseCustomToken };
