import { SpinderResponse } from "../utils/utils";

export interface FinalizeLoginData {
  customToken: string;
}

export class FinalizeLoginResponse
  implements SpinderResponse<FinalizeLoginData>
{
  status: string;
  data: FinalizeLoginData;

  constructor(status: string, data: FinalizeLoginData) {
    this.status = status;
    this.data = data;
  }
}
