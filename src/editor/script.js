onerror = e => alert(e)

const drawingCanvas = document.querySelector("#drawingCanvas");
const drawCtx = drawingCanvas.getContext("2d");

const bufferDrawingCanvas = document.createElement("canvas");
const bufferDrawCtx = bufferDrawingCanvas.getContext("2d");

const primaryColorPicker = document.querySelector("#primaryColorPicker");
const secondaryColorPicker = document.querySelector("#secondaryColorPicker");

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
        pX: 0,
        pY: 0,
        x: 0,
        y: 0,
        leftDown: false,
        wheelDown: false
    },
}

function setCameraPosition(x, y, relative = false) {
    x = Math.floor(x);
    y = Math.floor(y);
    appState.camera.x = relative ? appState.camera.x + x : x;
    appState.camera.y = relative ? appState.camera.y + y : y;

    drawingCanvas.style.left = `${appState.camera.x}px`;
    drawingCanvas.style.top = `${appState.camera.y}px`;
}

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
    });
    
    setCameraPosition(...pos1);

    drawingCanvas.style.width = `${pos2[0] - pos1[0]}px`;
    drawingCanvas.style.height = `${pos2[1] - pos1[1]}px`;
}

function setCanvasDimensions(width, height) {
    appState.canvas.width = width;
    appState.canvas.height = height;

    drawingCanvas.width = width;
    drawingCanvas.height = height;

    bufferDrawingCanvas.width = width;
    bufferDrawingCanvas.height = height;
}

function setPalette(palette) {
    if (palette.constructor === Palette) {
        appState.palette = palette;
    } else {
        throw TypeError("Could not set palette, provided input not a Palette")
    }
}

function setPrimaryColor(color) {
    appState.selectedColors[0] = chroma(color);
    primaryColorPicker.value = chroma(color);
}

function setSecondaryColor(color) {
    appState.selectedColors[1] = chroma(color);
    secondaryColorPicker.value = chroma(color);
}

function inCanvas(x,y) {
    // Check to see if screen coordinate is within canvas
    return (
        drawingCanvas.offsetLeft < x &&
        x < drawingCanvas.offsetLeft + drawingCanvas.offsetWidth &&
        drawingCanvas.offsetTop < y &&
        y < drawingCanvas.offsetTop + drawingCanvas.offsetHeight
    )
}

function windowCenter() {return [window.innerWidth / 2, window.innerHeight / 2]}

function screenToCanvas(x,y) {
    x = Math.floor(((x - drawingCanvas.offsetLeft) / drawingCanvas.offsetWidth) * drawingCanvas.width)
    y = Math.floor(((y - drawingCanvas.offsetTop) / drawingCanvas.offsetHeight) * drawingCanvas.height)
    
    return [x,y]
}

function range(start, end) {
    start = Math.round(start);
    end = Math.round(end);
    result = [];
    if (start > end) { // counting down
      for (let i = start; i >= end; i--) {
        result.push(i);
      }
    } else { // counting up
      for (let i = start; i <= end; i++) {
        result.push(i);
      }
    }
    return result;
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

function transferBmp(canvas0, canvas1) {
    canvas1.getContext("2d").drawImage(canvas0, 0, 0);
}

function linePoints(x0, y0, x1, y1) {
    pointsList = [];

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = Math.sign(x1 - x0);
    const sy = Math.sign(y1 - y0);
    let err = dx - dy;
  
    while (true) {
      pointsList.push({x:x0,y:y0})
  
      if (x0 === x1 && y0 === y1) break;
  
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 <  dx) { err += dx; y0 += sy; }
    }
    return pointsList;
}
  
function handlePointerMove(e) {
    [appState.cursor.pX,appState.cursor.pY] = [appState.cursor.x,appState.cursor.y];
    [appState.cursor.x,appState.cursor.y] = [e.x,e.y];
    if (appState.cursor.wheelDown) {
        setCameraPosition(appState.cursor.x - appState.cursor.pX, appState.cursor.y - appState.cursor.pY, true);
        return;
    }

    if (appState.cursor.leftDown) {
        for (let point of linePoints(...screenToCanvas(appState.cursor.pX, appState.cursor.pY), ...screenToCanvas(e.x,e.y))) {
            setPixel(bufferDrawCtx, point.x,point.y, appState.selectedColors[0]);
        }
        transferBmp(bufferDrawingCanvas, drawingCanvas)
    }
}

function handlePointerDown() {appState.cursor.leftDown = true};
function handlePointerUp() {appState.cursor.leftDown = false};

function handleKeyDown(e) {
    switch (e.key) {
        case "=":
            setCameraScale(1.1, appState.cursor.x, appState.cursor.y, false);
            break;
        case "-":
            setCameraScale(.9, ...windowCenter(), true);
            break;
        case "x":
            let tempColors = appState.selectedColors.slice(); // Slicing to create a shallow copy of the array, otherwise they sync up
            setPrimaryColor(tempColors[1]);
            setSecondaryColor(tempColors[0]);
    }
}

function handleWheel(e) {
    setCameraScale(1 + -Math.sign(e.deltaY)*.1, appState.cursor.x,appState.cursor.y);
}

function handleMouseDown(e) {
    if (e.button === 1) appState.cursor.wheelDown = true;
}

function handleMouseUp(e) {
    if (e.button === 1) appState.cursor.wheelDown = false;
}

window.addEventListener("pointermove", handlePointerMove);
window.addEventListener("pointerdown", handlePointerDown);
window.addEventListener("pointerup", handlePointerUp);

window.addEventListener("mousedown", handleMouseDown);
window.addEventListener("mouseup", handleMouseUp);

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("wheel", handleWheel);

function handleColorPickerInputEvent(e) {
    switch(e.currentTarget.id) {
        case "primaryColorPicker":
            setPrimaryColor(e.target.value);
            break;
        case "secondaryColorPicker":
            setSecondaryColor(e.target.value)
            break;
    }
}

[primaryColorPicker, secondaryColorPicker].forEach(picker => picker.addEventListener("change", handleColorPickerInputEvent));

function setup() {
    setCanvasDimensions(32, 32);
    setCameraPosition(...windowCenter().map((component) => {return component - 8}));

    setCameraScale(10, ...windowCenter());
    setPrimaryColor("#000");
    setSecondaryColor("#fff");
    defaultPalette = new Palette("PICO-8", ["000000", "1D2B53", "7E2553", "008751", "AB5236", "5F574F", "C2C3C7", "FFF1E8", "FF004D", "FFA300", "FFEC27", "00E436", "29ADFF", "83769C", "FF77A8", "FFCCAA"]);
    setPalette(defaultPalette);
}

setup();
