const map = (number, inMin, inMax, outMin, outMax) => (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;

module.exports = (hex) => {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });

  const mapRGB = (x) => Math.round(map(x, 0, 255, 0, 5));

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: mapRGB(parseInt(result[1], 16)),
    g: mapRGB(parseInt(result[2], 16)),
    b: mapRGB(parseInt(result[3], 16))
  } : null;
}
