import {
    frequencies,
    getLeftLoss,
    getRightLoss
} from "./audiogram.js";


export async function applyHearingLoss(audioBuffer){

    const context =
        new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
        );


    const source =
        context.createBufferSource();

    source.buffer = audioBuffer;


    let node = source;


    const loss =
        getLeftLoss();


    for(let i=0;i<frequencies.length;i++){

        const filter =
            context.createBiquadFilter();

        filter.type = "peaking";

        filter.frequency.value =
            frequencies[i];

        filter.Q.value =
            1;

        filter.gain.value =
        -loss[i];


        node.connect(filter);

        node = filter;
    }

        const makeup =
        context.createGain();
        
        makeup.gain.value = 2;
        
        node.connect(makeup);
        
        makeup.connect(
            context.destination
        );

    
    node.connect(
        context.destination
    );


    source.start();


    return await context.startRendering();

}
