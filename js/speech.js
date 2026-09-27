// js/speech.js
//
// Speech-perception layer for the Hearing Loss Simulator.
//
// IMPORTANT:
// SpeechRecognition supplies the linguistic transcription.
// This module then applies an audiogram-dependent phoneme
// degradation model to that transcription.
//
// It is NOT a clinical model and it does not claim that
// an audiogram uniquely predicts an individual's speech
// perception.
//
// The model is intentionally conservative:
// - vowels are degraded according to approximate formant regions
// - consonants are degraded according to their major acoustic
//   cue regions
// - degradation is probabilistic rather than a hard threshold
//
// It uses the audiogram already present in audiogram.js.

import {
    frequencies,
    getLeftLoss,
    getRightLoss
} from "./audiogram.js";


/* -----------------------------------------------------------
   PHONEME / ACOUSTIC-CUE MODEL
   -----------------------------------------------------------

   These are NOT "the frequency of a phoneme".

   They represent approximate regions containing important
   acoustic information for the phoneme.

   The weights are deliberately broad rather than pretending
   that a phoneme has a single frequency.
----------------------------------------------------------- */

const PHONEMES = {

    // ---- German / English-compatible consonants ----

    p: { type: "consonant", bands: [[500, .30], [1500, .45], [3000, .25]] },
    b: { type: "consonant", bands: [[500, .30], [1500, .45], [3000, .25]] },

    t: { type: "consonant", bands: [[1500, .20], [3000, .35], [5000, .45]] },
    d: { type: "consonant", bands: [[1500, .20], [3000, .35], [5000, .45]] },

    k: { type: "consonant", bands: [[1500, .25], [3000, .40], [5000, .35]] },
    g: { type: "consonant", bands: [[1500, .25], [3000, .40], [5000, .35]] },

    f: { type: "consonant", bands: [[1000, .20], [3000, .35], [6000, .45]] },
    v: { type: "consonant", bands: [[1000, .20], [3000, .35], [6000, .45]] },

    s: { type: "consonant", bands: [[3000, .20], [5000, .35], [8000, .45]] },
    z: { type: "consonant", bands: [[3000, .20], [5000, .35], [8000, .45]] },

    sh: { type: "consonant", bands: [[2000, .30], [3500, .40], [6000, .30]] },

    h: { type: "consonant", bands: [[1500, .30], [3000, .40], [5000, .30]] },

    m: { type: "consonant", bands: [[250, .45], [500, .40], [1000, .15]] },
    n: { type: "consonant", bands: [[500, .40], [1000, .35], [2000, .25]] },

    l: { type: "consonant", bands: [[500, .25], [1000, .40], [2000, .35]] },

    r: { type: "consonant", bands: [[500, .25], [1500, .40], [2500, .35]] },

    j: { type: "consonant", bands: [[1500, .30], [2500, .40], [4000, .30]] },

    // German "ch" /x/ and /ç/ are represented approximately.
    ch: { type: "consonant", bands: [[1500, .25], [3000, .35], [5000, .40]] },


    // ---- Vowels ----
    //
    // Vowels are represented by approximate F1/F2/F3
    // regions rather than by a single frequency.

    a: {
        type: "vowel",
        bands: [
            [700, .35],
            [1200, .35],
            [2500, .30]
        ]
    },

    e: {
        type: "vowel",
        bands: [
            [500, .35],
            [1800, .45],
            [2500, .20]
        ]
    },

    i: {
        type: "vowel",
        bands: [
            [300, .25],
            [2300, .50],
            [3000, .25]
        ]
    },

    o: {
        type: "vowel",
        bands: [
            [500, .35],
            [900, .40],
            [2500, .25]
        ]
    },

    u: {
        type: "vowel",
        bands: [
            [350, .35],
            [900, .45],
            [2200, .20]
        ]
    },

    y: {
        type: "vowel",
        bands: [
            [300, .25],
            [1800, .45],
            [2500, .30]
        ]
    },

    ä: {
        type: "vowel",
        bands: [
            [650, .35],
            [1700, .45],
            [2500, .20]
        ]
    },

    ö: {
        type: "vowel",
        bands: [
            [500, .35],
            [1200, .40],
            [2200, .25]
        ]
    },

    ü: {
        type: "vowel",
        bands: [
            [300, .30],
            [1700, .45],
            [2500, .25]
        ]
    }
};


/* -----------------------------------------------------------
   AUDIOGRAM INTERPOLATION
----------------------------------------------------------- */

function interpolateLoss(freq, losses) {

    if (!losses || !losses.length) {
        return 0;
    }

    const points = frequencies.map(
        (f, i) => ({
            frequency: f,
            loss: Number(losses[i]) || 0
        })
    );

    if (freq <= points[0].frequency) {
        return points[0].loss;
    }

    if (freq >= points[points.length - 1].frequency) {
        return points[points.length - 1].loss;
    }

    for (let i = 0; i < points.length - 1; i++) {

        const a = points[i];
        const b = points[i + 1];

        if (freq >= a.frequency && freq <= b.frequency) {

            // Audiometric frequency is logarithmic.
            const x =
                (Math.log2(freq) - Math.log2(a.frequency)) /
                (Math.log2(b.frequency) - Math.log2(a.frequency));

            return a.loss + x * (b.loss - a.loss);
        }
    }

    return 0;
}


/* -----------------------------------------------------------
   PHONEME AUDIBILITY
----------------------------------------------------------- */

function getPhonemeAudibility(phoneme, losses) {

    const profile = PHONEMES[phoneme];

    if (!profile) {
        return 1;
    }

    let total = 0;

    for (const [frequency, weight] of profile.bands) {

        const loss =
            interpolateLoss(frequency, losses);

        /*
         * This is a simplified audibility transform.
         *
         * 0 dB HL -> 1
         * 30 dB HL -> ~0.5
         * 60 dB HL -> ~0
         *
         * We do not interpret this as a clinical
         * speech-recognition score.
         */

        const audibility =
            Math.max(
                0,
                Math.min(
                    1,
                    1 - loss / 60
                )
            );

        total += audibility * weight;
    }

    return Math.max(0, Math.min(1, total));
}


/* -----------------------------------------------------------
   PSYCHOMETRIC TRANSFORM
----------------------------------------------------------- */

function recognitionProbability(audibility) {

    /*
     * Smooth rather than a hard cutoff.
     *
     * This prevents:
     *
     *     39 dB = perfect
     *     40 dB = disappears
     *
     * which would be physiologically unrealistic.
     */

    const midpoint = 0.45;
    const slope = 8;

    return 1 /
        (
            1 +
            Math.exp(
                -slope * (audibility - midpoint)
            )
        );
}


/* -----------------------------------------------------------
   ORTHOGRAPHY → APPROXIMATE PHONEME
----------------------------------------------------------- */

function characterToPhoneme(char, nextChar = "") {

    const c = char.toLowerCase();

    // Digraphs are handled by the caller.
    if (c === "s") return "s";
    if (c === "z") return "z";

    if (c === "p") return "p";
    if (c === "b") return "b";

    if (c === "t") return "t";
    if (c === "d") return "d";

    if (c === "k") return "k";
    if (c === "g") return "g";

    if (c === "f") return "f";
    if (c === "v") return "v";

    if (c === "m") return "m";
    if (c === "n") return "n";

    if (c === "l") return "l";
    if (c === "r") return "r";

    if (c === "h") return "h";
    if (c === "j") return "j";

    if ("aeiouyäöü".includes(c)) {
        return c;
    }

    return null;
}


/* -----------------------------------------------------------
   BLUR A SINGLE WORD
----------------------------------------------------------- */

function degradeWord(word, leftLoss, rightLoss) {

    const result = [];

    /*
     * For speech perception we use the average bilateral
     * loss by default.
     *
     * This corresponds to a central/listener-level display,
     * not a binaural auditory model.
     */
    const losses = leftLoss.map(
        (left, i) =>
            (
                Number(left) +
                Number(rightLoss[i] ?? left)
            ) / 2
    );

    for (let i = 0; i < word.length; i++) {

        const char = word[i];

        /*
         * Preserve punctuation/numbers.
         */
        if (!/[A-Za-zÄÖÜäöüß]/.test(char)) {
            result.push(char);
            continue;
        }

        /*
         * Handle common high-information digraphs.
         */
        const pair =
            word.slice(i, i + 2).toLowerCase();

        if (
            pair === "ch" &&
            PHONEMES.ch
        ) {

            const audibility =
                getPhonemeAudibility(
                    "ch",
                    losses
                );

            const p =
                recognitionProbability(
                    audibility
                );

            result.push(
                Math.random() < p
                    ? pair
                    : "·"
            );

            i++;
            continue;
        }

        const phoneme =
            characterToPhoneme(
                char
            );

        if (!phoneme) {
            result.push(char);
            continue;
        }

        const audibility =
            getPhonemeAudibility(
                phoneme,
                losses
            );

        const probability =
            recognitionProbability(
                audibility
            );

        /*
         * Very low audibility:
         * completely replace the character.
         */
        if (probability < 0.15) {

            result.push("·");
            continue;
        }

        /*
         * Intermediate audibility:
         * make the phoneme uncertain.
         */
        if (probability < 0.40) {

            result.push(
                Math.random() < probability
                    ? char
                    : "·"
            );

            continue;
        }

        /*
         * Above this point the phoneme normally survives.
         */
        result.push(char);
    }

    return result.join("");
}


/* -----------------------------------------------------------
   BLUR COMPLETE TRANSCRIPT
----------------------------------------------------------- */

export function simulateSpeechPerception(
    transcript,
    leftLoss = getLeftLoss(),
    rightLoss = getRightLoss()
) {

    if (!transcript) {
        return "";
    }

    return transcript
        .split(/(\s+)/)
        .map(token => {

            if (/^\s+$/.test(token)) {
                return token;
            }

            return degradeWord(
                token,
                leftLoss,
                rightLoss
            );
        })
        .join("");
}


/* -----------------------------------------------------------
   UI
----------------------------------------------------------- */

function createSpeechUI() {

    if (document.getElementById("speechPerception")) {
        return;
    }

    const section =
        document.createElement("section");

    section.id =
        "speechPerception";

    section.innerHTML = `
        <hr>

        <h2>Speech perception</h2>

        <p>
            Speak into your microphone. The transcript below
            is then degraded according to the current audiogram.
        </p>

        <button id="speechStart">
            Start speech recognition
        </button>

        <button id="speechStop" disabled>
            Stop
        </button>

        <div style="
            margin-top:15px;
            padding:15px;
            border:1px solid #ccc;
            border-radius:8px;
        ">
            <strong>Recognized:</strong>
            <div id="speechRaw"
                 style="margin-top:8px;"></div>
        </div>

        <div style="
            margin-top:15px;
            padding:15px;
            border:1px solid #ccc;
            border-radius:8px;
            font-size:1.25em;
        ">
            <strong>Simulated perception:</strong>
            <div id="speechHeard"
                 style="margin-top:8px;"></div>
        </div>

        <div id="speechStatus"
             style="margin-top:10px;">
        </div>
    `;

    document.body.appendChild(section);


    const startButton =
        document.getElementById(
            "speechStart"
        );

    const stopButton =
        document.getElementById(
            "speechStop"
        );

    const rawOutput =
        document.getElementById(
            "speechRaw"
        );

    const heardOutput =
        document.getElementById(
            "speechHeard"
        );

    const speechStatus =
        document.getElementById(
            "speechStatus"
        );


    const Recognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!Recognition) {

        speechStatus.textContent =
            "Speech recognition is not supported by this browser.";

        startButton.disabled = true;

        return;
    }


    const recognition =
        new Recognition();

    recognition.continuous = true;

    recognition.interimResults = true;

    /*
     * Your sample material is German, so default to German.
     *
     * Change this to "en-US" for English material.
     */
    recognition.lang = "de-DE";


    recognition.onstart = () => {

        startButton.disabled = true;
        stopButton.disabled = false;

        speechStatus.textContent =
            "Listening...";
    };


    recognition.onend = () => {

        startButton.disabled = false;
        stopButton.disabled = true;

        speechStatus.textContent =
            "Recognition stopped.";
    };


    recognition.onerror = event => {

        console.error(
            "Speech recognition error:",
            event.error
        );

        speechStatus.textContent =
            "Speech recognition error: " +
            event.error;
    };


    recognition.onresult = event => {

        let transcript = "";

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            transcript +=
                event.results[i][0].transcript;
        }


        rawOutput.textContent =
            transcript;


        /*
         * Read the CURRENT audiogram every time.
         *
         * This means you can move an audiogram point
         * while speech recognition is running and the
         * next transcript is degraded using the new values.
         */
        const left =
            getLeftLoss();

        const right =
            getRightLoss();


        heardOutput.textContent =
            simulateSpeechPerception(
                transcript,
                left,
                right
            );
    };


    startButton.onclick = () => {

        try {
            recognition.start();
        } catch (error) {

            console.error(error);

        }
    };


    stopButton.onclick = () => {

        recognition.stop();
    };
}


/* -----------------------------------------------------------
   INITIALIZE
----------------------------------------------------------- */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        createSpeechUI
    );

} else {

    createSpeechUI();

}
