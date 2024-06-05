import { DiscoverSource } from "./discover.model.js";

const afrobeatsApril2024: DiscoverSource = {
  //https://open.spotify.com/playlist/17tLe3tCu3NGUisFViFRSi?si=4316485a78874f74
  type: "Radio",
  id: "17tLe3tCu3NGUisFViFRSi",
  name: "Spindr Afro Radio",
  image:
    "https://img.etimg.com/thumb/msid-89919334,width-300,height-225,imgsize-35954,resizemode-75/radio.jpg", //Explore storing these app level images in firebase storage instead of at the frontend.
};

const alteCruise: DiscoverSource = {
  //https://open.spotify.com/playlist/37i9dQZF1DX5ja5oV6Kto0?si=bd37de31f7ab4e2d
  type: "Radio",
  id: "37i9dQZF1DX5ja5oV6Kto0",
  name: "Spindr Alte Radio",
  image:
    "https://img.etimg.com/thumb/msid-89919334,width-300,height-225,imgsize-35954,resizemode-75/radio.jpg", //Explore storing these app level images in firebase storage instead of at the frontend.
};

const hipHopMix: DiscoverSource = {
  //https://open.spotify.com/playlist/37i9dQZF1EQnqst5TRi17F?si=9a0ea31575f940f6
  type: "Radio",
  id: "37i9dQZF1EQnqst5TRi17F",
  name: "Spindr Hip Hop Radio",
  image:
    "https://img.etimg.com/thumb/msid-89919334,width-300,height-225,imgsize-35954,resizemode-75/radio.jpg", //Explore storing these app level images in firebase storage instead of at the frontend.
};

const indieMix: DiscoverSource = {
  //https://open.spotify.com/playlist/37i9dQZF1EQqkOPvHGajmW?si=70779828c59543c8
  type: "Radio",
  id: "37i9dQZF1EQqkOPvHGajmW",
  name: "Spindr Indie Radio",
  image:
    "https://img.etimg.com/thumb/msid-89919334,width-300,height-225,imgsize-35954,resizemode-75/radio.jpg", //Explore storing these app level images in firebase storage instead of at the frontend.
};

const spindrRadio = [afrobeatsApril2024, alteCruise, hipHopMix, indieMix];

function defaultAnonDiscoverSource(): DiscoverSource {
  return spindrRadio[Math.floor(Math.random() * spindrRadio.length)];
}

export { spindrRadio, defaultAnonDiscoverSource };
