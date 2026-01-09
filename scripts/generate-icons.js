const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const maskableSizes = [192, 512];

const inputSVG = path.join(__dirname, '../public/icon.svg');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  console.log('🎨 Generating PWA icons from SVG...\n');

  try {
    // Check if sharp is installed
    if (!fs.existsSync(path.join(__dirname, 'node_modules/sharp'))) {
      console.log('⚠️  Sharp not found. Installing...');
      console.log('   Run: npm install sharp --prefix scripts\n');
      process.exit(1);
    }

    // Read SVG file
    const svgBuffer = fs.readFileSync(inputSVG);

    // Generate standard icons
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated icon-${size}x${size}.png`);
    }

    // Generate maskable icons (with padding for safe zone)
    for (const size of maskableSizes) {
      const outputPath = path.join(outputDir, `icon-maskable-${size}x${size}.png`);

      // Maskable icons need 10% padding on each side
      const iconSize = Math.floor(size * 0.8); // 80% of total size
      const padding = Math.floor((size - iconSize) / 2);

      await sharp(svgBuffer)
        .resize(iconSize, iconSize)
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 37, g: 99, b: 235, alpha: 1 } // #2563eb
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated icon-maskable-${size}x${size}.png`);
    }

    console.log('\n✅ All icons generated successfully!');
    console.log('\n📁 Icons saved to: public/');
    console.log('\n🚀 Next steps:');
    console.log('   1. Commit the new icon files');
    console.log('   2. Deploy to Vercel');
    console.log('   3. Test PWA installation on mobile');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('sharp')) {
      console.log('\n💡 Install sharp first:');
      console.log('   cd scripts && npm install sharp');
    }
    process.exit(1);
  }
}

generateIcons();
