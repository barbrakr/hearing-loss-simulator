const translations = {

    en: {
        title: "Hearing Loss Simulator",

        about: "Introduction",

        about_text1: `
            This is an educational tool for individuals with normal hearing
            on specific hearing loss outcomes using concrete audio, spectrogram
            and speech perception measures. In order to use this tool effectively,
            please first make sure that your own hearing is within a normal
            -5 to 19 decibel hearing level range, i.e. by using the tool provided
            by Stéphane Pigeon available
            <a href="https://hearingtest.online" target="_blank" rel="noopener noreferrer">
                as a web-based hearingtest
            </a>
            or use the Mimi hearing test app available
            <a href="https://mimi.io/products/mimi-hearing-test-app" target="_blank" rel="noopener noreferrer">
                as the Mimi hearing test app
            </a>
            (both last accessed on October 4th, 2026).
        `,

        about_text2: `
            After ensuring you have normal hearing yourself, you may use this
            website app as an educational tool to understand the hearing loss
            of your loved one through entering the audiogram interactively and
            even uploading your own audio examples (or choose a pre-recorded
            one from the drop-down). None of the data is saved, so if you would
            like to keep a copy for future reference, please screenshot the
            data and save it locally.
        `,

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

        about_text1: `
            Diese Website-App dient als Bildungswerkzeug für Menschen mit
            normalem Hörvermögen, um die Auswirkungen bestimmter Hörverluste
            anhand konkreter Audio-, Spektrogramm- und Sprachwahrnehmungswerte
            zu verstehen. Um dieses Werkzeug effektiv zu nutzen, stellen Sie
            bitte zunächst sicher, dass Ihr eigenes Hörvermögen innerhalb eines
            normalen Bereichs von -5 bis 19 Dezibel Hörlevel liegt, beispielsweise
            mithilfe des von Stéphane Pigeon zur Verfügung gestellten
            <a href="https://hearingtest.online" target="_blank" rel="noopener noreferrer">
                webbasierten Hörtests
            </a>
            oder mithilfe der
            <a href="https://mimi.io/products/mimi-hearing-test-app" target="_blank" rel="noopener noreferrer">
                Mimi Hörtest App
            </a>
            (beide zuletzt am 4. Oktober 2026 aufgerufen).
        `,

        about_text2: `
            Sobald Sie sichergestellt haben, dass Sie selbst normalhörend sind,
            können Sie diese Website-App als Bildungswerkzeug verwenden, um den
            Hörverlust Ihres Angehörigen besser nachzuvollziehen. Dazu können
            Sie das Audiogramm interaktiv eingeben und eigene Audiobeispiele
            hochladen oder ein bereits aufgenommenes Beispiel aus dem Drop-down-
            Menü auswählen. Es werden keine Daten gespeichert. Wenn Sie eine
            Kopie für eine spätere Verwendung aufbewahren möchten, erstellen
            Sie bitte einen Screenshot der Daten und speichern Sie ihn lokal.
        `,

        about_text3: "Viel Spaß beim Erkunden!",

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
};


export function setLanguage(language) {

    document
        .querySelectorAll("[data-i18n]")
        .forEach(element => {

            const key = element.dataset.i18n;

            if (element.hasAttribute("data-i18n-html")) {

                element.innerHTML =
                    translations[language][key];

            } else {

                element.textContent =
                    translations[language][key];

            }
        });
}
