import logger from "node-color-log";

const appLogger = logger.createNamedLogger("App");
const firebaseLogger = logger.createNamedLogger("Firebase");
const authLogger = logger.createNamedLogger("Auth");
const userLogger = logger.createNamedLogger("User");
const loginLogger = logger.createNamedLogger("Login");
const discoverLogger = logger.createNamedLogger("Discover");
const stackLogger = logger.createNamedLogger("Stack");
const spotifyLogger = logger.createNamedLogger("Spotify");

function appMarkerLog(message: string) {
  appLogger.bold().bgColorLog("magenta", `[App] ${message}`);
}

function firebaseMarkerLog(message: string) {
  firebaseLogger.bold().bgColorLog("magenta", `[Firebase] ${message}`);
}

function authMarkerLog(message: string) {
  authLogger.bold().bgColorLog("magenta", `[Auth] ${message}`);
}

function userMarkerLog(message: string) {
  userLogger.bold().bgColorLog("magenta", `[User] ${message}`);
}

function loginMarkerLog(message: string) {
  loginLogger.bold().bgColorLog("magenta", `[Login] ${message}`);
}

function discoverMarkerLog(message: string) {
  discoverLogger.bold().bgColorLog("magenta", `[Discover] ${message}`);
}

function stackMarkerLog(message: string) {
  stackLogger.bold().bgColorLog("magenta", `[Stack] ${message}`);
}

function spotifyMarkerLog(message: string) {
  spotifyLogger.bold().bgColorLog("magenta", `[Spotify] ${message}`);
}

export {
  appLogger,
  firebaseLogger,
  authLogger,
  userLogger,
  loginLogger,
  discoverLogger,
  stackLogger,
  spotifyLogger,
  appMarkerLog,
  firebaseMarkerLog,
  authMarkerLog,
  userMarkerLog,
  loginMarkerLog,
  discoverMarkerLog,
  stackMarkerLog,
  spotifyMarkerLog,
};
