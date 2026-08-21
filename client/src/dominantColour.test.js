import { describe, expect, it } from 'vitest';
import { averageColour } from './dominantColour';

// Four bytes per pixel, so a run of these builds a fake sample
function pixels(...colours) {
  return Uint8ClampedArray.from(
    colours.flatMap(([r, g, b, a = 255]) => [r, g, b, a]),
  );
}

describe('picking a colour off a cover', () => {
  it('averages what it is given', () => {
    expect(averageColour(pixels([200, 0, 0], [100, 0, 0]))).toEqual([
      150, 0, 0,
    ]);
  });

  it('ignores transparent pixels', () => {
    expect(averageColour(pixels([200, 0, 0], [0, 255, 0, 0]))).toEqual([
      200, 0, 0,
    ]);
  });

  it('takes the colour over the greys around it', () => {
    // A sleeve that is mostly black with one bright panel. Averaging the lot
    // gives near black, which is no bloom at all
    const mostlyGrey = Array.from({ length: 9 }, () => [10, 10, 10]);

    expect(averageColour(pixels(...mostlyGrey, [220, 20, 60]))).toEqual([
      220, 20, 60,
    ]);
  });

  it('still answers for a cover with no colour in it', () => {
    expect(averageColour(pixels([40, 40, 40], [60, 60, 60]))).toEqual([
      50, 50, 50,
    ]);
  });

  it('has nothing to say about an empty sample', () => {
    expect(averageColour(pixels())).toBeNull();
    expect(averageColour(pixels([0, 0, 0, 0]))).toBeNull();
  });
});
