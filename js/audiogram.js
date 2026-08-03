export const frequencies = [
    125,
    250,
    500,
    1000,
    1500,
    2000,
    3000,
    4000,
    6000,
    8000,
    10000
];

export let leftLoss = [
    10,11,15,35,55,53,56,44,28,18,13
];

export let rightLoss = [
    10,11,15,35,55,53,56,44,28,18,13
];

export function createAudiogram(){

    let html = `
    <table>
        <tr>
            <th>Frequency (Hz)</th>
            <th>Left Ear (dB HL)</th>
            <th>Right Ear (dB HL)</th>
        </tr>
    `;

    for(let i=0;i<frequencies.length;i++){

        html += `
        <tr>

            <td>${frequencies[i]}</td>

            <td>
                <input
                    class="leftLoss"
                    type="number"
                    min="0"
                    max="120"
                    value="${leftLoss[i]}">
            </td>

            <td>
                <input
                    class="rightLoss"
                    type="number"
                    min="0"
                    max="120"
                    value="${rightLoss[i]}">
            </td>

        </tr>
        `;
    }

    html += "</table>";

    document.getElementById("audiogram").innerHTML = html;
}

export function getLeftLoss(){

    return [...document.querySelectorAll(".leftLoss")]
        .map(x => Number(x.value));

}

export function getRightLoss(){

    return [...document.querySelectorAll(".rightLoss")]
        .map(x => Number(x.value));

}
