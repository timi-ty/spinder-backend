//Start nodejs interval here to renew the admin authentication every hour

import { getSpinderUserData } from "../user/user.utils";

async function getAdminAccessToken(): Promise<string> {
  const adminUserData = await getSpinderUserData("880uagq8urtkncs7oug05l85x");
  return adminUserData.accessToken;
}

export { getAdminAccessToken };
