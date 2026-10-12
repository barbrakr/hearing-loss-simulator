
export function mixBuffers(
    main,
    noise,
    foreground,
    noiseLevel,
    foregroundLevel
) {
    const length = main.length;

    const result = new AudioBuffer({
        length,
        numberOfChannels: main.numberOfChannels,
        sampleRate: main.sampleRate
    });

    for (let ch = 0; ch < result.numberOfChannels; ch++) {
        const out = result.getChannelData(ch);
        const source = main.getChannelData(ch);

        const noiseData = noise
            ? noise.getChannelData(
                Math.min(ch, noise.numberOfChannels - 1)
            )
            : null;

        const foregroundData = foreground
            ? foreground.getChannelData(
                Math.min(ch, foreground.numberOfChannels - 1)
            )
            : null;

        for (let i = 0; i < length; i++) {
            out[i] =
                source[i]
                + (noiseData ? noiseData[i] * noiseLevel : 0)
                + (foregroundData ? foregroundData[i] * foregroundLevel : 0);

            out[i] = Math.max(-1, Math.min(1, out[i]));
        }
    }

    return result;
}
