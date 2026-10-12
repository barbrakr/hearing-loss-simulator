export function mixBuffers(
    main,
    noise,
    foreground,
    noiseLevel = 0,
    foregroundLevel = 0
) {
    const length = main.length;

    const result = new AudioBuffer({
        length,
        numberOfChannels: main.numberOfChannels,
        sampleRate: main.sampleRate
    });

    // Accept either one noise buffer or an array of buffers.
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

            // Mix all selected background noise layers.
            for (const layer of noiseLayers) {
                if (i < layer.data.length) {
                    sample += layer.data[i] * noiseLevel;
                }
            }

            // Mix optional foreground / tinnitus.
            if (foregroundData && i < foregroundData.length) {
                sample += foregroundData[i] * foregroundLevel;
            }

            // Keep samples within the valid audio range.
            out[i] = Math.max(-1, Math.min(1, sample));
        }
    }

    return result;
}
