import {
    createNoiseBuffer
} from "./noise.js";

import {
    mixBuffers
} from "./mixer.js";

import {
    drawSpectrogram,
    drawDifferenceSpectrogram
} from "./spectrogram.js";

import {
    applyHearingLoss
} from "./processor.js";


import {
    createAudiogram,
    getLeftLoss,
    getRightLoss,
    frequencies
} from "./audiogram.js";

import { createSpeechUI } from "./speech.js";
import { AudioEngine } from "./audio.js";


console.log("app.js loaded");


const engine =
    new AudioEngine();

let originalBuffer = null;   // clean audio
let workingBuffer = null;    // clean + optional noise
let processedBuffer = null;  // hearing-loss result

let originalCanvas = null;
let lossCanvas = null;

const noiseButton =
    document.getElementById(
        "noiseButton"
    );


noiseButton.onclick = async () =>{
    if(!engine.buffer){
    
        status.innerHTML =
            "Load audio first.";
    
        return;
    
    }

    const type =
        document.getElementById(
            "noiseSelect"
        ).value;



    
    const noise =
        await createNoiseBuffer(
            engine.context,
            type,
            engine.buffer.duration,
            engine.buffer.sampleRate
        );
    
    console.log(noise);
    console.log(noise instanceof AudioBuffer);

        workingBuffer =
            mixBuffers(
                workingBuffer,
                noise,
                0.15
            );
        
        engine.buffer = workingBuffer;

        drawSpectrogram(
            workingBuffer,
            originalCanvas,
            "CURRENT"
        );


    status.innerHTML =
        "Background noise added";

};

window.addEventListener(
"DOMContentLoaded",
()=>{

    createAudiogram();
   
    createSpeechUI({
        getAudioBuffer: () => workingBuffer,
        getAudiogram: () => ({
            left: getLeftLoss(),
            right: getRightLoss(),
            frequencies
        })
    });

    originalCanvas =
        document.getElementById(
            "originalSpectrogram"
        );


    lossCanvas =
        document.getElementById(
            "lossSpectrogram"
        );


    console.log(
        "Canvas:",
        originalCanvas,
        lossCanvas
    );

});


const loadButton =
    document.getElementById("loadButton");

const playButton =
    document.getElementById("playButton");

const stopButton =
    document.getElementById("stopButton");

const processButton =
    document.getElementById("processButton");

const status =
    document.getElementById("status");




const progressFill =
    document.getElementById("progress-fill");

const playbackTime =
    document.getElementById("playback-time");

let progressFrame = null;

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function updateProgress() {
    if (!engine.source || !engine.buffer) {
        progressFill.style.width = "0%";
        playbackTime.textContent =
            `0:00 / ${formatTime(engine.buffer?.duration || 0)}`;
        progressFrame = null;
        return;
    }

    const duration = engine.buffer.duration;
    const elapsed = Math.min(
        engine.context.currentTime - engine.playbackStartTime,
        duration
    );

    const percentage = duration > 0
        ? (elapsed / duration) * 100
        : 0;

    progressFill.style.width = `${percentage}%`;
    playbackTime.textContent =
        `${formatTime(elapsed)} / ${formatTime(duration)}`;

    progressFrame = requestAnimationFrame(updateProgress);
}

function startProgress() {
    if (progressFrame !== null) {
        cancelAnimationFrame(progressFrame);
    }

    updateProgress();
}

function resetProgress() {
    if (progressFrame !== null) {
        cancelAnimationFrame(progressFrame);
        progressFrame = null;
    }

    progressFill.style.width = "0%";
    playbackTime.textContent =
        `0:00 / ${formatTime(engine.buffer?.duration || 0)}`;
}


function updateSpectrogramCursors(progress) {

    const canvasIds = [
        ["spectrogram-original", "cursor-original"],
        ["spectrogram-processed", "cursor-processed"],
        ["spectrogram-difference", "cursor-difference"]
    ];

    canvasIds.forEach(([canvasId, cursorId]) => {

        const canvas = document.getElementById(canvasId);
        const cursor = document.getElementById(cursorId);

        if (!canvas || !cursor) return;

        const leftMargin =
            Number(canvas.dataset.leftMargin || 60);

        const columns =
            Number(canvas.dataset.columns || 0);

        if (!columns) return;

        /*
         * Canvas is scaled by CSS, so calculate the
         * displayed scale factor.
         */
        const displayedWidth =
            canvas.getBoundingClientRect().width;

        const scale =
            displayedWidth / canvas.width;

        /*
         * Position within the actual spectrogram image.
         */
        const x =
            (leftMargin + progress * columns) * scale;

        cursor.style.left = `${x}px`;
    });
}


loadButton.onclick = async () => {

    try {

        status.innerHTML =
        "Loading audio...";


        const source =
            document.querySelector(
                'input[name="source"]:checked'
            ).value;


        let loadedBuffer = null;


        if(source === "sample"){


            const filename =
                document.getElementById(
                    "sampleSelect"
                ).value;


            console.log(
                "Loading:",
                filename
            );


            loadedBuffer =
                await engine.loadFromURL(
                    filename
                );


        } else {


            const file =
                document.getElementById(
                    "audioFile"
                ).files[0];


            if(!file){

                status.innerHTML =
                "Choose a WAV file.";

                return;

            }


            loadedBuffer =
                await engine.loadFromFile(
                    file
                );

        }


        console.log(
            "Loaded:",
            loadedBuffer
        );


        originalBuffer = loadedBuffer;
        workingBuffer = loadedBuffer;
        processedBuffer = null;
        engine.buffer = workingBuffer;


        status.innerHTML =
        `
        Audio loaded.<br>
        Channels:
        ${loadedBuffer.numberOfChannels}<br>

        Sample rate:
        ${loadedBuffer.sampleRate} Hz<br>

        Samples:
        ${loadedBuffer.length}
        `;

        
        drawSpectrogram(
            engine.buffer,
            originalCanvas,
            "CURRENT"
        );


        playButton.disabled=false;
        stopButton.disabled=false;
        processButton.disabled=false;


    }
    catch(error){

        console.error(error);

        status.innerHTML =
        "Load error: " + error.message;

    }

};





processButton.onclick = async ()=>{

    try {

        if(!originalBuffer){

            status.innerHTML =
            "No audio loaded.";

            return;

        }


        status.innerHTML =
        "Processing hearing loss...";

                console.log(
            "Before loss:",
            engine.buffer.getChannelData(0)[10000]
        );

        processedBuffer =
            applyHearingLoss(
                workingBuffer,
                engine.context
            );


        const original =
            originalBuffer.getChannelData(0);
        
        const processed =
            processedBuffer.getChannelData(0);
        
        
        let difference = 0;
        
        for(let i=0;i<original.length;i++){
        
            difference +=
                Math.abs(
                    original[i]-processed[i]
                );
        
        }
        
        
        console.log(
            "Total difference:",
            difference
        );

        
                console.log(
            "Original sample:",
            originalBuffer.getChannelData(0)[10000]
        );
        
        console.log(
            "Processed sample:",
            processedBuffer.getChannelData(0)[10000]
        );     

        engine.buffer = processedBuffer;
        
        drawSpectrogram(
            processedBuffer,
            lossCanvas,
            "LOSS"
        );


        status.innerHTML =
        "Hearing loss applied";


                drawDifferenceSpectrogram(
            originalBuffer,
            engine.buffer,
            document.getElementById("differenceSpectrogram")
        );
        
        console.log(
            "After loss:",
            processedBuffer.getChannelData(0)[10000]
        );


    }
    catch(e){

        console.error(e);

        status.innerHTML =
        "Error: " + e.message;

    }

};





playButton.onclick = () => {
    engine.play();
    startProgress();
};

stopButton.onclick = () => {
    engine.stop();
    resetProgress();
};

