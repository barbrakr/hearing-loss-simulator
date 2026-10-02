import {
    pipeline
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";


const MODEL =
    "onnx-community/whisper-small";

let transcriber = null;
let loadingPromise = null;


/* =========================================================
   WHISPER
========================================================= */

async function getTranscriber(statusElement) {

    if (transcriber) {
        return transcriber;
    }

    if (loadingPromise) {
        return loadingPromise;
    }

    loadingPromise = (async () => {

        statusElement.textContent =
            "Loading speech recognition model…";

        const device =
            navigator.gpu
                ? "webgpu"
                : "wasm";

        transcriber =
            await pipeline(
                "automatic-speech-recognition",
                MODEL,
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


/* =========================================================
   AUDIO BUFFER → MONO 16 kHz
========================================================= */

function audioBufferToMono16k(audioBuffer) {

    const sourceRate =
        audioBuffer.sampleRate;

    const channels =
        audioBuffer.numberOfChannels;

    const inputLength =
        audioBuffer.length;


    /*
     * Downmix to mono.
     */

    const mono =
        new Float32Array(
            inputLength
        );


    for (
        let channel = 0;
        channel < channels;
        channel++
    ) {

        const data =
            audioBuffer.getChannelData(
                channel
            );

        for (
            let i = 0;
            i < inputLength;
            i++
        ) {

            mono[i] +=
                data[i] / channels;
        }
    }


    const targetRate = 16000;


    if (
        sourceRate === targetRate
    ) {
        return mono;
    }


    /*
     * Linear resampling to 16 kHz.
     */

    const outputLength =
        Math.round(
            mono.length *
            targetRate /
            sourceRate
        );


    const output =
        new Float32Array(
            outputLength
        );


    const ratio =
        sourceRate / targetRate;


    for (
        let i = 0;
        i < outputLength;
        i++
    ) {

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


/* =========================================================
   TRANSCRIPTION
========================================================= */

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
        language
            ? `Transcribing ${language} audio…`
            : "Detecting language and transcribing…";


    const options = {

        chunk_length_s: 30,

        stride_length_s: 5
    };


    if (language) {

        options.language =
            language;

        options.task =
            "transcribe";
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


/* =========================================================
   AUDIOGRAM INTERPOLATION
========================================================= */

function interpolateLoss(
    frequency,
    frequencies,
    losses
) {

    if (
        !frequencies ||
        !losses ||
        frequencies.length === 0 ||
        losses.length === 0
    ) {
        return 0;
    }


    if (
        frequency <= frequencies[0]
    ) {
        return losses[0];
    }


    const last =
        frequencies.length - 1;


    if (
        frequency >= frequencies[last]
    ) {
        return losses[last];
    }


    for (
        let i = 0;
        i < last;
        i++
    ) {

        if (
            frequency >= frequencies[i] &&
            frequency <= frequencies[i + 1]
        ) {

            const x1 =
                Math.log10(
                    frequencies[i]
                );

            const x2 =
                Math.log10(
                    frequencies[i + 1]
                );

            const x =
                Math.log10(
                    frequency
                );


            const fraction =
                (x - x1) /
                (x2 - x1);


            return (
                losses[i] +
                fraction *
                (
                    losses[i + 1] -
                    losses[i]
                )
            );
        }
    }


    return 0;
}


/* =========================================================
   SPEECH SOUND PROFILES
========================================================= */

const phonemeProfiles = {

    p: [[200, 1000]],
    b: [[200, 1500]],

    t: [[2500, 7000]],
    d: [[1500, 5000]],

    k: [[1500, 6000]],
    g: [[1000, 5000]],

    f: [[1000, 8000]],
    v: [[500, 5000]],

    s: [[3500, 9000]],
    z: [[2500, 8000]],

    sh: [[1800, 8000]],
    ch: [[2000, 9000]],

    j: [[1500, 6000]],
    h: [[1000, 6000]],

    m: [[200, 2000]],
    n: [[300, 4000]],

    l: [[300, 5000]],
    r: [[300, 4000]],

    a: [
        [600, 1200],
        [1000, 1800],
        [2000, 3500]
    ],

    e: [
        [400, 800],
        [1700, 2600],
        [2500, 3500]
    ],

    i: [
        [250, 500],
        [2000, 3500],
        [3000, 4500]
    ],

    o: [
        [300, 700],
        [700, 1200],
        [2200, 3500]
    ],

    u: [
        [250, 500],
        [500, 1100],
        [2000, 3000]
    ],

    ae: [
        [300, 700],
        [1400, 2200],
        [2500, 3500]
    ],

    oe: [
        [300, 600],
        [900, 1600],
        [2200, 3500]
    ],

    ue: [
        [250, 500],
        [1200, 2200],
        [2500, 4000]
    ]
};


/* =========================================================
   AUDIBILITY
========================================================= */

function bandAudibility(
    band,
    audiogram
) {

    const low =
        band[0];

    const high =
        band[1];


    const center =
        Math.sqrt(
            low * high
        );


    const leftLoss =
        interpolateLoss(
            center,
            audiogram.frequencies,
            audiogram.left
        );


    const rightLoss =
        interpolateLoss(
            center,
            audiogram.frequencies,
            audiogram.right
        );


    const averageLoss =
        (
            leftLoss +
            rightLoss
        ) / 2;


    return 1 /
        (
            1 +
            Math.exp(
                (averageLoss - 25) / 10
            )
        );
}


function phonemeAudibility(
    profile,
    audiogram
) {

    if (!profile) {
        return 0.7;
    }


    const values =
        profile.map(
            band =>
                bandAudibility(
                    band,
                    audiogram
                )
        );


    return (
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        ) / values.length
    );
}


/* =========================================================
   APPROXIMATE PERCEPTION
========================================================= */


function simulateSpeechPerception(text, audiogram) {
    let output = "";

    for (const character of text) {
        const lower = character.toLowerCase();

        let profile = phonemeProfiles[lower];

        if (lower === "ä") {
            profile = phonemeProfiles.ae;
        } else if (lower === "ö") {
            profile = phonemeProfiles.oe;
        } else if (lower === "ü") {
            profile = phonemeProfiles.ue;
        }

        // Preserve spaces, punctuation and unknown characters
        if (!profile) {
            output += character;
            continue;
        }

        const audibility = phonemeAudibility(profile, audiogram);

        // Map audibility to a gentler masking probability
        const hearingDifficulty = Math.max(
            0,
            Math.min(1, 1 - audibility)
        );

        const maskingProbability = Math.pow(
            hearingDifficulty,
            2
        ) * 0.35;

        output += Math.random() < maskingProbability
            ? "·"
            : character;
    }

    return output;
}


/* =========================================================
   SPEECH UI
========================================================= */

export function createSpeechUI({
    getAudioBuffer,
    getAudiogram
}) {

    /*
     * IMPORTANT:
     *
     * The section is created here.
     * No HTML container is required.
     */

    const container =
        document.createElement(
            "section"
        );


    container.className =
        "speech-section";


    container.innerHTML = `

        <h2>Speech Perception</h2>

        <p>
            Transcribe the audio currently
            loaded in the simulator.
        </p>

        <label for="speech-language">
            Language:
        </label>

        <select id="speech-language">

            <option value="" selected>
                Auto-detect
            </option>

            <option value="german">
                Deutsch
            </option>

            <option value="english">
                English
            </option>

        </select>

        <br><br>

        <button id="transcribe-audio">
            Transcribe loaded audio
        </button>

        <p id="speech-status"></p>

        <h3>Recognized speech [!SIMULATION - NOT READY YET!]</h3>

        <div
            id="speech-transcript"
            style="
                padding: 12px;
                border: 1px solid #ccc;
                min-height: 40px;
                white-space: pre-wrap;
            "
        ></div>

        <h3>
            Approximate hearing-loss perception
        </h3>

        <div
            id="speech-perception"
            style="
                padding: 12px;
                border: 1px solid #ccc;
                min-height: 40px;
                white-space: pre-wrap;
            "
        ></div>
    `;


    /*
     * Append the section BEFORE querying
     * anything inside it.
     */

    document.body.appendChild(
        container
    );


    const button =
        container.querySelector(
            "#transcribe-audio"
        );

    const status =
        container.querySelector(
            "#speech-status"
        );

    const transcript =
        container.querySelector(
            "#speech-transcript"
        );

    const perception =
        container.querySelector(
            "#speech-perception"
        );

    const languageSelect =
        container.querySelector(
            "#speech-language"
        );


    button.addEventListener(
        "click",
        async () => {

            button.disabled = true;

            transcript.textContent = "";
            perception.textContent = "";


            try {

                const audioBuffer =
                    getAudioBuffer();


                if (!audioBuffer) {

                    throw new Error(
                        "Please load an audio file first."
                    );
                }


                const language =
                    languageSelect.value ||
                    null;


                const result =
                    await transcribeAudioBuffer(
                        audioBuffer,
                        status,
                        language
                    );


                transcript.textContent =
                    result.text || "";


                const audiogram =
                    getAudiogram();


                if (
                    audiogram &&
                    result.text
                ) {

                    perception.textContent =
                        simulateSpeechPerception(
                            result.text,
                            audiogram
                        );
                }


            } catch (error) {

                console.error(
                    "Speech recognition error:",
                    error
                );


                status.textContent =
                    "Speech recognition failed.";


                transcript.textContent =
                    error.message;


            } finally {

                button.disabled = false;
            }
        }
    );
}
