import {
    drawSpectrogram
} from "./spectrogram.js";

import {
    applyHearingLoss
} from "./processor.js";


import {
    createAudiogram,
    getLeftLoss,
    getRightLoss
} from "./audiogram.js";


import { AudioEngine } from "./audio.js";


console.log("app.js loaded");


const engine =
    new AudioEngine();

let originalBuffer = null;

window.addEventListener(
"DOMContentLoaded",
()=>{

    createAudiogram();

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


        originalBuffer =
            loadedBuffer;


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
            loadedBuffer,
            document.getElementById(
                "originalSpectrogram"
            )
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


        const result =
            applyHearingLoss(
                originalBuffer,
                engine.context
            );


                console.log(
            "Original sample:",
            originalBuffer.getChannelData(0)[10000]
        );
        
        console.log(
            "Processed sample:",
            result.getChannelData(0)[10000]
        );     

        engine.buffer = result;


        drawSpectrogram(
            result,
            document.getElementById(
                "lossSpectrogram"
            )
        );


        status.innerHTML =
        "Hearing loss applied";


    }
    catch(e){

        console.error(e);

        status.innerHTML =
        "Error: " + e.message;

    }

};



playButton.onclick = ()=>{

    engine.play();

};


stopButton.onclick = ()=>{

    engine.stop();

};
