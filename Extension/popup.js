var SpotifyWebApi = require('spotify-web-api-js');
var spotifyApi = new SpotifyWebApi();

let currentSongId;
let currentSongUri;

document.getElementById("button").addEventListener("click", () => {
    const playlist = getSelectedPlaylist();

    if(playlist == "Favourites"){
        spotifyApi.addToMySavedTracks([currentSongId])
        .catch((err) => {console.log(err)})
    }else{
        spotifyApi.getUserPlaylists()
        .then((res) => {
            res.items.forEach(element => {
                if(element.name == playlist){
                    spotifyApi.addTracksToPlaylist(element.id, [currentSongUri])
                    .catch((err) => {console.log(err)})
                }
            });
        })
    }
})

window.addEventListener("load", () => {
    chrome.tabs.executeScript({file: "content.js"});

    let onYoutube = checkIfOnYoutube();
    let title = getSongTitle();
    let refreshToken = getRefreshTokenFromStorage();
    
    onYoutube
    .then((bool) => {
        if(bool){
            loadingAnimation(true);
            refreshToken
            .then((token) => {
                let accessToken = getRefreshAccessToken(token);
                accessToken
                .then((token) => {
                    spotifyApi.setAccessToken(token.access_token);
                    title
                    .then((title) => {
                        spotifyApi.searchTracks(formatTitleForSearching(title))
                        .then((response) => {
                            if(response.tracks.items.length != 0){
                                let track = response.tracks.items[0];
                                currentSongId = track.id;
                                currentSongUri = track.uri;
                                let titleUI = track.name + " - ";        ;
                                let imageURL = track.album.images[0].url;
    
                                let count = 0;
                                (track.artists).forEach(artist => {
                                count++;
                                if(count > 1){
                                    titleUI = titleUI + ", " + artist.name
                                }else{
                                    titleUI = titleUI + " " + artist.name
                                }
                                });
    
                                setUserInterface(imageURL, titleUI);
                            }else{
                                document.getElementById("loading").style.cssText = "display: none";
                                document.getElementById("available").style.cssText = "display: normal";
                            }

                            let user;

                            spotifyApi.getMe()
                            .then((res) => {
                                user = res.id;
                                spotifyApi.getUserPlaylists()
                                .then((res) => {
                                    res.items.forEach(element => {
                                        if(element.owner.id == user){
                                            addElementToSelection(element.name);
                                        }
                                    });
                                })
                            })
                        }) 
                    })
                })
            })
        }else{
            loadingAnimation(false);
            console.log("test");
            document.getElementById("available").style.cssText = "display: normal";
        }
    })
})

function loadingAnimation(bool){
    if(bool){
        document.getElementById("loading").style.cssText = "display: normal";
    }else{
        document.getElementById("loading").style.cssText = "display: none";
    }
}

function setUserInterface(url, title){
    loadingAnimation(false);
    document.getElementById("available").style.cssText = "display: none";
    document.getElementById("title").innerHTML = title;
    document.getElementById("image-url").src = url;
}

function formatTitleForSearching(title)
{
    title = title.replace(/ *\([^)]*\) */g, "");
    title = title.replace(/ *\[[^\]]*\] */g, "");
    title = title.split("ft. ")[0];
    title = title.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
    title = title.replace(/[^\x00-\x7F]/g, "");
    title = title.split("|")[0];

    return title;
}


function getSongTitle(){
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const port = chrome.tabs.connect(tabs[0].id);
            port.postMessage({ message: 'getTitle' });
            port.onMessage.addListener((response) => {
                if(response.title !== "wrong site")
                {
                    resolve(response.title);
                }else{
                    reject("wrong site");
                }
            });
        });
    })
}

function checkIfOnYoutube(){
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const port = chrome.tabs.connect(tabs[0].id);
            port.postMessage({ message: 'getTitle' });
            port.onMessage.addListener((response) => {
                if(response.title === "wrong site")
                {
                    resolve(false);
                }else{
                    resolve(true);
                }
            });
        });
    })
}

function getRefreshAccessToken(refreshToken)
{
    let data = new Promise((resolve, reject) => {
        $.ajax(
            {
                method: "POST",
                url: "https://accounts.spotify.com/api/token",
                headers: {'Content-Type':'application/x-www-form-urlencoded'},
                data: {
                    "grant_type":    "refresh_token",
                    "refresh_token":  refreshToken,
                    "client_secret": Secrets.client_secret,
                    "client_id":     Secrets.client_id,
                },
                success: (response) => {
                    resolve(response);
                },
                error: (error) => {
                    reject(error);
                }
            }
        );
    })

    data.then((data) => {
        setTokensInStorge(data.access_token, data.refresh_token);
        spotifyApi.setAccessToken(data.access_token);
    })

    return data;
}

function setTokensInStorge(accessToken, refreshToken)
{
      chrome.storage.sync.set({"accessToken": accessToken});
      chrome.storage.sync.set({"refreshToken": refreshToken});
}

function getRefreshTokenFromStorage(){
    return new Promise((resolve) => {
        chrome.storage.sync.get(["refreshToken"], function(result) {
            resolve(result.refreshToken);
        });
    })
}


function addElementToSelection(element){
    var x = document.getElementById("playlists");
    var option = document.createElement("option");
    option.text = element;
    x.add(option, x[0]);
}

function getSelectedPlaylist(){
    var e = document.getElementById("playlists");
    let playlist = e.options[e.selectedIndex].text;
    return playlist;
}