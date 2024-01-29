import { SpinderResponse } from "../utils/utils.js";

interface DiscoverSourceTypesData {
  selectedSourceType: number;
  sourceTypes: string[];
}

class DiscoverSourceTypesResponse
  implements SpinderResponse<DiscoverSourceTypesData>
{
  status: string;
  data: DiscoverSourceTypesData;

  constructor(status: string, data: DiscoverSourceTypesData) {
    this.status = status;
    this.data = data;
  }
}

export { DiscoverSourceTypesData, DiscoverSourceTypesResponse };
