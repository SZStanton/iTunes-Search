// Far enough that a tap with a shaky thumb is not a swipe, and flat enough
// that a slightly angled scroll does not flick the page over
const SWIPE_DISTANCE = 60;
const SWIPE_SLOPE = 1.5;

// 'left' means the content was dragged left, which is the next page, the way
// it reads everywhere else on a phone
function swipeDirection(dx, dy) {
  if (Math.abs(dx) < SWIPE_DISTANCE) return null;
  if (Math.abs(dx) < Math.abs(dy) * SWIPE_SLOPE) return null;

  return dx < 0 ? 'left' : 'right';
}

export { SWIPE_DISTANCE, SWIPE_SLOPE, swipeDirection };
