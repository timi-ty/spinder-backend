import { DiscoverSource } from "../discover/discover.model.js";
import { getFirestoreCollection } from "../firebase/firebase.spinder.js";
import {
  getSpotifyFollowedArtists,
  getSpotifyRecommendationsFromArtists,
  getSpotifyRecommendationsFromTracks,
  getSpotifySeveralArtists,
  getSpotifyUserPlaylistTracks,
  getSpotifyUserPlaylists,
  getSpotifyUserTopTracks,
  refreshSpotifyAccessToken,
  searchSpotify,
} from "../spotify/spotify.api.js";
import {
  SpotifyArtistDetails,
  SpotifyTrack,
} from "../spotify/spotify.model.js";
import { SpinderUserData } from "../user/user.model.js";
import { getSpinderUserData } from "../user/user.utils.js";
import { getRandomItems, mapAndFilter } from "../utils/utils.js";
import { DeckItem, DeckItemArtist } from "./deck.model.js";
import { isUserOnline } from "./deck.service.js";

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
      deckItems = await getSpinderPeopleTracks();
      break;
    case "My Artists":
      deckItems = await getMyArtistsTracks(accessToken);
      break;
    case "My Playlists":
      deckItems = await getMyPlaylistsTracks(accessToken);
      break;
    case "Vibe":
      deckItems = await getVibeTracks(accessToken, source.name);
      break;
    case "Spinder Person":
      deckItems = await getSpinderPersonTracks(source.id);
      break;
    case "Artist":
      deckItems = await getArtistTracks(accessToken, source.id);
      break;
    case "Playlist":
      deckItems = await getPlaylistTracks(accessToken, source.id);
      break;
  }

  if (deckItems.length < 2) {
    const extraItems = await getAnythingMeTracks(accessToken);
    deckItems = deckItems.concat(extraItems);
  }

  return deckItems;
}

async function getAnythingMeTracks(
  accessToken: string,
  count: number = 50
): Promise<DeckItem[]> {
  const halfCount = count / 2;
  //Get just 1 top track to obtain the total number of available top tracks.
  const oneTrack = await getSpotifyUserTopTracks(accessToken, 0, 1);
  //Calculate the maximum possible offset. We cannot offset more than the total minus the number of tracks we want.
  const maxOffset = Math.max(oneTrack.total - halfCount, 0);
  //Compute a random offset between 0 (inclusive) and the maxOffset (inclusive).
  const offset = Math.round(Math.random() * maxOffset);
  //Compute limit. We want to get 25 tracks, but we may not have up to that.
  const limit = Math.min(oneTrack.total - offset, halfCount);
  //Get the user's top tracks between with offset and limit.
  const topTracks = await getSpotifyUserTopTracks(accessToken, offset, limit);
  //Select up to 5 random tracks from our top tracks to use as reccommendation seeds.
  const randomTopTracks = getRandomItems(topTracks.items, 5);
  //Get 25 more tracks by way of spotify recommendation.
  const recommendationTracks = await getSpotifyRecommendationsFromTracks(
    accessToken,
    randomTopTracks.map((track) => track.id),
    halfCount
  );
  //Shuffling is pointless here because firestore by default orders data by id. If we want shuffling, it has to be implemented there.
  const anythingMeTracks = [...topTracks.items, ...recommendationTracks.tracks];

  return completeDeckData(anythingMeTracks, accessToken);
}

async function getSpinderPeopleTracks() {
  //Get up to 5 Spinder users at random and get top tracks for each of them.
  const spinderUsers = await getFirestoreCollection("users"); //TODO: This won't scale. Change to a proper firestore query.
  const randomUsers = getRandomItems(spinderUsers.docs, 5);

  const deckItems: DeckItem[] = [];
  for (var i = 0; i < randomUsers.length; i++) {
    const userId = randomUsers[i].id;
    const userData = randomUsers[i].data() as SpinderUserData;
    const isOnline = await isUserOnline(userId);
    var accessToken = userData.accessToken; //An online user will always have a valid spotify access token.
    if (!isOnline) {
      accessToken = (await refreshSpotifyAccessToken(userData.refreshToken))
        .access_token; //We can refresh tokens for offline users without worry because they will refresh again when they come back online.
    }
    const userTopTracks = await getAnythingMeTracks(accessToken, 10);
    deckItems.push(...userTopTracks);
  }

  return deckItems;
}

async function getMyArtistsTracks(
  accessToken: string,
  count: number = 50
): Promise<DeckItem[]> {
  const followedArtists = await getSpotifyFollowedArtists(accessToken, 50);
  //Select up to 5 random artists from the followed artists to use as recommendation seeds.
  const randomArtists = getRandomItems(followedArtists.artists.items, 5);
  //Get 50 tracks by way of spotify recommendation.
  const recommendationTracks = await getSpotifyRecommendationsFromArtists(
    accessToken,
    randomArtists.map((artist) => artist.id),
    count
  );
  const followedArtistsTracks = recommendationTracks.tracks;

  return completeDeckData(followedArtistsTracks, accessToken);
}

async function getMyPlaylistsTracks(
  accessToken: string,
  count: number = 10
): Promise<DeckItem[]> {
  //Get just 1 playlist to obtain the total number of available playlists.
  const onePlaylist = await getSpotifyUserPlaylists(accessToken, 0, 1);
  //Calculate the maximum possible offset. We cannot offset more than the total minus the number of tracks we want.
  const maxOffset = Math.max(onePlaylist.total - count, 0);
  //Compute a random offset between 0 (inclusive) and the maxOffset (inclusive).
  const offset = Math.round(Math.random() * maxOffset);
  //Compute limit. We want to get 10 playlists, but we may not have up to that.
  const limit = Math.min(onePlaylist.total - offset, count);
  //Get the user's playlists between with offset and limit.
  const playlists = await getSpotifyUserPlaylists(accessToken, offset, limit);
  //Select up to 5 random playlists from our playlists to get tracks from.
  const randomPlaylists = getRandomItems(playlists.items, 5);
  const myPlaylistsracks: SpotifyTrack[] = [];

  for (var i = 0; i < randomPlaylists.length; i++) {
    const playlist = randomPlaylists[i];
    const playlistTracks = await getSpotifyUserPlaylistTracks(
      accessToken,
      playlist.id,
      0,
      10
    ); //TODO: Get a random set of 10 tracks from the playlist instead of just the first 10.
    myPlaylistsracks.push(...playlistTracks.items.map((item) => item.track));
  }

  return completeDeckData(myPlaylistsracks, accessToken);
}

async function getSpinderPersonTracks(spinderPersonId: string) {
  const spinderPerson = await getSpinderUserData(spinderPersonId);

  const isOnline = await isUserOnline(spinderPersonId);
  var accessToken = spinderPerson.accessToken; //An online user will always have a valid spotify access token.
  if (!isOnline) {
    accessToken = (await refreshSpotifyAccessToken(spinderPerson.refreshToken))
      .access_token; //We can refresh tokens for offline users without worry because they will refresh again when they come back online.
  }
  const userTopTracks = await getAnythingMeTracks(accessToken, 50);

  return userTopTracks;
}

async function getArtistTracks(
  accessToken: string,
  artistId: string,
  count: number = 50
): Promise<DeckItem[]> {
  //Get 50 tracks by way of spotify recommendation.
  const recommendationTracks = await getSpotifyRecommendationsFromArtists(
    accessToken,
    [artistId],
    count
  );
  const artistTracks = recommendationTracks.tracks;

  return completeDeckData(artistTracks, accessToken);
}

async function getPlaylistTracks(
  accessToken: string,
  playlistId: string,
  count: number = 50
): Promise<DeckItem[]> {
  const playlistTrackItems = await getSpotifyUserPlaylistTracks(
    accessToken,
    playlistId,
    0,
    count
  ); //TODO: Get a random set of count tracks from the playlist instead of just the first count.
  const playlistTracks = playlistTrackItems.items.map((item) => item.track);

  return completeDeckData(playlistTracks, accessToken);
}

async function getVibeTracks(accessToken: string, vibe: string) {
  const spotifySearchResult = await searchSpotify(accessToken, vibe, true);

  const playlistResults = spotifySearchResult.playlists.items;
  const vibePlaylists = [];

  //Try to get the top 4 playlist and 1 random playlist.
  for (var i = 0; i < 5; i++) {
    if (i >= playlistResults.length) break;
    if (i === 4) {
      //Don't include any playlist we already added. Random index should never be less than 4.
      var randomIndex = Math.round(Math.random() * playlistResults.length - 1);
      randomIndex = Math.max(randomIndex, 4);
      if (randomIndex >= playlistResults.length) break;
      vibePlaylists.push(playlistResults[randomIndex]);
    } else {
      vibePlaylists.push(playlistResults[i]);
    }
  }

  const vibePlaylistsracks: SpotifyTrack[] = [];

  for (var j = 0; j < vibePlaylists.length; j++) {
    const playlist = vibePlaylists[j];
    const playlistTracks = await getSpotifyUserPlaylistTracks(
      accessToken,
      playlist.id,
      0,
      10
    ); //TODO: Get a random set of 10 tracks from the playlist instead of just the first 10.
    vibePlaylistsracks.push(...playlistTracks.items.map((item) => item.track));
  }

  return completeDeckData(vibePlaylistsracks, accessToken);
}

async function completeDeckData(
  originalTracksData: SpotifyTrack[],
  accessToken: string
): Promise<DeckItem[]> {
  //We use try catch blocks here to reduce the chances of a filler failing. If there's a problem, just move to the next track.
  const artistIds = originalTracksData.map((track) => {
    try {
      return track.artists.length > 0
        ? track.artists[0].id
        : "0TnOYISbd1XYRBk9myaseg";
    } catch (error) {
      console.error(error);
      return "0TnOYISbd1XYRBk9myaseg"; //Should ideally be an an id that represents default data for an unknown artist.
    }
  });

  const artistDetailsMap: Map<string, SpotifyArtistDetails> = new Map();
  (await getSpotifySeveralArtists(accessToken, artistIds)).artists.forEach(
    (artist) => {
      artistDetailsMap.set(artist.id, artist);
    }
  );

  const completeTracksData: DeckItem[] = mapAndFilter(
    originalTracksData,
    (track) => {
      try {
        const mainArtistId =
          track.artists.length > 0
            ? track.artists[0].id
            : "0TnOYISbd1XYRBk9myaseg";
        const mainArtistDetails = artistDetailsMap.get(mainArtistId);
        if (!mainArtistDetails) return null;
        const relatedSources: DiscoverSource[] = [];
        track.artists.forEach((artist) => {
          const artistSource: DiscoverSource = {
            type: "Artist",
            id: artist.id,
            name: artist.name,
            image:
              mainArtistDetails.images.length > 0
                ? mainArtistDetails.images[0].url
                : "",
          };
          relatedSources.push(artistSource);
        });
        mainArtistDetails.genres.forEach((genre) => {
          const vibeSource: DiscoverSource = {
            type: "Vibe",
            id: genre,
            name: genre,
            image:
              mainArtistDetails.images.length > 0
                ? mainArtistDetails.images[0].url
                : "",
          };
          relatedSources.push(vibeSource);
        });

        const artists = track.artists.map((artist) => {
          const deckArtist: DeckItemArtist = {
            artistName: artist.name,
            artistUri: artist.uri,
            artistImage:
              mainArtistDetails.images.length > 0
                ? mainArtistDetails.images[0].url //We don't try to get the images of featured artists
                : "",
          };
          return deckArtist;
        });

        return {
          trackId: track.id,
          image: track.album.images.length > 0 ? track.album.images[0].url : "",
          previewUrl: track.preview_url,
          trackName: track.name,
          trackUri: track.uri,
          artists: artists,
          relatedSources: relatedSources,
        };
      } catch {
        return null;
      }
    },
    (deckItem) =>
      deckItem !== null &&
      deckItem !== undefined &&
      deckItem.previewUrl !== null &&
      deckItem.previewUrl !== undefined
  );

  return completeTracksData;
}

export { getDeckTracks };
