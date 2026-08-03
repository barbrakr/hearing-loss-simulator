import {
    frequencies,
    getLeftLoss,
    getRightLoss
} from "./audiogram.js";


export async function applyHearingLoss(audioBuffer, context){

    const offline =
        new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
        );


    const source =
        offline.createBufferSource();

    source.buffer =
        audioBuffer;



    const splitter =
        offline.createChannelSplitter(2);


    const merger =
        offline.createChannelMerger(2);



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


    splitter.connect(left.input,0);
    splitter.connect(right.input,1);


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


        filter.gain.value =
            -loss[i];


        previous.connect(filter);

        previous=filter;

    }


    return {

        input:input,

        output:previous

    };

}
