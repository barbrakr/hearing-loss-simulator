import { fft } from "./dsp.js";


export function drawSpectrogram(
    audioBuffer,
    canvas,
    name = "UNKNOWN"
) {

    const ctx = canvas.getContext("2d");


    const samples =
        audioBuffer.getChannelData(0);

    const sampleRate =
        audioBuffer.sampleRate;


    // -----------------------------
    // STFT settings
    // -----------------------------

    const fftSize = 2048;

    const hop = fftSize / 2;


    const maxFrequency = 10000;


    const rows =
        Math.floor(
            maxFrequency *
            fftSize /
            sampleRate
        );


    const columns =
        Math.floor(
            (samples.length - fftSize)
            /
            hop
        );


    const colorBarWidth = 100;


    canvas.width =
        columns + colorBarWidth;

    canvas.height =
        rows;



    const image =
        ctx.createImageData(
            columns,
            rows
        );



    // -----------------------------
    // Hann window
    // -----------------------------

    const window =
        new Float32Array(
            fftSize
        );


    for(let i = 0; i < fftSize; i++){

        window[i] =
            0.5 -
            0.5 *
            Math.cos(
                2 * Math.PI * i /
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



    // Display range

    const minDb = -100;
    const maxDb = 0;



    // -----------------------------
    // Calculate spectrogram
    // -----------------------------

    for(
        let x = 0;
        x < columns;
        x++
    ){

        const offset =
            x * hop;



        for(
            let i = 0;
            i < fftSize;
            i++
        ){

            re[i] =
                (samples[offset+i] || 0)
                *
                window[i];

            im[i] = 0;

        }



        fft(re, im);



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



            const db =
                20 *
                Math.log10(
                    Math.max(
                        magnitude,
                        1e-10
                    )
                );



            let value =
                (
                    db - minDb
                )
                /
                (
                    maxDb - minDb
                );


            value =
                Math.max(
                    0,
                    Math.min(
                        1,
                        value
                    )
                );



            // -----------------------------
            // Same colour map as color bar
            // -----------------------------

            const t = value;


            let r;
            let g;
            let b;



            if(t < 0.25){

                const p =
                    t / 0.25;

                r = 0;
                g = 0;
                b = Math.round(
                    255 * p
                );

            }

            else if(t < 0.50){

                const p =
                    (t - 0.25) / 0.25;

                r = 0;
                g = Math.round(
                    255 * p
                );
                b = 255;

            }

            else if(t < 0.75){

                const p =
                    (t - 0.50) / 0.25;

                r = Math.round(
                    255 * p
                );

                g = 255;

                b = Math.round(
                    255 * (1-p)
                );

            }

            else {

                const p =
                    (t - 0.75) / 0.25;

                r = 255;

                g = Math.round(
                    255 * (1-p)
                );

                b = 0;

            }



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
                r;

            image.data[pixel+1] =
                g;

            image.data[pixel+2] =
                b;

            image.data[pixel+3] =
                255;


        }

    }



    ctx.putImageData(
        image,
        0,
        0
    );



    // -----------------------------
    // Colour bar
    // -----------------------------

    const barWidth = 20;

    const barX =
        columns + 15;



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



    ctx.fillStyle =
        "black";

    ctx.font =
        "12px Arial";


    ctx.fillText(
        "0 dB",
        barX + 25,
        12
    );


    ctx.fillText(
        "-20",
        barX + 25,
        rows * 0.2
    );


    ctx.fillText(
        "-40",
        barX + 25,
        rows * 0.4
    );


    ctx.fillText(
        "-60",
        barX + 25,
        rows * 0.6
    );


    ctx.fillText(
        "-80",
        barX + 25,
        rows * 0.8
    );


    ctx.fillText(
        "-100",
        barX + 25,
        rows - 5
    );



    console.log(
        name,
        columns,
        "frames",
        rows,
        "frequency bins",
        "max Hz:",
        maxFrequency
    );

}
