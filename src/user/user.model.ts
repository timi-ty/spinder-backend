import {
  DiscoverDestination,
  DiscoverSource,
  defaultDiscoverSource,
  defaultDiscoverDestination,
} from "../discover/discover.model.js";

interface SpinderUserData {
  name: string;
  selectedDiscoverSource: DiscoverSource;
  selectedDiscoverDestination: DiscoverDestination;
  accessToken: string;
  refreshToken: string;
}

const defaultSpinderUserData: SpinderUserData = {
  name: "",
  selectedDiscoverSource: defaultDiscoverSource,
  selectedDiscoverDestination: defaultDiscoverDestination,
  accessToken: "",
  refreshToken: "",
};

export { SpinderUserData, defaultSpinderUserData };
