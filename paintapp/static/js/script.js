var canvas = document.getElementById("paint");
var ctx = canvas.getContext("2d");
var width = canvas.width, height = canvas.height;
var curX, curY, prevX, prevY;
var hold = false;
var fill_value = true, stroke_value = false;
var canvas_data = { "pencil": [] };
ctx.lineWidth = 15;

function reset() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas_data = { "pencil": [] };
    $('#output').text("");
}

function pencil() {

    // Lowkey reminds me of CSE 11 resizable pizza slices and dragging mickeys
    canvas.onmousedown = function (e){
        curX = e.clientX - canvas.offsetLeft;
        curY = e.clientY - canvas.offsetTop;
//        console.log('CX: ' + e.clientX);
//        console.log('CY: ' + e.clientY);
        hold = true;
        prevX = curX;
        prevY = curY;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
    };
        
    canvas.onmousemove = function (e){
        if (hold) {
            curX = e.clientX - canvas.offsetLeft;
            curY = e.clientY - canvas.offsetTop;
//            console.log('CX: ' + e.clientX);
//            console.log('CY: ' + e.clientY);
//            console.log('CL: ' + canvas.offsetLeft);
//            console.log('CT: ' + canvas.offsetTop);
            draw();
        }
    };
        
    canvas.onmouseup = function(e) {
        hold = false;
    };
        
    canvas.onmouseout = function(e) {
        hold = false;
    };
        
    function draw() {
        ctx.lineTo(curX, curY);
        ctx.stroke();
        canvas_data.pencil.push({ "startx": prevX, "starty": prevY, "endx": curX, "endy": curY, 
            "thick": ctx.lineWidth, "color": ctx.strokeStyle });
    }
}


// Compute the center of mass of the handwritten digit
// Note: 1 stands for black (0 - white) so we have to invert.
function centerImage(img) {
    var meanX = 0;
    var meanY = 0;
    var rows = img.length;
    var columns = img[0].length;
    var sumPixels = 0;
    for (var y = 0; y < rows; y++) {
        for (var x = 0; x < columns; x++) {
            var pixel = 1 - img[y][x];
            sumPixels += pixel;
            meanY += y * pixel;
            meanX += x * pixel;
        }
    }
    meanX /= sumPixels;
    meanY /= sumPixels;
    var dX = Math.round(columns/2 - meanX);
    var dY = Math.round(rows/2 - meanY);
    return { transX: dX, transY: dY };
}

// Given a gray-scale image, find the boundary rectangle
// by above-threshold surrounding
function getBoundingRectangle(img, threshold) {
    var rows = img.length;
    var columns = img[0].length;
    var minX=columns;
    var minY=rows;
    var maxX=-1;
    var maxY=-1;
    for (var y = 0; y < rows; y++) {
        for (var x = 0; x < columns; x++) {
            if (img[y][x] < threshold) {
                if (minX > x) minX = x;
                if (maxX < x) maxX = x;
                if (minY > y) minY = y;
                if (maxY < y) maxY = y;
            }
        }
    }
    return { minY: minY, minX: minX, maxY: maxY, maxX: maxX};
}

// Convert an image to grayscale
function imageDataToGrayscale(imgData) {
    var grayscaleImg = [];
    for (var y = 0; y < imgData.height; y++) {
            grayscaleImg[y]=[];
        for (var x = 0; x < imgData.width; x++) {
            var offset = y * 4 * imgData.width + 4 * x;
            var alpha = imgData.data[offset+3];
            // weird: when painting with stroke, alpha == 0 means white;
            // alpha > 0 is a grayscale value; in that case I simply take the R value
            if (alpha == 0) {
                imgData.data[offset] = 255;
                imgData.data[offset+1] = 255;
                imgData.data[offset+2] = 255;
            }
            imgData.data[offset+3] = 255;
            // simply take red channel value. Not correct, but works for
            // black or white images.
            grayscaleImg[y][x] = imgData.data[y*4*imgData.width + x*4 + 0] / 255;
        }
    }
    return grayscaleImg;
}

function classify (){

    // CSRF stuff TODO!!!!!!!!!
//    var csrftoken = getCookie('csrftoken');
//    var headers = new Headers();
//    headers.append('X-CSRFToken', csrftoken);

//    var image = canvas.toDataURL();

    var imgData = ctx.getImageData(0, 0, 280, 280);
    grayscaleImg = imageDataToGrayscale(imgData);
    var boundingRectangle = getBoundingRectangle(grayscaleImg, 0.01);
    var trans = centerImage(grayscaleImg); // [dX, dY] to center of mass
    var canvasCopy = document.createElement("canvas");
    canvasCopy.width = imgData.width;
    canvasCopy.height = imgData.height;
    var copyCtx = canvasCopy.getContext("2d");
    var brW = boundingRectangle.maxX+1-boundingRectangle.minX;
    var brH = boundingRectangle.maxY+1-boundingRectangle.minY;
    var scaling = 190 / (brW>brH?brW:brH);
    // scale
    copyCtx.translate(canvas.width/2, canvas.height/2);
    copyCtx.scale(scaling, scaling);
    copyCtx.translate(-canvas.width/2, -canvas.height/2);
    // translate to center of mass
    copyCtx.translate(trans.transX, trans.transY);
    // default take image from original canvas
    copyCtx.drawImage(ctx.canvas, 0, 0);

    // now bin image into 10x10 blocks (giving a 28x28 image)
    imgData = copyCtx.getImageData(0, 0, 280, 280);
    grayscaleImg = imageDataToGrayscale(imgData);

    // Create (1, 28, 28) matrix
    var nnInput = new Array(28);
    for (var y = 0; y < 28; y++) {
      var nnInputTmp = new Array(28);
      for (var x = 0; x < 28; x++) {
        var mean = 0;
        for (var v = 0; v < 10; v++) {
          for (var h = 0; h < 10; h++) {
            mean += grayscaleImg[y*10 + v][x*10 + h];
          }
        }
        mean = 1 - (mean / 100); // average and invert
        nnInputTmp[x] = (mean - .5) / .5;
      }
      nnInput[y] = nnInputTmp;
    }

    console.log(nnInput);

    // TODO Throw into CNN
    $.ajax({
        type: 'post',
        url: '/',
//        headers: headers,
//        credentials: 'same-origin', // or 'include'
        data: {
            'imgMtx[]' : nnInput
        },

        success: function(data){
            console.log('Data: ' + data);
            $('#output').text(data);
        }
    });

}
