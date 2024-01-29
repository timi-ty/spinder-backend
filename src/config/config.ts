import Config from "./config.model.js";

enum DISCOVER_SOURCE_TYPES {
  ANYTHING_ME,
  FOLLOWING,
  PLAYLIST,
  ARTISTE,
  KEYWORD,
}

const config: Config = {
  discover_source_types: ["Anything Me, Following, Playlist, Artiste, Keyword"],
};

export default config;
