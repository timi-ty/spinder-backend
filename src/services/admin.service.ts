//Start nodejs interval here to renew the admin authentication every hour

import { refreshSpotifyAccessToken } from "../spotify/spotify.api.js";
import {
  getSpinderUserData,
  updateOrCreateSpinderUserData,
} from "../user/user.utils.js";
import { oneHourInMillis } from "../utils/utils.js";

var adminTokenValidTill = Date.now();

async function getAdminAccessToken(): Promise<string> {
  const adminUserData = await getSpinderUserData("880uagq8urtkncs7oug05l85x");
  if (adminTokenValidTill > Date.now()) {
    //Admin token is still valid
    return adminUserData.accessToken;
  } else {
    //Refresh the admin tokan.
    const newToken = await refreshSpotifyAccessToken(
      adminUserData.refreshToken
    );
    updateOrCreateSpinderUserData(
      "880uagq8urtkncs7oug05l85x",
      null,
      null,
      newToken.access_token,
      newToken.refresh_token,
      false
    );
    adminTokenValidTill = Date.now() + oneHourInMillis;
    return newToken.access_token;
  }
}

export { getAdminAccessToken };
