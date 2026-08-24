// Averaged from a 16px downscale rather than a real palette pass. It only
// feeds a bloom behind the artwork.
const SAMPLE = 16;
// Below this spread a pixel counts as grey, and greys average out to mud.
const COLOURFUL = 30;

function averageColour(data) {
  let all = [0, 0, 0, 0];
  let colourful = [0, 0, 0, 0];

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];

    if (a < 128) continue;

    all = [all[0] + r, all[1] + g, all[2] + b, all[3] + 1];

    if (Math.max(r, g, b) - Math.min(r, g, b) >= COLOURFUL) {
      colourful = [
        colourful[0] + r,
        colourful[1] + g,
        colourful[2] + b,
        colourful[3] + 1,
      ];
    }
  }

  // A near colourless cover still gets its own grey, so mono sleeves bloom too.
  const [r, g, b, count] = colourful[3] >= all[3] / 10 ? colourful : all;

  if (!count) return null;

  return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
}

function read(src) {
  return new Promise(resolve => {
    if (!src) return resolve(null);

    const image = new Image();

    // Apple sends the CORS header. The display uses a plain img, so losing it
    // would only cost the bloom.
    image.crossOrigin = 'anonymous';
    image.onerror = () => resolve(null);

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = SAMPLE;
        canvas.height = SAMPLE;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return resolve(null);

        context.drawImage(image, 0, 0, SAMPLE, SAMPLE);

        resolve(averageColour(context.getImageData(0, 0, SAMPLE, SAMPLE).data));
      } catch {
        // A tainted canvas throws here, and a lost bloom is not worth saying.
        resolve(null);
      }
    };

    image.src = src;
  });
}

// Keyed on the url, so a cover is sampled once and later viewers open with it.
const resolved = new Map();
const pending = new Map();

function cachedColour(src) {
  return resolved.get(src) ?? null;
}

function dominantColour(src) {
  if (!src) return Promise.resolve(null);
  if (resolved.has(src)) return Promise.resolve(resolved.get(src));
  if (pending.has(src)) return pending.get(src);

  const job = read(src).then(colour => {
    resolved.set(src, colour);
    pending.delete(src);

    return colour;
  });

  pending.set(src, job);

  return job;
}

export { averageColour, cachedColour, dominantColour };
