// Far enough that a shaky tap is not a swipe, flat enough that an angled
// scroll does not turn the page.
const SWIPE_DISTANCE = 60;
const SWIPE_SLOPE = 1.5;

// 'left' means dragged left, which is the next page.
function swipeDirection(dx, dy) {
  if (Math.abs(dx) < SWIPE_DISTANCE) return null;
  if (Math.abs(dx) < Math.abs(dy) * SWIPE_SLOPE) return null;

  return dx < 0 ? 'left' : 'right';
}

export { SWIPE_DISTANCE, SWIPE_SLOPE, swipeDirection };
