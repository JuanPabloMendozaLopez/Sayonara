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

// funcion que colorea el track bar del input[type=range]
const range = document.querySelector("input[type=range]");

function updateRange() {
    const min = range.min || 0;
    const max = range.max || 100;
    const val = range.value;

    const percent = ((val - min) / (max - min)) * 100;

    range.style.background = `linear-gradient(to right, #787878 ${percent}%, #ddd ${percent}%)`;
}

range.addEventListener("input", updateRange);

// inicializar al cargar
updateRange();

const albumPortrait = document.querySelector(".album-portrait");
const inputFile = document.querySelector("input[type=file]");
const audio = document.getElementById("audio");

const songName = document.getElementById("song-name");
const artistName = document.getElementById("artist-name");

const startTime = document.getElementById("start-time");
const endTime = document.getElementById("end-time");

function timeUpdate() {
    if (audio.currentTime === audio.duration) {
        playPause();
    } else {
        startTime.textContent = formatTime(audio.currentTime);
        range.value = (audio.currentTime / audio.duration) * 100;
        updateRange();
    }
}

// funcion cargar metadatos para asignar la duracion de la cancion
function loadedMetaData() {
    endTime.textContent = formatTime(audio.duration);
}

// funcion para actualizar valor del trackbar
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

let currentFile = null;
let currentTitle = "";
let currentArtist = "";

// Función para REPRODUCIR canción
function loadAndPlaySong() {
    let file = inputFile.files[0]; 
    
    if (!file) return;
    
    currentFile = file;

    jsmediatags.read(file, {
        onSuccess: function(tag) {
            const { title, artist, picture } = tag.tags;

            currentTitle = title || "Sin titulo";
            currentArtist = artist || "Artista desconocido";

            // Actualizar UI
            songName.textContent = currentTitle;
            artistName.textContent = currentArtist;

            // Manejar imagen
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

            // Limpiar eventos anteriores
            audio.removeEventListener("timeupdate", timeUpdate);
            audio.removeEventListener("loadedmetadata", loadedMetaData);
            range.removeEventListener("input", updateTrackValue);
            
            isPlaying = false;

            // Cargar y reproducir
            let url = URL.createObjectURL(file);
            audio.src = url;
            audio.addEventListener("loadedmetadata", loadedMetaData);
            audio.addEventListener("timeupdate", timeUpdate);
            range.addEventListener("input", updateTrackValue);
            playPause();
        },
        onError: function(error) {
            console.log(error);
        }
    });
}

// Función para GUARDAR canción (sin reproducir)
function loadAndSaveSong() {
    let file = inputFile.files[0]; 
    
    if (!file) return;
    
    currentFile = file;

    jsmediatags.read(file, {
        onSuccess: function(tag) {
            const { title, artist, picture } = tag.tags;

            currentTitle = title || "Sin titulo";
            currentArtist = artist || "Artista desconocido";

            // Manejar imagen
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

            // Crear audio temporal solo para obtener duración
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
                
                // Liberar memoria
                URL.revokeObjectURL(url);
                tempAudio.src = '';
            });
        },
        onError: function(error) {
            console.log(error);
        }
    });
}

// funcion para formatear segundos
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
}

// Click en albumPortrait → REPRODUCIR
albumPortrait.addEventListener("click", () => {
    inputFile.setAttribute("data-action", "play");
    inputFile.value = ""; // RESETEAR INPUT
    inputFile.click();
});

// Click en btn-add → GUARDAR
const btn_add = document.getElementById("btn-add");
btn_add.addEventListener("click", () => {
    inputFile.setAttribute("data-action", "save");
    inputFile.value = ""; // RESETEAR INPUT
    inputFile.click();
});

// Cuando se selecciona un archivo, decidir qué hacer
inputFile.addEventListener("change", () => {
    const action = inputFile.getAttribute("data-action");
    
    if (action === "play") {
        loadAndPlaySong();
    } else if (action === "save") {
        loadAndSaveSong();
    }
    
    // Limpiar atributo después de ejecutar
    inputFile.removeAttribute("data-action");
});

// cambiar icono del boton al cambiar estado de reproduccion
let isPlaying = false;

const btnPlayPause = document.querySelector(".btn-playpause");
const iconPlayPause = document.getElementById("icon-playpause");

function playPause() {
    isPlaying = !isPlaying;

    if (isPlaying) {
        iconPlayPause.src = "assets/pause.png"
        audio.play();
    } else {
        iconPlayPause.src = "assets/play.png"
        audio.pause();
    }
}

btnPlayPause.addEventListener("click", () => {
    playPause();
});

// navgeacion entre secciones
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

navigationButtons[3].click();

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
            <p>${song.duration}</p>
            `;

            song_list.appendChild(songHTML);
        });

        activeItemEvents();
    };
}

function activeItemEvents() {
    const song_items = document.querySelectorAll(".song-item");

    song_items.forEach(song_item => {
        song_item.addEventListener("click", () => {
            const id = Number(song_item.dataset.id);

            const picture_content = song_item.querySelector(".picture-content");
            const song_title = song_item.querySelector(".song-title");

            let isActive = picture_content.classList.contains("active");
            
            song_items.forEach(item => {
                item.querySelector(".picture-content")?.classList.remove("active");
                item.querySelector(".song-title")?.classList.remove("active");
            });

            if (!isActive) {
                picture_content.classList.add("active");
                song_title.classList.add("active");
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