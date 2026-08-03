import {
    frequencies,
    getLeftLoss,
    getRightLoss
} from "./audiogram.js";

import {
    fft,
    ifft
} from "./dsp.js";


export function applyHearingLoss(buffer){


    const left =
        buffer.getChannelData(0);


    const right =
        buffer.numberOfChannels > 1
        ? buffer.getChannelData(1)
        : left;


    const result =
        new AudioBuffer({

            length: buffer.length,

            numberOfChannels:2,

            sampleRate:buffer.sampleRate

        });


    result.copyToChannel(
        processChannel(
            left,
            buffer.sampleRate,
            getLeftLoss()
        ),
        0
    );


    result.copyToChannel(
        processChannel(
            right,
            buffer.sampleRate,
            getRightLoss()
        ),
        1
    );


    return result;

}



function processChannel(
    input,
    sampleRate,
    loss
){

    const size = 2048;

    const output =
        new Float32Array(
            input.length
        );


    const re =
        new Float32Array(size);

    const im =
        new Float32Array(size);


    for(
        let pos=0;
        pos<input.length;
        pos+=size
    ){

        for(
            let i=0;
            i<size;
            i++
        ){

            re[i] =
            input[pos+i] || 0;

            im[i]=0;

        }


        fft(re,im);


        for(
            let i=0;
            i<size;
            i++
        ){

            const freq =
            i *
            sampleRate /
            size;


            const db =
            interpolateLoss(
                freq,
                loss
            );


            const gain =
            Math.pow(
                10,
                -db/40
            );


            re[i]*=gain;
            im[i]*=gain;

        }


        ifft(re,im);



        for(
            let i=0;
            i<size;
            i++
        ){

            if(pos+i < output.length){

                output[pos+i] +=
                re[i];

            }

        }

    }


    return output;

}



function interpolateLoss(
    freq,
    loss
){

    if(freq <= frequencies[0])
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


            return loss[i]
            +
            t *
            (
            loss[i+1]-loss[i]
            );

        }

    }


    return loss[loss.length-1];

}
