export function fft(re, im) {

    const n = re.length;

    if (n <= 1) return;


    // bit reversal
    let j = 0;

    for (let i = 1; i < n; i++) {

        let bit = n >> 1;

        while (j & bit) {
            j ^= bit;
            bit >>= 1;
        }

        j ^= bit;

        if (i < j) {

            [re[i], re[j]] =
            [re[j], re[i]];

            [im[i], im[j]] =
            [im[j], im[i]];

        }

    }


    for (
        let len = 2;
        len <= n;
        len <<= 1
    ) {

        const angle =
            -2 * Math.PI / len;


        const wlenR =
            Math.cos(angle);

        const wlenI =
            Math.sin(angle);


        for (
            let i = 0;
            i < n;
            i += len
        ) {

            let wr = 1;
            let wi = 0;


            for (
                let j = 0;
                j < len / 2;
                j++
            ) {

                const uR = re[i+j];
                const uI = im[i+j];


                const vR =
                    re[i+j+len/2] * wr -
                    im[i+j+len/2] * wi;


                const vI =
                    re[i+j+len/2] * wi +
                    im[i+j+len/2] * wr;


                re[i+j] =
                    uR + vR;

                im[i+j] =
                    uI + vI;


                re[i+j+len/2] =
                    uR - vR;

                im[i+j+len/2] =
                    uI - vI;


                const nextWr =
                    wr*wlenR -
                    wi*wlenI;


                wi =
                    wr*wlenI +
                    wi*wlenR;

                wr = nextWr;

            }

        }

    }

}



export function ifft(re, im) {

    for(let i=0;i<re.length;i++){
        im[i] = -im[i];
    }


    fft(re, im);


    for(let i=0;i<re.length;i++){

        re[i] /= re.length;
        im[i] /= re.length;

    }

}
