import {
    frequencies,
    getLeftLoss,
    getRightLoss
} from "./audiogram.js";

import {
    fft,
    ifft
} from "./dsp.js";


export function applyHearingLoss(
    buffer,
    context
){

    const result =
        context.createBuffer(
            2,
            buffer.length,
            buffer.sampleRate
        );


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


    /*
        Hann window
    */

    for(let i = 0; i < size; i++){

        window[i] =
            0.5 -
            0.5 *
            Math.cos(
                2 * Math.PI * i / (size - 1)
            );

    }


    const re =
        new Float32Array(size);

    const im =
        new Float32Array(size);


    /*
        FULL AUDIOGRAM

        1.0 = full hearing-loss audiogram

        This remains 1.0 by default.
    */

    const simulationStrength = 1.0;


    /*
        STFT processing
    */

    for(
        let pos = 0;
        pos < input.length;
        pos += hop
    ){

        /*
            Copy windowed signal
        */

        for(let i = 0; i < size; i++){

            re[i] =
                (input[pos + i] || 0)
                *
                window[i];

            im[i] = 0;

        }


        fft(re, im);


        /*
            Apply audiogram attenuation
            to positive frequencies.
        */

        for(
            let i = 0;
            i < size / 2;
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
                Convert hearing loss in dB
                into linear attenuation.

                Example:

                10 dB  -> 0.316
                20 dB  -> 0.100
                30 dB  -> 0.032
            */

            const gain =
                Math.pow(
                    10,
                    -(db * simulationStrength) / 20
                );


            re[i] *= gain;
            im[i] *= gain;


            /*
                Mirror the positive-frequency
                bin onto the negative-frequency
                bin.
            */

            if(i > 0){

                const mirror =
                    size - i;

                re[mirror] *= gain;
                im[mirror] *= gain;

            }

        }


        /*
            Back to time domain
        */

        ifft(re, im);


        /*
            Overlap-add
        */

        for(let i = 0; i < size; i++){

            if(pos + i < output.length){

                output[pos + i] +=
                    re[i] *
                    window[i];


                windowSum[pos + i] +=
                    window[i] *
                    window[i];

            }

        }

    }


    /*
        Correct overlap-add windowing.
    */

    for(let i = 0; i < output.length; i++){

        if(windowSum[i] > 0){

            output[i] /=
                windowSum[i];

        }

    }


    /*
    =====================================================
        MAKE-UP GAIN
    =====================================================

        The audiogram attenuation is deliberately real.

        However, applying 20–35 dB of attenuation to
        portions of the spectrum can make the entire
        signal subjectively much quieter.

        We therefore restore some overall loudness.

        This does NOT undo the frequency-selective loss.

        It simply raises the remaining signal.
    */


    let inputEnergy = 0;
    let outputEnergy = 0;


    for(let i = 0; i < input.length; i++){

        inputEnergy +=
            input[i] * input[i];


        outputEnergy +=
            output[i] * output[i];

    }


    const inputRms =
        Math.sqrt(
            inputEnergy /
            input.length
        );


    const outputRms =
        Math.sqrt(
            outputEnergy /
            output.length
        );


    let makeupGain = 1;


    if(
        outputRms > 0 &&
        inputRms > 0
    ){

        makeupGain =
            inputRms /
            outputRms;

    }


    /*
        Don't compensate indefinitely.

        A maximum of +12 dB keeps the result
        from becoming unnaturally loud when the
        hearing loss is severe.
    */

    const maximumMakeupGain =
        Math.pow(
            10,
            12 / 20
        );


    makeupGain =
        Math.min(
            makeupGain,
            maximumMakeupGain
        );


    console.log(
        "Input RMS:",
        inputRms
    );

    console.log(
        "Processed RMS:",
        outputRms
    );

    console.log(
        "Make-up gain:",
        makeupGain.toFixed(3),
        "(" +
        (
            20 *
            Math.log10(makeupGain)
        ).toFixed(1) +
        " dB)"
    );


    /*
        Apply make-up gain.
    */

    for(let i = 0; i < output.length; i++){

        output[i] *= makeupGain;

    }


    /*
    =====================================================
        SOFT CLIPPING / PEAK PROTECTION
    =====================================================

        We don't normalize the entire signal.

        We only protect against values exceeding
        the Web Audio range of -1 to +1.
    */

    for(let i = 0; i < output.length; i++){

        if(output[i] > 1){

            output[i] = 1;

        }

        else if(output[i] < -1){

            output[i] = -1;

        }

    }


    return output;
}



function interpolateLoss(
    freq,
    loss
){

    /*
        Below first audiogram frequency
    */

    if(freq <= frequencies[0]){

        return loss[0];

    }


    /*
        Interpolate between audiogram points
    */

    for(
        let i = 0;
        i < frequencies.length - 1;
        i++
    ){

        if(
            freq >= frequencies[i] &&
            freq <= frequencies[i + 1]
        ){

            const t =
                (
                    freq - frequencies[i]
                )
                /
                (
                    frequencies[i + 1]
                    -
                    frequencies[i]
                );


            return (
                loss[i]
                +
                t *
                (
                    loss[i + 1]
                    -
                    loss[i]
                )
            );

        }

    }


    /*
        Above the final audiogram frequency
    */

    return loss[loss.length - 1];

}
