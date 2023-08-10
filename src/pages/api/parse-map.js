import getPixels from 'get-pixels';
import nearestColor from 'nearest-color';

const colorPalette = {
  black: {
    rgb: [0, 0, 0],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  gray: {
    rgb: [127, 127, 127],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  darkRed: {
    rgb: [136, 0, 21],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  red: {
    rgb: [255, 0, 0],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  orange: {
    rgb: [255, 127, 39],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  yellow: {
    rgb: [255, 255, 0],
    distanceThreshold: 150,
    priorityThreshold: 5,
  },
  green: {
    rgb: [0, 255, 0],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  blue: {
    rgb: [0, 162, 232],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  darkBlue: {
    rgb: [63, 72, 204],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  purple: {
    rgb: [163, 73, 164],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  white: {
    rgb: [255, 255, 255],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  lightGray: {
    rgb: [195, 195, 195],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  brown: {
    rgb: [185, 122, 87],
    distanceThreshold: 150,
    priorityThreshold: 5,
  },
  lightPink: {
    rgb: [255, 174, 201],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  darkYellow: {
    rgb: [255, 201, 14],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  beige: {
    rgb: [239, 228, 176],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  lime: {
    rgb: [181, 230, 29],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  skyBlue: {
    rgb: [153, 217, 234],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  steelBlue: {
    rgb: [112, 146, 190],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  lavender: {
    rgb: [200, 191, 231],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
};

const colors = Object.keys(colorPalette);

const colorPaletteRgb = Object.fromEntries(Object.entries(colorPalette).map(([color, {rgb}]) => [color, {r: rgb[0], g: rgb[1], b: rgb[2]}]));

const colorMatcher = nearestColor.from(colorPaletteRgb);

export default async function handler(req, res) {
  const { image: mapUrl } = req.query;
  const tileSize = 32;
  
  try {
    const tiles = await getMapTiles(mapUrl, tileSize);
    res.status(200).json(tiles);
  } catch (error) {
    console.error({ error: 'An error occurred while processing the image.', message: error.message, mapUrl });
    res.status(500).json({ error: 'An error occurred while processing the image.', message: error.message, mapUrl });
  }
}

async function getMapTiles(mapUrl, tileSize) {
  return new Promise((resolve, reject) => {
    getPixels(mapUrl, 'image/png', (err, pixels) => {
      if (err) {
        reject(err);
        return;
      }
      
      const width = pixels.shape[0];
      const height = pixels.shape[1];
      const tiles = [];
      
      for (let y = 0; y < height; y += tileSize) {
        for (let x = 0; x < width; x += tileSize) {
          
          const tilePixels = {};
          
          for (let tileY = y; tileY < y + tileSize; tileY++) {
            for (let tileX = x; tileX < x + tileSize; tileX++) {
              
              if (tileY < height && tileX < width) {
                
                const r = pixels.get(tileX, tileY, 0);
                const g = pixels.get(tileX, tileY, 1);
                const b = pixels.get(tileX, tileY, 2);
                
                const nearestColor = colorMatcher({r, g, b});
                const nearestColorName = nearestColor.name;
                
                if (!colorPalette[nearestColorName].distance || (colorPalette[nearestColorName].distance > nearestColor.distance)) {
                  tilePixels[nearestColorName] = (tilePixels[nearestColorName] || 0) + 1;
                }
              }
            }
          }
          
          let mostUsedColorInTile = '';
          let mostUsedColorCount = 0;
          let colorMetThreshold = '';
          let colorMetThresholdCount = 0;
          for(const key in tilePixels) {
            
            if (mostUsedColorCount < tilePixels[key]) {
              mostUsedColorInTile = key;
              mostUsedColorCount = tilePixels[key];
            }
            
            if (colorPalette[key].priorityThreshold > 0 && tilePixels[key] >= colorPalette[key].priorityThreshold) {
              if (colorMetThresholdCount < tilePixels[key]) {
                colorMetThreshold = key;
                colorMetThresholdCount = tilePixels[key];
              }
            }
          }
          const tileColor = colorMetThreshold || mostUsedColorInTile;
          tiles.push(colors.indexOf(tileColor));
        }
      }
      resolve(tiles);
    });
  });
}
