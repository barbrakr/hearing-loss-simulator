export class AudioEngine{

constructor(){

this.context = null;

this.buffer = null;

this.source = null;

}


async init(){

if(!this.context){

this.context = new AudioContext();

}

await this.context.resume();

}


async loadFromFile(file){

    await this.init();

    const arrayBuffer =
        await file.arrayBuffer();

    this.buffer =
        await this.context.decodeAudioData(arrayBuffer);

    return this.buffer;

}


async loadFromURL(url){

    console.log("Loading:", url);

    await this.init();

    const response = await fetch(url);

    if(!response.ok){
        throw new Error("Couldn't load " + url);
    }

    const arrayBuffer =
        await response.arrayBuffer();

    this.buffer =
        await this.context.decodeAudioData(arrayBuffer);

    return this.buffer;
    }


play(){

if(!this.buffer)
return;


this.stop();


this.source =
this.context.createBufferSource();

this.source.buffer =
this.buffer;

this.source.connect(
this.context.destination
);

this.source.start();

}


stop(){

if(this.source){

try{

this.source.stop();

}catch(e){}

this.source.disconnect();

this.source=null;

}

}


getLeft(){

return this.buffer.getChannelData(0);

}


getRight(){

if(this.buffer.numberOfChannels>1)

return this.buffer.getChannelData(1);

return this.buffer.getChannelData(0);

}

}
