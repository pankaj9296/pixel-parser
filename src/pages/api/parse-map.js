import getPixels from 'get-pixels';
import nearestColor from 'nearest-color';

// Define a list of color names and their RGB values
const colorList = {
  black:  { r: 0, g: 0, b: 0 },
  gray:  { r: 127, g: 127, b: 127 },
  darkRed:  { r: 136, g: 0, b: 21 },
  red:  { r: 237, g: 28, b: 36 },
  orange:  { r: 255, g: 127, b: 39 },
  yellow:  { r: 255, g: 242, b: 0 },
  green:  { r: 34, g: 177, b: 76 },
  blue:  { r: 0, g: 162, b: 232 },
  darkBlue:  { r: 63, g: 72, b: 204 },
  purple:  { r: 163, g: 73, b: 164 },
  white:  { r: 255, g: 255, b: 255 },
  lightGray:  { r: 195, g: 195, b: 195 },
  brown:  { r: 185, g: 122, b: 87 },
  lightPink:  { r: 255, g: 174, b: 201 },
  darkYellow:  { r: 255, g: 201, b: 14 },
  beige:  { r: 239, g: 228, b: 176 },
  lime:  { r: 181, g: 230, b: 29 },
  skyBlue:  { r: 153, g: 217, b: 234 },
  steelBlue:  { r: 112, g: 146, b: 190 },
  lavender:  { r: 200, g: 191, b: 231 },
};

const colorMatcher = nearestColor.from(colorList);

export default async function handler(req, res) {
  const { image: imageUrl } = req.query;
  const tileSize = 32;
  
  try {
    const imageData = await getImageData(imageUrl, tileSize);
    const colorNames = getColorNames(imageData); // Get color names for each tile
    res.status(200).json(colorNames);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while processing the image.', message: error.message, imageUrl });
  }
}

async function getImageData(imageUrl, tileSize) {
  return new Promise((resolve, reject) => {
    getPixels(imageUrl, 'image/png', (err, pixels) => {
      if (err) {
        reject(err);
        return;
      }
      
      const width = pixels.shape[0];
      const height = pixels.shape[1];
      const result = [];
      
      for (let y = 0; y < height; y += tileSize) {
        const resultRow = [];
        for (let x = 0; x < width; x += tileSize) {
          let sumRed = 0;
          let sumGreen = 0;
          let sumBlue = 0;
          let count = 0;
          
          for (let tileY = y; tileY < y + tileSize; tileY++) {
            for (let tileX = x; tileX < x + tileSize; tileX++) {
              if (tileY < height && tileX < width) {
                const red = pixels.get(tileX, tileY, 0);
                const green = pixels.get(tileX, tileY, 1);
                const blue = pixels.get(tileX, tileY, 2);
                
                sumRed += red;
                sumGreen += green;
                sumBlue += blue;
                count++;
              }
            }
          }
          
          const averageRed = Math.round(sumRed / count);
          const averageGreen = Math.round(sumGreen / count);
          const averageBlue = Math.round(sumBlue / count);
          
          resultRow.push([averageRed, averageGreen, averageBlue]);
        }
        result.push(resultRow);
      }
      resolve(result);
    });
  });
}

function getColorNames(imageData) {
  const colorNames = [];
  
  for (const tilesRow of imageData) {
    const colorNamesRow = [];
    for (const tile of tilesRow) {
      const [r, g, b] = tile;
      const nearestColorName = colorMatcher({r, g, b}).name; // Get the nearest color name
      colorNamesRow.push(nearestColorName);
      // console.log('color: ', {r, g, b});
    }
    colorNames.push(colorNamesRow);
  }
  
  return colorNames;
}
