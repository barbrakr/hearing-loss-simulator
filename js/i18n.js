en: {
    title: "Hearing Loss Simulator",
    original: "Original",
    hearingLoss: "Hearing Loss",
    difference: "Difference",
    spectrograms: "Spectrograms",
    play: "Play",
    stop: "Stop",
    process: "Process",
    uploadAudio: "Upload audio",
    selectNoise: "Select background noise",
    speechRecognition: "Speech recognition",
    processing: "Processing...",
    finished: "Finished"
},

de: {
    title: "Hörverlust-Simulator",
    original: "Original",
    hearingLoss: "Hörverlust",
    difference: "Unterschied",
    spectrograms: "Spektrogramme",
    play: "Abspielen",
    stop: "Stopp",
    process: "Verarbeiten",
    uploadAudio: "Audiodatei hochladen",
    selectNoise: "Hintergrundgeräusch auswählen",
    speechRecognition: "Spracherkennung",
    processing: "Verarbeitung...",
    finished: "Fertig"
}

export function setLanguage(language) {

    document
        .querySelectorAll("[data-i18n]")
        .forEach(element => {

            const key =
                element.dataset.i18n;

            if(translations[language]?.[key]){

                element.textContent =
                    translations[language][key];

            }

        });

}

export { translations };
