import { DiscoverSource } from "./discover.model.js";

const afroRadio: DiscoverSource = {
  //https://open.spotify.com/playlist/17tLe3tCu3NGUisFViFRSi — user-curated "AFROBEATS LAB 2026" (118 tracks)
  type: "Radio",
  id: "17tLe3tCu3NGUisFViFRSi",
  name: "Spindr Afro Radio",
  image:
    "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da8461cc722d96793fceeb52edb8",
};

const alteRadio: DiscoverSource = {
  //https://open.spotify.com/playlist/13fepRD2njUXVXylZJkmuA — user-curated "alté cruise" (415 tracks)
  type: "Radio",
  id: "13fepRD2njUXVXylZJkmuA",
  name: "Spindr Alte Radio",
  image:
    "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000d72cb2ba33d31bf52a586b3bd1a1",
};

const hipHopRadio: DiscoverSource = {
  //https://open.spotify.com/playlist/5TZkls9cEOzWDR6qCxwDot — user-curated "HipHop 2026" (332 tracks)
  type: "Radio",
  id: "5TZkls9cEOzWDR6qCxwDot",
  name: "Spindr Hip Hop Radio",
  image:
    "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000d72c500b2d3b5b31f68ae1c74c13",
};

const indieRadio: DiscoverSource = {
  //https://open.spotify.com/playlist/0qYAqOsMGJPntjVEKV5WOF — user-curated "indie rock" (207 tracks)
  type: "Radio",
  id: "0qYAqOsMGJPntjVEKV5WOF",
  name: "Spindr Indie Radio",
  image:
    "https://mosaic.scdn.co/640/ab67616d00001e0288a4a43acf0d1901da9d2975ab67616d00001e029f1b21f21b13ff2d3e891f6bab67616d00001e02b1f8da74f225fa1225cdfaceab67616d00001e02fb1cb900d28642e668d77b12",
};

const spindrRadio = [afroRadio, alteRadio, hipHopRadio, indieRadio];

function defaultAnonDiscoverSource(): DiscoverSource {
  return spindrRadio[Math.floor(Math.random() * spindrRadio.length)];
}

export { spindrRadio, defaultAnonDiscoverSource };
