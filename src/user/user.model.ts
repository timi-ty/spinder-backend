import {
  DiscoverDestination,
  DiscoverSource,
  defaultDiscoverSource,
  emptyDiscoverDestination,
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
  selectedDiscoverDestination: emptyDiscoverDestination,
  accessToken: "",
  refreshToken: "",
};

export { SpinderUserData, defaultSpinderUserData };
