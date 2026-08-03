const frequencies = [
125,
250,
500,
1000,
1500,
2000,
3000,
4000,
6000,
8000,
10000
];


// hearing loss in dB

let loss = [
10,
11,
15,
28,
34,
34,
32,
31,
29,
18,
13
];



document
.getElementById("run")
.onclick = async function(){


const file =
document.getElementById("audiofile")
.files[0];


if(!file){
alert("Choose a WAV file");
return;
}



const audioContext =
new AudioContext();



const arrayBuffer =
await file.arrayBuffer();



const audioBuffer =
await audioContext.decodeAudioData(
arrayBuffer
);



const source =
audioContext.createBufferSource();


source.buffer =
audioBuffer;



// create hearing loss filters

let filters=[];


for(let i=0;i<frequencies.length;i++){


let filter =
audioContext.createBiquadFilter();


filter.type="peaking";

filter.frequency.value =
frequencies[i];


filter.Q.value =
1;


// attenuation

filter.gain.value =
-loss[i];


filters.push(filter);

}




// connect filters

source.connect(filters[0]);


for(let i=0;i<filters.length-1;i++){

filters[i].connect(
filters[i+1]
);

}



filters[
filters.length-1
].connect(
audioContext.destination
);



source.start();



};
