interface FinalizeLoginData {
  firebaseCustomToken: string;
}

interface SilentLoginData {
  userId: string;
}

type RequestAccessResult = "Allow" | "Pend";

export { FinalizeLoginData, SilentLoginData, RequestAccessResult };
