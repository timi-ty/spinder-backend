import { HttpStatusCode } from "axios";
import { SpotifyErrorResponse } from "../utils/utils.js";
import { SpotifyPlaylists } from "./discover.util.model.js";
import {
  DiscoverDestinationData,
  DiscoverDestinationPlaylist,
} from "./discover.model.js";
import { discoverLogger } from "../utils/logger.js";

async function getCountOrAllOwnedSpotifyPlaylists(
  accessToken: string,
  userId: string,
  count: number,
  offset: number
): Promise<DiscoverDestinationData> {
  var spotifyPlaylists = await getUserSpotifyPlaylists(accessToken, offset);
  var ownedSpotifyPlaylists = filterOwnedSpotifyPlaylists(
    spotifyPlaylists,
    userId
  );
  var keepCurating =
    ownedSpotifyPlaylists.length < count && spotifyPlaylists.next;
  while (keepCurating) {
    discoverLogger.debug(
      `Found ${ownedSpotifyPlaylists} playlists owned by user ${userId} so far but there are more playlists to search at ${spotifyPlaylists.next}. Continuing...`
    );
    spotifyPlaylists = await getUserSpotifyPlaylists(
      accessToken,
      -1,
      spotifyPlaylists.next
    );
    const moreOwnedSpotifyPlaylists = filterOwnedSpotifyPlaylists(
      spotifyPlaylists,
      userId
    );
    ownedSpotifyPlaylists = ownedSpotifyPlaylists.concat(
      moreOwnedSpotifyPlaylists
    );
    keepCurating =
      ownedSpotifyPlaylists.length < count && spotifyPlaylists.next;
  }

  const discoverDestinationData: DiscoverDestinationData = {
    offset: spotifyPlaylists.offset,
    total: spotifyPlaylists.total,
    discoverDestinationPlaylists: ownedSpotifyPlaylists,
    selectedDestinationId: "",
  };

  return discoverDestinationData;
}

// Offset is only used if the next url is not supplied.
async function getUserSpotifyPlaylists(
  accessToken: string,
  offset: number,
  next: string = `https://api.spotify.com/v1/me/playlists?offset=${offset}&limmit=50`
): Promise<SpotifyPlaylists> {
  discoverLogger.debug(`Getting user spotify playlists at url ${next}`);
  const response = await fetch(next, {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });

  if (response.status === HttpStatusCode.Ok) {
    const spotifyPlaylists: SpotifyPlaylists = await response.json();
    return spotifyPlaylists;
  } else {
    const spotifyErrorResponse: SpotifyErrorResponse = await response.json();
    throw new Error(
      `Status: ${spotifyErrorResponse.error.status}, Message: ${spotifyErrorResponse.error.message}`
    );
  }
}

function filterOwnedSpotifyPlaylists(
  spotifyPlaylists: SpotifyPlaylists,
  userId: string
): DiscoverDestinationPlaylist[] {
  const userOwnedPlaylists = spotifyPlaylists.items
    .filter((playlist) => playlist.owner.id === userId)
    .map((playlist) => {
      const discoverDestinationPlaylist: DiscoverDestinationPlaylist = {
        name: playlist.name,
        image: playlist.images.length > 0 ? playlist.images[0].url : "",
        id: playlist.id,
      };
      discoverLogger.debug(
        `Found user owned playlist - ${discoverDestinationPlaylist.name}.`
      );
      return discoverDestinationPlaylist;
    });
  return userOwnedPlaylists;
}

export { getCountOrAllOwnedSpotifyPlaylists };
