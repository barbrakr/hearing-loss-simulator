import {
    applyHearingLoss
} from "./processor.js";

const processButton =
document.getElementById(
"processButton"
);

let processedBuffer = null;


processButton.onclick = async ()=>{


status.innerHTML =
"Processing hearing loss...";


processedBuffer =
await applyHearingLoss(
    engine.buffer,
    engine.context
);


engine.buffer =
processedBuffer;

await engine.context.resume();


status.innerHTML =
"Hearing loss applied";


};

import {
    createAudiogram,
    getLeftLoss,
    getRightLoss
} from "./audiogram.js";


import { AudioEngine } from "./audio.js";

console.log("app.js loaded");

const engine = new AudioEngine();

createAudiogram();

const loadButton = document.getElementById("loadButton");
const playButton = document.getElementById("playButton");
const stopButton = document.getElementById("stopButton");
const status = document.getElementById("status");

loadButton.onclick = async () => {

    let buffer;

    const source = document.querySelector(
        'input[name="source"]:checked'
    ).value;

    if(source === "sample"){

        const filename =
            document.getElementById("sampleSelect").value;

        buffer =
            await engine.loadFromURL(filename);

    } else {

        const file =
            document.getElementById("audioFile").files[0];

        if(!file){

            alert("Choose a WAV file.");

            return;
        }

        buffer =
            await engine.loadFromFile(file);
    }

    status.innerHTML = `
Loaded successfully.<br>
Channels: ${buffer.numberOfChannels}<br>
Sample Rate: ${buffer.sampleRate} Hz<br>
Samples: ${buffer.length}
`;

    playButton.disabled = false;
    stopButton.disabled = false;

    console.log(engine.getLeft());
    console.log(engine.getRight());

};

playButton.onclick = () => {
    engine.play();
};

stopButton.onclick = () => {
    engine.stop();
};

