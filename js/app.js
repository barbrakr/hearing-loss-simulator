import {
    createSpectrogram
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
        
        status.innerHTML = "Loading audio...";

                const canvas =
        document.getElementById(
        "spectrogram"
        );
        
        
        createSpectrogram(
            buffer,
            canvas
        );


        const source =
            document.querySelector(
                'input[name="source"]:checked'
            ).value;


        let buffer;


        if(source === "sample"){

            const filename =
                document.getElementById(
                    "sampleSelect"
                ).value;


            console.log(
                "Loading sample:",
                filename
            );


            buffer =
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


            buffer =
                await engine.loadFromFile(
                    file
                );

        }


        console.log(
            "Loaded buffer:",
            buffer
        );
        originalBuffer = buffer;

        status.innerHTML =
        `
        Audio loaded.<br>
        Channels: ${buffer.numberOfChannels}<br>
        Sample rate: ${buffer.sampleRate}<br>
        Length: ${buffer.length}
        `;


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


        if(!engine.buffer){

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


        engine.buffer =
            result;


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
