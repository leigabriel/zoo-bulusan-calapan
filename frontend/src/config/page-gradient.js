// Shared page background. White holds the top of the page so headings and cards keep a
// clean backdrop, then green rises toward the bottom - the same treatment as the home hero.
//
// Apply this to the page WRAPPER, not to an inner content column: an opaque child paints over
// a parent's gradient, so a `bg-white` <main> would hide it completely. That is exactly what
// hid the home hero before its z-index was corrected.
export const PAGE_BG_GRADIENT =
    'bg-[linear-gradient(to_bottom,#ffffff_0%,#ffffff_45%,#bbf7d0_72%,#4ade80_100%)]';
