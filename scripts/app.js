// inicializar db
const request = indexedDB.open("myDB", 6);

request.onupgradeneeded = (e) => {
    db = e.target.result

    if (!db.objectStoreNames.contains("songs")) {
        db.createObjectStore("songs", { keyPath: "id", autoIncrement: true } )
    }
    
    let favoriteStore;

    if (!db.objectStoreNames.contains("favorites")) {
        favoriteStore = db.createObjectStore("favorites", { keyPath: "songId" });
    } else {
        favoriteStore = e.target.transaction.objectStore("favorites");
    }

    if (!favoriteStore.indexNames.contains("order")) {
        favoriteStore.createIndex("order", "order", { unique: false });
    }

}

request.onsuccess = (e) => {
    db = e.target.result;
    loadSavedSongs();
    loadFavoriteSongs();
}

//  SVG al inicio del archivo
const svg_favorite   =  `<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 9.1371C2 14 6.01943 16.5914 8.96173 18.9109C10 19.7294 11 20.5 12 20.5C13 20.5 14 19.7294 15.0383 18.9109C17.9806 16.5914 22 14 22 9.1371C22 4.27416 16.4998 0.825464 12 5.50063C7.50016 0.825464 2 4.27416 2 9.1371Z" fill="currentColor"/>
                        </svg>`;
const svg_nofavorite = `<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.96173 18.9109L9.42605 18.3219L8.96173 18.9109ZM12 5.50063L11.4596 6.02073C11.601 6.16763 11.7961 6.25063 12 6.25063C12.2039 6.25063 12.399 6.16763 12.5404 6.02073L12 5.50063ZM15.0383 18.9109L15.5026 19.4999L15.0383 18.9109ZM9.42605 18.3219C7.91039 17.1271 6.25307 15.9603 4.93829 14.4798C3.64922 13.0282 2.75 11.3345 2.75 9.1371H1.25C1.25 11.8026 2.3605 13.8361 3.81672 15.4758C5.24723 17.0866 7.07077 18.3752 8.49742 19.4999L9.42605 18.3219ZM2.75 9.1371C2.75 6.98623 3.96537 5.18252 5.62436 4.42419C7.23607 3.68748 9.40166 3.88258 11.4596 6.02073L12.5404 4.98053C10.0985 2.44352 7.26409 2.02539 5.00076 3.05996C2.78471 4.07292 1.25 6.42503 1.25 9.1371H2.75ZM8.49742 19.4999C9.00965 19.9037 9.55954 20.3343 10.1168 20.6599C10.6739 20.9854 11.3096 21.25 12 21.25V19.75C11.6904 19.75 11.3261 19.6293 10.8736 19.3648C10.4213 19.1005 9.95208 18.7366 9.42605 18.3219L8.49742 19.4999ZM15.5026 19.4999C16.9292 18.3752 18.7528 17.0866 20.1833 15.4758C21.6395 13.8361 22.75 11.8026 22.75 9.1371H21.25C21.25 11.3345 20.3508 13.0282 19.0617 14.4798C17.7469 15.9603 16.0896 17.1271 14.574 18.3219L15.5026 19.4999ZM22.75 9.1371C22.75 6.42503 21.2153 4.07292 18.9992 3.05996C16.7359 2.02539 13.9015 2.44352 11.4596 4.98053L12.5404 6.02073C14.5983 3.88258 16.7639 3.68748 18.3756 4.42419C20.0346 5.18252 21.25 6.98623 21.25 9.1371H22.75ZM14.574 18.3219C14.0479 18.7366 13.5787 19.1005 13.1264 19.3648C12.6739 19.6293 12.3096 19.75 12 19.75V21.25C12.6904 21.25 13.3261 20.9854 13.8832 20.6599C14.4405 20.3343 14.9903 19.9037 15.5026 19.4999L14.574 18.3219Z" fill="currentColor"/>
                        </svg>`

const inputFile = document.querySelector("input[type=file]");
const audio = document.getElementById("audio");

const songCard = document.querySelector('.song-card');
const albumPortrait = document.querySelector(".album-portrait");
const songName = document.getElementById("song-name");
const artistName = document.getElementById("artist-name");
const startTime = document.getElementById("start-time");
const endTime = document.getElementById("end-time");
const btnPlayPause = document.querySelector(".btn-playpause");
const iconPlayPause = document.getElementById("icon-playpause");

const footer = document.querySelector("footer");
const footerSongName = document.getElementById("footer-song-name");
const footerArtistName = document.getElementById("footer-artist-name");
const footerAlbumPortrait = footer.querySelector("img");
const footerIconPlayPause = document.getElementById("footer-icon-playpause");
const footerBtnPlayPause = document.querySelector(".footer-btn-playpause");
const footerStartTime = document.getElementById("footer-start-time");
const footerEndTime = document.getElementById("footer-end-time");
const inicioSection = document.querySelector("#inicio");

//  Seleccionar ambos ranges
const mainRange = document.querySelector("#inicio .track-bar input[type=range]");
const footerRange = document.querySelector("footer .track-bar input[type=range]");

let currentFile = null;
let currentTitle = "";
let currentArtist = "";
let currentSongId = null;

let currentContext = null;
let currentPlaylist = [];
let currentIndex = -1;

let isUserSeeking = false; 

function updateRange(rangeElement) {
    if (!rangeElement) return;
    
    const min = rangeElement.min || 0;
    const max = rangeElement.max || 100;
    const val = rangeElement.value;

    const percent = ((val - min) / (max - min)) * 100;

    rangeElement.style.background = `linear-gradient(to right, #ddd ${percent}%, #787878 ${percent}%)`;
}

function isAudioPlaying() {
    return !audio.paused && !audio.ended && audio.currentTime > 0;
}

function updatePlayPauseButton() {
    updatePlayPauseButtonWithState(isAudioPlaying());
}

function updatePlayPauseButtonWithState(isPlaying) {
    if (isPlaying) {
        iconPlayPause.src = "assets/pause.png";
        footerIconPlayPause.src = "assets/pause.png";
    } else {
        iconPlayPause.src = "assets/play.png";
        footerIconPlayPause.src = "assets/play.png";
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
    playNext();
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

//  Solo actualiza si el usuario NO está arrastrando
function timeUpdate() {
    if (audio.ended || isUserSeeking) {
        return;
    }
    
    const currentTime = formatTime(audio.currentTime);
    const progress = (audio.currentTime / audio.duration) * 100;
    
    // Actualizar ambos displays de tiempo
    if (startTime) startTime.textContent = currentTime;
    if (footerStartTime) footerStartTime.textContent = currentTime;
    
    // Actualizar ambos ranges
    if (mainRange) {
        mainRange.value = progress;
        updateRange(mainRange);
    }
    
    if (footerRange) {
        footerRange.value = progress;
        updateRange(footerRange);
    }
}

function loadedMetaData() {
    const duration = formatTime(audio.duration);
    if (endTime) endTime.textContent = duration;
    if (footerEndTime) footerEndTime.textContent = duration;
}

//  Maneja el arrastre visual
function handleRangeInput(rangeElement) {
    isUserSeeking = true; //  Bloquear actualizaciones automáticas
    
    // Sincronizar el otro range
    const value = rangeElement.value;
    if (rangeElement === mainRange && footerRange) {
        footerRange.value = value;
        updateRange(footerRange);
    } else if (rangeElement === footerRange && mainRange) {
        mainRange.value = value;
        updateRange(mainRange);
    }
    
    updateRange(rangeElement);
}

//  Maneja cuando suelta el mouse
function handleRangeChange(rangeElement) {
    if (!audio.duration) return;
    
    let seconds = (audio.duration * rangeElement.value) / 100;
    audio.currentTime = seconds;
    
    isUserSeeking = false; //  Permitir actualizaciones automáticas nuevamente
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
        if (currentContext === "saved") {
                currentPlaylist.push(id)
        }
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
            footerSongName.textContent = currentTitle;
            footerArtistName.textContent = currentArtist;

            let pictureUrl;
            let defaultPicture = "assets/default.jpeg"
            if (picture) {
                let base64String = "";
                for (let i = 0; i < picture.data.length; i++) {
                    base64String += String.fromCharCode(picture.data[i]);
                }
                pictureUrl = `data:${picture.format};base64,${btoa(base64String)}`;
            } else {
                pictureUrl = defaultPicture;
            }

            albumPortrait.src = pictureUrl;
            footerAlbumPortrait.src = pictureUrl;

            if (pictureUrl !== defaultPicture) {
                applyColor(albumPortrait);
            }

            audio.removeEventListener("timeupdate", timeUpdate);
            audio.removeEventListener("loadedmetadata", loadedMetaData);
            
            let url = URL.createObjectURL(file);
            audio.src = url;
            
            audio.addEventListener("loadedmetadata", loadedMetaData);
            audio.addEventListener("timeupdate", timeUpdate);
            
            audio.play().catch(err => {
                console.log("Error al reproducir:", err);
            });

            const activeButton = document.querySelector('.navigation-button.active');
            const isInicio = activeButton?.dataset.section === "inicio";
            
            toggleFooter(!isInicio);
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

            setTimeout(adjustFooterWidth, 100);
        },
        onError: function(error) {
            console.log(error);
        }
    });
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
}

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

function playNext() {
    if (!currentContext || currentPlaylist.length === 0) {
        console.log("No hay contexto de reproducción");
        return;
    }
    
    const nextIndex = (currentIndex + 1) % currentPlaylist.length;
    const nextSongId = currentPlaylist[nextIndex];
    
    console.log("Siguiente canción:", nextSongId);
    
    currentIndex = nextIndex;
    currentSongId = nextSongId;
    updateSongListUI();
    
    const tx = db.transaction("songs", "readonly");
    const store = tx.objectStore("songs");
    const req = store.get(nextSongId);
    
    req.onsuccess = () => {
        const song = req.result;
        if (song) {
            loadAndPlaySong(song.file);
        }
    };
}

function playPrevious() {
    if (!currentContext || currentPlaylist.length === 0) {
        console.log("No hay contexto de reproducción");
        return;
    }
    
    const prevIndex = currentIndex === 0 
        ? currentPlaylist.length - 1 
        : currentIndex - 1;
    const prevSongId = currentPlaylist[prevIndex];
    
    console.log("Canción anterior:", prevSongId);
    
    currentIndex = prevIndex;
    currentSongId = prevSongId;
    updateSongListUI();
    
    const tx = db.transaction("songs", "readonly");
    const store = tx.objectStore("songs");
    const req = store.get(prevSongId);
    
    req.onsuccess = () => {
        const song = req.result;
        if (song) {
            loadAndPlaySong(song.file);
        }
    };
}

const btnNext = document.querySelector(".btn-next");
const btnPrevious = document.querySelector(".btn-back");

if (btnNext) btnNext.addEventListener("click", playNext);
if (btnPrevious) btnPrevious.addEventListener("click", playPrevious);

const footerBtnNext = document.querySelector(".footer-btn-next");
const footerBtnPrevious = document.querySelector(".footer-btn-back");

if (footerBtnNext) footerBtnNext.addEventListener("click", playNext);
if (footerBtnPrevious) footerBtnPrevious.addEventListener("click", playPrevious);

if (btnPlayPause) btnPlayPause.addEventListener("click", playPause);
if (footerBtnPlayPause) footerBtnPlayPause.addEventListener("click", playPause);

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

        const isInicio = button.dataset.section === "inicio";
        const shouldShowFooter = !isInicio && currentSongId !== null;
        
        toggleFooter(shouldShowFooter);
        setTimeout(adjustFooterWidth, 100); 
    });
});

navigationButtons[2].click();

function loadSavedSongs() {
    const song_list = document.querySelector(".song-list");
    song_list.innerHTML = "";

    const tx = db.transaction("songs", "readonly");
    const store = tx.objectStore("songs");

    const req = store.getAll();

    req.onsuccess = () => {
        const songs = req.result;

        if (songs.length === 0) {

            const noSongsHTML = document.createElement("div");

            noSongsHTML.classList.add("no-songs-item");
            
            noSongsHTML.innerHTML = `
                                        <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 19C9 20.1046 7.65685 21 6 21C4.34315 21 3 20.1046 3 19C3 17.8954 4.34315 17 6 17C7.65685 17 9 17.8954 9 19ZM9 19V5L21 3V17M21 17C21 18.1046 19.6569 19 18 19C16.3431 19 15 18.1046 15 17C15 15.8954 16.3431 15 18 15C19.6569 15 21 15.8954 21 17ZM9 9L21 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        <p>No hay canciones aquí todavía.</p>
                                    `

            song_list.appendChild(noSongsHTML);

        }

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

        activeItemEvents(".song-list .song-item");
        updateSongListUI();
    };
}

function loadFavoriteSongs() {
    const favorite_list = document.querySelector(".favorite-list");
    favorite_list.innerHTML = "";

    const tx = db.transaction(["favorites", "songs"], "readonly");
    const favoriteStore = tx.objectStore("favorites");
    const songStore = tx.objectStore("songs");

    const index = favoriteStore.index("order");
    const favReq = index.getAll();
    const songReq = songStore.getAll();

    tx.oncomplete = () => {
        const favorites = favReq.result;
        const songs = songReq.result;

        if (favorites.length === 0) {

            const noSongsHTML = document.createElement("div");

            noSongsHTML.classList.add("no-songs-item");
            
            noSongsHTML.innerHTML = `
                                        <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 19C9 20.1046 7.65685 21 6 21C4.34315 21 3 20.1046 3 19C3 17.8954 4.34315 17 6 17C7.65685 17 9 17.8954 9 19ZM9 19V5L21 3V17M21 17C21 18.1046 19.6569 19 18 19C16.3431 19 15 18.1046 15 17C15 15.8954 16.3431 15 18 15C19.6569 15 21 15.8954 21 17ZM9 9L21 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        <p>No hay canciones aquí todavía.</p>
                                    `

            favorite_list.appendChild(noSongsHTML);

        }

        const songMap = new Map();
        songs.forEach(song => songMap.set(song.id, song));

        favorites.forEach(fav => {
            const song = songMap.get(fav.songId);
            if (!song) return;

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
                <button class="btn-favorite active">
                    ${svg_favorite}
                </button>
            </div>
            `;

            favorite_list.appendChild(songHTML);
        });

        activeItemEvents(".favorite-list .song-item");
        updateSongListUI();
    };
}

function activeItemEvents(selector) {
    const song_items = document.querySelectorAll(selector);

    song_items.forEach(song_item => {
        const picture_content = song_item.querySelector(".picture-content");
        const btn_favorite = song_item.querySelector(".btn-favorite");
        const id = Number(song_item.dataset.id);

        const btn_delete = song_item.querySelector(".btn-delete");

        if (".song-list .song-item" === selector) {

            btn_delete.addEventListener("click", () => {
                const tx = db.transaction(["songs", "favorites"], "readwrite");
                const songStore = tx.objectStore("songs");
                const favoriteStore = tx.objectStore("favorites");
                const songReq = songStore.delete(id);

                songReq.onsuccess = () => {
                    
                    console.log("Cancion eliminada");
                    favoriteStore.delete(id);
                    currentPlaylist = currentPlaylist.filter(item => item !== id);

                    if (currentSongId === id) {
                        clearSongCard();
                    }
                    
                }

                songReq.onerror = () => {
                    console.log("Error al eliminar la canción");
                };

                tx.oncomplete = () => {
                    loadSavedSongs();
                    loadFavoriteSongs();
                }

            });
            
        }
        
        btn_favorite.addEventListener("click", () => {
            const tx = db.transaction(["songs", "favorites"], "readwrite");
            const songStore = tx.objectStore("songs");
            const favoriteStore = tx.objectStore("favorites");
            const songReq = songStore.get(id);

            songReq.onsuccess = () => {
                const song = songReq.result;

                if (!song) {
                    console.log("La canción no existe");
                    return;
                }

                song.isFavorite = !song.isFavorite;

                document.querySelectorAll(`[data-id="${id}"] .btn-favorite`).forEach(btn => {
                    if (song.isFavorite) {
                        btn.innerHTML = svg_favorite;
                        btn.classList.add("active");
                    } else {
                        btn.innerHTML = svg_nofavorite;
                        btn.classList.remove("active");
                    }
                });

                songStore.put(song);
                
                if (!song.isFavorite) {
                    favoriteStore.delete(id);
                    
                    const favoriteItem = document.querySelector(`.favorite-list [data-id="${id}"]`);
                    if (favoriteItem) {
                        favoriteItem.remove();
                    }

                } else {
                    favoriteStore.put({
                        songId: id,
                        order: Date.now()
                    });
                }
            };

            songReq.onerror = () => {
                console.log("Error al procesar favorito");
            };

            tx.oncomplete = () => {
                console.log("Favorito actualizado correctamente");
                loadFavoriteSongs();
            };

            tx.onerror = () => {
                console.log("Error en la transacción de favoritos");
            };
        });

        picture_content.addEventListener("click", () => {
            const isCurrentSong = currentSongId === id;

            if (isCurrentSong) {
                playPause();
            } else {
                currentSongId = id;
                
                const activeButton = document.querySelector('.navigation-button.active');
                const section = activeButton?.dataset.section;
                
                if (section === "guardados") {
                    currentContext = "saved";
                    const allSongItems = document.querySelectorAll(".song-list .song-item");
                    currentPlaylist = Array.from(allSongItems).map(item => Number(item.dataset.id));
                } else if (section === "favoritos") {
                    currentContext = "favorites";
                    const allSongItems = document.querySelectorAll(".favorite-list .song-item");
                    currentPlaylist = Array.from(allSongItems).map(item => Number(item.dataset.id));
                }
                
                currentIndex = currentPlaylist.indexOf(id);
                
                console.log("Contexto:", currentContext);
                console.log("Playlist:", currentPlaylist);
                console.log("Índice actual:", currentIndex);
                
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

function toggleFooter(show) {
    const footer = document.querySelector('footer');
    
    if (show) {
        footer.style.display = 'flex';
        document.body.classList.add('footer-visible');
    } else {
        footer.style.display = 'none';
        document.body.classList.remove('footer-visible');
    }
}

function clearSongCard() {
    audio.removeEventListener("timeupdate", timeUpdate);
    audio.removeEventListener("loadedmetadata", loadedMetaData);
    
    audio.pause();
    audio.src = "";

    currentSongId = null;
    currentFile = null;
    currentTitle = "";
    currentArtist = "";

    songCard.style.background = "var(--color-bg-card)"
    songName.textContent = "Sin reproducir";
    artistName.textContent = "Artista desconocido";
    albumPortrait.src = "assets/default.jpeg";

    startTime.textContent = "0:00";
    endTime.textContent = "0:00";
    footerStartTime.textContent = "0:00";
    footerEndTime.textContent = "0:00";
    
    currentContext = null;
    currentPlaylist = [];
    currentIndex = -1;

    inicioSection.style.background = `
        linear-gradient(
        to bottom,
        var(--color-bg-surface),
        var(--color-bg-main)
    )
    `;

    if (mainRange) {
        mainRange.value = 0;
        mainRange.style.background = "#ddd";
    }
    
    if (footerRange) {
        footerRange.value = 0;
        footerRange.style.background = "#ddd";
    }
    
    updatePlayPauseButton();
    updateSongListUI();

    toggleFooter(false);
}

function adjustFooterWidth() {
    const footer = document.querySelector('footer');
    const main = document.querySelector('main');
    
    const hasScrollbar = main.scrollHeight > main.clientHeight;
    const scrollbarWidth = hasScrollbar ? 15 : 0;
    
    footer.style.width = `calc(100vw - 280px - 60px - ${scrollbarWidth}px)`;
}

function applyColor(img) {

    let colorThief = new ColorThief();
    const palette = colorThief.getPalette(img, 5);

    // 👉 elegir el color más "intenso"
    const bestColor = palette.reduce((best, current) => {
        const currentScore = getColorScore(current);
        const bestScore = getColorScore(best);
        return currentScore > bestScore ? current : best;
    });

    applyBackground(bestColor);
}

function getColorScore([r, g, b]) {
    // saturación simple (qué tan "vivo" es el color)
    return Math.max(r, g, b) - Math.min(r, g, b);
}

function applyShadow(color) {
    songCard.style.boxShadow = `
        0px 10px 30px rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.6),
        0px 0px 80px rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.5)
    `;
}

function applyBackground(color) {
    inicioSection.style.background = `
        linear-gradient(
            to bottom,
            rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.4),
            #141414
        )
    `;
}

//  Conectar eventos de los ranges
if (mainRange) {
    mainRange.addEventListener("input", () => handleRangeInput(mainRange));
    mainRange.addEventListener("change", () => handleRangeChange(mainRange));
    updateRange(mainRange);
}

if (footerRange) {
    footerRange.addEventListener("input", () => handleRangeInput(footerRange));
    footerRange.addEventListener("change", () => handleRangeChange(footerRange));
    updateRange(footerRange);
}