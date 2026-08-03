export function createSpectrogram(
    audioBuffer,
    canvas
){

    const ctx =
        canvas.getContext("2d");


    const data =
        audioBuffer.getChannelData(0);


    const sampleRate =
        audioBuffer.sampleRate;


    const fftSize = 2048;

    const hop = 512;


    const frames =
        Math.floor(
            (data.length - fftSize) / hop
        );


    const bins =
        fftSize / 2;


    canvas.width = frames;
    canvas.height = bins;


    const image =
        ctx.createImageData(
            frames,
            bins
        );


    for(
        let x=0;
        x<frames;
        x++
    ){

        const offset =
            x * hop;


        for(
            let y=0;
            y<bins;
            y++
        ){

            let magnitude = 0;


            // simple FFT placeholder
            // replaced below

            const index =
                offset + y;


            if(index < data.length){

                magnitude =
                    Math.abs(
                        data[index]
                    );

            }


            let db =
                20 *
                Math.log10(
                    magnitude + 0.00001
                );


            db =
                Math.max(
                    -100,
                    Math.min(
                        0,
                        db
                    )
                );


            const colour =
                dbToColour(db);


            const pixel =
                (
                    y * frames + x
                )
                * 4;


            image.data[pixel] =
                colour.r;


            image.data[pixel+1] =
                colour.g;


            image.data[pixel+2] =
                colour.b;


            image.data[pixel+3] =
                255;

        }

    }


    ctx.putImageData(
        image,
        0,
        0
    );


    drawAxes(
        canvas,
        sampleRate,
        data.length
    );

}



function dbToColour(db){

    const value =
        (db + 100) / 100;


    return {

        r:
            Math.floor(
                255 * value
            ),

        g:
            Math.floor(
                255 * value * value
            ),

        b:
            255 -
            Math.floor(
                255 * value
            )

    };

}



function drawAxes(
    canvas,
    sampleRate,
    length
){

    const ctx =
        canvas.getContext("2d");


    ctx.font="12px Arial";


    const duration =
        length /
        sampleRate;


    console.log(
        "Duration:",
        duration,
        "seconds"
    );

}
