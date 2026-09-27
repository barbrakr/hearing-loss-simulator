import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";


// ------------------------------------------------------------
// Whisper
// ------------------------------------------------------------

const MODEL = "onnx-community/whisper-small";

let transcriber = null;
let loadingPromise = null;


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

        /*
         * Use WebGPU when available.
         * Fall back to WASM otherwise.
         */
        const device =
            navigator.gpu ? "webgpu" : "wasm";

        transcriber = await pipeline(
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


// ------------------------------------------------------------
// AudioBuffer -> mono 16 kHz Float32Array
// ------------------------------------------------------------

function audioBufferToMono16k(audioBuffer) {

    const sourceRate =
        audioBuffer.sampleRate;

    const channels =
        audioBuffer.numberOfChannels;

    const inputLength =
        audioBuffer.length;


    /*
     * Downmix all channels to mono.
     */
    const mono =
        new Float32Array(inputLength);

    for (let channel = 0; channel < channels; channel++) {

        const data =
            audioBuffer.getChannelData(channel);

        for (let i = 0; i < inputLength; i++) {

            mono[i] +=
                data[i] / channels;
        }
    }


    const targetRate = 16000;


    if (sourceRate === targetRate) {
        return mono;
    }


    /*
     * Linear resampling.
     *
     * Whisper expects the waveform at 16 kHz.
     */
    const outputLength =
        Math.round(
            mono.length *
            targetRate /
            sourceRate
        );

    const output =
        new Float32Array(outputLength);

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
            mono[left] * (1 - fraction) +
            mono[right] * fraction;
    }


    return output;
}


// ------------------------------------------------------------
// Transcription
// ------------------------------------------------------------

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

        /*
         * Long recordings are processed in overlapping chunks.
         */
        chunk_length_s: 30,

        stride_length_s: 5,

    };


    /*
     * If the user selected a language,
     * constrain Whisper to that language.
     *
     * If language === null,
     * Whisper can auto-detect it.
     */
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


// ------------------------------------------------------------
// Audiogram interpolation
// ------------------------------------------------------------

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


    if (frequency <= frequencies[0]) {
        return losses[0];
    }


    const last =
        frequencies.length - 1;


    if (frequency >= frequencies[last]) {
        return losses[last];
    }


    for (let i = 0; i < last; i++) {

        if (
            frequency >= frequencies[i] &&
            frequency <= frequencies[i + 1]
        ) {

            /*
             * Audiogram frequencies are treated
             * approximately logarithmically.
             */
            const x1 =
                Math.log10(
                    frequencies[i]
                );

            const x2 =
                Math.log10(
                    frequencies[i + 1]
                );

            const x =
                Math.log10(frequency);


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


// ------------------------------------------------------------
// Phoneme / speech-sound profiles
//
// These are approximate perceptual profiles.
// They are NOT a clinical hearing model.
// ------------------------------------------------------------

const phonemeProfiles = {

    // Stops
    p: [[200, 1000]],
    b: [[200, 1500]],

    t: [[2500, 7000]],
    d: [[1500, 5000]],

    k: [[1500, 6000]],
    g: [[1000, 5000]],


    // Fricatives
    f: [[1000, 8000]],
    v: [[500, 5000]],

    s: [[3500, 9000]],
    z: [[2500, 8000]],

    sh: [[1800, 8000]],
    ch: [[2000, 9000]],

    j: [[1500, 6000]],
    h: [[1000, 6000]],


    // Nasals
    m: [[200, 2000]],
    n: [[300, 4000]],
    ng: [[300, 4000]],


    // Liquids
    l: [[300, 5000]],
    r: [[300, 4000]],


    /*
     * Approximate vowel formant regions.
     *
     * These are deliberately broad.
     */

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


    /*
     * German rounded front vowels.
     */

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


// ------------------------------------------------------------
// Audibility of one frequency band
// ------------------------------------------------------------

function bandAudibility(
    band,
    audiogram
) {

    const [
        low,
        high
    ] = band;


    /*
     * Geometric center frequency.
     */
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


    /*
     * For now use the average of both ears.
     *
     * We can later model binaural listening
     * more realistically.
     */
    const averageLoss =
        (
            leftLoss +
            rightLoss
        ) / 2;


    /*
     * Smooth psychometric approximation.
     *
     * 25 dB HL is treated as an approximate
     * midpoint rather than a hard cutoff.
     */
    return 1 / (
        1 +
        Math.exp(
            (averageLoss - 25) / 10
        )
    );
}


// ------------------------------------------------------------
// Phoneme audibility
// ------------------------------------------------------------

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


// ------------------------------------------------------------
// Approximate speech-perception degradation
// ------------------------------------------------------------

function simulateSpeechPerception(
    text,
    audiogram
) {

    let output = "";


    for (const character of text) {

        const lower =
            character.toLowerCase();


        let profile =
            phonemeProfiles[lower];


        /*
         * German umlauts.
         */
        if (lower === "ä") {

            profile =
                phonemeProfiles.ae;

        } else if (lower === "ö") {

            profile =
                phonemeProfiles.oe;

        } else if (lower === "ü") {

            profile =
                phonemeProfiles.ue;
        }


        /*
         * Punctuation, spaces and unknown
         * characters are left unchanged.
         */
        if (!profile) {

            output += character;

            continue;
        }


        const audibility =
            phonemeAudibility(
                profile,
                audiogram
            );


        /*
         * Don't make it completely deterministic.
         */
        const probability =
            Math.max(
                0.05,
                Math.min(
                    0.98,
                    audibility
                )
            );


        output +=
            Math.random() < probability
                ? character
                : "·";
    }


    return output;
}


// ------------------------------------------------------------
// UI
// ------------------------------------------------------------

export function createSpeechUI({
    getAudioBuffer,
    getAudiogram
}) {

    const container =
        document.createElement("section");


    container.className =
        "speech-section";


    container.innerHTML = `
        <h2>Speech Perception</h2>

        <p>
            Transcribe the audio currently loaded
            in the simulator.
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

        <h3>Recognized speech</h3>

        <div
            id="speech-transcript"
            style="
                padding: 12px;
                border: 1px solid #ccc;
                min-height: 40px;
                white-space: pre-wrap;
            "
        ></div>

        <h3>Approximate hearing-loss perception</h3>

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

                /*
                 * IMPORTANT:
                 *
                 * This gets the audio already loaded
                 * by the simulator.
                 *
                 * No microphone is accessed.
                 */
                const audioBuffer =
                    getAudioBuffer();


                if (!audioBuffer) {

                    throw new Error(
                        "Please load an audio file first."
                    );
                }


                /*
                 * Empty string means:
                 * let Whisper detect the language.
                 */
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


                /*
                 * Apply the audiogram-based
                 * approximation to the recognized text.
                 */
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
