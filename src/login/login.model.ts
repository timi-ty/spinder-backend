import { SpinderResponse } from "../utils/utils";

interface FinalizeLoginData {
  firebaseCustomToken: string;
  spotifyAccessToken: string;
}

class FinalizeLoginResponse implements SpinderResponse<FinalizeLoginData> {
  status: string;
  data: FinalizeLoginData;

  constructor(status: string, data: FinalizeLoginData) {
    this.status = status;
    this.data = data;
  }
}

export { FinalizeLoginData, FinalizeLoginResponse };
