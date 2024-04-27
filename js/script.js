console.log('Let write JavaScript');

let currentsong = new Audio();
let songs;
let currFolder;
let currentSongIndex = 0;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`http://127.0.0.1:3000/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }
    // show all the songs in the playlist
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `<li><img class="invert" width="34" src="img/music.svg" alt="">
                               <div class="info">
                                   <div> ${song.replaceAll("%20", " ")}</div>
                                   <div>Sahil</div>
                               </div>
                               <div class="playnow">
                                   <span>Play Now</span>
                                   <img class="invert" src="img/play.svg" alt="">
                               </div></li>`;
    }

    // Attach an event listener to each song
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach((e, index) => {
        e.addEventListener("click", element => {
            playMusic(index);
        });
    });

    return songs;
}

const playMusic = async (index, pause = false) => {
    currentSongIndex = index;
    currentsong.src = `/${currFolder}/` + songs[index];
    try {
        await currentsong.load(); // Wait for the audio to load
        if (!pause) {
            await currentsong.play(); // Wait for the play request to finish
            play.src = "img/pause.svg";
        }
        document.querySelector(".songinfo").innerHTML = decodeURI(songs[index]);
        document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

        // Remove any existing timeupdate listener
        currentsong.removeEventListener("timeupdate", updateTime);

        // Listen for timeupdate event
        currentsong.addEventListener("timeupdate", updateTime);

    } catch (error) {
        console.error("An error occurred while playing the music:", error);
    }
};

function updateTime() {
    if (!isNaN(currentsong.duration) && isFinite(currentsong.duration) && currentsong.duration > 0) {
        const currentTime = isNaN(currentsong.currentTime) ? 0 : currentsong.currentTime;
        document.querySelector(".songtime").textContent = `${secondsToMinutesSeconds(currentTime)} / ${secondsToMinutesSeconds(currentsong.duration)}`;
        document.querySelector(".circle").style.left = `${(currentTime / currentsong.duration) * 100}%`;
    } else {
        console.error("Cannot seek: currentsong duration is not a valid finite number or is 0.");
        // Remove timeupdate listener if duration is invalid
        currentsong.removeEventListener("timeupdate", updateTime);
    }
}

async function displayAlbums() {
    try {
        console.log("Displaying albums...");
        let response = await fetch(`/songs/`);
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardcontainer");
        if (!cardContainer) {
            console.error("Card container not found.");
            return;
        }
        let array = Array.from(anchors);
        for (let index = 0; index < array.length; index++) {
            const anchor = array[index];
            if (anchor.href.includes("/songs") && !anchor.href.includes(".htaccess")) {
                let folder = anchor.href.split("/").slice(-2)[0];
                let infoResponse = await fetch(`/songs/${folder}/info.json`);
                let info = await infoResponse.json();
                cardContainer.innerHTML += `
                    <div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="">
                        <h2>${info.title}</h2>
                        <p>${info.description}</p>
                    </div>`;
            }
        }
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

async function main() {
    try {
        // Get the list of all the songs
        await getSongs("songs/ncs");
        playMusic(0, true);

        // Display all the albums on the page
        await displayAlbums();

        // Attach an event listener to play
        play.addEventListener("click", () => {
            if (currentsong.paused) {
                currentsong.play().catch(error => console.error(error));
                play.src = "img/pause.svg";
            } else {
                currentsong.pause();
                play.src = "img/play.svg";
            }
        });

        // Attach an event listener to next
        next.addEventListener("click", () => {
            currentSongIndex = (currentSongIndex + 1) % songs.length;
            playMusic(currentSongIndex);
        });

        // Attach an event listener to previous
        previous.addEventListener("click", () => {
            currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
            playMusic(currentSongIndex);
        });

        // Add event listener to volume/mute
        let volumeImg = document.querySelector(".volume img");
        let volumeRange = document.querySelector(".range input");

        volumeImg.addEventListener("click", () => {
            if (currentsong.volume > 0) {
                currentsong.volume = 0;
                volumeRange.value = 0;
                volumeImg.src = "img/mute.svg";
            } else {
                currentsong.volume = 1;
                volumeRange.value = 100;
                volumeImg.src = "img/volume.svg";
            }
        });

        // Add event listener to volume range
        volumeRange.addEventListener("input", (e) => {
            currentsong.volume = parseInt(e.target.value) / 100;
            if (currentsong.volume > 0) {
                volumeImg.src = "img/volume.svg";
            }
        });

        // Add event listener to seekbar
        let seekbar = document.querySelector(".seekbar");
        seekbar.addEventListener("click", (e) => {
            let percent = (e.offsetX / seekbar.getBoundingClientRect().width);
            currentsong.currentTime = percent * currentsong.duration;
        });

        // Add event listener for hamburger
        // document.querySelector(".hamburger").addEventListener("click", () => {
        //     let navMenu = document.querySelector(".left");
        //     if (navMenu.style.left === "0px") {
        //         navMenu.style.left = "-120%";
        //     } else {
        //         navMenu.style.left = "0";
        //     }
        // });


        // add an event listener for hamburger
        document.querySelector(".hamburger").addEventListener("click", () => {
            document.querySelector(".left").style.left = "0"
        })

        // Add event listener for close button
        document.querySelector(".close").addEventListener("click", () => {
            let navMenu = document.querySelector(".left");
            navMenu.style.left = "-120%";
        });

    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main();




















// console.log('Let write JavaScript');
// let currentsong = new Audio();
// let songs;
// let currFolder;

// function secondsToMinutesSeconds(seconds) {
//     if (isNaN(seconds) || seconds < 0) {
//         return "00:00";
//     }

//     const minutes = Math.floor(seconds / 60);
//     const remainingSeconds = Math.floor(seconds % 60);

//     const formattedMinutes = String(minutes).padStart(2, '0');
//     const formattedSeconds = String(remainingSeconds).padStart(2, '0');

//     return `${formattedMinutes}:${formattedSeconds}`;
// }

// async function getSongs(folder) {
//     currFolder = folder;
//     let a = await fetch(`http://127.0.0.1:3000/${folder}/`)
//     let response = await a.text();
//     let div = document.createElement("div")
//     div.innerHTML = response;
//     let as = div.getElementsByTagName("a")
//     songs = []
//     for (let index = 0; index < as.length; index++) {
//         const element = as[index];
//         if (element.href.endsWith(".mp3")) {
//             songs.push(element.href.split(`/${folder}/`)[1])
//         }
//     }
//     // show all the songs in the playlist
//     let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0]
//     songUL.innerHTML = ""
//     for (const song of songs) {
//         songUL.innerHTML = songUL.innerHTML + `<li><img class="invert" width="34" src="img/music.svg" alt="">
//                                <div class="info">
//                                    <div> ${song.replaceAll("%20", " ")}</div>
//                                    <div>Sahil</div>
//                                </div>
//                                <div class="playnow">
//                                    <span>Play Now</span>
//                                    <img class="invert" src="img/play.svg" alt="">
//                                </div></li>`;
//     }

//     //    Attach an event listener to each song
//     Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
//         e.addEventListener("click", element => {
//             playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim())

//         })
//     })

//     return songs
// }

// const playMusic = (track, pause = false) => {
//     currentsong.Src = `/${currFolder}/` + track
//     if (!pause) {
//         currentsong.play()
//         play.src = "img/pause.svg"
//     }
//     document.querySelector(".songinfo").innerHTML = decodeURI(track)
//     document.querySelector(".songtime").innerHTML = "00:00 / 00:00"

// }

// async function displayAlbums() {
//     console.log("displaying albums")
//     let a = await fetch(`/songs/`)
//     let response = await a.text();
//     let div = document.createElement("div")
//     div.innerHTML = response;
//     let anchors = div.getElementsByTagName("a")
//     let cardContainer = document.querySelector(".cardContainer")
//     let array = Array.from(anchors)
//     for (let index = 0; index < array.length; index++) {
//         const e = array[index];

//         if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
//             let folder = (e.href.split("/").slice(-2)[0])
//             // Get the metadata of the folder
//             let a = await fetch(`/songs/${folder}/info.json`)
//             let response = await a.json();
//             console.log(response)
//             cardContainer.innerHTML = cardContainer.innerHTML + ` <div data-folder="${folder}" class="card">
//             <div class="play">
//                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
//                     xmlns="http://www.w3.org/2000/svg">
//                     <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
//                         stroke-linejoin="round" />
//                 </svg>
//             </div>
//             <img src="/songs/${folder}/cover.jpg" alt="">
//             <h2>${response.title}</h2>
//             <p>${response.description}</p>
//         </div>`
//         }
//     }

//     // Load the playlist whenever card is clicked
//     Array.from(document.getElementsByClassName("card")).forEach(e => {
//         e.addEventListener("click", async item => {
//             console.log("Fetching Songs")
//             songs = await getSongs(`songs/${item.currentTarget.dotaset.folder}`)
//             playMusic(songs[0])


//         })
//     })

// }

// async function main() {
//     // get the list of all the songs
//     await getSongs("songs/ncs")
//     playMusic(songs[0], true)

//     // Display all the albums on the page
//     displayAlbums()

//     // Attach an enent listener to play, next and previous
//     play.addEventListener("click", () => {
//         if (currentsong.paused) {
//             currentsong.play()
//             play.Src = "img/pause.svg"
//         }
//         else {
//             currentsong.pause()
//             play.Src = "img/play.svg"
//         }
//     })

//     // Listen for timeupdate event
//     currentsong.addEventListener("timeupdate", () => {
//         document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentsong.currentTime)} / ${secondsToMinutesSeconds(currentsong.duration)}`
//         document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
//     })

//     // Add an event listener to seekbar
//     document.querySelector(".seekbar").addEventListener("click", e => {
//         let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
//         document.querySelector(".circle").style.left = percent + "%";
//         currentsong.currentTime = ((currentsong.duration) * percent) / 100
//     })

//     // add an event listener for hamburger
//     document.querySelector(".hamburger").addEventListener("click", () => {
//         document.querySelector(".left").style.left = "0"
//     })

//     // add an event listener for close button
//     document.querySelector(".close").addEventListener("click", () => {
//         document.querySelector(".left").style.left = "-120%"
//     })

//     // Add an event listener to previous
//     previous.addEventListener("click", () => {
//         console.log("Previous clicked")
//         let index = songs.indexof(currentsong.src.split("/").slice(-1)[0])
//         if ((index - 1) >= 0) {
//             playMusic(songs[index - 1])
//         }
//     })

//     // Add an event listener to next
//     next.addEventListener("click", () => {
//         console.log("Next clicked")

//         let index = songs.indexof(currentsong.src.split("/").slice(-1)[0])
//         if ((index + 1) > songs.length) {
//             playMusic(songs[index + 1])
//         }
//     })

//     // Add an event to volume
//     document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
//         console.log("satting volume to", e.target.value, "/ 100")
//         currentsong.volume = parseInt(e.target.value) / 100
//         if (currentsong.volume >0){
//             document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg")
//         }
//     })

//     // Add event listener to mute the track
//     document.querySelector(".volume>img").addEventListener("click", e => {
//         if (e.target.src.includes("volume.svg")) {
//             e.target.src = e.target.src.replace("volume.svg", "mute.svg")
//             currentsong.volume = 0;
//             document.querySelector(".range").getElementsByTagName("input")[0].volume = 0;
//         }
//         else {
//             e.target.src = e.target.src.replace("mute.svg", "volume.svg")
//             currentsong.volume = .10;
//             document.querySelector(".range").getElementsByTagName("input")[0].volume = 10;
//         }
//     })


// }

// main()