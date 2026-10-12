
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

    // Backwards-compatible: accept one noise buffer or many.
    const noises = noise
        ? (Array.isArray(noise) ? noise : [noise])
        : [];

    for (let ch = 0; ch < result.numberOfChannels; ch++) {
        const out = result.getChannelData(ch);
        const source = main.getChannelData(ch);

        const noiseLayers = noises.map(buffer => ({
            data: buffer.getChannelData(
                Math.min(ch, buffer.numberOfChannels - 1)
            )
        }));

        const foregroundData = foreground
            ? foreground.getChannelData(
                Math.min(ch, foreground.numberOfChannels - 1)
            )
            : null;

        for (let i = 0; i < length; i++) {
            let sample = source[i];

            for (const layer of noiseLayers) {
                if (i < layer.data.length) {
                    sample += layer.data[i] * noiseLevel;
                }
            }

            if (foregroundData && i < foregroundData.length) {
                sample += foregroundData[i] * foregroundLevel;
            }

            out[i] = Math.max(-1, Math.min(1, sample));
        }
    }

    return result;
}
