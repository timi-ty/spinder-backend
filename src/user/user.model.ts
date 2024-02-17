import {
  DiscoverDestination,
  DiscoverSource,
  emptyDiscoverDestination,
} from "../discover/discover.model.js";

interface SpinderUserData {
  selectedDiscoverSource: DiscoverSource;
  selectedDiscoverDestination: DiscoverDestination;
  accessToken: string;
}

const defaultSpinderUserData: SpinderUserData = {
  selectedDiscoverSource: "Anything Me",
  selectedDiscoverDestination: emptyDiscoverDestination,
  accessToken: "",
};

export { SpinderUserData, defaultSpinderUserData };
