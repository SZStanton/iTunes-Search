import { describe, expect, it } from 'vitest';
import { SWIPE_DISTANCE, swipeDirection } from './swipe';

describe('reading a swipe', () => {
  it('pages forward when the content is dragged left', () => {
    expect(swipeDirection(-120, 0)).toBe('left');
  });

  it('pages back when it is dragged right', () => {
    expect(swipeDirection(120, 0)).toBe('right');
  });

  it('ignores anything shorter than the threshold', () => {
    expect(swipeDirection(-(SWIPE_DISTANCE - 1), 0)).toBeNull();
    expect(swipeDirection(SWIPE_DISTANCE - 1, 0)).toBeNull();
  });

  it('takes it at exactly the threshold', () => {
    expect(swipeDirection(-SWIPE_DISTANCE, 0)).toBe('left');
  });

  it('ignores a tap, where nothing moved', () => {
    expect(swipeDirection(0, 0)).toBeNull();
  });

  // Scrolling a long page with a thumb is never perfectly vertical
  it('ignores a scroll that drifted sideways', () => {
    expect(swipeDirection(-70, 300)).toBeNull();
    expect(swipeDirection(70, -300)).toBeNull();
  });

  it('still takes a long swipe that sagged a little', () => {
    expect(swipeDirection(-200, 40)).toBe('left');
  });
});
