import getPixels from 'get-pixels';
import nearestColor from 'nearest-color';

const colorPalette = {
  black: {
    id: 0,
    rgb: [0, 0, 0],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  gray: {
    id: 1,
    rgb: [127, 127, 127],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  darkRed: {
    id: 2,
    rgb: [136, 0, 21],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  red: {
    id: 3,
    rgb: [255, 0, 0],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  orange: {
    id: 4,
    rgb: [255, 127, 39],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  yellow: {
    id: 5,
    rgb: [255, 255, 0],
    distanceThreshold: 150,
    priorityThreshold: 5,
  },
  green: {
    id: 6,
    rgb: [0, 255, 0],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  blue: {
    id: 7,
    rgb: [0, 162, 232],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  darkBlue: {
    id: 8,
    rgb: [63, 72, 204],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  purple: {
    id: 9,
    rgb: [163, 73, 164],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  white: {
    id: 10,
    rgb: [255, 255, 255],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  lightGray: {
    id: 11,
    rgb: [195, 195, 195],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  brown: {
    id: 12,
    rgb: [185, 122, 87],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  lightPink: {
    id: 13,
    rgb: [255, 174, 201],
    distanceThreshold: 150,
    priorityThreshold: 5,
  },
  darkYellow: {
    id: 14,
    rgb: [255, 201, 14],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  beige: {
    id: 15,
    rgb: [239, 228, 176],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  lime: {
    id: 16,
    rgb: [181, 230, 29],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  skyBlue: {
    id: 17,
    rgb: [153, 217, 234],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  steelBlue: {
    id: 18,
    rgb: [112, 146, 190],
    distanceThreshold: 150,
    priorityThreshold: 0,
  },
  lavender: {
    id: 19,
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
    // res.status(200).send(tiles);
    res.status(200).json({response: JSON.stringify(tiles)});
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
      
      let width = pixels.shape[0];
      let height = pixels.shape[1];
      
      width = width - width % tileSize;
      height = height - height % tileSize;
      
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
          tiles.push(colors.indexOf(tileColor) + 1);
        }
      }
      resolve(tiles);
    });
  });
}
