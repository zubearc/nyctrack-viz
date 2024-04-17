function addColor (color, text) {
  const div = document.createElement('div')
  div.classList.add('color')
  div.style.backgroundColor = color
  div.textContent = text || color
  document.querySelector('.colors').appendChild(div)
}

export function captureColors (imageBuffer) {
  const colorFreqs = new Map()
  for (let i = 0; i < imageBuffer.length; i += 4) {
    const color = imageBuffer.slice(i, i + 3)
    const code = color.join(',')
    colorFreqs.set(code, (colorFreqs.get(code) || 0) + 1)
  }
  // get the top most frequent colors
  const sortedTopColors = [...colorFreqs.entries()].sort((a, b) => b[1] - a[1])
  console.log('Colors in image', colorFreqs.size)
  console.log('Colors', sortedTopColors)
  const skips = ['255,255,255', '255,0,0', '0,255,0', '0,0,255', '255,255,0', '255,0,255', '0,255,255', '198,216,200']
  const allowed = ['0,0,0']
  const forReplacement = []
  for (const [color, freq] of sortedTopColors) {
    if (!allowed.includes(color)) {
      if (skips.includes(color)) continue
      const [r, g, b] = color.split(',')
      if (r === g && g === b) continue // skip greys
      if (r > 200 && g > 200 && b > 200) continue // skip whites
    }
    addColor('rgb(' + color + ')', `${color} (x${freq})`)
    forReplacement.push(color)
  }
  return forReplacement
}
