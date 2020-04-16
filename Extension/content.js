//request for youtube title
//parses and sends title back
chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener((request, sender, sendResponse) => {
        if(request.message === "getTitle")
        {
            let title = document.querySelector("#container > h1 > yt-formatted-string");
            let url = window.location.href;

            if(url.endsWith("https://www.youtube.com/") || !url.includes("youtube.com")){
                port.postMessage({title: "wrong site"});
            }else if(url.includes("youtube.com")){
                port.postMessage({title: title.innerHTML});
            }
        }
        else if(request.message === "getPlaylist"){
           
            let result = [];
            let titles = document.querySelectorAll("h4");

            titles.forEach(element => {
                result.push(element.querySelector("span").innerHTML);
            });
            port.postMessage({playlist: result});
        }
    })
})


