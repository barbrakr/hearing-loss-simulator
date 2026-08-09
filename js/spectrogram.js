import { fft } from "./dsp.js";


/*
==========================================================
SPECTROGRAM CALIBRATION
==========================================================

These values define the relationship between digital
amplitude and acoustic dB SPL.

IMPORTANT:
A WAV file does not inherently contain absolute SPL.

These are calibration parameters and should eventually
be replaced by values obtained from a calibrated reference
recording/tone.

For now:

    amplitude 0.1 = 70 dB SPL
*/

const referenceAmplitude = 0.1;
const referenceSPL = 70;


/*
==========================================================
DISPLAY RANGE
==========================================================
*/

const minSPL = 20;
const maxSPL = 100;

const maxFrequency = 10000;


/*
==========================================================
DIGITAL AMPLITUDE -> dB SPL
==========================================================
*/

function amplitudeToSPL(amplitude) {

    amplitude =
        Math.max(
            amplitude,
            1e-10
        );


    const digitalDifference =
        20 *
        Math.log10(
            amplitude /
            referenceAmplitude
        );


    return (
        referenceSPL +
        digitalDifference
    );

}


/*
==========================================================
SHARED COLOUR MAP
==========================================================
*/

function getColour(value) {

    const t =
        Math.max(
            0,
            Math.min(
                1,
                value
            )
        );


    let r;
    let g;
    let b;


    /*
    black -> blue
    */

    if(t < 0.25){

        const p =
            t / 0.25;

        r = 0;
        g = 0;
        b =
            Math.round(
                255 * p
            );

    }


    /*
    blue -> cyan
    */

    else if(t < 0.50){

        const p =
            (t - 0.25) /
            0.25;

        r = 0;

        g =
            Math.round(
                255 * p
            );

        b = 255;

    }


    /*
    cyan -> yellow
    */

    else if(t < 0.75){

        const p =
            (t - 0.50) /
            0.25;

        r =
            Math.round(
                255 * p
            );

        g = 255;

        b =
            Math.round(
                255 * (1 - p)
            );

    }


    /*
    yellow -> red
    */

    else {

        const p =
            (t - 0.75) /
            0.25;

        r = 255;

        g =
            Math.round(
                255 * (1 - p)
            );

        b = 0;

    }


    return {
        r,
        g,
        b
    };

}


/*
==========================================================
DRAW COLOUR BAR
==========================================================
*/

function drawColourBar(
    ctx,
    barX,
    rows
) {

    const barWidth = 20;


    const gradient =
        ctx.createLinearGradient(
            0,
            rows,
            0,
            0
        );


    gradient.addColorStop(
        0.0,
        "black"
    );

    gradient.addColorStop(
        0.25,
        "blue"
    );

    gradient.addColorStop(
        0.50,
        "cyan"
    );

    gradient.addColorStop(
        0.75,
        "yellow"
    );

    gradient.addColorStop(
        1.0,
        "red"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        barX,
        0,
        barWidth,
        rows
    );


    /*
    SPL labels
    */

    ctx.fillStyle =
        "black";

    ctx.font =
        "12px Arial";

    ctx.textAlign =
        "left";


    const splSteps = 8;


    for(
        let i = 0;
        i <= splSteps;
        i++
    ){

        const spl =
            maxSPL -
            (
                i /
                splSteps
            )
            *
            (
                maxSPL -
                minSPL
            );


        const y =
            (
                i /
                splSteps
            )
            *
            rows;


        ctx.fillText(
            Math.round(spl) +
            " dB SPL",
            barX + 25,
            y + 4
        );

    }

}


/*
==========================================================
DRAW AXES
==========================================================
*/

function drawAxes(
    ctx,
    audioBuffer,
    leftMargin,
    columns,
    rows
) {

    ctx.fillStyle =
        "black";

    ctx.font =
        "12px Arial";

    ctx.textAlign =
        "left";


    /*
    ------------------------------------------------------
    TIME AXIS
    ------------------------------------------------------
    */

    const duration =
        audioBuffer.duration;


    const timeSteps = 10;


    for(
        let i = 0;
        i <= timeSteps;
        i++
    ){

        const x =
            leftMargin +
            (
                i /
                timeSteps
            )
            *
            columns;


        const time =
            duration *
            i /
            timeSteps;


        ctx.fillText(
            time.toFixed(1) +
            " s",
            x - 10,
            rows + 25
        );

    }


    /*
    ------------------------------------------------------
    FREQUENCY AXIS
    ------------------------------------------------------
    */

    for(
        let frequency = 0;
        frequency <= maxFrequency;
        frequency += 2000
    ){

        const y =
            rows -
            (
                frequency /
                maxFrequency
            )
            *
            rows;


        ctx.fillText(
            frequency +
            " Hz",
            5,
            y + 4
        );

    }

}


/*
==========================================================
CALCULATE FFT MAGNITUDE
==========================================================
*/

function calculateMagnitude(
    samples,
    offset,
    fftSize,
    window,
    re,
    im,
    bin
) {

    for(
        let i = 0;
        i < fftSize;
        i++
    ){

        re[i] =
            (
                samples[offset + i] ||
                0
            )
            *
            window[i];


        im[i] = 0;

    }


    fft(
        re,
        im
    );


    return (
        Math.sqrt(
            re[bin] * re[bin] +
            im[bin] * im[bin]
        )
        /
        (fftSize / 2)
    );

}


/*
==========================================================
DRAW NORMAL dB SPL SPECTROGRAM
==========================================================
*/

export function drawSpectrogram(
    audioBuffer,
    canvas,
    name = "UNKNOWN"
) {

    if(!audioBuffer || !canvas){

        console.error(
            "drawSpectrogram: missing buffer or canvas"
        );

        return;

    }


    const ctx =
        canvas.getContext("2d");


    const samples =
        audioBuffer.getChannelData(0);


    const sampleRate =
        audioBuffer.sampleRate;


    const fftSize = 2048;

    const hop =
        fftSize / 2;


    const rows =
        Math.floor(
            maxFrequency *
            fftSize /
            sampleRate
        );


    const columns =
        Math.floor(
            (
                samples.length -
                fftSize
            )
            /
            hop
        );


    const leftMargin = 60;

    const bottomMargin = 40;

    const colorBarWidth = 120;


    canvas.width =
        leftMargin +
        columns +
        colorBarWidth;


    canvas.height =
        rows +
        bottomMargin;


    /*
    Image
    */

    const image =
        ctx.createImageData(
            columns,
            rows
        );


    /*
    Hann window
    */

    const window =
        new Float32Array(
            fftSize
        );


    for(
        let i = 0;
        i < fftSize;
        i++
    ){

        window[i] =
            0.5 -
            0.5 *
            Math.cos(
                2 *
                Math.PI *
                i /
                (fftSize - 1)
            );

    }


    const re =
        new Float32Array(
            fftSize
        );

    const im =
        new Float32Array(
            fftSize
        );


    /*
    ------------------------------------------------------
    FFT
    ------------------------------------------------------
    */

    for(
        let x = 0;
        x < columns;
        x++
    ){

        const offset =
            x * hop;


        /*
        Run FFT once for this frame.
        */

        for(
            let i = 0;
            i < fftSize;
            i++
        ){

            re[i] =
                (
                    samples[offset + i] ||
                    0
                )
                *
                window[i];

            im[i] = 0;

        }


        fft(
            re,
            im
        );


        /*
        Frequency bins
        */

        for(
            let y = 0;
            y < rows;
            y++
        ){

            const magnitude =
                Math.sqrt(
                    re[y] * re[y] +
                    im[y] * im[y]
                )
                /
                (fftSize / 2);


            const spl =
                amplitudeToSPL(
                    magnitude
                );


            let value =
                (
                    spl - minSPL
                )
                /
                (
                    maxSPL -
                    minSPL
                );


            value =
                Math.max(
                    0,
                    Math.min(
                        1,
                        value
                    )
                );


            const colour =
                getColour(
                    value
                );


            const pixel =
                (
                    (
                        rows -
                        1 -
                        y
                    )
                    *
                    columns +
                    x
                )
                *
                4;


            image.data[pixel] =
                colour.r;

            image.data[pixel + 1] =
                colour.g;

            image.data[pixel + 2] =
                colour.b;

            image.data[pixel + 3] =
                255;

        }

    }


    /*
    Draw image
    */

    ctx.putImageData(
        image,
        leftMargin,
        0
    );


    /*
    Colour bar
    */

    const barX =
        leftMargin +
        columns +
        25;


    drawColourBar(
        ctx,
        barX,
        rows
    );


    /*
    Axes
    */

    drawAxes(
        ctx,
        audioBuffer,
        leftMargin,
        columns,
        rows
    );


    console.log(
        name,
        columns,
        "frames",
        rows,
        "frequency bins",
        "max Hz:",
        maxFrequency,
        "dB SPL range:",
        minSPL,
        "-",
        maxSPL
    );

}


/*
==========================================================
DRAW DIFFERENCE SPECTROGRAM
==========================================================

This shows:

    ORIGINAL acoustic signal
              -
    HEARING-LOSS signal

The colour represents how much acoustic energy has
been removed by the hearing-loss processing.

This is NOT an SPL display.

It is an attenuation/information-loss display.

----------------------------------------------------------

0 dB   = essentially unchanged
10 dB  = 10 dB reduction
20 dB  = 20 dB reduction
30 dB  = 30 dB reduction
40 dB+ = very substantial reduction

==========================================================
*/

export function drawDifferenceSpectrogram(
    originalBuffer,
    processedBuffer,
    canvas
) {

    if(
        !originalBuffer ||
        !processedBuffer ||
        !canvas
    ){

        console.error(
            "drawDifferenceSpectrogram: missing buffer or canvas"
        );

        return;

    }


    const ctx =
        canvas.getContext("2d");


    const original =
        originalBuffer.getChannelData(0);


    const processed =
        processedBuffer.getChannelData(0);


    const sampleRate =
        originalBuffer.sampleRate;


    const fftSize = 2048;

    const hop =
        fftSize / 2;


    const rows =
        Math.floor(
            maxFrequency *
            fftSize /
            sampleRate
        );


    const columns =
        Math.floor(
            (
                Math.min(
                    original.length,
                    processed.length
                )
                -
                fftSize
            )
            /
            hop
        );


    const leftMargin = 60;

    const bottomMargin = 40;

    const colorBarWidth = 120;


    canvas.width =
        leftMargin +
        columns +
        colorBarWidth;


    canvas.height =
        rows +
        bottomMargin;


    const image =
        ctx.createImageData(
            columns,
            rows
        );


    /*
    Hann window
    */

    const window =
        new Float32Array(
            fftSize
        );


    for(
        let i = 0;
        i < fftSize;
        i++
    ){

        window[i] =
            0.5 -
            0.5 *
            Math.cos(
                2 *
                Math.PI *
                i /
                (fftSize - 1)
            );

    }


    const originalRe =
        new Float32Array(
            fftSize
        );

    const originalIm =
        new Float32Array(
            fftSize
        );


    const processedRe =
        new Float32Array(
            fftSize
        );

    const processedIm =
        new Float32Array(
            fftSize
        );


    /*
    ------------------------------------------------------
    Difference scale
    ------------------------------------------------------

    The difference spectrogram is attenuation in dB.

    0 dB = no loss
    40 dB = very large loss
    ------------------------------------------------------
    */

    const minDifference = 0;

    const maxDifference = 40;


    /*
    ------------------------------------------------------
    Calculate difference
    ------------------------------------------------------
    */

    for(
        let x = 0;
        x < columns;
        x++
    ){

        const offset =
            x * hop;


        /*
        ----------------------------------------------
        ORIGINAL FFT
        ----------------------------------------------
        */

        for(
            let i = 0;
            i < fftSize;
            i++
        ){

            originalRe[i] =
                (
                    original[offset + i] ||
                    0
                )
                *
                window[i];

            originalIm[i] = 0;

        }


        fft(
            originalRe,
            originalIm
        );


        /*
        ----------------------------------------------
        PROCESSED FFT
        ----------------------------------------------
        */

        for(
            let i = 0;
            i < fftSize;
            i++
        ){

            processedRe[i] =
                (
                    processed[offset + i] ||
                    0
                )
                *
                window[i];

            processedIm[i] = 0;

        }


        fft(
            processedRe,
            processedIm
        );


        /*
        ----------------------------------------------
        Frequency bins
        ----------------------------------------------
        */

        for(
            let y = 0;
            y < rows;
            y++
        ){

            const originalMagnitude =
                Math.sqrt(
                    originalRe[y] *
                    originalRe[y] +
                    originalIm[y] *
                    originalIm[y]
                )
                /
                (fftSize / 2);


            const processedMagnitude =
                Math.sqrt(
                    processedRe[y] *
                    processedRe[y] +
                    processedIm[y] *
                    processedIm[y]
                )
                /
                (fftSize / 2);


            /*
            Avoid division by zero.
            */

            const safeOriginal =
                Math.max(
                    originalMagnitude,
                    1e-10
                );


            const safeProcessed =
                Math.max(
                    processedMagnitude,
                    1e-10
                );


            /*
            ------------------------------------------
            Attenuation

            Positive number means signal was reduced.

            Example:

            original = -40 dB
            processed = -60 dB

            difference = 20 dB
            ------------------------------------------
            */

            let difference =
                20 *
                Math.log10(
                    safeOriginal /
                    safeProcessed
                );


            /*
            Hearing-loss processing should normally
            produce positive attenuation.

            If processing happens to increase a bin,
            display it as zero loss.
            */

            difference =
                Math.max(
                    0,
                    difference
                );


            /*
            Map 0–40 dB to colour.
            */

            let value =
                (
                    difference -
                    minDifference
                )
                /
                (
                    maxDifference -
                    minDifference
                );


            value =
                Math.max(
                    0,
                    Math.min(
                        1,
                        value
                    )
                );


            /*
            Colour
            */

            const colour =
                getColour(
                    value
                );


            const pixel =
                (
                    (
                        rows -
                        1 -
                        y
                    )
                    *
                    columns +
                    x
                )
                *
                4;


            image.data[pixel] =
                colour.r;

            image.data[pixel + 1] =
                colour.g;

            image.data[pixel + 2] =
                colour.b;

            image.data[pixel + 3] =
                255;

        }

    }


    /*
    Draw difference image
    */

    ctx.putImageData(
        image,
        leftMargin,
        0
    );


    /*
    ------------------------------------------------------
    Difference colour bar
    ------------------------------------------------------
    */

    const barX =
        leftMargin +
        columns +
        25;


    const barWidth = 20;


    const gradient =
        ctx.createLinearGradient(
            0,
            rows,
            0,
            0
        );


    gradient.addColorStop(
        0.0,
        "black"
    );

    gradient.addColorStop(
        0.25,
        "blue"
    );

    gradient.addColorStop(
        0.50,
        "cyan"
    );

    gradient.addColorStop(
        0.75,
        "yellow"
    );

    gradient.addColorStop(
        1.0,
        "red"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        barX,
        0,
        barWidth,
        rows
    );


    /*
    Difference labels
    */

    ctx.fillStyle =
        "black";

    ctx.font =
        "12px Arial";


    const differenceSteps = 8;


    for(
        let i = 0;
        i <= differenceSteps;
        i++
    ){

        const difference =
            maxDifference -
            (
                i /
                differenceSteps
            )
            *
            maxDifference;


        const y =
            (
                i /
                differenceSteps
            )
            *
            rows;


        ctx.fillText(
            Math.round(difference) +
            " dB loss",
            barX + 25,
            y + 4
        );

    }


    /*
    Axes
    */

    drawAxes(
        ctx,
        originalBuffer,
        leftMargin,
        columns,
        rows
    );


    console.log(
        "Difference spectrogram drawn."
    );

}
