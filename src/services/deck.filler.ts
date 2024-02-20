import { DiscoverSource } from "../discover/discover.model.js";
import {
  getSpotifyRecommendations,
  getSpotifyUserTopTracks,
} from "../spotify/spotify.api.js";
import { getRandomItems } from "../utils/utils.js";

//For the frontend to work, the backend has to respond here with at least 2 tracks.
//Makesure that if the source has less than 2 tracks, we fill it up with more from elsewhere.
async function getDeckTracks(
  source: DiscoverSource,
  accessToken: string
): Promise<DeckItem[]> {
  var deckItems: DeckItem[] = [];
  switch (source.type) {
    case "Anything Me":
      deckItems = await getAnythingMeTracks(accessToken);
      break;
    case "Spinder People":
      break;
    case "My Artists":
      break;
    case "My Playlists":
      break;
    case "Vibe":
      break;
    case "Spinder Person":
      break;
    case "Artist":
      break;
    case "Playlist":
      break;
  }

  if (deckItems.length < 2) {
    const extraItems = await getAnythingMeTracks(accessToken);
    deckItems = deckItems.concat(extraItems);
  }

  return deckItems;
}

async function getAnythingMeTracks(accessToken: string): Promise<DeckItem[]> {
  //Get just 1 top track only to obtain the total number of available top tracks.
  const oneTrack = await getSpotifyUserTopTracks(accessToken, 0, 1);
  //Calculate the maximum possible offset. We cannot offset more than the total minus the number of tracks we want.
  const maxOffset = Math.max(oneTrack.total - 25, 0);
  //Compute a random offset between 0 (inclusive) and the maxOffset (inclusive).
  const offset = Math.round(Math.random() * maxOffset);
  //Compute limit. We want to get 25 tracks, but we may not have up to that.
  const limit = Math.min(oneTrack.total - offset, 25);
  //Get the user's top tracks between with offset and limit.
  const topTracks = await getSpotifyUserTopTracks(accessToken, offset, limit);
  //Select up to 5 random tracks from our top tracks to use as reccommendation seeds.
  const randomTopTracks = getRandomItems(topTracks.items, 5);
  //Get 25 more tracks by way of spotify recommendation.
  const recommendationTracks = await getSpotifyRecommendations(
    accessToken,
    randomTopTracks,
    25
  );
  //Shuffling is pointless here because firestore by default orders data by id. If we want shuffling, it has to be implemented there.
  const anythingMeTracks = [...topTracks.items, ...recommendationTracks.tracks];
  const anythingMeDeckTracks: DeckItem[] = anythingMeTracks.map((track) => {
    return {
      image: track.album.images.length > 0 ? track.album.images[0].url : "",
      previewUrl: track.preview_url,
      trackName: track.name,
      trackUri: track.uri,
      artistName: track.artists[0].name,
      artistUri: track.artists[0].uri,
      trackId: track.id,
    };
  });
  return anythingMeDeckTracks;
}

export { getDeckTracks };
