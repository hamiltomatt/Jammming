const clientId = 'c44483032bff4146b3856637c7ed2df4';
const redirectUri = "http://localhost:3000";
let accessToken;

const Spotify = {
  getAccessToken() {
    if(accessToken) {
      return accessToken; // if token exists, just return it
    }

    const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/); // checks url of window for paramters, captures them if found
    const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

    if(accessTokenMatch && expiresInMatch) {
      accessToken = accessTokenMatch[1];
      const expiresIn = Number(expiresInMatch[1]); // captures exact match for parameters if both found
      window.setTimeout(() => accessToken = '', expiresIn * 1000);
      window.history.pushState('Access Token', null, '/'); // clears parameters, allowing new access token to be grabbed when it expires
      return accessToken;
    } else { // if paramters not found, go to spotify authorization page with clientId and redirectUri
      const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
      window.location = accessUrl;
    }
  },
  search(term) { // search spotify for tracks with current term in input
    const accessTokenVariable = Spotify.getAccessToken();
    return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, { headers: { Authorization: `Bearer ${accessTokenVariable}`}
    }).then(response => {
      return response.json();
    }).then(jsonResponse => {
      if(!jsonResponse.tracks) {
        return [];
      }
      return jsonResponse.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        uri: track.uri
      }));
    });
  },
  savePlaylist(name, trackURIs) { // save playlist to spotify with name and URIs of tracks
    if(name && trackURIs.length) {
      const accessTokenVariable = Spotify.getAccessToken();
      const headers = {
        Authorization: `Bearer ${accessTokenVariable}`
      };
      let userId;

      return fetch('https://api.spotify.com/v1/me', {
        headers: headers
      }).then(response => {
        return response.json();
      }).then(jsonResponse => {
        userId = jsonResponse.id;

        return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
          headers: headers,
          method: 'POST',
          body: JSON.stringify({ name: name })
        }).then(response => {
          return response.json();
        }).then(jsonResponse => {
          const playlistId = jsonResponse.id;

          return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, {
            headers: headers,
            method: 'POST',
            body: JSON.stringify({ uris: trackURIs })
          });
        });
      });

    } else {
      return;
    }
  }
};

export default Spotify;
