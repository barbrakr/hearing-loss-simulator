import {
    frequencies,
    getLeftLoss,
    getRightLoss
} from "./audiogram.js";


export async function applyHearingLoss(audioBuffer, audioContext){

    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;

    const offline =
        new OfflineAudioContext(
            2,
            length,
            sampleRate
        );


    const outputBuffer =
        offline.createBuffer(
            2,
            length,
            sampleRate
        );


    const left =
        audioBuffer.getChannelData(0);


    const right =
        audioBuffer.numberOfChannels > 1
        ? audioBuffer.getChannelData(1)
        : left;


    const leftProcessed =
        processChannel(
            left,
            sampleRate,
            getLeftLoss()
        );


    const rightProcessed =
        processChannel(
            right,
            sampleRate,
            getRightLoss()
        );


    outputBuffer
        .copyToChannel(
            leftProcessed,
            0
        );


    outputBuffer
        .copyToChannel(
            rightProcessed,
            1
        );


    return outputBuffer;

}



function processChannel(
    audio,
    sampleRate,
    loss
){


    const n = audio.length;


    let real =
        new Float32Array(n);

    let imag =
        new Float32Array(n);



    // forward FFT

    fft(
        audio,
        real,
        imag
    );



    for(
        let i=0;
        i<n/2;
        i++
    ){

        const hz =
            i * sampleRate / n;


        const attenuation =
            interpolateLoss(
                hz,
                loss
            );


        const gain =
            Math.pow(
                10,
                -attenuation / 20
            );


        real[i] *= gain;
        imag[i] *= gain;

        real[n-i-1] *= gain;
        imag[n-i-1] *= gain;

    }



    const output =
        new Float32Array(n);


    ifft(
        real,
        imag,
        output
    );


    return output;

}



function interpolateLoss(freq,loss){

    if(freq < frequencies[0])
        return loss[0];


    for(
        let i=0;
        i<frequencies.length-1;
        i++
    ){

        if(
            freq >= frequencies[i] &&
            freq <= frequencies[i+1]
        ){

            const t =
            (freq-frequencies[i]) /
            (frequencies[i+1]-frequencies[i]);


            return (
                loss[i] +
                t *
                (loss[i+1]-loss[i])
            );

        }

    }


    return loss[loss.length-1];

}
