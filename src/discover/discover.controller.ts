import { SpinderErrorResponse } from "../utils/utils";

async function getDiscoverDestinations(
  req: Request,
  res: Response,
  next: (error: SpinderErrorResponse) => void
) {
  //Get the list of currently allowed discover destinations. The user's destination selection should be marked in the response.
}

async function searchDiscoverDestinations(
  req: Request,
  res: Response,
  next: (error: SpinderErrorResponse) => void
) {
  //Get the list of currently allowed discover destinations.
}

async function getDiscoverSourceTypes(
  req: Request,
  res: Response,
  next: (error: SpinderErrorResponse) => void
) {
  //Get the list of currently allowed discover source types from the Spinder App Database. The user's source type selection should be marked in the response.
}

async function searchDiscoverSources(
  req: Request,
  res: Response,
  next: (error: SpinderErrorResponse) => void
) {
  //Using source type, search spotify for matching discover sources.
}

export {
  getDiscoverSourceTypes,
  searchDiscoverSources,
  getDiscoverDestinations,
  searchDiscoverDestinations,
};
