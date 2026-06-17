const sharp = require('sharp');
const axios = require('axios');

/**
 * Removes the background from a logo image buffer using pixel-distance threshold.
 * Samples the top-left corner pixel as the background reference color.
 * Sets pixels within threshold distance to transparent.
 * Returns a PNG buffer with transparency.
 */
async function removeLogoBackground(logoBuffer) {
  try {
    const sharpImg = sharp(logoBuffer);
    const { data, info } = await sharpImg
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const bgR = data[0], bgG = data[1], bgB = data[2], bgA = data[3];
    if (bgA < 10) return logoBuffer; // already transparent

    const threshold = 35;
    for (let i = 0; i < data.length; i += 4) {
      const dist = Math.sqrt(
        Math.pow(data[i]   - bgR, 2) +
        Math.pow(data[i+1] - bgG, 2) +
        Math.pow(data[i+2] - bgB, 2)
      );
      if (dist < threshold) data[i + 3] = 0; // make transparent
    }

    return await sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 }
    }).png().toBuffer();

  } catch (error) {
    console.error('Background removal error:', error.message);
    return logoBuffer; // return original on failure
  }
}

/**
 * Downloads logo, removes background, resizes to targetWidth, returns PNG buffer.
 * Also returns the actual rendered height after resize for correct compositing.
 */
async function processLogo(logoUrl, targetWidth) {
  const rawBuffer = await axios
    .get(logoUrl, { responseType: 'arraybuffer' })
    .then(r => Buffer.from(r.data));

  const cleanBuffer = await removeLogoBackground(rawBuffer);

  const resizedBuffer = await sharp(cleanBuffer)
    .resize({ width: targetWidth })
    .png()
    .toBuffer();

  const meta = await sharp(resizedBuffer).metadata();
  return { buffer: resizedBuffer, width: meta.width, height: meta.height };
}

module.exports = { removeLogoBackground, processLogo };
