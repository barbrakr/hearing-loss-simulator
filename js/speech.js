// js/speech.js
//
// Transcribes the audio buffer already loaded into the simulator.
//
// Pipeline:
//
// loaded audio
//      ↓
// workingBuffer
//      ↓
// Whisper ASR
//      ↓
// transcript
//      ↓
// audiogram-dependent phoneme degradation
//      ↓
// simulated transcript
//
// No microphone is used.

import {
    pipeline
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";


let transcriber = null;
let loadingPromise = null;


/* ---------------------------------------------------------
   LOAD WHISPER
--------------------------------------------------------- */

async function getTranscriber(statusElement) {

    if (transcriber) {
        return transcriber;
    }

    if (loadingPromise) {
        return loadingPromise;
    }

    loadingPromise = (async () => {

        statusElement.textContent =
            "Loading speech recognition model… " +
            "This may take a while the first time.";

        /*
         * Tiny is intentionally used initially because this
         * application is client-side.
         *
         * For better recognition, change to:
         *
         * onnx-community/whisper-small
         *
         * or another appropriate multilingual Whisper model.
         */

        const device =
            navigator.gpu
                ? "webgpu"
                : "wasm";

        transcriber = await pipeline(
            "automatic-speech-recognition",
            "onnx-community/whisper-tiny",
            {
                device
            }
        );

        statusElement.textContent =
            "Speech recognition model ready.";

        return transcriber;

    })();

    return loadingPromise;
}


/* ---------------------------------------------------------
   AUDIOBUFFER → MONO FLOAT32 @ 16 kHz
--------------------------------------------------------- */

function audioBufferToMono16k(audioBuffer) {

    const sourceRate =
        audioBuffer.sampleRate;

    const length =
        audioBuffer.length;

    const channels =
        audioBuffer.numberOfChannels;


    /*
     * First convert to mono.
     */

    const mono =
        new Float32Array(length);

    for (let c = 0; c < channels; c++) {

        const channel =
            audioBuffer.getChannelData(c);

        for (let i = 0; i < length; i++) {
            mono[i] +=
                channel[i] / channels;
        }
    }


    /*
     * Whisper expects 16 kHz audio.
     */

    const targetRate = 16000;

    if (sourceRate === targetRate) {
        return mono;
    }


    const outputLength =
        Math.round(
            mono.length *
            targetRate /
            sourceRate
        );

    const output =
        new Float32Array(outputLength);


    /*
     * Linear interpolation resampling.
     *
     * This is sufficient for the ASR input conversion.
     */

    const ratio =
        sourceRate / targetRate;

    for (let i = 0; i < outputLength; i++) {

        const position =
            i * ratio;

        const left =
            Math.floor(position);

        const right =
            Math.min(
                left + 1,
                mono.length - 1
            );

        const fraction =
            position - left;

        output[i] =
            mono[left] *
            (1 - fraction) +
            mono[right] *
            fraction;
    }

    return output;
}


/* ---------------------------------------------------------
   AUDIO → TEXT
--------------------------------------------------------- */

export async function transcribeAudioBuffer(
    audioBuffer,
    statusElement,
    language = null
) {

    if (!audioBuffer) {
        throw new Error(
            "No audio is currently loaded."
        );
    }


    const model =
        await getTranscriber(
            statusElement
        );


    statusElement.textContent =
        "Preparing audio…";


    const audio =
        audioBufferToMono16k(
            audioBuffer
        );


    statusElement.textContent =
        "Transcribing audio…";


    /*
     * Whisper supports chunking for longer recordings.
     *
     * return_timestamps gives us speech segments which
     * we can later use for more sophisticated phoneme
     * processing.
     */

    const options = {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true
    };


    /*
     * If the user tells us the language, giving Whisper
     * the language improves recognition.
     *
     * null = automatic language detection.
     */

    if (language) {
        options.language = language;
        options.task = "transcribe";
    }


    const result =
        await model(
            audio,
            options
        );


    statusElement.textContent =
        "Transcription complete.";


    return result;
}


/* ---------------------------------------------------------
   AUDIOMETRIC MODEL
--------------------------------------------------------- */

const PHONEMES = {

    p: {
        bands: [
            [500, .30],
            [1500, .45],
            [3000, .25]
        ]
    },

    b: {
        bands: [
            [500, .30],
            [1500, .45],
            [3000, .25]
        ]
    },

    t: {
        bands: [
            [1500, .20],
            [3000, .35],
            [5000, .45]
        ]
    },

    d: {
        bands: [
            [1500, .20],
            [3000, .35],
            [5000, .45]
        ]
    },

    k: {
        bands: [
            [1500, .25],
            [3000, .40],
            [5000, .35]
        ]
    },

    g: {
        bands: [
            [1500, .25],
            [3000, .40],
            [5000, .35]
        ]
    },

    f: {
        bands: [
            [1000, .20],
            [3000, .35],
            [6000, .45]
        ]
    },

    v: {
        bands: [
            [1000, .20],
            [3000, .35],
            [6000, .45]
        ]
    },

    s: {
        bands: [
            [3000, .20],
            [5000, .35],
            [8000, .45]
        ]
    },

    z: {
        bands: [
            [3000, .20],
            [5000, .35],
            [8000, .45]
        ]
    },

    m: {
        bands: [
            [250, .45],
            [500, .40],
            [1000, .15]
        ]
    },

    n: {
        bands: [
            [500, .40],
            [1000, .35],
            [2000, .25]
        ]
    },

    l: {
        bands: [
            [500, .25],
            [1000, .40],
            [2000, .35]
        ]
    },

    r: {
        bands: [
            [500, .25],
            [1500, .40],
            [2500, .35]
        ]
    },

    h: {
        bands: [
            [1500, .30],
            [3000, .40],
            [5000, .30]
        ]
    },

    a: {
        bands: [
            [700, .35],
            [1200, .35],
            [2500, .30]
        ]
    },

    e: {
        bands: [
            [500, .35],
            [1800, .45],
            [2500, .20]
        ]
    },

    i: {
        bands: [
            [300, .25],
            [2300, .50],
            [3000, .25]
        ]
    },

    o: {
        bands: [
            [500, .35],
            [900, .40],
            [2500, .25]
        ]
    },

    u: {
        bands: [
            [350, .35],
            [900, .45],
            [2200, .20]
        ]
    },

    y: {
        bands: [
            [300, .25],
            [1800, .45],
            [2500, .30]
        ]
    }
};


/* ---------------------------------------------------------
   AUDIOGRAM
--------------------------------------------------------- */

function interpolateLoss(
    frequency,
    losses,
    frequencies
) {

    if (!losses || !frequencies) {
        return 0;
    }

    if (frequency <= frequencies[0]) {
        return losses[0];
    }

    if (
        frequency >=
        frequencies[frequencies.length - 1]
    ) {
        return losses[losses.length - 1];
    }


    for (
        let i = 0;
        i < frequencies.length - 1;
        i++
    ) {

        const f1 =
            frequencies[i];

        const f2 =
            frequencies[i + 1];

        if (
            frequency >= f1 &&
            frequency <= f2
        ) {

            /*
             * Audiograms are conventionally plotted
             * on a logarithmic frequency axis.
             */

            const x =
                (
                    Math.log2(frequency) -
                    Math.log2(f1)
                ) /
                (
                    Math.log2(f2) -
                    Math.log2(f1)
                );

            return (
                losses[i] +
                x *
                (
                    losses[i + 1] -
                    losses[i]
                )
            );
        }
    }

    return 0;
}


/* ---------------------------------------------------------
   PHONEME AUDIBILITY
--------------------------------------------------------- */

function phonemeAudibility(
    phoneme,
    leftLoss,
    rightLoss,
    frequencies
) {

    const profile =
        PHONEMES[phoneme];

    if (!profile) {
        return 1;
    }

    let result = 0;

    for (
        const [frequency, weight]
        of profile.bands
    ) {

        const left =
            interpolateLoss(
                frequency,
                leftLoss,
                frequencies
            );

        const right =
            interpolateLoss(
                frequency,
                rightLoss,
                frequencies
            );

        /*
         * Bilateral average.
         *
         * This is deliberately a simple perceptual
         * approximation rather than a clinical
         * binaural model.
         */

        const loss =
            (left + right) / 2;


        /*
         * Smooth audibility function.
         */

        const available =
            Math.max(
                0,
                Math.min(
                    1,
                    1 - loss / 60
                )
            );

        result +=
            weight * available;
    }

    return result;
}


/* ---------------------------------------------------------
   PHONEME RECOGNITION PROBABILITY
--------------------------------------------------------- */

function recognitionProbability(
    audibility
) {

    const midpoint = 0.45;
    const slope = 8;

    return (
        1 /
        (
            1 +
            Math.exp(
                -slope *
                (
                    audibility -
                    midpoint
                )
            )
        )
    );
}


/* ---------------------------------------------------------
   CHARACTER → APPROXIMATE PHONEME
--------------------------------------------------------- */

function characterPhoneme(
    character
) {

    const c =
        character.toLowerCase();

    if (
        "abcdefghijklmnopqrstuvwxyzäöü"
        .includes(c)
    ) {
        return c;
    }

    return null;
}


/* ---------------------------------------------------------
   DEGRADE TRANSCRIPT
--------------------------------------------------------- */

export function simulateSpeechPerception(
    transcript,
    leftLoss,
    rightLoss,
    frequencies
) {

    if (!transcript) {
        return "";
    }


    return transcript
        .split("")
        .map(character => {

            const phoneme =
                characterPhoneme(
                    character
                );


            /*
             * Spaces and punctuation survive.
             */

            if (!phoneme) {
                return character;
            }


            const audibility =
                phonemeAudibility(
                    phoneme,
                    leftLoss,
                    rightLoss,
                    frequencies
                );


            const probability =
                recognitionProbability(
                    audibility
                );


            /*
             * Don't make high-frequency consonants
             * disappear deterministically.
             */

            if (
                Math.random() >
                probability
            ) {

                return "·";
            }


            return character;
        })
        .join("");
}


/* ---------------------------------------------------------
   UI
--------------------------------------------------------- */

export function createSpeechUI({
    getAudioBuffer,
    getAudiogram
}) {

    const container =
        document.createElement(
            "div"
        );

    container.id =
        "speechPerception";

    container.innerHTML = `

        <hr>

        <h2>Speech perception</h2>

        <p>
            Transcribe the audio currently loaded
            in the simulator.
        </p>

        <button id="transcribeAudioButton">
            Transcribe loaded audio
        </button>

        <div
            id="speechStatus"
            style="margin-top:10px"
        ></div>

        <div
            style="
                margin-top:15px;
                padding:12px;
                border:1px solid #ccc;
                border-radius:8px;
            "
        >
            <strong>Transcript</strong>

            <div
                id="speechTranscript"
                style="margin-top:8px"
            ></div>
        </div>

        <div
            style="
                margin-top:15px;
                padding:12px;
                border:1px solid #ccc;
                border-radius:8px;
            "
        >
            <strong>
                Simulated speech perception
            </strong>

            <div
                id="speechHeard"
                style="
                    margin-top:8px;
                    font-size:1.25em;
                "
            ></div>
        </div>
    `;


    /*
     * Put it at the end of the main page.
     */

    document.body.appendChild(
        container
    );


    const button =
        document.getElementById(
            "transcribeAudioButton"
        );

    const status =
        document.getElementById(
            "speechStatus"
        );

    const transcriptElement =
        document.getElementById(
            "speechTranscript"
        );

    const heardElement =
        document.getElementById(
            "speechHeard"
        );


    button.onclick =
        async () => {

            try {

                const audio =
                    getAudioBuffer();

                if (!audio) {

                    status.textContent =
                        "Load an audio file first.";

                    return;
                }


                button.disabled = true;


                const result =
                    await transcribeAudioBuffer(
                        audio,
                        status
                    );


                const transcript =
                    result.text.trim();


                transcriptElement.textContent =
                    transcript;


                const audiogram =
                    getAudiogram();


                const heard =
                    simulateSpeechPerception(
                        transcript,
                        audiogram.left,
                        audiogram.right,
                        audiogram.frequencies
                    );


                heardElement.textContent =
                    heard;


                status.textContent =
                    "Done.";

            } catch (error) {

                console.error(
                    "Speech transcription error:",
                    error
                );

                status.textContent =
                    "Speech recognition failed: " +
                    error.message;

            } finally {

                button.disabled = false;
            }
        };


    return container;
}
