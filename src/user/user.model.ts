import { DiscoverSourceType } from "../discover/discover.model";

interface SpinderUserData {
  selectedDiscoverSourceType: DiscoverSourceType;
  selectedDiscoverDestination: string;
  accessToken: string;
}

const defaultSpinderUserData: SpinderUserData = {
  selectedDiscoverSourceType: "Anything Me",
  selectedDiscoverDestination: "",
  accessToken: "",
};

export { SpinderUserData, defaultSpinderUserData };
