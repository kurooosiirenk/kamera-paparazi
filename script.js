```javascript
/* =====================================================
   PAPARAZZI HAND CAMERA
   Browser / GitHub Pages Version
===================================================== */


/* =====================================================
   ELEMENT
===================================================== */

const video =
    document.getElementById("video");

const canvas =
    document.getElementById("canvas");

const drawCanvas =
    document.getElementById("drawingCanvas");

const ctx =
    canvas.getContext("2d");

const drawCtx =
    drawCanvas.getContext("2d");

const startScreen =
    document.getElementById("startScreen");

const startButton =
    document.getElementById("startButton");

const errorText =
    document.getElementById("errorText");

const modeText =
    document.getElementById("modeText");

const effectText =
    document.getElementById("effectText");


/* =====================================================
   MODE
===================================================== */

const MODE_DRAW = 0;
const MODE_CAMERA = 1;

let mode = MODE_DRAW;


/* =====================================================
   TRANSITION
===================================================== */

let transition = false;

let transitionTarget = null;

let transitionStart = 0;

const transitionDuration = 650;


/* =====================================================
   DRAWING
===================================================== */

const brushColors = [
    "#ff0000",
    "#00ff00",
    "#0088ff",
    "#ffff00",
    "#ff00ff",
    "#ffffff"
];

let brushIndex = 0;

let lastDrawPoint = null;

let lastBrushChange = 0;


/* =====================================================
   EFFECTS
===================================================== */

const effectNames = [
    "BLUR",
    "MOTION BLUR",
    "RGB GLITCH",
    "NEON",
    "INVERSE",
    "PIXELATE",
    "VIGNETTE",
    "CHROMATIC",
    "THERMAL",
    "EDGE",
    "MIRROR",
    "NORMAL"
];

const effectColors = [
    "#ff00ff",
    "#00ffff",
    "#ff0000",
    "#ff00ff",
    "#ffff00",
    "#00aaff",
    "#00ffff",
    "#ff0088",
    "#ff8800",
    "#00ff00",
    "#ff00ff",
    "#00ff00"
];

let effect = 0;

let lastEffectChange = 0;


/* =====================================================
   RESOLUTION
===================================================== */

let width = 1280;
let height = 720;


/* =====================================================
   RESIZE
===================================================== */

function resizeCanvas() {

    width =
        window.innerWidth;

    height =
        window.innerHeight;

    canvas.width =
        width;

    canvas.height =
        height;

    drawCanvas.width =
        width;

    drawCanvas.height =
        height;
}

window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();


/* =====================================================
   DISTANCE
===================================================== */

function distance(a, b) {

    const dx =
        a.x - b.x;

    const dy =
        a.y - b.y;

    return Math.sqrt(
        dx * dx +
        dy * dy
    );
}


/* =====================================================
   POINT
===================================================== */

function convertPoint(lm) {

    return {

        x:
            (1 - lm.x)
            * width,

        y:
            lm.y
            * height
    };
}


/* =====================================================
   FIVE FINGERS
===================================================== */

function fiveFingersOpen(lm) {

    const index =
        lm[8].y <
        lm[6].y;

    const middle =
        lm[12].y <
        lm[10].y;

    const ring =
        lm[16].y <
        lm[14].y;

    const pinky =
        lm[20].y <
        lm[18].y;

    const thumb =
        Math.abs(
            lm[4].x -
            lm[2].x
        ) > .08;

    return (
        index &&
        middle &&
        ring &&
        pinky &&
        thumb
    );
}


/* =====================================================
   INDEX ONLY
===================================================== */

function indexOnly(lm) {

    const index =
        lm[8].y <
        lm[6].y;

    const middle =
        lm[12].y >
        lm[10].y;

    const ring =
        lm[16].y >
        lm[14].y;

    const pinky =
        lm[20].y >
        lm[18].y;

    const thumb =
        Math.abs(
            lm[4].x -
            lm[2].x
        ) < .08;

    return (
        index &&
        middle &&
        ring &&
        pinky &&
        thumb
    );
}


/* =====================================================
   PINCH
===================================================== */

function isPinch(lm) {

    return (
        distance(
            lm[4],
            lm[8]
        ) < .055
    );
}


/* =====================================================
   MEDIAPIPE
===================================================== */

const hands =
    new Hands({

        locateFile:
            file => {

                return (
                    "https://cdn.jsdelivr.net/" +
                    "npm/@mediapipe/hands/" +
                    file
                );
            }

    });


hands.setOptions({

    maxNumHands: 2,

    modelComplexity: 0,

    minDetectionConfidence: .65,

    minTrackingConfidence: .75
});


/* =====================================================
   RESULTS
===================================================== */

hands.onResults(
    onResults
);


/* =====================================================
   MAIN RESULTS
===================================================== */

function onResults(results) {

    /*
       BACKGROUND
    */

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    /*
       DRAW CAMERA
    */

    ctx.save();

    ctx.translate(
        width,
        0
    );

    ctx.scale(
        -1,
        1
    );

    ctx.drawImage(
        results.image,
        0,
        0,
        width,
        height
    );

    ctx.restore();


    const handsData =
        results.multiHandLandmarks ||
        [];


    /*
       GESTURE
    */

    detectModeGesture(
        handsData
    );


    /*
       MODE
    */

    if (
        mode === MODE_DRAW
    ) {

        drawMode(
            handsData
        );

    } else {

        cameraMode(
            handsData
        );
    }


    /*
       TRANSITION
    */

    if (transition) {

        drawTransition();
    }
}


/* =====================================================
   MODE GESTURE
===================================================== */

function detectModeGesture(
    handsData
) {

    if (
        transition ||
        handsData.length !== 1
    ) {

        return;
    }


    const hand =
        handsData[0];


    if (
        mode === MODE_DRAW &&
        fiveFingersOpen(hand)
    ) {

        startTransition(
            MODE_CAMERA
        );

        return;
    }


    if (
        mode === MODE_CAMERA &&
        indexOnly(hand)
    ) {

        startTransition(
            MODE_DRAW
        );
    }
}


/* =====================================================
   DRAW MODE
===================================================== */

function drawMode(
    handsData
) {

    modeText.innerText =
        "DRAWING MODE";

    effectText.innerText =
        "COLOR: " +
        brushIndexName();


    if (
        handsData.length !== 1
    ) {

        lastDrawPoint =
            null;

        return;
    }


    const lm =
        handsData[0];


    const index =
        convertPoint(
            lm[8]
        );


    /*
       PINCH
    */

    if (
        isPinch(lm)
    ) {

        const now =
            performance.now();


        if (
            now -
            lastBrushChange
            > 800
        ) {

            brushIndex++;

            if (
                brushIndex >=
                brushColors.length
            ) {

                brushIndex = 0;
            }

            lastBrushChange =
                now;

            lastDrawPoint =
                null;
        }

        return;
    }


    /*
       SMOOTH
    */

    let smoothPoint;


    if (
        lastDrawPoint === null
    ) {

        smoothPoint =
            index;

    } else {

        smoothPoint = {

            x:
                lastDrawPoint.x
                * .75
                +
                index.x
                * .25,

            y:
                lastDrawPoint.y
                * .75
                +
                index.y
                * .25
        };
    }


    /*
       LINE
    */

    if (
        lastDrawPoint
    ) {

        drawCtx.beginPath();

        drawCtx.moveTo(
            lastDrawPoint.x,
            lastDrawPoint.y
        );

        drawCtx.lineTo(
            smoothPoint.x,
            smoothPoint.y
        );

        drawCtx.strokeStyle =
            brushColors[
                brushIndex
            ];

        drawCtx.lineWidth =
            8;

        drawCtx.lineCap =
            "round";

        drawCtx.lineJoin =
            "round";

        drawCtx.stroke();
    }


    lastDrawPoint =
        smoothPoint;


    /*
       CURSOR
    */

    drawCtx.beginPath();

    drawCtx.arc(
        smoothPoint.x,
        smoothPoint.y,
        10,
        0,
        Math.PI * 2
    );

    drawCtx.fillStyle =
        brushColors[
            brushIndex
        ];

    drawCtx.fill();


    drawCtx.beginPath();

    drawCtx.arc(
        smoothPoint.x,
        smoothPoint.y,
        17,
        0,
        Math.PI * 2
    );

    drawCtx.strokeStyle =
        "#ffffff";

    drawCtx.lineWidth =
        2;

    drawCtx.stroke();
}


/* =====================================================
   BRUSH NAME
===================================================== */

function brushIndexName() {

    const names = [
        "RED",
        "GREEN",
        "BLUE",
        "YELLOW",
        "MAGENTA",
        "WHITE"
    ];

    return names[
        brushIndex
    ];
}


/* =====================================================
   CAMERA MODE
===================================================== */

function cameraMode(
    handsData
) {

    modeText.innerText =
        "PAPARAZZI CAMERA";


    if (
        handsData.length !== 2
    ) {

        effectText.innerText =
            "SHOW BOTH HANDS";

        return;
    }


    const hand1 =
        handsData[0];

    const hand2 =
        handsData[1];


    const thumb1 =
        convertPoint(
            hand1[4]
        );

    const index1 =
        convertPoint(
            hand1[8]
        );

    const thumb2 =
        convertPoint(
            hand2[4]
        );

    const index2 =
        convertPoint(
            hand2[8]
        );


    /*
       EFFECT
    */

    applyEffect();


    /*
       COLOR
    */

    const color =
        effectColors[
            effect
        ];


    /*
       FRAME
    */

    ctx.strokeStyle =
        color;

    ctx.lineWidth =
        4;


    drawLine(
        thumb1,
        thumb2
    );

    drawLine(
        index1,
        index2
    );

    drawLine(
        thumb1,
        index1
    );

    drawLine(
        thumb2,
        index2
    );


    /*
       FINGERTIPS
    */

    const tips = [

        hand1[4],
        hand1[8],
        hand1[12],
        hand1[16],
        hand1[20],

        hand2[4],
        hand2[8],
        hand2[12],
        hand2[16],
        hand2[20]

    ];


    for (
        const lm of tips
    ) {

        const p =
            convertPoint(
                lm
            );


        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            5,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            color;

        ctx.fill();
    }


    /*
       PINCH
    */

    if (
        isPinch(hand1) ||
        isPinch(hand2)
    ) {

        const now =
            performance.now();


        if (
            now -
            lastEffectChange
            > 800
        ) {

            effect++;

            if (
                effect >=
                effectNames.length
            ) {

                effect = 0;
            }

            lastEffectChange =
                now;
        }
    }


    effectText.innerText =
        "EFFECT: " +
        effectNames[
            effect
        ];
}


/* =====================================================
   DRAW LINE
===================================================== */

function drawLine(
    a,
    b
) {

    ctx.beginPath();

    ctx.moveTo(
        a.x,
        a.y
    );

    ctx.lineTo(
        b.x,
        b.y
    );

    ctx.stroke();
}


/* =====================================================
   EFFECT
===================================================== */

function applyEffect() {

    /*
       BLUR
    */

    if (
        effect === 0
    ) {

        ctx.save();

        ctx.globalAlpha =
            .45;

        ctx.filter =
            "blur(8px)";

        ctx.drawImage(
            canvas,
            0,
            0
        );

        ctx.restore();
    }


    /*
       MOTION BLUR
    */

    else if (
        effect === 1
    ) {

        ctx.save();

        ctx.globalAlpha =
            .25;

        ctx.filter =
            "blur(4px)";

        ctx.drawImage(
            canvas,
            12,
            0
        );

        ctx.drawImage(
            canvas,
            -12,
            0
        );

        ctx.restore();
    }


    /*
       RGB GLITCH
    */

    else if (
        effect === 2
    ) {

        ctx.save();

        ctx.globalAlpha =
            .35;

        ctx.globalCompositeOperation =
            "screen";

        ctx.drawImage(
            canvas,
            15,
            0
        );

        ctx.drawImage(
            canvas,
            -15,
            0
        );

        ctx.restore();
    }


    /*
       NEON
    */

    else if (
        effect === 3
    ) {

        ctx.save();

        ctx.globalCompositeOperation =
            "screen";

        ctx.globalAlpha =
            .3;

        ctx.filter =
            "saturate(250%)";

        ctx.drawImage(
            canvas,
            0,
            0
        );

        ctx.restore();
    }


    /*
       INVERSE
    */

    else if (
        effect === 4
    ) {

        ctx.save();

        ctx.globalCompositeOperation =
            "difference";

        ctx.fillStyle =
            "white";

        ctx.fillRect(
            0,
            0,
            width,
            height
        );

        ctx.restore();
    }


    /*
       PIXELATE
    */

    else if (
        effect === 5
    ) {

        ctx.save();

        ctx.globalAlpha =
            .8;

        ctx.imageSmoothingEnabled =
            false;

        const small =
            document.createElement(
                "canvas"
            );

        const scale = 12;

        small.width =
            Math.max(
                1,
                Math.floor(
                    width / scale
                )
            );

        small.height =
            Math.max(
                1,
                Math.floor(
                    height / scale
                )
            );


        const smallCtx =
            small.getContext(
                "2d"
            );


        smallCtx.drawImage(
            canvas,
            0,
            0,
            small.width,
            small.height
        );


        ctx.drawImage(
            small,
            0,
            0,
            width,
            height
        );

        ctx.restore();
    }


    /*
       VIGNETTE
    */

    else if (
        effect === 6
    ) {

        const gradient =
            ctx.createRadialGradient(
                width / 2,
                height / 2,
                100,
                width / 2,
                height / 2,
                Math.max(
                    width,
                    height
                ) * .75
            );


        gradient.addColorStop(
            0,
            "rgba(0,0,0,0)"
        );

        gradient.addColorStop(
            1,
            "rgba(0,0,0,.75)"
        );


        ctx.fillStyle =
            gradient;

        ctx.fillRect(
            0,
            0,
            width,
            height
        );
    }


    /*
       CHROMATIC
    */

    else if (
        effect === 7
    ) {

        ctx.save();

        ctx.globalAlpha =
            .3;

        ctx.globalCompositeOperation =
            "screen";

        ctx.drawImage(
            canvas,
            10,
            0
        );

        ctx.drawImage(
            canvas,
            -10,
            0
        );

        ctx.restore();
    }


    /*
       THERMAL
    */

    else if (
        effect === 8
    ) {

        ctx.save();

        ctx.globalCompositeOperation =
            "overlay";

        ctx.fillStyle =
            "#ff5500";

        ctx.globalAlpha =
            .3;

        ctx.fillRect(
            0,
            0,
            width,
            height
        );

        ctx.restore();
    }


    /*
       EDGE
    */

    else if (
        effect === 9
    ) {

        ctx.save();

        ctx.globalCompositeOperation =
            "difference";

        ctx.strokeStyle =
            "#00ff00";

        ctx.lineWidth =
            2;

        ctx.strokeRect(
            0,
            0,
            width,
            height
        );

        ctx.restore();
    }


    /*
       MIRROR
    */

    else if (
        effect === 10
    ) {

        ctx.save();

        ctx.translate(
            width,
            0
        );

        ctx.scale(
            -1,
            1
        );

        ctx.globalAlpha =
            .5;

        ctx.drawImage(
            canvas,
            0,
            0
        );

        ctx.restore();
    }
}


/* =====================================================
   TRANSITION
===================================================== */

function startTransition(
    target
) {

    transition =
        true;

    transitionTarget =
        target;

    transitionStart =
        performance.now();

    lastDrawPoint =
        null;
}


function drawTransition() {

    const elapsed =
        performance.now()
        - transitionStart;


    const progress =
        Math.min(
            elapsed /
            transitionDuration,
            1
        );


    const centerX =
        width / 2;

    const centerY =
        height / 2;


    const radius =
        progress *
        Math.max(
            width,
            height
        ) * .6;


    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        radius,
        0,
        Math.PI * 2
    );


    ctx.strokeStyle =
        "#ff00ff";

    ctx.lineWidth =
        6;

    ctx.stroke();


    ctx.font =
        "bold 32px Arial";

    ctx.textAlign =
        "center";

    ctx.fillStyle =
        "#00ffff";


    ctx.fillText(

        transitionTarget ===
        MODE_CAMERA

            ? "CAMERA MODE"

            : "DRAWING MODE",

        centerX,
        centerY
    );


    if (
        progress >= 1
    ) {

        mode =
            transitionTarget;

        transition =
            false;

        transitionTarget =
            null;

        lastDrawPoint =
            null;
    }
}


/* =====================================================
   START CAMERA
===================================================== */

async function startCamera() {

    try {

        errorText.innerText =
            "Meminta izin kamera...";


        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices
                .getUserMedia
        ) {

            throw new Error(
                "Browser tidak mendukung kamera."
            );
        }


        const stream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {

                        facingMode:
                            "user",

                        width: {
                            ideal: 1280
                        },

                        height: {
                            ideal: 720
                        },

                        frameRate: {
                            ideal: 30,
                            max: 30
                        }
                    },

                    audio: false
                });


        video.srcObject =
            stream;


        await video.play();


        startScreen.classList
            .add("hidden");


        startProcessing();


    } catch (error) {

        console.error(
            error
        );


        errorText.innerText =
            "Kamera gagal dibuka. " +
            "Pastikan izin kamera " +
            "sudah diberikan.";
    }
}


/* =====================================================
   PROCESS CAMERA
===================================================== */

let processing =
    false;


async function startProcessing() {

    if (processing) {
        return;
    }

    processing = true;


    async function loop() {

        if (
            video.readyState >= 2
        ) {

            await hands.send({
                image: video
            });
        }


        requestAnimationFrame(
            loop
        );
    }


    loop();
}


/* =====================================================
   BUTTON
===================================================== */

startButton.addEventListener(
    "click",
    startCamera
);
```
