import { fft } from "./dsp.js";

export function drawSpectrogram(audioBuffer, canvas, name = "UNKNOWN") {

    const ctx = canvas.getContext("2d");

    const samples = audioBuffer.getChannelData(0);

    const sampleRate = audioBuffer.sampleRate;

    const fftSize = 2048;
    const hop = fftSize / 2;

    const maxFrequency = 10000;

    const rows =
        Math.floor(
            maxFrequency *
            fftSize /
            sampleRate
        );
    const columns = Math.floor((samples.length - fftSize) / hop);

    const colorBarWidth = 60;
    
    canvas.width =
        columns + colorBarWidth;
    
    canvas.height =
        rows;

    const image = ctx.createImageData(columns, rows);

    //----------------------------------------------------
    // Hann window (same as processor)
    //----------------------------------------------------

    const window = new Float32Array(fftSize);

    for (let i = 0; i < fftSize; i++) {

        window[i] =
            0.5 -
            0.5 *
            Math.cos(
                2 * Math.PI * i / (fftSize - 1)
            );

    }

    //----------------------------------------------------

    const re = new Float32Array(fftSize);
    const im = new Float32Array(fftSize);

    const minDb = -60;
    const maxDb = -10;

    for (let x = 0; x < columns; x++) {

        const offset = x * hop;

        //------------------------------------------------
        // Window signal
        //------------------------------------------------

        for (let i = 0; i < fftSize; i++) {

            re[i] =
                (samples[offset + i] || 0)
                * window[i];

            im[i] = 0;

        }

        fft(re, im);

        //------------------------------------------------
        // Magnitude
        //------------------------------------------------

        for (let y = 0; y < rows; y++) {

            const magnitude =
                Math.sqrt(
                    re[y] * re[y] +
                    im[y] * im[y]
                ) / (fftSize / 2);

            const db =
                20 *
                Math.log10(
                    Math.max(
                        magnitude,
                        1e-10
                    )
                );

                        if (x === 200 && (y === 46 || y === 186)) {
                console.log(
                    name,
                    "bin",
                    y,
                    "dB:",
                    db.toFixed(2)
                );
            }

            let value =
                (db - minDb) /
                (maxDb - minDb);

            value =
                Math.max(
                    0,
                    Math.min(
                        1,
                        value
                    )
                );

            const gray =
                Math.round(
                    value * 255
                );

            const pixel =
                (
                    (rows - 1 - y)
                    * columns
                    + x
                ) * 4;

            image.data[pixel] = gray;
            image.data[pixel + 1] = gray;
            image.data[pixel + 2] = gray;
            image.data[pixel + 3] = 255;

        }

    }

    ctx.putImageData(image, 0, 0);

    const barX = columns + 15;
    
    const gradient =
        ctx.createLinearGradient(
            0,
            rows,
            0,
            0
        );
    
    gradient.addColorStop(0, "black");
    gradient.addColorStop(1, "white");
    
    ctx.fillStyle = gradient;
    
    ctx.fillRect(
        barX,
        0,
        20,
        rows
    );
    
    ctx.fillStyle = "black";
    ctx.font = "12px Arial";
    
    ctx.fillText("0 dB", barX + 25, 12);
    
    ctx.fillText("-20", barX + 25, rows * 0.2);
    
    ctx.fillText("-40", barX + 25, rows * 0.4);
    
    ctx.fillText("-60", barX + 25, rows * 0.6);
    
    ctx.fillText("-80", barX + 25, rows * 0.8);
    
    ctx.fillText("-100", barX + 25, rows - 4);

    console.log(
        name,
        columns,
        "frames",
        rows,
        "frequency bins"
    );
}
