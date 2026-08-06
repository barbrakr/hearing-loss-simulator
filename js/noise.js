export async function createNoiseBuffer(
    context,
    type = "fan",
    duration,
    sampleRate
){
    
    if(type === "traffic"){
    
        const response =
            await fetch("audio/traffic.wav");
    
        const arrayBuffer =
            await response.arrayBuffer();
    
        const traffic =
            await context.decodeAudioData(arrayBuffer);

        console.log(
            "Traffic:",
            traffic.duration,
            traffic.length,
            traffic.sampleRate
        );
            
        return matchLength(
            traffic,
            duration,
            context
        );
    }
    
    const length =
        Math.floor(
            duration * sampleRate
        );


    const buffer =
        context.createBuffer(
            2,
            length,
            sampleRate
        );


    const left =
        buffer.getChannelData(0);

    const right =
        buffer.getChannelData(1);



    for(let i = 0; i < length; i++){

        let sample = 0;


        if(type === "fan"){

            // low-frequency filtered noise

            sample =
                (Math.random()*2-1)
                *
                0.8;


            // simple smoothing

            if(i > 0){

                sample =
                    left[i-1] * 0.95
                    +
                    sample * 0.05;

            }

        }





        left[i] =
            sample;

        right[i] =
            sample;

    }


    return buffer;

}


function matchLength(
    sourceBuffer,
    duration,
    context
){

    const targetLength =
        Math.floor(
            duration *
            sourceBuffer.sampleRate
        );

    const output =
        context.createBuffer(
            sourceBuffer.numberOfChannels,
            targetLength,
            sourceBuffer.sampleRate
        );

    for(let ch = 0;
        ch < sourceBuffer.numberOfChannels;
        ch++){

        const src =
            sourceBuffer.getChannelData(ch);

        const dst =
            output.getChannelData(ch);

        let pos = 0;

        while(pos < targetLength){

            const n =
                Math.min(
                    src.length,
                    targetLength - pos
                );

            dst.set(
                src.subarray(0, n),
                pos
            );

            pos += n;
        }
    }

    return output;
}
