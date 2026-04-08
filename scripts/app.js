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

let isPlaying = false;

const btnPlayPause = document.querySelector(".btn-playpause");
const iconPlayPause = document.getElementById("icon-playpause");

function PlayPause() {
    
    isPlaying = !isPlaying;

    if (isPlaying) {
        
        iconPlayPause.src = "assets/pause.png"

    } else {

        iconPlayPause.src = "assets/play.png"
    }

}

btnPlayPause.addEventListener("click", function() {
    PlayPause();
});