import { DiscoverSourceType } from "../discover/discover.model";

interface SpinderUserData {
  selectedDiscoverSourceType: DiscoverSourceType;
  selectedDiscoverDestination: string;
}

const defaultSpinderUserData: SpinderUserData = {
  selectedDiscoverSourceType: "Anything Me",
  selectedDiscoverDestination: "",
};

export { SpinderUserData, defaultSpinderUserData };
