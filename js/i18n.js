const translations = {

    en: {

        title: "Hearing Loss Simulator",

        original: "Original",
        hearingLoss: "Hearing Loss",
        difference: "Difference",

        spectrograms: "Spectrograms",

        play: "Play",
        process: "Process"

    },

    de: {

        title: "Hörverlust-Simulator",

        original: "Original",
        hearingLoss: "Hörverlust",
        difference: "Unterschied",

        spectrograms: "Spektrogramme",

        play: "Abspielen",
        process: "Verarbeiten"

    }

};


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
