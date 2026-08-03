export function mixBuffers(
    main,
    noise,
    noiseLevel = 0.2
){

    const length =
        main.length;


    const result =
        new AudioBuffer({
            length: length,
            numberOfChannels: 2,
            sampleRate: main.sampleRate
        });



    for(
        let ch = 0;
        ch < 2;
        ch++
    ){

        const out =
            result.getChannelData(ch);


        const source =
            main.getChannelData(
                Math.min(
                    ch,
                    main.numberOfChannels - 1
                )
            );


        const noiseData =
            noise.getChannelData(ch);



        for(
            let i = 0;
            i < length;
            i++
        ){

            out[i] =
                source[i]
                +
                noiseData[i]
                *
                noiseLevel;


            if(out[i] > 1)
                out[i] = 1;


            if(out[i] < -1)
                out[i] = -1;

        }

    }


    return result;

}
