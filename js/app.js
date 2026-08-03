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


createAudiogram();


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

        let buffer;

        const source =
            document.querySelector(
                'input[name="source"]:checked'
            ).value;


        if(source === "sample"){

            const filename =
                document.getElementById(
                    "sampleSelect"
                ).value;


            buffer =
                await engine.loadFromURL(
                    filename
                );

        }
        else {

            const file =
                document.getElementById(
                    "audioFile"
                ).files[0];


            if(!file){

                alert(
                    "Choose a WAV file."
                );

                return;

            }


            buffer =
                await engine.loadFromFile(
                    file
                );

        }


        status.innerHTML =
        `
        Loaded successfully.<br>
        Channels: ${buffer.numberOfChannels}<br>
        Sample Rate: ${buffer.sampleRate} Hz<br>
        Samples: ${buffer.length}
        `;


        playButton.disabled=false;
        stopButton.disabled=false;


    }
    catch(e){

        console.error(e);

        status.innerHTML =
        e.message;

    }

};





processButton.onclick = async ()=>{

    try {

        status.innerHTML =
        "Processing hearing loss...";


        const result =
            await applyHearingLoss(
                engine.buffer
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
