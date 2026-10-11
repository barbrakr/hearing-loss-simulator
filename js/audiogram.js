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


let leftLoss = [
    9,
    10,
    13,
    22,
    34,
    30,
    30,
    30,
    25,
    12,
    16
];


let rightLoss = [
    10,
    11,
    15,
    28,
    34,
    34,
    32,
    31,
    29,
    18,
    13
];



export function getLeftLoss(){

    return leftLoss;

}


export function getRightLoss(){

    return rightLoss;

}



export function createAudiogram(){


    const canvas =
        document.getElementById(
            "audiogramCanvas"
        );


    if(!canvas)
        return;


    const ctx =
        canvas.getContext("2d");



    const width =
        canvas.width;

    const height =
        canvas.height;


    const margin = 50;



    let dragging = null;



    function xPosition(i){

        return margin +
            i *
            (
                (width-margin*2)
                /
                (frequencies.length-1)
            );

    }



    function yPosition(db){

        return margin +
            (
                db / 120
            )
            *
            (
                height-margin*2
            );

    }


    function drawSpeechBanana() {
        
            ctx.save();
        
            // Typische Sprachbereiche, ungefähr in dB HL.
            // x: Frequenz in Hz, y: Pegel in dB HL.
            const regions = [
                {
                    name: "Vowels",
                    color: "#b0b0b0",
                    points: [
                        [250, 35],
                        [250, 10],
                        [500, 10],
                        [1000, 15],
                        [1000, 35],
                        [500, 45]
                    ]
                },
                {
                    name: "Sonorants",
                    color: "#d0d0d0",
                    points: [
                        [250, 35],
                        [500, 25],
                        [1000, 20],
                        [2000, 25],
                        [2000, 45],
                        [1000, 50],
                        [500, 45]
                    ]
                },
                {
                    name: "Consonants",
                    color: "#e5e5e5",
                    points: [
                        [500, 40],
                        [1000, 25],
                        [2000, 15],
                        [4000, 10],
                        [8000, 15],
                        [8000, 55],
                        [4000, 45],
                        [2000, 50],
                        [1000, 50]
                    ]
                }
            ];
        
            // Frequenz logarithmisch auf die x-Achse abbilden.
            // Die vorhandene Achse verteilt Frequenzen gleichmäßig
            // nach Listenindex; deshalb interpolieren wir passend dazu.


    function draw(){


        ctx.clearRect(
            0,
            0,
            width,
            height
        );



        // grid

        ctx.strokeStyle="#ccc";

        for(let db=0;db<=120;db+=20){

            let y =
                yPosition(db);


            ctx.beginPath();

            ctx.moveTo(
                margin,
                y
            );

            ctx.lineTo(
                width-margin,
                y
            );

            ctx.stroke();

        }

        // grid
        ctx.strokeStyle = "#ccc";
        
        for(let db = 0; db <= 120; db += 20) {
        
            const y = yPosition(db);
        
            ctx.beginPath();
            ctx.moveTo(margin, y);
            ctx.lineTo(width - margin, y);
            ctx.stroke();
        }
        
        // Speech Banana — hinter den Kurven
        drawSpeechBanana();
        
        // labels
        ctx.fillStyle = "black";
        ctx.font = "12px Arial";
        
        // ... deine vorhandenen Achsenbeschriftungen ...
        
        // Deine vorhandene Legende und Kurven bleiben erhalten.

        
        // labels

        ctx.fillStyle="black";
        ctx.font="12px Arial";


        for(let i=0;i<frequencies.length;i++){

            ctx.fillText(
                frequencies[i],
                xPosition(i)-12,
                height-20
            );

        }



        for(let db=0;db<=120;db+=20){

            ctx.fillText(
                db+" dB",
                5,
                yPosition(db)+4
            );

        }


        // legend
        
        const legendX = width - 150;
        const legendY = 20;
        
        ctx.font = "12px Arial";
        ctx.textAlign = "left";
        
        // Left
        ctx.strokeStyle = "#1976d2";
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.moveTo(
            legendX,
            legendY
        );
        ctx.lineTo(
            legendX + 25,
            legendY
        );
        ctx.stroke();
        
        ctx.fillStyle = "#1976d2";
        
        ctx.fillText(
            "Left",
            legendX + 32,
            legendY + 4
        );
        
        
        // Right
        ctx.strokeStyle = "#d32f2f";
        
        ctx.beginPath();
        ctx.moveTo(
            legendX + 75,
            legendY
        );
        ctx.lineTo(
            legendX + 100,
            legendY
        );
        ctx.stroke();
        
        ctx.fillStyle = "#d32f2f";
        
        ctx.fillText(
            "Right",
            legendX + 107,
            legendY + 4
        );
        
        // curves
        
        drawCurve(
            leftLoss,
            "#1976d2"
        );
        
        drawCurve(
            rightLoss,
            "#d32f2f"
        );

    }




    function drawCurve(values,color){


        ctx.strokeStyle=color;
        ctx.lineWidth=2;


        ctx.beginPath();


        values.forEach(
            (db,i)=>{


                const x =
                    xPosition(i);


                const y =
                    yPosition(db);


                if(i===0)
                    ctx.moveTo(x,y);
                else
                    ctx.lineTo(x,y);


            }
        );


        ctx.stroke();



        values.forEach(
            (db,i)=>{


                ctx.fillStyle=color;


                ctx.beginPath();


                ctx.arc(
                    xPosition(i),
                    yPosition(db),
                    5,
                    0,
                    Math.PI*2
                );


                ctx.fill();


            }
        );

    }





    canvas.onmousedown =
    e=>{


        const rect =
            canvas.getBoundingClientRect();


        const mx =
            e.clientX -
            rect.left;


        const my =
            e.clientY -
            rect.top;



        for(let ear of ["left","right"]){


            let data =
                ear==="left"
                ? leftLoss
                : rightLoss;



            for(let i=0;i<data.length;i++){


                let dx =
                    mx-xPosition(i);

                let dy =
                    my-yPosition(data[i]);


                if(
                    Math.sqrt(dx*dx+dy*dy)
                    <10
                ){

                    dragging={
                        ear,
                        index:i
                    };

                    return;

                }

            }

        }

    };





    canvas.onmousemove =
    e=>{


        if(!dragging)
            return;



        const rect =
            canvas.getBoundingClientRect();


        const my =
            e.clientY -
            rect.top;



        let db =
            (
                (my-margin)
                /
                (height-margin*2)
            )
            *
            120;



        db =
            Math.max(
                0,
                Math.min(
                    120,
                    Math.round(db)
                )
            );



        if(dragging.ear==="left")
            leftLoss[dragging.index]=db;
        else
            rightLoss[dragging.index]=db;

        

            
    function xForFrequency(freq) {

        const index =
            frequencies.findIndex(f => f === freq);

        if(index !== -1)
            return xPosition(index);

        for(let i = 0; i < frequencies.length - 1; i++) {

            if(
                freq > frequencies[i] &&
                freq < frequencies[i + 1]
            ) {
                const t =
                    (Math.log(freq) - Math.log(frequencies[i])) /
                    (Math.log(frequencies[i + 1]) -
                     Math.log(frequencies[i]));

                return xPosition(i) +
                    t * (xPosition(i + 1) - xPosition(i));
            }
        }

        return xPosition(0);
    }

    regions.forEach(region => {

        ctx.beginPath();

        region.points.forEach((point, i) => {

            const x = xForFrequency(point[0]);
            const y = yPosition(point[1]);

            if(i === 0)
                ctx.moveTo(x, y);
            else
                ctx.lineTo(x, y);
        });

        ctx.closePath();

        ctx.fillStyle = region.color;
        ctx.globalAlpha = 0.65;
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#888";
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    // Labels
    ctx.fillStyle = "#333";
    ctx.font = "11px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        "Vowels",
        xForFrequency(350),
        yPosition(27)
    );

    ctx.fillText(
        "Sonorants",
        xForFrequency(900),
        yPosition(42)
    );

    ctx.fillText(
        "Consonants",
        xForFrequency(3500),
        yPosition(35)
    );

    ctx.restore();
}

        draw();


    };





    window.onmouseup =
    ()=>{

        dragging=null;

    };



    draw();


}
