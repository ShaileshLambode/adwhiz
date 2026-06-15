// Generic fallback — used ONLY when user skips AI fill entirely
// Safe for any occasion because it uses neutral-but-warm tones
const GENERIC_FALLBACK_PALETTE = {
  panelBg: '#1A1A2E',
  useDarkPanel: true,
  headlineColor: '#FFD700',
  subheadingColor: '#FFA500',
  bodyTextColor: '#FFFFFF',
  sloganColor: '#FFD700',
  footerBg: '#16213E',
  footerTextAccent: '#FFD700',
  iconCircleColor: '#FFD700',
  featureBorderColor: '#FFA500',
  zoneBgTint: '#FFF8F0',
};

function getDefaultFestivalPalette() {
  return GENERIC_FALLBACK_PALETTE;
}

module.exports = { getDefaultFestivalPalette };
