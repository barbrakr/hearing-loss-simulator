import { fft } from "./dsp.js";


// ============================================================
// SPECTROGRAM SETTINGS
// ============================================================

const FFT_SIZE = 2048;
const HOP = FFT_SIZE / 2;

const MAX_FREQUENCY = 11000;

// Display range
const MIN_DB_SPL = 0;
const MAX_DB_SPL = 80;

// Reference RMS pressure.
//
// IMPORTANT:
// This is the calibration point between the digital audio
// amplitude and estimated acoustic pressure.
//
// If your existing calibration uses a different reference,
// change this value.
//
// Standard atmospheric reference pressure:
const REFERENCE_PRESSURE = 20e-6;

// ============================================================
// SYNCHRONIZED SPECTROGRAM INTERACTION
// ============================================================

const spectrogramCanvasIds = [
    "originalSpectrogram",
    "lossSpectrogram",
    "differenceSpectrogram"
];

let spectrogramInteractionInitialized = false;


function initializeSpectrogramInteraction() {

    if (spectrogramInteractionInitialized) {
        return;
    }

    const canvases =
        spectrogramCanvasIds
            .map(id =>
                document.getElementById(id)
            )
            .filter(Boolean);

    // Wait until all three canvases exist.
    if (canvases.length !== 3) {
        return;
    }

    spectrogramInteractionInitialized = true;


    canvases.forEach(canvas => {

        const wrapper =
            canvas.parentElement;


        // ----------------------------------------------------
        // Vertical hover line
        // ----------------------------------------------------

        const vertical =
            document.createElement("div");

        vertical.className =
            "spectrogram-hover-vertical";

        wrapper.appendChild(vertical);


        // ----------------------------------------------------
        // Horizontal hover line
        // ----------------------------------------------------

        const horizontal =
            document.createElement("div");

        horizontal.className =
            "spectrogram-hover-horizontal";

        wrapper.appendChild(horizontal);


        // ----------------------------------------------------
        // Mouse interaction
        // ----------------------------------------------------

        canvas.addEventListener(
            "mousemove",
            event => {

                updateSpectrogramInteraction(
                    canvas,
                    event
                );
            }
        );


        canvas.addEventListener(
            "mouseleave",
            () => {

                hideSpectrogramInteraction();
            }
        );
    });
}



function updateSpectrogramInteraction(
    sourceCanvas,
    event
) {

    const data =
        sourceCanvas._spectrogramData;

    if (!data) {
        return;
    }


    const rect =
        sourceCanvas.getBoundingClientRect();


    // Convert mouse position from CSS pixels
    // to actual canvas pixels.

    const canvasX =
        (
            event.clientX -
            rect.left
        )
        *
        (
            sourceCanvas.width /
            rect.width
        );


    const canvasY =
        (
            event.clientY -
            rect.top
        )
        *
        (
            sourceCanvas.height /
            rect.height
        );


    const leftMargin =
        Number(
            sourceCanvas.dataset.leftMargin
        );


    const columns =
        Number(
            sourceCanvas.dataset.columns
        );


    const rows =
        Number(
            data.rows
        );


    // --------------------------------------------------------
    // Ignore the frequency axis
    // --------------------------------------------------------

    if (
        canvasX < leftMargin
    ) {

        hideSpectrogramInteraction();

        return;
    }


    // --------------------------------------------------------
    // Ignore colour bar / right side
    // --------------------------------------------------------

    if (
        canvasX >=
        leftMargin + columns
    ) {

        hideSpectrogramInteraction();

        return;
    }


    // --------------------------------------------------------
    // Ignore bottom time axis
    // --------------------------------------------------------

    if (
        canvasY < 0 ||
        canvasY >= rows
    ) {

        hideSpectrogramInteraction();

        return;
    }


    // --------------------------------------------------------
    // Spectrogram image pixel
    // --------------------------------------------------------

    const imageX =
        Math.floor(
            canvasX - leftMargin
        );


    const imageY =
        Math.floor(
            canvasY
        );


    // --------------------------------------------------------
    // Time
    //
    // Use the centre of the FFT window.
    // --------------------------------------------------------

    const time =
        (
            imageX * HOP +
            FFT_SIZE / 2
        )
        /
        data.sampleRate;


    // --------------------------------------------------------
    // Frequency
    //
    // The image is vertically flipped when drawn:
    //
    // FFT bin 0       -> bottom
    // highest bin     -> top
    // --------------------------------------------------------

    const fftBin =
        rows -
        1 -
        imageY;


    const frequency =
        fftBin *
        data.sampleRate /
        FFT_SIZE;


    if (
        frequency < 0 ||
        frequency > MAX_FREQUENCY
    ) {

        hideSpectrogramInteraction();

        return;
    }


    // --------------------------------------------------------
    // Move all three crosshairs
    // --------------------------------------------------------

    spectrogramCanvasIds.forEach(
        id => {

            const canvas =
                document.getElementById(id);

            if (!canvas) {
                return;
            }


            const canvasData =
                canvas._spectrogramData;

            if (!canvasData) {
                return;
            }


            const wrapper =
                canvas.parentElement;


            const vertical =
                wrapper.querySelector(
                    ".spectrogram-hover-vertical"
                );


            const horizontal =
                wrapper.querySelector(
                    ".spectrogram-hover-horizontal"
                );


            const canvasRect =
                canvas.getBoundingClientRect();


            const wrapperRect =
                wrapper.getBoundingClientRect();


            const scaleX =
                canvasRect.width /
                canvas.width;


            const scaleY =
                canvasRect.height /
                canvas.height;


            const x =
                (
                    leftMargin +
                    imageX
                )
                *
                scaleX
                +
                (
                    canvasRect.left -
                    wrapperRect.left
                );


            const y =
                imageY *
                scaleY
                +
                (
                    canvasRect.top -
                    wrapperRect.top
                );


            vertical.style.left =
                `${x}px`;

            vertical.style.top =
                `${canvasRect.top - wrapperRect.top}px`;

            vertical.style.height =
                `${rows * scaleY}px`;

            vertical.style.display =
                "block";


            horizontal.style.left =
                `${
                    canvasRect.left -
                    wrapperRect.left +
                    leftMargin * scaleX
                }px`;

            horizontal.style.top =
                `${y}px`;

            horizontal.style.width =
                `${columns * scaleX}px`;

            horizontal.style.display =
                "block";
        }
    );


    // --------------------------------------------------------
    // Read the three values
    // --------------------------------------------------------

    const original =
        getSpectrogramValue(
            "originalSpectrogram",
            imageX,
            imageY
        );


    const hearingLoss =
        getSpectrogramValue(
            "lossSpectrogram",
            imageX,
            imageY
        );


    const difference =
        getSpectrogramValue(
            "differenceSpectrogram",
            imageX,
            imageY
        );


    // --------------------------------------------------------
    // Show ONE shared tooltip
    // --------------------------------------------------------

    showSpectrogramTooltip(
        sourceCanvas,
        time,
        frequency,
        original,
        hearingLoss,
        difference
    );
}


function getSpectrogramValue(
    canvasId,
    x,
    y
) {

    const canvas =
        document.getElementById(canvasId);

    if (
        !canvas ||
        !canvas._spectrogramData
    ) {
        return null;
    }


    const data =
        canvas._spectrogramData;


    if (
        x < 0 ||
        x >= data.columns ||
        y < 0 ||
        y >= data.rows
    ) {
        return null;
    }


    return data.values[
        y *
        data.columns +
        x
    ];
}


function showSpectrogramTooltip(
    sourceCanvas,
    time,
    frequency,
    original,
    hearingLoss,
    difference
) {

    const wrapper =
        sourceCanvas.parentElement;


    let tooltip =
        wrapper.querySelector(
            ".spectrogram-hover-tooltip"
        );


    if (!tooltip) {

        tooltip =
            document.createElement("div");

        tooltip.className =
            "spectrogram-hover-tooltip";

        wrapper.appendChild(tooltip);
    }


    tooltip.innerHTML = `
        <strong>
            ${time.toFixed(2)} s
            &nbsp; | &nbsp;
            ${Math.round(frequency)} Hz
        </strong>

        <br>

        Original:
        ${
            original !== null
                ? original.toFixed(1) + " dB SPL"
                : "—"
        }

        <br>

        Hearing Loss:
        ${
            hearingLoss !== null
                ? hearingLoss.toFixed(1) + " dB SPL"
                : "—"
        }

        <br>

        Difference:
        ${
            difference !== null
                ? difference.toFixed(1) + " dB"
                : "—"
        }
    `;


    tooltip.style.display =
        "block";
}


function hideSpectrogramInteraction() {

    document
        .querySelectorAll(
            ".spectrogram-hover-vertical, " +
            ".spectrogram-hover-horizontal, " +
            ".spectrogram-hover-tooltip"
        )
        .forEach(element => {

            element.style.display =
                "none";
        });
}


// ============================================================
// DRAW NORMAL SPECTROGRAM
// ============================================================

export function drawSpectrogram(
    audioBuffer,
    canvas,
    name = "UNKNOWN"
) {

    if (!audioBuffer) {
        console.error(
            "drawSpectrogram: audioBuffer is null"
        );
        return;
    }

    if (!canvas) {
        console.error(
            "drawSpectrogram: canvas is null"
        );
        return;
    }


    const ctx =
        canvas.getContext("2d");


    const samples =
        audioBuffer.getChannelData(0);

    const sampleRate =
        audioBuffer.sampleRate;


    // --------------------------------------------------------
    // Dimensions
    // --------------------------------------------------------

    const rows =
        Math.floor(
            MAX_FREQUENCY *
            FFT_SIZE /
            sampleRate
        );


    const columns =
        Math.max(
            1,
            Math.floor(
                (samples.length - FFT_SIZE) /
                HOP
            )
        );

    canvas.dataset.columns = columns;
    
    const leftMargin = 60;
    const bottomMargin = 40;

    const colorBarWidth = 110;


    canvas.width =
        leftMargin +
        columns +
        colorBarWidth;

    canvas.height =
        rows +
        bottomMargin;

    canvas.dataset.leftMargin = leftMargin;
    canvas.dataset.columns = columns;
    canvas.dataset.colorBarWidth = colorBarWidth;
    
    // --------------------------------------------------------
    // Image
    // --------------------------------------------------------

    const image =
        ctx.createImageData(
            columns,
            rows
        );

    const dbData =
        new Float32Array(
            columns * rows
        );

    // --------------------------------------------------------
    // Hann window
    // --------------------------------------------------------

    const window =
        new Float32Array(
            FFT_SIZE
        );


    for (
        let i = 0;
        i < FFT_SIZE;
        i++
    ) {

        window[i] =
            0.5 -
            0.5 *
            Math.cos(
                2 *
                Math.PI *
                i /
                (FFT_SIZE - 1)
            );
    }


    // --------------------------------------------------------
    // FFT arrays
    // --------------------------------------------------------

    const re =
        new Float32Array(
            FFT_SIZE
        );

    const im =
        new Float32Array(
            FFT_SIZE
        );


    // --------------------------------------------------------
    // Calculate spectrogram
    // --------------------------------------------------------

    for (
        let x = 0;
        x < columns;
        x++
    ) {

        const offset =
            x * HOP;


        // --------------------------------------------
        // Window audio
        // --------------------------------------------

        for (
            let i = 0;
            i < FFT_SIZE;
            i++
        ) {

            re[i] =
                (samples[offset + i] || 0)
                *
                window[i];

            im[i] = 0;
        }


        // --------------------------------------------
        // FFT
        // --------------------------------------------

        fft(
            re,
            im
        );


        // --------------------------------------------
        // Frequency bins
        // --------------------------------------------

        for (
            let y = 0;
            y < rows;
            y++
        ) {

            const magnitude =
                Math.sqrt(
                    re[y] * re[y] +
                    im[y] * im[y]
                )
                /
                (FFT_SIZE / 2);


            // ------------------------------------------------
            // Convert digital magnitude to estimated dB SPL
            // ------------------------------------------------

            const dbSpl =
                amplitudeToDbSpl(
                    magnitude
                );
            
            dbData[
                        (
                            (rows - 1 - y)
                            *
                            columns
                        )
                        +
                        x
                    ] = dbSpl;

            const color =
                dbSplToColor(
                    dbSpl
                );


            // ------------------------------------------------
            // Canvas pixel
            // ------------------------------------------------

            const pixel =
                (
                    (rows - 1 - y)
                    *
                    columns
                    +
                    x
                )
                *
                4;


            image.data[pixel] =
                color[0];

            image.data[pixel + 1] =
                color[1];

            image.data[pixel + 2] =
                color[2];

            image.data[pixel + 3] =
                255;
        }
    }


    // --------------------------------------------------------
    // Draw spectrogram
    // --------------------------------------------------------

    ctx.putImageData(
        image,
        leftMargin,
        0
    );


    // --------------------------------------------------------
    // Draw axes
    // --------------------------------------------------------

    drawAxes(
        ctx,
        audioBuffer,
        leftMargin,
        rows,
        columns,
        bottomMargin
    );


    // --------------------------------------------------------
    // Draw color bar
    // --------------------------------------------------------

    drawColorBar(
        ctx,
        columns,
        rows,
        leftMargin
    );

    canvas._spectrogramData = {
        values: dbData,
        columns: columns,
        rows: rows,
        sampleRate: sampleRate,
        duration: audioBuffer.duration
    };
    
    initializeSpectrogramInteraction();
    
    console.log(
        name,
        columns,
        "frames",
        rows,
        "frequency bins",
        "max Hz:",
        MAX_FREQUENCY
    );
}


// ============================================================
// DIFFERENCE SPECTROGRAM
// ============================================================
//
// Shows:
//
//     ORIGINAL - HEARING LOSS
//
// Positive difference means energy present in the original
// has been reduced by the hearing-loss processing.
//
// The display is based on the difference between the two
// spectra rather than simply subtracting waveform samples.
// ============================================================

export function drawDifferenceSpectrogram(
    originalBuffer,
    processedBuffer,
    canvas
) {

    if (!originalBuffer) {
        console.error(
            "drawDifferenceSpectrogram: originalBuffer is null"
        );
        return;
    }

    if (!processedBuffer) {
        console.error(
            "drawDifferenceSpectrogram: processedBuffer is null"
        );
        return;
    }

    if (!canvas) {
        console.error(
            "drawDifferenceSpectrogram: canvas is null"
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


    // --------------------------------------------------------
    // Use the shorter buffer
    // --------------------------------------------------------

    const length =
        Math.min(
            original.length,
            processed.length
        );


    const rows =
        Math.floor(
            MAX_FREQUENCY *
            FFT_SIZE /
            sampleRate
        );


    const columns =
        Math.max(
            1,
            Math.floor(
                (length - FFT_SIZE) /
                HOP
            )
        );

    canvas.dataset.columns = columns;
    
    const leftMargin = 60;
    const bottomMargin = 40;
    const colorBarWidth = 110;


    canvas.width =
        leftMargin +
        columns +
        colorBarWidth;

    canvas.height =
        rows +
        bottomMargin;

    canvas.dataset.leftMargin = leftMargin;
    canvas.dataset.columns = columns;
    canvas.dataset.colorBarWidth = colorBarWidth;
    
    const image =
        ctx.createImageData(
            columns,
            rows
        );

    const differenceData =
        new Float32Array(
            columns * rows
        );

    // --------------------------------------------------------
    // Hann window
    // --------------------------------------------------------

    const window =
        new Float32Array(
            FFT_SIZE
        );


    for (
        let i = 0;
        i < FFT_SIZE;
        i++
    ) {

        window[i] =
            0.5 -
            0.5 *
            Math.cos(
                2 *
                Math.PI *
                i /
                (FFT_SIZE - 1)
            );
    }


    // --------------------------------------------------------
    // FFT arrays
    // --------------------------------------------------------

    const originalRe =
        new Float32Array(
            FFT_SIZE
        );

    const originalIm =
        new Float32Array(
            FFT_SIZE
        );

    const processedRe =
        new Float32Array(
            FFT_SIZE
        );

    const processedIm =
        new Float32Array(
            FFT_SIZE
        );


    // --------------------------------------------------------
    // Calculate difference spectrum
    // --------------------------------------------------------

    for (
        let x = 0;
        x < columns;
        x++
    ) {

        const offset =
            x * HOP;


        // --------------------------------------------
        // Original window
        // --------------------------------------------

        for (
            let i = 0;
            i < FFT_SIZE;
            i++
        ) {

            originalRe[i] =
                (original[offset + i] || 0)
                *
                window[i];

            originalIm[i] = 0;
        }


        // --------------------------------------------
        // Processed window
        // --------------------------------------------

        for (
            let i = 0;
            i < FFT_SIZE;
            i++
        ) {

            processedRe[i] =
                (processed[offset + i] || 0)
                *
                window[i];

            processedIm[i] = 0;
        }


        // --------------------------------------------
        // FFT
        // --------------------------------------------

        fft(
            originalRe,
            originalIm
        );

        fft(
            processedRe,
            processedIm
        );


        // --------------------------------------------
        // Frequency bins
        // --------------------------------------------

        for (
            let y = 0;
            y < rows;
            y++
        ) {

            const originalMagnitude =
                Math.sqrt(
                    originalRe[y] *
                    originalRe[y] +
                    originalIm[y] *
                    originalIm[y]
                )
                /
                (FFT_SIZE / 2);


            const processedMagnitude =
                Math.sqrt(
                    processedRe[y] *
                    processedRe[y] +
                    processedIm[y] *
                    processedIm[y]
                )
                /
                (FFT_SIZE / 2);


            const originalDb =
                amplitudeToDbSpl(
                    originalMagnitude
                );


            const processedDb =
                amplitudeToDbSpl(
                    processedMagnitude
                );


            // ------------------------------------------------
            // Amount of information lost
            // ------------------------------------------------

            let differenceDb =
                originalDb -
                processedDb;


            // Ignore tiny numerical differences
            if (
                Math.abs(differenceDb) < 0.5
            ) {

                differenceDb = 0;
            }

            differenceData[
                (
                    (rows - 1 - y)
                    *
                    columns
                )
                +
                x
            ] = differenceDb;

            // ------------------------------------------------
            // Difference display
            //
            // 0 dB loss = very dark blue
            // Larger loss = cyan -> green -> yellow -> red
            // ------------------------------------------------

            const color =
                differenceToColor(
                    differenceDb
                );


            const pixel =
                (
                    (rows - 1 - y)
                    *
                    columns
                    +
                    x
                )
                *
                4;


            image.data[pixel] =
                color[0];

            image.data[pixel + 1] =
                color[1];

            image.data[pixel + 2] =
                color[2];

            image.data[pixel + 3] =
                255;
        }
    }


    // --------------------------------------------------------
    // Draw
    // --------------------------------------------------------

    ctx.putImageData(
        image,
        leftMargin,
        0
    );


    drawAxes(
        ctx,
        originalBuffer,
        leftMargin,
        rows,
        columns,
        bottomMargin
    );


    drawDifferenceColorBar(
        ctx,
        columns,
        rows,
        leftMargin
    );

    canvas._spectrogramData = {
        values: differenceData,
        columns: columns,
        rows: rows,
        sampleRate: sampleRate,
        duration: originalBuffer.duration
    };
    
    initializeSpectrogramInteraction();
    
    const scale =
        canvas.getBoundingClientRect().width /
        canvas.width;
    
    document.getElementById("progress-container").style.width =
        `${columns * scale}px`;

    console.log(
        "Difference spectrogram drawn."
    );
}



// ============================================================
// DIGITAL AMPLITUDE -> dB SPL
// ============================================================

function amplitudeToDbSpl(
    amplitude
) {

    if (
        amplitude <= 1e-10
    ) {

        return 0;
    }


    /*
      Convert digital amplitude to RMS-like
      pressure relative to 20 µPa.

      This is an estimated calibration unless
      the digital signal has been acoustically calibrated.
    */

    const pressure =
        amplitude;


    const dbSpl =
        20 *
        Math.log10(
            pressure /
            REFERENCE_PRESSURE
        );


    return Math.max(
        0,
        dbSpl
    );
}



// ============================================================
// dB SPL -> COLOUR
// ============================================================

function dbSplToColor(
    db
) {

    if (
        db <= 0
    ) {

        return [
            0,
            0,
            0
        ];
    }


    const stops = [

        {
            db: 0,
            r: 0,
            g: 0,
            b: 0
        },

        {
            db: 20,
            r: 0,
            g: 0,
            b: 120
        },

        {
            db: 30,
            r: 0,
            g: 80,
            b: 255
        },

        {
            db: 40,
            r: 0,
            g: 220,
            b: 255
        },

        {
            db: 50,
            r: 0,
            g: 220,
            b: 80
        },

        {
            db: 60,
            r: 255,
            g: 255,
            b: 0
        },

        {
            db: 70,
            r: 255,
            g: 140,
            b: 0
        },

        {
            db: 80,
            r: 255,
            g: 0,
            b: 0
        }
    ];


    if (
        db >= 80
    ) {

        return [
            255,
            0,
            0
        ];
    }


    for (
        let i = 0;
        i < stops.length - 1;
        i++
    ) {

        const a =
            stops[i];

        const b =
            stops[i + 1];


        if (
            db >= a.db &&
            db <= b.db
        ) {

            const t =
                (
                    db - a.db
                )
                /
                (
                    b.db - a.db
                );


            return [

                Math.round(
                    a.r +
                    t *
                    (
                        b.r -
                        a.r
                    )
                ),

                Math.round(
                    a.g +
                    t *
                    (
                        b.g -
                        a.g
                    )
                ),

                Math.round(
                    a.b +
                    t *
                    (
                        b.b -
                        a.b
                    )
                )
            ];
        }
    }


    return [
        0,
        0,
        0
    ];
}



// ============================================================
// DIFFERENCE COLOUR MAP
// ============================================================

function differenceToColor(
    db
) {

    /*
      Difference range:

      0 dB   = dark blue
      5 dB   = blue
      10 dB  = cyan
      20 dB  = green
      30 dB  = yellow
      40 dB  = orange
      50+ dB = red
    */


    if (
        db <= 0
    ) {

        return [
            10,
            10,
            40
        ];
    }


    const stops = [

        {
            db: 0,
            r: 10,
            g: 10,
            b: 40
        },

        {
            db: 5,
            r: 0,
            g: 80,
            b: 255
        },

        {
            db: 10,
            r: 0,
            g: 220,
            b: 255
        },

        {
            db: 20,
            r: 0,
            g: 220,
            b: 80
        },

        {
            db: 30,
            r: 255,
            g: 255,
            b: 0
        },

        {
            db: 40,
            r: 255,
            g: 140,
            b: 0
        },

        {
            db: 50,
            r: 255,
            g: 0,
            b: 0
        }
    ];


    if (
        db >= 50
    ) {

        return [
            255,
            0,
            0
        ];
    }


    for (
        let i = 0;
        i < stops.length - 1;
        i++
    ) {

        const a =
            stops[i];

        const b =
            stops[i + 1];


        if (
            db >= a.db &&
            db <= b.db
        ) {

            const t =
                (
                    db - a.db
                )
                /
                (
                    b.db - a.db
                );


            return [

                Math.round(
                    a.r +
                    t *
                    (
                        b.r -
                        a.r
                    )
                ),

                Math.round(
                    a.g +
                    t *
                    (
                        b.g -
                        a.g
                    )
                ),

                Math.round(
                    a.b +
                    t *
                    (
                        b.b -
                        a.b
                    )
                )
            ];
        }
    }


    return [
        10,
        10,
        40
    ];
}



// ============================================================
// NORMAL COLOR BAR
// ============================================================

function drawColorBar(
    ctx,
    columns,
    rows,
    leftMargin
) {

    const barWidth = 20;

    const barX =
        leftMargin +
        columns +
        25;


    const gradient =
        ctx.createLinearGradient(
            0,
            rows,
            0,
            0
        );


    gradient.addColorStop(
        0.00,
        "black"
    );

    gradient.addColorStop(
        0.25,
        "#000078"
    );

    gradient.addColorStop(
        0.375,
        "#0050ff"
    );

    gradient.addColorStop(
        0.50,
        "#00dcff"
    );

    gradient.addColorStop(
        0.625,
        "#00dc50"
    );

    gradient.addColorStop(
        0.75,
        "yellow"
    );

    gradient.addColorStop(
        0.875,
        "orange"
    );

    gradient.addColorStop(
        1.00,
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


    ctx.fillStyle =
        "black";

    ctx.font =
        "12px Arial";

    ctx.textAlign =
        "left";


    const labels = [

        {
            db: 0,
            text: "0 dB SPL"
        },

        {
            db: 20,
            text: "20"
        },

        {
            db: 40,
            text: "40"
        },

        {
            db: 60,
            text: "60"
        },

        {
            db: 80,
            text: "80"
        }
    ];


    for (
        const label of labels
    ) {

        const y =
            rows -
            (
                label.db /
                MAX_DB_SPL
            )
            *
            rows;


        ctx.fillText(
            label.text,
            barX + barWidth + 8,
            y + 4
        );
    }
}



// ============================================================
// DIFFERENCE COLOR BAR
// ============================================================

function drawDifferenceColorBar(
    ctx,
    columns,
    rows,
    leftMargin
) {

    const barWidth = 20;

    const barX =
        leftMargin +
        columns +
        25;


    const gradient =
        ctx.createLinearGradient(
            0,
            rows,
            0,
            0
        );


    gradient.addColorStop(
        0.00,
        "#0a0a28"
    );

    gradient.addColorStop(
        0.10,
        "#0050ff"
    );

    gradient.addColorStop(
        0.20,
        "#00dcff"
    );

    gradient.addColorStop(
        0.40,
        "#00dc50"
    );

    gradient.addColorStop(
        0.60,
        "yellow"
    );

    gradient.addColorStop(
        0.80,
        "orange"
    );

    gradient.addColorStop(
        1.00,
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


    ctx.fillStyle =
        "black";

    ctx.font =
        "12px Arial";


    const labels = [
        {
            db: 0,
            text: "0 dB loss"
        },

        {
            db: 10,
            text: "10"
        },

        {
            db: 20,
            text: "20"
        },

        {
            db: 30,
            text: "30"
        },

        {
            db: 40,
            text: "40"
        },

        {
            db: 50,
            text: "50+"
        }
    ];


    for (
        const label of labels
    ) {

        const y =
            rows -
            (
                label.db /
                50
            )
            *
            rows;


        ctx.fillText(
            label.text,
            barX + barWidth + 8,
            y + 4
        );
    }
}



// ============================================================
// AXES
// ============================================================

function drawAxes(
    ctx,
    audioBuffer,
    leftMargin,
    rows,
    columns,
    bottomMargin
) {

    ctx.fillStyle =
        "black";

    ctx.font =
        "12px Arial";

    ctx.textAlign =
        "left";


    // --------------------------------------------------------
    // Time axis
    // --------------------------------------------------------

    const duration =
        audioBuffer.duration;


    const timeSteps = 10;


    for (
        let i = 0;
        i <= timeSteps;
        i++
    ) {

        const x =
            leftMargin +
            (
                i /
                timeSteps
            )
            *
            columns;


        const seconds =
            duration *
            i /
            timeSteps;


        ctx.fillText(
            seconds.toFixed(1) + " s",
            x - 10,
            rows + 25
        );
    }


    // --------------------------------------------------------
    // Frequency axis
    // --------------------------------------------------------

    for (
        let f = 0;
        f <= MAX_FREQUENCY;
        f += 2000
    ) {

        const y =
            rows -
            (
                f /
                MAX_FREQUENCY
            )
            *
            rows;


        ctx.fillText(
            f + " Hz",
            5,
            y + 4
        );
    }
}


export function updateProgressBarWidth() {

    const canvas =
        document.getElementById("spectrogram-original");

    const progressContainer =
        document.getElementById("progress-container");

    if (!canvas || !progressContainer) {
        return;
    }

    const columns =
        Number(canvas.dataset.columns);

    if (!columns) {
        return;
    }

    const leftMargin = 60;

    const scale =
        canvas.getBoundingClientRect().width /
        canvas.width;

    const imageLeft =
        leftMargin * scale;

    const imageWidth =
        columns * scale;
}
