
// runs on first install            
chrome.runtime.onInstalled.addListener(function() {
    authorize();
    getAccessToken();
});

// authorizes app to spotify
function authorize(){

    const scopes = 'playlist-modify-private playlist-modify-public user-library-modify';
    const client_id = Secrets.client_id;
    const redirect_uri = "https://maximilianklackl.github.io/YoutubeToSpotifyChromeExtension/downloaded.html";

    let url = 'https://accounts.spotify.com/authorize' +
        '?response_type=code' +
        '&client_id=' + client_id +
        (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
        '&redirect_uri=' + encodeURIComponent(redirect_uri);

    window.open(url, '_blank').focus();

}


// get access token by redirect url
function getAccessToken()
{    
    let url = "about:blank"; 
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) { 

        url = tab.url;
        console.log("url: " + url);
        let code = url.split("code=")[1];
        console.log(code);

        $.ajax(
            {
                method: "POST",
                url: "https://accounts.spotify.com/api/token",
                headers: {'Content-Type':'application/x-www-form-urlencoded'},
                data: {
                "grant_type":    "authorization_code",
                "code":          code,
                "redirect_uri":  "https://maximilianklackl.github.io/YoutubeToSpotifyChromeExtension/downloaded.html",
                "client_secret": Secrets.client_secret,
                "client_id":     Secrets.client_id,
                },
                success: function(response) {
                console.log(response);
                let accessToken = response.access_token;
                let refreshToken = response.refresh_token;
    
                setTokensInStorge(accessToken, refreshToken);
                },
                error: function(err){
                    console.log(err);
                }
            }
        );
    });
}


function setTokensInStorge(accessToken, refreshToken)
{
      chrome.storage.sync.set({"accessToken": accessToken});
      chrome.storage.sync.set({"refreshToken": refreshToken});
}