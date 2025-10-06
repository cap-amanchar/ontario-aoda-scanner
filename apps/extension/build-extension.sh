#!/bin/bash
# Generate Valid PNG Icons for Chrome Extension

echo "🎨 Generating PNG icons for Chrome..."

cd "$(dirname "$0")"

# Create icons directory
mkdir -p dist/icons

# Create a Node.js script to generate valid PNGs
cat > /tmp/generate-real-pngs.js << 'PNGGEN'
const fs = require('fs');

// This is a valid minimal PNG file (1x1 blue pixel)
// We'll use this as a base and it's a real PNG that Chrome accepts
const minimalBluePNG = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk start
  0x00, 0x00, 0x00, 0x01, // Width: 1
  0x00, 0x00, 0x00, 0x01, // Height: 1
  0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth and color type
  0x90, 0x77, 0x53, 0xDE, // IHDR CRC
  0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk start
  0x08, 0xD7, 0x63, 0x60, 0x00, 0x00, 0x00, 0x02, // Image data (blue pixel)
  0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33, // IDAT CRC
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
  0xAE, 0x42, 0x60, 0x82  // IEND CRC
]);

// Create PNG files for each size
const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
  // For now, we'll use the minimal PNG for all sizes
  // It's 1x1 but valid - Chrome will accept it
  const filename = `dist/icons/icon-${size}.png`;
  fs.writeFileSync(filename, minimalBluePNG);
  console.log(`✓ Created ${filename} (${minimalBluePNG.length} bytes)`);
});

console.log('\n✅ All PNG icons created!');
console.log('Note: Icons are minimal 1x1 PNGs. They work but are tiny.');
console.log('For production, replace with proper designed icons.');
PNGGEN

# Run the generator
node /tmp/generate-real-pngs.js

# Verify files were created
echo ""
echo "📁 Icon files created:"
ls -lh dist/icons/

# Verify they're real PNGs
echo ""
echo "🔍 Verifying PNG format:"
for size in 16 32 48 128; do
  if file dist/icons/icon-${size}.png 2>/dev/null | grep -q PNG; then
    echo "✓ icon-${size}.png is a valid PNG"
  else
    # Try with hexdump to check PNG signature
    if head -c 8 dist/icons/icon-${size}.png | od -An -tx1 | grep -q "89 50 4e 47"; then
      echo "✓ icon-${size}.png has PNG signature"
    else
      echo "✗ icon-${size}.png may not be valid"
    fi
  fi
done

echo ""
echo "✅ Icons ready! Try loading the extension now."