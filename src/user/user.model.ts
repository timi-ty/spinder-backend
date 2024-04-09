import {
  DiscoverDestination,
  DiscoverSource,
  defaultDiscoverSource,
  defaultDiscoverDestination,
} from "../discover/discover.model.js";

interface SpinderUserData {
  name: string;
  image: string;
  selectedDiscoverSource: DiscoverSource;
  selectedDiscoverDestination: DiscoverDestination;
  accessToken: string;
  refreshToken: string;
  isAnon: boolean;
}

const defaultSpinderUserData: SpinderUserData = {
  name: "",
  image: "",
  selectedDiscoverSource: defaultDiscoverSource,
  selectedDiscoverDestination: defaultDiscoverDestination,
  accessToken: "",
  refreshToken: "",
  isAnon: true,
};

export { SpinderUserData, defaultSpinderUserData };
