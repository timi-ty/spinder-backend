import { SpinderResponse } from "../utils/utils.js";

interface ExplicitContent {
  filter_enabled: boolean;
  filter_locked: boolean;
}

interface ExternalUrls {
  spotify: string;
}

interface Followers {
  href: string;
  total: number;
}

interface Image {
  url: string;
  height: number;
  width: number;
}

export interface UserProfileData {
  country: string;
  display_name: string;
  email: string;
  explicit_content: ExplicitContent;
  external_urls: ExternalUrls;
  followers: Followers;
  href: string;
  id: string;
  images: Image[];
  product: string;
  type: string;
  uri: string;
}

export class UserPorfileResponse implements SpinderResponse<UserProfileData> {
  status: string;
  data: UserProfileData;

  constructor(status: string, data: UserProfileData) {
    this.status = status;
    this.data = data;
  }
}
