import logger from "node-color-log";

const appLogger = logger.createNamedLogger("App");
const firebaseLogger = logger.createNamedLogger("Firebase");
const authLogger = logger.createNamedLogger("Auth");
const userLogger = logger.createNamedLogger("User");
const loginLogger = logger.createNamedLogger("Login");
const discoverLogger = logger.createNamedLogger("Discover");

function appMarkerLog(message: string) {
  appLogger.bold().bgColorLog("magenta", message);
}

function firebaseMarkerLog(message: string) {
  appLogger.bold().bgColorLog("magenta", message);
}

function authMarkerLog(message: string) {
  appLogger.bold().bgColorLog("magenta", message);
}

function userMarkerLog(message: string) {
  appLogger.bold().bgColorLog("magenta", message);
}

function loginMarkerLog(message: string) {
  appLogger.bold().bgColorLog("magenta", message);
}

function discoverMarkerLog(message: string) {
  appLogger.bold().bgColorLog("magenta", message);
}

export {
  appLogger,
  firebaseLogger,
  authLogger,
  userLogger,
  loginLogger,
  discoverLogger,
  appMarkerLog,
  firebaseMarkerLog,
  authMarkerLog,
  userMarkerLog,
  loginMarkerLog,
  discoverMarkerLog,
};
