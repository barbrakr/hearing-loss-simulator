import {
    frequencies,
    getLeftLoss,
    getRightLoss
} from "./audiogram.js";


export function applyHearingLoss(audioBuffer){


    const sampleRate =
        audioBuffer.sampleRate;


    const length =
        audioBuffer.length;


    const channels =
        audioBuffer.numberOfChannels;


    const output =
        new AudioBuffer({

            length:length,

            numberOfChannels:2,

            sampleRate:sampleRate

        });



    const left =
        audioBuffer.getChannelData(0);


    const right =
        channels > 1
        ? audioBuffer.getChannelData(1)
        : left;



    output.copyToChannel(
        processChannel(
            left,
            sampleRate,
            getLeftLoss()
        ),
        0
    );



    output.copyToChannel(
        processChannel(
            right,
            sampleRate,
            getRightLoss()
        ),
        1
    );


    return output;

}




function processChannel(
    input,
    sampleRate,
    loss
){


    const n =
        input.length;


    const output =
        new Float32Array(n);



    const fftSize = 2048;

    const hop = 1024;



    const fft =
        new FFT(fftSize);



    const frame =
        new Array(fftSize);



    const spectrum =
        fft.createComplexArray();



    const inverse =
        fft.createComplexArray();



    let window =
        new Float32Array(
            fftSize
        );


    for(let i=0;i<fftSize;i++){

        window[i] =
        0.5 -
        0.5 *
        Math.cos(
            2*Math.PI*i/(fftSize-1)
        );

    }



    for(
        let pos=0;
        pos<n;
        pos+=hop
    ){


        for(
            let i=0;
            i<fftSize;
            i++
        ){

            frame[i] =
            (input[pos+i] || 0)
            *
            window[i];

        }



        fft.realTransform(
            spectrum,
            frame
        );


        fft.completeSpectrum(
            spectrum
        );



        for(
            let bin=0;
            bin<fftSize;
            bin++
        ){


            const freq =
            bin *
            sampleRate /
            fftSize;



            const db =
            interpolateLoss(
                freq,
                loss
            );


            const simulationFactor = 0.5;
            
            const gain =
            Math.pow(
                10,
                (-db * simulationFactor) / 20
            );



            spectrum[2*bin] *= gain;

            spectrum[2*bin+1] *= gain;


        }



        fft.inverseTransform(
            inverse,
            spectrum
        );



        for(
            let i=0;
            i<fftSize;
            i++
        ){

            if(pos+i<n){

                output[pos+i] +=
                inverse[2*i]
                *
                window[i]
                /
                fftSize;

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
            (
                freq -
                frequencies[i]
            )
            /
            (
                frequencies[i+1] -
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
