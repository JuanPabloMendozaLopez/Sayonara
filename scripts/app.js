// inicializar db
const request = indexedDB.open("myDB", 2);

request.onupgradeneeded = (e) => {
    db = e.target.result
    db.createObjectStore("songs", { keyPath: "id", autoIncrement: true } )
}

request.onsuccess = (e) => {
    db = e.target.result;
    loadSavedSongs();
}

const range = document.querySelector("input[type=range]");

function updateRange() {
    const min = range.min || 0;
    const max = range.max || 100;
    const val = range.value;

    const percent = ((val - min) / (max - min)) * 100;

    range.style.background = `linear-gradient(to right, #787878 ${percent}%, #ddd ${percent}%)`;
}

range.addEventListener("input", updateRange);

updateRange();

const inputFile = document.querySelector("input[type=file]");
const audio = document.getElementById("audio");

const albumPortrait = document.querySelector(".album-portrait");
const songName = document.getElementById("song-name");
const artistName = document.getElementById("artist-name");
const startTime = document.getElementById("start-time");
const endTime = document.getElementById("end-time");
const btnPlayPause = document.querySelector(".btn-playpause");
const iconPlayPause = document.getElementById("icon-playpause");

let currentFile = null;
let currentTitle = "";
let currentArtist = "";
let currentSongId = null;

function isAudioPlaying() {
    return !audio.paused && !audio.ended && audio.currentTime > 0;
}

function updatePlayPauseButton() {
    updatePlayPauseButtonWithState(isAudioPlaying());
}

function updatePlayPauseButtonWithState(isPlaying) {
    if (isPlaying) {
        iconPlayPause.src = "assets/pause.png";
    } else {
        iconPlayPause.src = "assets/play.png";
    }
}

audio.addEventListener("play", () => {
    console.log("EVENTO PLAY disparado");
    updatePlayPauseButtonWithState(true);
    updateSongListUIWithState(true);
});

audio.addEventListener("pause", () => {
    console.log("EVENTO PAUSE disparado");
    updatePlayPauseButtonWithState(false);
    updateSongListUIWithState(false);
});

audio.addEventListener("ended", () => {
    updatePlayPauseButtonWithState(false);
    updateSongListUIWithState(false);
});

function updateSongListUIWithState(isPlaying) {
    console.log("updateSongListUI llamado con isPlaying:", isPlaying);
    console.log("currentSongId:", currentSongId);
    
    const song_items = document.querySelectorAll(".song-item");
    
    song_items.forEach(song_item => {
        const picture_content = song_item.querySelector(".picture-content");
        const song_title = song_item.querySelector(".song-title");
        const id = Number(song_item.dataset.id);
        
        const isCurrentSong = currentSongId === id;
        
        if (isCurrentSong) {
            song_title.classList.add("selected");
            if (isPlaying) {
                console.log("Agregando clase active al item", id);
                picture_content.classList.add("active");
            } else {
                console.log("Removiendo clase active del item", id);
                picture_content.classList.remove("active");
            }
        } else {
            song_title.classList.remove("selected");
            picture_content.classList.remove("active");
        }
    });
}

function updateSongListUI() {
    updateSongListUIWithState(isAudioPlaying());
}

function timeUpdate() {
    if (audio.ended) {
        return;
    }
    
    startTime.textContent = formatTime(audio.currentTime);
    range.value = (audio.currentTime / audio.duration) * 100;
    updateRange();
}

function loadedMetaData() {
    endTime.textContent = formatTime(audio.duration);
}

function updateTrackValue() {
    let seconds = (audio.duration * range.value) / 100;
    audio.currentTime = seconds;
    startTime.textContent = audio.currentTime === audio.duration ? formatTime(audio.duration) : formatTime(audio.currentTime);
    updateRange();
}

function saveAudio(song, file, picture) {
    const tx = db.transaction("songs", "readwrite");
    const store = tx.objectStore("songs");

    const req = store.add({
        ...song,
        file: file,
        picture: picture
    });

    req.onsuccess = (e) => {
        const id = e.target.result;
        song.id = id;
        loadSavedSongs();
    };
}

function loadAndPlaySong(file) {
    if (!file) return;
    
    currentFile = file;

    jsmediatags.read(file, {
        onSuccess: function(tag) {
            const { title, artist, picture } = tag.tags;

            currentTitle = title || "Sin titulo";
            currentArtist = artist || "Artista desconocido";

            songName.textContent = currentTitle;
            artistName.textContent = currentArtist;

            let pictureUrl;
            if (picture) {
                let base64String = "";
                for (let i = 0; i < picture.data.length; i++) {
                    base64String += String.fromCharCode(picture.data[i]);
                }
                pictureUrl = `data:${picture.format};base64,${btoa(base64String)}`;
            } else {
                pictureUrl = "assets/default.jpeg";
            }

            albumPortrait.src = pictureUrl;

            audio.removeEventListener("timeupdate", timeUpdate);
            audio.removeEventListener("loadedmetadata", loadedMetaData);
            range.removeEventListener("input", updateTrackValue);
            
            let url = URL.createObjectURL(file);
            audio.src = url;
            audio.addEventListener("loadedmetadata", loadedMetaData);
            audio.addEventListener("timeupdate", timeUpdate);
            range.addEventListener("input", updateTrackValue);
            
            audio.play().catch(err => {
                console.log("Error al reproducir:", err);
            });
        },
        onError: function(error) {
            console.log(error);
        }
    });
}

function loadAndSaveSong() {
    let file = inputFile.files[0]; 
    
    if (!file) return;
    
    currentFile = file;

    jsmediatags.read(file, {
        onSuccess: function(tag) {
            const { title, artist, picture } = tag.tags;

            currentTitle = title || "Sin titulo";
            currentArtist = artist || "Artista desconocido";

            let pictureUrl;
            if (picture) {
                let base64String = "";
                for (let i = 0; i < picture.data.length; i++) {
                    base64String += String.fromCharCode(picture.data[i]);
                }
                pictureUrl = `data:${picture.format};base64,${btoa(base64String)}`;
            } else {
                pictureUrl = "assets/default.jpeg";
            }

            let url = URL.createObjectURL(file);
            const tempAudio = new Audio(url);
            
            tempAudio.addEventListener("loadedmetadata", () => {
                const song = {
                    title: currentTitle,
                    artist: currentArtist,
                    isFavorite: false,
                    duration: formatTime(tempAudio.duration)
                };
                
                saveAudio(song, currentFile, pictureUrl);
                
                URL.revokeObjectURL(url);
                tempAudio.src = '';
            });
        },
        onError: function(error) {
            console.log(error);
        }
    });
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
}

albumPortrait.addEventListener("click", () => {
    inputFile.setAttribute("data-action", "play");
    inputFile.value = "";
    inputFile.click();
});

const btn_add = document.getElementById("btn-add");
btn_add.addEventListener("click", () => {
    inputFile.setAttribute("data-action", "save");
    inputFile.value = "";
    inputFile.click();
});

inputFile.addEventListener("change", () => {
    const action = inputFile.getAttribute("data-action");
    let file = inputFile.files[0]; 
    
    if (action === "play") {
        loadAndPlaySong(file);
    } else if (action === "save") {
        loadAndSaveSong();
    }
    
    inputFile.removeAttribute("data-action");
});

function playPause() {
    if (!audio.src) return;
    
    if (isAudioPlaying()) {
        audio.pause();
    } else {
        audio.play();
    }
}

btnPlayPause.addEventListener("click", playPause);

const navigationButtons = document.querySelectorAll(".navigation-button");
const sections = document.querySelectorAll("section");

navigationButtons.forEach(button => {
    button.addEventListener("click", () => {
        sections.forEach(section => {
            section.style.display = "none";
        })
        
        navigationButtons.forEach(btn => {
            btn.classList.remove("active");
        })
        button.classList.add("active");
        const section = document.getElementById(button.dataset.section);
        section.style.display = "flex"
    });
});

navigationButtons[2].click();

const svg_favorite   =  `<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 9.1371C2 14 6.01943 16.5914 8.96173 18.9109C10 19.7294 11 20.5 12 20.5C13 20.5 14 19.7294 15.0383 18.9109C17.9806 16.5914 22 14 22 9.1371C22 4.27416 16.4998 0.825464 12 5.50063C7.50016 0.825464 2 4.27416 2 9.1371Z" fill="currentColor"/>
                        </svg>`;
const svg_nofavorite = `<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.96173 18.9109L9.42605 18.3219L8.96173 18.9109ZM12 5.50063L11.4596 6.02073C11.601 6.16763 11.7961 6.25063 12 6.25063C12.2039 6.25063 12.399 6.16763 12.5404 6.02073L12 5.50063ZM15.0383 18.9109L15.5026 19.4999L15.0383 18.9109ZM9.42605 18.3219C7.91039 17.1271 6.25307 15.9603 4.93829 14.4798C3.64922 13.0282 2.75 11.3345 2.75 9.1371H1.25C1.25 11.8026 2.3605 13.8361 3.81672 15.4758C5.24723 17.0866 7.07077 18.3752 8.49742 19.4999L9.42605 18.3219ZM2.75 9.1371C2.75 6.98623 3.96537 5.18252 5.62436 4.42419C7.23607 3.68748 9.40166 3.88258 11.4596 6.02073L12.5404 4.98053C10.0985 2.44352 7.26409 2.02539 5.00076 3.05996C2.78471 4.07292 1.25 6.42503 1.25 9.1371H2.75ZM8.49742 19.4999C9.00965 19.9037 9.55954 20.3343 10.1168 20.6599C10.6739 20.9854 11.3096 21.25 12 21.25V19.75C11.6904 19.75 11.3261 19.6293 10.8736 19.3648C10.4213 19.1005 9.95208 18.7366 9.42605 18.3219L8.49742 19.4999ZM15.5026 19.4999C16.9292 18.3752 18.7528 17.0866 20.1833 15.4758C21.6395 13.8361 22.75 11.8026 22.75 9.1371H21.25C21.25 11.3345 20.3508 13.0282 19.0617 14.4798C17.7469 15.9603 16.0896 17.1271 14.574 18.3219L15.5026 19.4999ZM22.75 9.1371C22.75 6.42503 21.2153 4.07292 18.9992 3.05996C16.7359 2.02539 13.9015 2.44352 11.4596 4.98053L12.5404 6.02073C14.5983 3.88258 16.7639 3.68748 18.3756 4.42419C20.0346 5.18252 21.25 6.98623 21.25 9.1371H22.75ZM14.574 18.3219C14.0479 18.7366 13.5787 19.1005 13.1264 19.3648C12.6739 19.6293 12.3096 19.75 12 19.75V21.25C12.6904 21.25 13.3261 20.9854 13.8832 20.6599C14.4405 20.3343 14.9903 19.9037 15.5026 19.4999L14.574 18.3219Z" fill="currentColor"/>
                        </svg>`

function loadSavedSongs() {
    const song_list = document.querySelector(".song-list");
    song_list.innerHTML = "";

    const tx = db.transaction("songs", "readonly");
    const store = tx.objectStore("songs");

    const req = store.getAll();

    req.onsuccess = () => {
        const songs = req.result;

        songs.forEach(song => {
            const songHTML = document.createElement("div");

            songHTML.classList.add("song-item");
            songHTML.dataset.id = song.id;

            songHTML.innerHTML = `
            <div class="song-content">
                <div class="picture-content">
                    <img src="${song.picture}">
                </div>
                <div>
                    <p class="song-title">${song.title}</p>
                    <p class="song-artist">${song.artist}</p>
                </div>
            </div>
            <div class="song-controls">
                <p>${song.duration}</p>
                <button class="btn-favorite ${song.isFavorite ? `active` : ``}">
                    ${song.isFavorite ? 
                        svg_favorite : 
                        svg_nofavorite }
                </button>
                <button class="btn-delete">
                    <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M14 10V17M10 10V17" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            `;

            song_list.appendChild(songHTML);
        });

        activeItemEvents();
        updateSongListUI();
    };
}

function activeItemEvents() {
    const song_items = document.querySelectorAll(".song-item");

    song_items.forEach(song_item => {
        const picture_content = song_item.querySelector(".picture-content");
        const btn_delete = song_item.querySelector(".btn-delete");
        const btn_favorite = song_item.querySelector(".btn-favorite");
        const id = Number(song_item.dataset.id);

        btn_delete.addEventListener("click", () => {
            const tx = db.transaction("songs", "readwrite");
            const store = tx.objectStore("songs");
            const req = store.delete(id);

            req.onsuccess = () => {
                console.log("Cancion eliminada");
                if (currentSongId === id) {
                    clearSongCard();
                }
                loadSavedSongs();
            }
        });

        btn_favorite.addEventListener("click", () => {
            const tx = db.transaction("songs", "readwrite");
            const store = tx.objectStore("songs");
            const req = store.get(id);

            req.onsuccess = () => {
                const song = req.result;
                song.isFavorite = !song.isFavorite;

                if (song.isFavorite) {
                    btn_favorite.innerHTML = svg_favorite;
                    btn_favorite.classList.add("active")
                } else {
                    btn_favorite.innerHTML = svg_nofavorite;
                    btn_favorite.classList.remove("active");
                }

                store.put(song);
            }
        });

        picture_content.addEventListener("click", () => {
            const isCurrentSong = currentSongId === id;

            if (isCurrentSong) {
                playPause();
            } else {
                currentSongId = id;
                updateSongListUI();
                
                const tx = db.transaction("songs", "readonly");
                const store = tx.objectStore("songs");
                const req = store.get(id);
                
                req.onsuccess = () => {
                    const song = req.result;
                    loadAndPlaySong(song.file);
                };
            }
        });
    });
}

function clearSongs() {
    const tx = db.transaction("songs", "readwrite");
    const store = tx.objectStore("songs");

    const req = store.clear(); 

    req.onsuccess = () => {
        console.log("Todas las canciones eliminadas");
        loadSavedSongs(); 
    };
}

function clearSongCard() {
    // Primero desvincula los eventos
    audio.removeEventListener("timeupdate", timeUpdate);
    audio.removeEventListener("loadedmetadata", loadedMetaData);
    range.removeEventListener("input", updateTrackValue);
    
    // Ahora sí pausa y limpia
    audio.pause();
    audio.src = "";

    currentSongId = null;
    currentFile = null;
    currentTitle = "";
    currentArtist = "";

    songName.textContent = "Sin reproducir";
    artistName.textContent = "Artista desconocido";
    albumPortrait.src = "assets/default.jpeg";

    startTime.textContent = "0:00";
    endTime.textContent = "0:00";

    // Ahora resetea el range
    range.value = 0;
    range.style.background = "#ddd";
    
    updatePlayPauseButton();
    updateSongListUI();
}