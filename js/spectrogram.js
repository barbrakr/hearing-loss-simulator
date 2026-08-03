import {
    FFT_SIZE,
    HOP_SIZE,
    WINDOW
} from "./stftConfig.js";


import {
    fft,
    ifft
} from "./dsp.js";


export function drawSpectrogram(
    audioBuffer,
    canvas,
    name="UNKNOWN"
){

    console.log("Hop:", hop);
    console.log("Window[100]:", WINDOW[100]);
    
    const ctx =
        canvas.getContext("2d");


    const samples =
        audioBuffer.getChannelData(0);


    const sampleRate =
        audioBuffer.sampleRate;


    const fftSize = FFT_SIZE;
    const hop = HOP_SIZE;


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
            (samples[offset+i] || 0)
            *
            WINDOW[i];

            im[i]=0;

        }


        fft(re,im);
        
        if (x === 200) {
        
            console.log(
                name,
                "1 kHz magnitude:",
                Math.sqrt(
                    re[46]*re[46] +
                    im[46]*im[46]
                )
            );
        
            console.log(
                name,
                "4 kHz magnitude:",
                Math.sqrt(
                    re[186]*re[186] +
                    im[186]*im[186]
                )
            );
        
        }


        for(
            let y=0;
            y<rows;
            y++
        ){
        
        const magnitude =
            Math.sqrt(
                re[y] * re[y] +
                im[y] * im[y]
            ) / (fftSize / 2);
        
        const db =
            20 * Math.log10(
                Math.max(magnitude, 1e-10)
            );


            const minDb = -100;
            const maxDb = 0;
            
            
            const value =
                Math.round(
                    255 *
                    Math.max(
                        0,
                        Math.min(
                            1,
                            (db + 100) / 100
                        )
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
