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


    const result =
        new AudioBuffer({

            length: buffer.length,

            numberOfChannels: 2,

            sampleRate: buffer.sampleRate

        });


    const left =
        buffer.getChannelData(0);


    const right =
        buffer.numberOfChannels > 1
        ? buffer.getChannelData(1)
        : left;



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

    const hop = size / 2;


    const output =
        new Float32Array(
            input.length
        );
    
    const windowSum =
        new Float32Array(
            input.length
        );


    const window =
        new Float32Array(size);


    for(let i=0;i<size;i++){

        window[i] =
            0.5 -
            0.5 *
            Math.cos(
                2*Math.PI*i/(size-1)
            );

    }



    const re =
        new Float32Array(size);

    const im =
        new Float32Array(size);



    for(
        let pos=0;
        pos<input.length;
        pos+=hop
    ){


        for(let i=0;i<size;i++){

            re[i] =
                (input[pos+i] || 0)
                *
                window[i];

            im[i]=0;

        }



        fft(re,im);



        /*
          Apply audiogram only
          to positive frequencies
        */

        for(
            let i=0;
            i<size/2;
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


            /*
              Simulation calibration

              0.25 = mild
              0.5  = moderate
              1.0  = full audiogram
            */

            const simulationStrength = 0.5;


            const gain =
                Math.pow(
                    10,
                    -(db * simulationStrength)/20
                );


            re[i] *= gain;
            im[i] *= gain;


            // mirror frequency
            const mirror =
                size-i;

            re[mirror] *= gain;
            im[mirror] *= gain;

        }



        ifft(re,im);



        for(let i=0;i<size;i++){

            if(pos+i < output.length){

            output[pos+i] +=
                re[i] *
                window[i];
            
            windowSum[pos+i] +=
                window[i] * window[i];

            }

        }

    }


    /*
       Only prevent clipping.
       Do NOT normalize.
    */

    for(let i=0;i<output.length;i++){

        if(output[i] > 1)
            output[i]=1;

        if(output[i] < -1)
            output[i]=-1;

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
                (
                    freq - frequencies[i]
                )
                /
                (
                    frequencies[i+1]
                    -
                    frequencies[i]
                );


            return (
                loss[i]
                +
                t *
                (
                    loss[i+1]
                    -
                    loss[i]
                )
            );

        }

    }


    return loss[loss.length-1];

}
