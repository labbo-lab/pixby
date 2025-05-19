onerror = e => alert(e)

const drawingCanvas = document.querySelector("#drawingCanvas");
const drawCtx = drawingCanvas.getContext("2d");

class Palette extends Array {
    constructor(title, colors) {
        super(...(colors.map((color) => chroma(color))));
        this.title = title;
    }
    push(color) {
        if (color.constructor != chroma("#000").constructor) color = chroma(color);
        this[this.length] = color;
        return this;
    }
}

const appState = {
    camera: {
        x: 0,
        y: 0,
        scale: 1,
    },
    canvas: {
        width: undefined,
        height: undefined,
    },
    selectedColors: [
        chroma("#f00"),
        chroma("#f0f")
    ],
    tool: "pen",
    palette: {
        title: undefined,
        colors: undefined
    },
    keysPressed: [],
    cursor: {
        x: 0,
        y: 0,
        down: false
    }
}

function setCameraPosition(x, y, relative = false) {
    x = Math.floor(x);
    y = Math.floor(y);
    appState.camera.x = relative ? appState.camera.x + x : x;
    appState.camera.y = relative ? appState.camera.y + y : y;

    drawingCanvas.style.left = `${x}px`;
    drawingCanvas.style.top = `${y}px`;
}

// function setCameraScale(scale, cX, cY, relative = false) {
//     scale = Math.max(relative ? appState.camera.scale + scale : scale, 0);

//     appState.camera.scale = scale;
//     drawingCanvas.style.width = `${(drawingCanvas.width/drawingCanvas.height) * scale}px`
//     drawingCanvas.style.height = `${scale}px`
// }


/**
 * @function Set Camera Scale
 * @param {number} scale - A number to scale to/by.
 * @param {number} cX - The origin on the X axis to scale from.
 * @param {number} cY - The origin on the Y axis to scale from.
 */
function setCameraScale(scale, cX, cY) {
    let pos1 = [drawingCanvas.offsetLeft, drawingCanvas.offsetTop];
    let pos2 = [pos1[0] + drawingCanvas.offsetWidth, pos1[1] + drawingCanvas.offsetHeight];

    // Translate (left,top) and (left+width,top+height) by (-cX, -cY)

    [pos1,pos2].forEach((position) => {
        position.forEach((component, index) => {
            position[index] -= [cX,cY][index]
            position[index] *= scale
            position[index] += [cX,cY][index]
        })
    })
    
    drawingCanvas.style.left = `${pos1[0]}px`;
    drawingCanvas.style.top = `${pos1[1]}px`;

    drawingCanvas.style.width = `${pos2[0] - pos1[0]}px`;
    drawingCanvas.style.height = `${pos2[1] - pos1[1]}px`;
}

function setCanvasDimensions(width, height) {
    appState.canvas.width = width;
    appState.canvas.height = height;

    drawingCanvas.width = width;
    drawingCanvas.height = height;
}

function setPalette(palette) {
    if (palette.constructor === Palette) {
        appState.palette = palette;
    } else {
        throw TypeError("Could not set palette, provided input not a Palette")
    }
}

/**
 * @function setSelectedColors
 * @param {color} [primary] Set the primary color.
 * @param {color} [secondary] Set the secondary color.
 * @returns {void} test
*/
function setSelectedColors(primary, secondary) {[appState.selectedColors.primary, appState.selectedColors.secondary] = [primary, secondary]}

function inCanvas(x,y) {
    // Check to see if screen coordinate is within canvas
    return (
        drawingCanvas.offsetLeft < x &&
        x < drawingCanvas.offsetLeft + drawingCanvas.offsetWidth &&
        drawingCanvas.offsetTop < y &&
        y < drawingCanvas.offsetTop + drawingCanvas.offsetHeight
    )
}

function windowCenter() {return [window.innerWidth / 2, window.innerHeight / 2];}

function screenToCanvas(x,y) {
    x = Math.floor(((x - drawingCanvas.offsetLeft) / drawingCanvas.offsetWidth) * drawingCanvas.width)
    y = Math.floor(((y - drawingCanvas.offsetTop) / drawingCanvas.offsetHeight) * drawingCanvas.height)
    
    return [x,y]
}

function canvasToScreen(x,y) {

}

function createBuffer(context, w,h) {
    
}

function renderBuffer(canvas, buffer, x = 0,y = 0) {

}

/**
 * @description Set a pixel on the drawing canvas
 * @param {(CanvasRenderingContext2D|ImageData)} context - The canvas rendering context or buffer to place the pixel onto.
 * @param {number} x - X coordinate of the pixel.
 * @param {number} y - X coordinate of the pixel.
 * @param {Color} color - The color to set the pixel to.
*/
function setPixel(context, x,y, color) {
    if (context.constructor === CanvasRenderingContext2D) {
        let arr = new Uint8ClampedArray(4);
        arr.forEach((_, idx) => {arr[idx] = color.rgb()[idx]})
        arr[3] = 255

        let data = new ImageData(arr,1)
        drawCtx.putImageData(data,x,y)
    }
}

function handlePointerMove(e) {
    [appState.cursor.x, appState.cursor.y] = [e.x, e.y]
    if (appState.cursor.down) {
        setPixel(drawCtx, ...screenToCanvas(e.x,e.y), appState.selectedColors[0]);
    }
}

function handlePointerDown() {appState.cursor.down = true}
function handlePointerUp() {appState.cursor.down = false}

function handleKeyDown(e) {
    switch (e.key) {
        case "=":
            setCameraScale(1.1, appState.cursor.x, appState.cursor.y, false);
            break;
        case "-":
            setCameraScale(.9, ...windowCenter(), true);
            break;
        case "x":
            appState.selectedColors = appState.selectedColors.reverse();
    }
}

window.addEventListener("pointermove", handlePointerMove);
window.addEventListener("pointerdown", handlePointerDown);
window.addEventListener("pointerup", handlePointerUp);
window.addEventListener("keydown", handleKeyDown);

function setup() {
    setCanvasDimensions(16,16);
    setCameraPosition(...windowCenter().map((component) => {return component - 8}));

    setCameraScale(10, ...windowCenter());

    defaultPalette = new Palette("PICO-8", ["000000", "1D2B53", "7E2553", "008751", "AB5236", "5F574F", "C2C3C7", "FFF1E8", "FF004D", "FFA300", "FFEC27", "00E436", "29ADFF", "83769C", "FF77A8", "FFCCAA"]);
    setPalette(defaultPalette);
}

setup();
