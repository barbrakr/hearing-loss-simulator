export function createNoiseBuffer(
    context,
    type = "fan",
    duration,
    sampleRate
){

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


        if(type === "traffic"){

            // distant traffic:
            // low rumble + irregular events

            sample =
                (Math.random()*2-1)
                *
                0.4;


            if(
                Math.random() < 0.0005
            ){

                sample +=
                    Math.random()
                    *
                    0.5;

            }

        }



        left[i] =
            sample;

        right[i] =
            sample;

    }


    return buffer;

}
