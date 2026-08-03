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



        drawCurve(
            leftLoss,
            "blue"
        );


        drawCurve(
            rightLoss,
            "red"
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



        draw();


    };





    window.onmouseup =
    ()=>{

        dragging=null;

    };



    draw();


}
