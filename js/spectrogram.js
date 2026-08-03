import {
    fft,
    ifft
} from "./dsp.js";


export function drawSpectrogram(
    audioBuffer,
    canvas,
    name
){

    const ctx =
        canvas.getContext("2d");


    const samples =
        audioBuffer.getChannelData(0);


    const sampleRate =
        audioBuffer.sampleRate;


    const fftSize = 2048;

    const hop = 512;


    const columns =
        Math.floor(
            (samples.length-fftSize)
            /
            hop
        );


    const rows =
        fftSize/2;


    canvas.width =
        columns;

    canvas.height =
        rows;


    const image =
        ctx.createImageData(
            columns,
            rows
        );


    const re =
        new Float32Array(
            fftSize
        );


    const im =
        new Float32Array(
            fftSize
        );



    for(
        let x=0;
        x<columns;
        x++
    ){

        let offset =
            x*hop;


        for(
            let i=0;
            i<fftSize;
            i++
        ){

            re[i] =
                samples[offset+i] || 0;

            im[i]=0;

        }


        fft(re,im);



        for(
            let y=0;
            y<rows;
            y++
        ){

            const magnitude =
                Math.sqrt(
                    re[y]*re[y]
                    +
                    im[y]*im[y]
                );


            const db =
                20 *
                Math.log10(
                    magnitude + 0.000001
                );


            const minDb = -100;
            const maxDb = 0;
            
            
            const value =
                Math.max(
                    0,
                    Math.min(
                        255,
                        (
                            (db-minDb)
                            /
                            (maxDb-minDb)
                        )
                        *
                        255
                    )
                );


            const pixel =
                (
                    (rows-y-1)
                    *
                    columns
                    +
                    x
                )
                *
                4;


            image.data[pixel]=value;

            image.data[pixel+1]=value/2;

            image.data[pixel+2]=255-value;

            image.data[pixel+3]=255;


        }


    }


    ctx.putImageData(
        image,
        0,
        0
    );

    
    console.log(
        "Spectrogram:",
        name,
        columns,
        rows,
        "Hz max:",
        sampleRate/2
    );

}
