const translations = {
        en: {
                title: "Hearing Loss Simulator",
                about: "Introduction",
                about_text1: "This is an educational tool for individuals with normal hearing on specific hearing loss outcomes using concrete audio, spectrogram and speech perception measures. In order to use this tool effectively, please first make sure that your own hearing is at a normal -5 to 19 decibel hearing level range, i.e. by using the tool provided by Stéphane Pigeon available here: <a href="https://hearingtest.online">https://hearingtest.online</a> or use the Mimi hearing test app available here: <a href="https://mimi.io/products/mimi-hearing-test-app">https://mimi.io/products/mimi-hearing-test-app</a> (both last accessed on October 4th, 2026).",
                about_text2: "After ensuring you have normal hearing yourself, you may use this website app as an educational tool to understand the hearing loss of your loved one through entering the audiogram interactively and even uploading your own audio examples (or choose a pre-recorded one from the drop-down). None of the data is saved, so if you would like to keep a copy for future reference, please screenshot the data and save it locally.",
                about_text3: "Happy exploring!",
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
                about: "Einführung",
                about_text1: "This is an educational tool for individuals with normal hearing on specific hearing loss outcomes using concrete audio, spectrogram and speech perception measures. In order to use this tool effectively, please first make sure that your own hearing is at a normal -5 to 19 decibel hearing level range, i.e. by using the tool provided by Stéphane Pigeon available here: <a href="https://hearingtest.online">https://hearingtest.online</a> or use the Mimi hearing test app available here: <a href="https://mimi.io/products/mimi-hearing-test-app">https://mimi.io/products/mimi-hearing-test-app</a> (both last accessed on October 4th, 2026).",
                about_text2: "Sobald Sie sichergestellt haben, dass Sie selbst normalhörend sind, können Sie diese Website-App als Bildungswerkzeug verwenden um den Hörverlust ihres Angehörigen durch die interaktive Audiogrammeingabe und den Uploading eigener Audiobeispiele (oder durch die Auswahl eines bereits aufgenommenen Beispiels im Drop-down) besser nachzuvollziehen. Es werden keine Daten gespeichert, also speichern Sie bitte einen lokalen Screenshot für die eigene zukünftige Verwendung.",
                about_text3: "Happy exploring!",
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
