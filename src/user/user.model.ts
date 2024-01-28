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

export interface SpotifyUserProfileData {
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

export class SpotifyUserProfileResponse
  implements SpinderResponse<SpotifyUserProfileData>
{
  status: string;
  data: SpotifyUserProfileData;

  constructor(status: string, data: SpotifyUserProfileData) {
    this.status = status;
    this.data = data;
  }
}
