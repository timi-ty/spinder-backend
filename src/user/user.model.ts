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

interface SpotifyUserProfileData {
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

interface SpinderUserData {
  selectedDiscoverSourceType: number;
}

const defaultSpinderUserData: SpinderUserData = {
  selectedDiscoverSourceType: 0,
};

export { SpotifyUserProfileData, SpinderUserData, defaultSpinderUserData };
