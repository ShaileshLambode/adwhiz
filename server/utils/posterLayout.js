/**
 * Utility functions for poster dimensions and zone positioning.
 */

/**
 * Parses a size string like "1024x1365" into numeric width and height.
 * Fallback is [1024, 1024].
 * @param {string} sizeStr
 * @returns {Array<number>} [width, height]
 */
function parseSize(sizeStr) {
  if (!sizeStr || typeof sizeStr !== 'string') {
    return [1024, 1024];
  }
  const parts = sizeStr.split('x');
  if (parts.length === 2) {
    const w = parseInt(parts[0], 10);
    const h = parseInt(parts[1], 10);
    if (!isNaN(w) && !isNaN(h)) {
      return [w, h];
    }
  }
  return [1024, 1024];
}

/**
 * Calculates height allocations for each zone dynamically based on total poster height.
 * Sums up to exactly 100% of height (no empty space or gaps).
 * @param {number} H - Total poster height in pixels
 * @param {number} [W=null] - Total poster width in pixels
 * @returns {Object} Heights for z1 through z6
 */
function calculateZoneHeights(H, W = null) {
  const isLandscape = W && W > H;
  const z1 = Math.floor(H * 0.10); // Header
  const z2 = isLandscape ? Math.floor(H * 0.46) : Math.floor(H * 0.42); // Hero
  const z3 = Math.floor(H * 0.10); // Values Row
  const z4 = Math.floor(H * 0.08); // Features Bar
  const z5 = isLandscape ? Math.floor(H * 0.08) : Math.floor(H * 0.10); // Product Categories
  // Zone 6 spans all the remaining height to ensure no gaps at the bottom
  const z6 = H - (z1 + z2 + z3 + z4 + z5);

  return { z1, z2, z3, z4, z5, z6 };
}

module.exports = {
  parseSize,
  calculateZoneHeights
};
