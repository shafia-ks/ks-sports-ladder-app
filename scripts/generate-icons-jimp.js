const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

// Icon sizes required for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const maskableSizes = [192, 512];

const inputImage = path.join(__dirname, '../public/app-icon-base.png');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
    console.log('🎨 Generating PWA icons using Jimp...');

    try {
        if (!fs.existsSync(inputImage)) {
            throw new Error(`Input file not found: ${inputImage}`);
        }

        const image = await Jimp.read(inputImage);

        // Generate standard square icons
        for (const size of sizes) {
            const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

            // Jimp v1 syntax might differ, trying safe approach or guessing based on v1 structure
            // If resize takes object: .resize({ w: size, h: size })
            // If it takes params: .resize(size, size)
            // Inspecting prototype keys might help, but let's try standard first.

            const resized = image.clone();
            resized.resize({ w: size, h: size });
            await resized.write(outputPath);

            console.log(`✓ Generated icon-${size}x${size}.png`);
        }

        // Generate maskable icons (with padding)
        for (const size of maskableSizes) {
            const outputPath = path.join(outputDir, `icon-maskable-${size}x${size}.png`);

            // Create a blank image with the brand color background
            const background = new Jimp({ width: size, height: size, color: 0x2563ebff });

            // Calculate icon size (80% of total) and padding
            const iconSize = Math.floor(size * 0.8);
            const padding = Math.floor((size - iconSize) / 2);

            const icon = image.clone();
            icon.resize({ w: iconSize, h: iconSize });

            // Composite the icon onto the background
            background.composite(icon, padding, padding);

            await background.write(outputPath);

            console.log(`✓ Generated icon-maskable-${size}x${size}.png`);
        }

        console.log('\n✅ All icons generated successfully!');
    } catch (error) {
        console.error('❌ Error generating icons:', error.message);
        process.exit(1);
    }
}

generateIcons();
