const fs = require('fs');
const path = require('path');

// Simple PNG generator using canvas-like approach
// This creates a basic base64 encoded PNG

function createSimpleIcon(size) {
  // Create a simple SVG that we'll save as the icon source
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="#2563eb" rx="${size * 0.15}"/>
  <g fill="white" transform="translate(${size/2}, ${size/2})">
    <text font-size="${size * 0.5}" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif">🏆</text>
  </g>
</svg>`.trim();
  
  return svg;
}

// Generate icons
const publicDir = path.join(__dirname, '..', 'public');

// For now, we'll create SVG versions which most browsers support
// You can convert these to PNG using an online tool or ImageMagick later
fs.writeFileSync(
  path.join(publicDir, 'icon-192x192.svg'),
  createSimpleIcon(192)
);

fs.writeFileSync(
  path.join(publicDir, 'icon-512x512.svg'),
  createSimpleIcon(512)
);

console.log('✓ Generated icon-192x192.svg');
console.log('✓ Generated icon-512x512.svg');
console.log('');
console.log('Note: For production, convert these SVGs to PNG format.');
console.log('You can use:');
console.log('- Online tools like https://cloudconvert.com/svg-to-png');
console.log('- ImageMagick: convert icon.svg icon.png');
console.log('- Or use the generate-icons.html file in your browser');
