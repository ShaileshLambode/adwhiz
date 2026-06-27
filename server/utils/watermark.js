const sharp = require("sharp");

/**
 * buildWatermarkSvg
 * ────────────────────
 * Generates a semi-transparent diagonal "AdWhiz" watermark sized to the
 * target image. Used only for Free-plan users (Basic/Pro images are
 * watermark-free per plan config in server/config/plans.js).
 *
 * Kept deliberately simple — a single repeating diagonal wordmark — so it
 * is cheap to render at any output resolution (no external image asset to
 * load, no extra Sharp composite I/O).
 */
function buildWatermarkSvg(width, height) {
  const fontSize = Math.max(18, Math.round(width * 0.035));
  const label = "AdWhiz";
  const tileW = fontSize * 7;
  const tileH = fontSize * 5;

  const tiles = [];
  for (let y = -tileH; y < height + tileH; y += tileH) {
    for (let x = -tileW; x < width + tileW; x += tileW) {
      tiles.push(
        `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="white" fill-opacity="0.16" transform="rotate(-30 ${x} ${y})">${label}</text>`
      );
    }
  }

  // Plus one clear, larger watermark bottom-right as the "official" mark.
  const cornerFontSize = Math.max(22, Math.round(width * 0.045));
  const cornerMark = `<text x="${width - 24}" y="${height - 24}" font-family="Arial, sans-serif" font-size="${cornerFontSize}" font-weight="bold" fill="white" fill-opacity="0.55" text-anchor="end">${label}</text>`;

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${tiles.join("\n")}
    ${cornerMark}
  </svg>`;
}

/**
 * applyWatermark(imageBuffer) -> Promise<Buffer>
 * Composites the watermark SVG over an already-rendered image buffer.
 * Call this as the LAST step before upload, on the final flattened
 * JPEG/PNG buffer — not on intermediate layers — so the mark always sits
 * on top regardless of how each post type builds its composite.
 */
async function applyWatermark(imageBuffer) {
  const { width, height } = await sharp(imageBuffer).metadata();
  const watermarkSvg = buildWatermarkSvg(width, height);

  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(watermarkSvg), top: 0, left: 0 }])
    .jpeg({ quality: 93 })
    .toBuffer();
}

module.exports = { applyWatermark };
