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

function loadedMetaData() {
    
    endTime.textContent = formatTime(audio.duration);
    
}

function updateTrackValue() {
    
    let seconds = (audio.duration * range.value) / 100;
    audio.currentTime = seconds;
    startTime.textContent = formatTime(audio.currentTime);
    updateRange();

}

function loadSong() {

    audio.removeEventListener("timeupdate", timeUpdate);
    audio.removeEventListener("loadedmetadata", loadedMetaData);
    range.removeEventListener("input", updateTrackValue);

    isPlaying = false;

    let file = inputFile.files[0]; 

    jsmediatags.read(file, {
        onSuccess: function(tag) {
            const { title, artist, picture } = tag.tags;
            songName.textContent = title || "Sin titulo";
            artistName.textContent = artist || "Artista desconocido";

            if (picture) {
                let base64String = "";

                for (let i = 0; i < picture.data.length; i++) {
                    base64String += String.fromCharCode(picture.data[i]);
                }

                albumPortrait.src = `data:${picture.format};base64,${btoa(base64String)}`;
            } else {
                albumPortrait.src = "assets/default.jpeg"
            }
        },
        onError: function(error) {
            console.log(error)
        }
    })

    let url = URL.createObjectURL(file);
    audio.src = url

    audio.addEventListener("loadedmetadata", loadedMetaData);

    audio.addEventListener('timeupdate', timeUpdate);

    range.addEventListener("input", updateTrackValue);

    playPause();
}


function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
}

albumPortrait.addEventListener("click", () => {
    inputFile.click();
});

inputFile.addEventListener("change", () => {
    loadSong();
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