export async function createForegroundBuffer(
    context,
    type = "Tinnitus (ringing)",
    duration,
    sampleRate
){
    
    if(type === "Tinnitus (ringing)"){
    
        const response =
            await fetch("audio/freesound_community-tinnitus-71519.wav");
    
        const arrayBuffer =
            await response.arrayBuffer();
    
        const tinnitus =
            await context.decodeAudioData(arrayBuffer);

        console.log(
            "Tinnitus (ringing):",
            tinnitus.duration,
            tinnitus.length,
            tinnitus.sampleRate
        );
            
        return matchLength(
            tinnitus,
            duration,
            context
        );
    }


     if(type === "Tinnitus (pulse)"){
    
        const response =
            await fetch("audio/freesound_community-pulse-73820.wav");
    
        const arrayBuffer =
            await response.arrayBuffer();
    
        const tinnitusp =
            await context.decodeAudioData(arrayBuffer);

        console.log(
            "Tinnitus (pulse):",
            tinnitusp.duration,
            tinnitusp.length,
            tinnitusp.sampleRate
        );
            
        return matchLength(
            tinnitusp,
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
