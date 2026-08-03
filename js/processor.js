import {
    frequencies,
    getLeftLoss,
    getRightLoss
} from "./audiogram.js";


export async function applyHearingLoss(audioBuffer){


    const channels =
        audioBuffer.numberOfChannels;


    const offline =
        new OfflineAudioContext(
            channels,
            audioBuffer.length,
            audioBuffer.sampleRate
        );


    const source =
        offline.createBufferSource();


    source.buffer =
        audioBuffer;


    const merger =
        offline.createChannelMerger(
            channels
        );


    if(channels === 1){

        const filter =
            createEarFilter(
                offline,
                getLeftLoss()
            );


        source
        .connect(filter.input);


        filter.output
        .connect(
            offline.destination
        );


    }


    else {


        const splitter =
            offline.createChannelSplitter(2);


        source.connect(splitter);



        const left =
            createEarFilter(
                offline,
                getLeftLoss()
            );


        const right =
            createEarFilter(
                offline,
                getRightLoss()
            );



        splitter.connect(
            left.input,
            0
        );


        splitter.connect(
            right.input,
            1
        );


        left.output.connect(
            merger,
            0,
            0
        );


        right.output.connect(
            merger,
            0,
            1
        );


        merger.connect(
            offline.destination
        );

    }


    source.start();


    return await offline.startRendering();

}




function createEarFilter(context,loss){


    let input =
        context.createGain();


    let previous=input;


    for(let i=0;i<frequencies.length;i++){


        let filter =
            context.createBiquadFilter();


        filter.type="peaking";


        filter.frequency.value =
            frequencies[i];


        filter.Q.value =
            0.7;


        // temporary limit
        // so we can hear it working

        filter.gain.value =
            -Math.min(
                loss[i],
                35
            );


        previous.connect(filter);


        previous=filter;

    }


    return {

        input:input,

        output:previous

    };

}
