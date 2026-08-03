alert("JavaScript loaded");


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


let loss = [
10,
11,
15,
35,
55,
53,
56,
44,
28,
18,
13
];



function createAudiogram(){

let html="<table>";

html += "<tr><th>Hz</th><th>Loss dB</th></tr>";


for(let i=0;i<frequencies.length;i++){

html += `
<tr>
<td>${frequencies[i]}</td>

<td>
<input 
class="loss"
type="number"
value="${loss[i]}">
</td>

</tr>
`;

}


html+="</table>";

document.getElementById(
"audiogram"
).innerHTML=html;

}


createAudiogram();



function getLoss(){

return [...document.querySelectorAll(".loss")]
.map(x=>Number(x.value));

}




document.getElementById("run")
.onclick = async ()=>{


let file =
document.getElementById("audiofile")
.files[0];


if(!file){

alert("Choose WAV file");

return;

}



let context =
new AudioContext();



let data =
await file.arrayBuffer();



let buffer =
await context.decodeAudioData(data);



let source =
context.createBufferSource();


source.buffer=buffer;



let losses=getLoss();


let previous=source;



for(let i=0;i<frequencies.length;i++){


let filter =
context.createBiquadFilter();


filter.type="peaking";


filter.frequency.value =
frequencies[i];


filter.Q.value=1;


// simulate hearing loss

filter.gain.value =
-losses[i];


previous.connect(filter);


previous=filter;


}



let analyser =
context.createAnalyser();


analyser.fftSize=2048;


previous.connect(analyser);


analyser.connect(
context.destination
);



drawSpectrogram(
analyser
);



source.start();


};





function drawSpectrogram(analyser){


let canvas =
document.getElementById(
"spectrogram"
);


let ctx =
canvas.getContext("2d");


canvas.width=800;
canvas.height=300;


let data =
new Uint8Array(
analyser.frequencyBinCount
);



function draw(){


requestAnimationFrame(draw);


analyser.getByteFrequencyData(data);



ctx.drawImage(
canvas,
-1,
0
);



for(let y=0;y<canvas.height;y++){


let index =
Math.floor(
y/data.length*data.length
);


let value=data[index];


ctx.fillStyle =
`rgb(${value},${value/2},0)`;


ctx.fillRect(
canvas.width-1,
canvas.height-y,
1,
1
);


}

}


draw();


}
