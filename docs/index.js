/* eslint-env browser */
import SignificantColors from './colors.json' assert { type: "json" }
// import { captureColors } from './colorCompute'

const PINK = [255, 0, 255]

function setBannerText (text) {
  document.querySelector('#btext').textContent = text
}

function setBannerColor (color) {
  document.querySelector('#btext').style.backgroundColor = color
}

const can = document.getElementById('can')
const img = new Image()
img.src = 'tracks.png'
img.onload = main
function main () {
  const MULTIPLIER = img.src.endsWith('svg') ? 1.5 : 1
  const imgWidth = img.width * MULTIPLIER
  const imgHeight = img.height * MULTIPLIER
  // log the image dimensions
  console.log(img.width, img.height)
  can.width = imgWidth
  can.height = imgHeight
  const ctx = can.getContext('2d')
  // draw red square on whole canvas
  ctx.fillStyle = 'red'
  ctx.fillRect(0, 0, can.width, can.height)

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, 0, 0, imgWidth, imgHeight)

  // First extract the image data from the canvas, then make a view around the ArrayBuffer of the raw data so we can access the pixel values directly.
  // The encoding is RGBA, so 4 bytes per pixel.
  const imageData = ctx.getImageData(0, 0, can.width, can.height)
  const imageBuffer = imageData.data

  // For obtaining significant colors (non precomputed):
  // const significantColors = captureColors(imageBuffer, PINK)
  // replaceColors(significantColors, replacementColor)

  const significantColors = SignificantColors // precomputed
  console.log('Colors', significantColors)

  function replaceColors (fromColors, withColor) {
    fromColors = Array.isArray(fromColors) ? fromColors : [fromColors]
    let replacedPixels = 0
    for (let i = 0; i < imageBuffer.length; i += 4) {
      const color = imageBuffer.slice(i, i + 3)
      if (fromColors.includes(color.join(','))) {
        imageBuffer[i] = withColor[0]
        imageBuffer[i + 1] = withColor[1]
        imageBuffer[i + 2] = withColor[2]
        replacedPixels++
      }
    }
    // redraw the image
    ctx.putImageData(imageData, 0, 0)
    console.log(`Replaced ${replacedPixels} pixels with ${withColor}`)
    return replacedPixels
  }
  window.replaceColors = replaceColors

  const PINK_STR = PINK.join(',')
  function isColorSignificant (color) {
    const targetColorStr = typeof color === 'string' ? color : color.join(',')
    if (targetColorStr === PINK_STR) {
      return false
    }
    if (significantColors.includes(targetColorStr)) {
      return true
    }
    return false
  }

  function isColorSignificantAt (x, y) {
    // get the current color at canvas x, y
    const targetColor = getPixelRGB(x, y)
    // check if the target is in the significant colors
    return isColorSignificant(targetColor)
  }

  let needsRedraw = false
  setInterval(() => {
    if (needsRedraw) {
      ctx.putImageData(imageData, 0, 0)
      needsRedraw = false
    }
  }, 500)

  function drawSquare (x, y, color) {
    ctx.fillStyle = color || 'red'
    ctx.fillRect(x, y, 10, 10)
  }
  function drawPixel (x, y, color) {
    const index = (y * can.width + x) * 4
    imageBuffer[index] = color[0]
    imageBuffer[index + 1] = color[1]
    imageBuffer[index + 2] = color[2]
    needsRedraw = true
  }

  function floodFill (x, y, forceAllow) {
    if (!forceAllow && !isColorSignificantAt(x, y)) {
      return
    }
    let maxRuns = 200
    function fillDFS (x, y) {
      maxRuns--
      if (maxRuns <= 0) {
        // queue for next run
        setTimeout(() => floodFill(x, y, true), 0)
        return
      }
      const neighbors = [
        [x, y],
        [x, y - 1],
        [x, y + 1],
        [x - 1, y],
        [x + 1, y],
        // corners
        [x - 1, y - 1],
        [x + 1, y - 1],
        [x - 1, y + 1],
        [x + 1, y + 1]
      ]
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= can.width || ny < 0 || ny >= can.height) {
          continue
        }
        if (isColorSignificantAt(nx, ny)) {
          drawPixel(nx, ny, PINK)
          fillDFS(nx, ny)
        }
      }
    }
    fillDFS(x, y)
  }

  function getPixelRGB (x, y) {
    const scaledX = Math.floor(x)
    const scaledY = Math.floor(y)
    const index = (scaledY * can.width + scaledX) * 4
    return [imageBuffer[index], imageBuffer[index + 1], imageBuffer[index + 2]]
  }
  window.getPixelRGB = getPixelRGB

  let holding = false
  let lastVisitedColor
  can.addEventListener('mousemove', function (event) {
    const x = event.clientX
    const y = event.clientY
    const canvasPos = getCanvasPos(event)
    const pixelRgb = getPixelRGB(canvasPos.x, canvasPos.y)
    // check if color is white-ish
    if (pixelRgb[0] > 200 && pixelRgb[1] > 200 && pixelRgb[2] > 200) {
      // if so don't set the lastVisitedColor to it (we wouldn't see it!)
    } else {
      lastVisitedColor = `rgb(${pixelRgb[0]}, ${pixelRgb[1]}, ${pixelRgb[2]})`
    }
    setBannerText(`Pos: ${canvasPos.x}, ${canvasPos.y} (page: ${x}, ${y}) (${lastVisitedColor})`)
    setBannerColor(lastVisitedColor)
    // paint brush effect:
    // drawSquare(canvasPos.x, canvasPos.y, lastVisitedColor);
    if (holding && isColorSignificant(pixelRgb)) {
      floodFill(canvasPos.x, canvasPos.y, PINK)
    }
  })

  can.addEventListener('mousedown', function (event) {
    holding = true
  })
  can.addEventListener('mouseup', function (event) {
    holding = false
  })
}

function getCanvasPos (event) {
  return {
    x: event.offsetX,
    y: event.offsetY
  }
}

function downloadCanvas () {
  const a = document.createElement('a')
  a.href = can.toDataURL()
  a.download = 'tracks.png'
  a.click()
}
window.downloadCanvas = downloadCanvas
