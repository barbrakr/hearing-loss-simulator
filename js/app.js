import {
    createNoiseBuffer
} from "./noise.js";

import {
    mixBuffers
} from "./mixer.js";


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

let originalCanvas = null;
let lossCanvas = null;

const noiseButton =
    document.getElementById(
        "noiseButton"
    );


noiseButton.onclick = ()=>{
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
        createNoiseBuffer(
            engine.context,
            type,
            engine.buffer.duration,
            engine.buffer.sampleRate
        );


    engine.buffer =
        mixBuffers(
            engine.buffer,
            noise,
            0.15
        );

        drawSpectrogram(
        engine.buffer,
        originalCanvas,
        "NOISY"
    );


    status.innerHTML =
        "Background noise added";

};

window.addEventListener(
"DOMContentLoaded",
()=>{

    createAudiogram();


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


        const result =
            applyHearingLoss(
                originalBuffer,
                engine.context
            );


        const original =
            originalBuffer.getChannelData(0);
        
        const processed =
            result.getChannelData(0);
        
        
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
            result.getChannelData(0)[10000]
        );     

        engine.buffer = result;

        
        drawSpectrogram(
            result,
            document.getElementById(
                "lossSpectrogram"
            ),
            "LOSS"
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
