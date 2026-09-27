import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";

const MODEL = "onnx-community/whisper-small";

let transcriber = null;
let loadingPromise = null;


/* ---------------------------------------------------------
   Whisper model
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
            "Loading speech recognition model…";

        const device = navigator.gpu ? "webgpu" : "wasm";

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


/* ---------------------------------------------------------
   AudioBuffer → mono 16 kHz Float32Array
--------------------------------------------------------- */

async function audioBufferToMono16k(audioBuffer) {
    const targetRate = 16000;

    const offlineContext = new OfflineAudioContext(
        1,
        Math.ceil(audioBuffer.duration * targetRate),
        targetRate
    );

    const source = offlineContext.createBufferSource();

    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start(0);

    const rendered = await offlineContext.startRendering();

    return rendered.getChannelData(0);
}


/* ---------------------------------------------------------
   Transcription
--------------------------------------------------------- */

export async function transcribeAudioBuffer(
    audioBuffer,
    statusElement,
    language = null
) {
    if (!audioBuffer) {
        throw new Error(
            "No audio is available for speech recognition."
        );
    }

    const model = await getTranscriber(statusElement);

    statusElement.textContent =
        "Preparing audio for speech recognition…";

    const audio =
        await audioBufferToMono16k(audioBuffer);

    statusElement.textContent =
        language
            ? `Transcribing ${language} audio…`
            : "Detecting language and transcribing…";

    const options = {
        chunk_length_s: 30,
        stride_length_s: 5
    };

    if (language) {
        options.language = language;
        options.task = "transcribe";
    }

    const result = await model(audio, options);

    statusElement.textContent =
        "Transcription complete.";

    return result;
}


/* ---------------------------------------------------------
   UI
--------------------------------------------------------- */

export function createSpeechUI({
    getAudioBuffer,
    getAudiogram
}) {
    const container =
        document.getElementById("speechRecognition");

    if (!container) {
        console.warn(
            "Speech recognition container not found."
        );
        return;
    }

    container.innerHTML = "";

    const title = document.createElement("h2");
    title.textContent = "Speech perception";

    const description =
        document.createElement("p");

    description.textContent =
        "Transcribe the currently processed audio and compare the result with the audiogram.";

    const controls =
        document.createElement("div");

    controls.className = "speech-controls";


    /* Language */

    const languageLabel =
        document.createElement("label");

    languageLabel.textContent =
        "Language: ";

    const languageSelect =
        document.createElement("select");

    languageSelect.innerHTML = `
        <option value="">Auto-detect</option>
        <option value="german">Deutsch</option>
        <option value="english">English</option>
    `;

    languageLabel.appendChild(languageSelect);


    /* Button */

    const button =
        document.createElement("button");

    button.textContent =
        "Transcribe processed audio";


    /* Status */

    const status =
        document.createElement("p");

    status.textContent =
        "Ready.";


    /* Transcript */

    const transcriptTitle =
        document.createElement("h3");

    transcriptTitle.textContent =
        "Recognized speech";

    const transcript =
        document.createElement("div");

    transcript.className =
        "speech-transcript";

    transcript.textContent =
        "—";


    /* Audiogram perception */

    const perceptionTitle =
        document.createElement("h3");

    perceptionTitle.textContent =
        "Approximate perception";

    const perception =
        document.createElement("div");

    perception.className =
        "speech-perception";

    perception.textContent =
        "—";


    controls.appendChild(languageLabel);
    controls.appendChild(button);

    container.appendChild(title);
    container.appendChild(description);
    container.appendChild(controls);
    container.appendChild(status);
    container.appendChild(transcriptTitle);
    container.appendChild(transcript);
    container.appendChild(perceptionTitle);
    container.appendChild(perception);


    /* -----------------------------------------------------
       Button
    ----------------------------------------------------- */

    button.addEventListener("click", async () => {
        button.disabled = true;

        transcript.textContent = "—";
        perception.textContent = "—";

        try {
            /*
             * IMPORTANT:
             *
             * app.js now decides which AudioBuffer is sent here.
             *
             * We want the hearing-loss processed buffer,
             * not the original clean recording.
             */
            const audioBuffer =
                getAudioBuffer();

            if (!audioBuffer) {
                throw new Error(
                    "Please load and process an audio file first."
                );
            }

            const language =
                languageSelect.value || null;

            const result =
                await transcribeAudioBuffer(
                    audioBuffer,
                    status,
                    language
                );

            transcript.textContent =
                result.text || "No speech recognized.";


            /* ---------------------------------------------
               Audiogram-based approximate perception
            --------------------------------------------- */

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
                "Speech recognition failed:",
                error
            );

            status.textContent =
                "Speech recognition failed.";

            transcript.textContent =
                error.message ||
                "Unknown error.";

        } finally {
            button.disabled = false;
        }
    });
}


/* ---------------------------------------------------------
   Approximate audiogram-based perception
--------------------------------------------------------- */

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
        const f1 = frequencies[i];
        const f2 = frequencies[i + 1];

        if (
            frequency >= f1 &&
            frequency <= f2
        ) {
            /*
             * Audiograms are logarithmic in frequency,
             * so interpolate on log frequency.
             */

            const x1 = Math.log10(f1);
            const x2 = Math.log10(f2);
            const x = Math.log10(frequency);

            const t =
                (x - x1) /
                (x2 - x1);

            return (
                losses[i] +
                t *
                (losses[i + 1] - losses[i])
            );
        }
    }

    return losses[last];
}


/*
 * Approximate speech-frequency profiles.
 *
 * This is NOT a clinical speech-perception model.
 * It is only used to visualize how the audiogram
 * could affect different speech sounds.
 */

const phonemeProfiles = {
    stops: {
        frequency: 1500,
        phonemes: [
            "p", "b",
            "t", "d",
            "k", "g"
        ]
    },

    fricatives: {
        frequency: 4000,
        phonemes: [
            "f", "v",
            "s", "z",
            "sh", "ch",
            "j", "h"
        ]
    },

    nasals: {
        frequency: 500,
        phonemes: [
            "m", "n",
            "ng"
        ]
    },

    liquids: {
        frequency: 1000,
        phonemes: [
            "l", "r"
        ]
    },

    vowels: {
        frequency: 500,
        phonemes: [
            "a", "e",
            "i", "o", "u",
            "ä", "ö", "ü"
        ]
    }
};


function bandAudibility(
    frequency,
    audiogram
) {
    const leftLoss =
        interpolateLoss(
            frequency,
            audiogram.frequencies,
            audiogram.left
        );

    const rightLoss =
        interpolateLoss(
            frequency,
            audiogram.frequencies,
            audiogram.right
        );

    const averageLoss =
        (leftLoss + rightLoss) / 2;

    /*
     * Approximate probability that this
     * frequency region remains audible.
     */

    return 1 /
        (
            1 +
            Math.exp(
                (averageLoss - 25) / 10
            )
        );
}


function phonemeAudibility(
    phoneme,
    audiogram
) {
    const lower =
        phoneme.toLowerCase();

    for (
        const profile
        of Object.values(phonemeProfiles)
    ) {
        if (
            profile.phonemes.includes(lower)
        ) {
            return bandAudibility(
                profile.frequency,
                audiogram
            );
        }
    }

    /*
     * Unknown characters are left alone.
     */

    return 1;
}


function simulateSpeechPerception(
    text,
    audiogram
) {
    if (!text) {
        return "";
    }

    let result = "";

    for (const character of text) {

        /*
         * Preserve whitespace and punctuation.
         */

        if (
            /\s/.test(character) ||
            /[.,!?;:'"()\-]/.test(character)
        ) {
            result += character;
            continue;
        }

        const audibility =
            phonemeAudibility(
                character,
                audiogram
            );

        /*
         * Only obscure characters when
         * audibility is sufficiently reduced.
         */

        if (
            audibility < 0.5 &&
            Math.random() > audibility
        ) {
            result += "·";
        } else {
            result += character;
        }
    }

    return result;
}
