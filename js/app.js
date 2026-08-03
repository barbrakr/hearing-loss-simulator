import {AudioEngine}
from "./audio.js";


const engine =
new AudioEngine();


const loadButton =
document.getElementById(
"loadButton"
);

const playButton =
document.getElementById(
"playButton"
);

const stopButton =
document.getElementById(
"stopButton"
);

const status =
document.getElementById(
"status"
);


loadButton.onclick =
async ()=>{

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


const buffer =
await engine.load(file);


status.innerHTML =

`
Loaded successfully.<br>

Channels:
${buffer.numberOfChannels}

<br>

Sample rate:
${buffer.sampleRate}

Hz

<br>

Samples:
${buffer.length}

`;


console.log(
engine.getLeft()
);

console.log(
engine.getRight()
);


playButton.disabled=false;

stopButton.disabled=false;

};


playButton.onclick=()=>{

engine.play();

};


stopButton.onclick=()=>{

engine.stop();

};
