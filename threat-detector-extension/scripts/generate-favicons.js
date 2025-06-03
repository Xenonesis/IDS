const fs = require('fs');
const path = require('path');

// This script creates placeholder favicon files
// In a real project, you would use a tool like sharp or canvas to generate actual images

const publicDir = path.join(__dirname, '..', 'public');

// Create placeholder favicon files
const faviconSizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-96x96.png', size: 96 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 }
];

// Create a simple SVG-based favicon generator
function generateSVGFavicon(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#dc2626;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#b91c1c;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Shield background -->
  <path d="M16 2L6 6v7.5c0 6.5 4.5 12.6 10 14 5.5-1.4 10-7.5 10-14V6l-10-4z" 
        fill="url(#shieldGradient)"/>
  
  <!-- Inner shield highlight -->
  <path d="M16 4L8 7.5v6.5c0 5.2 3.6 10.1 8 11.2 4.4-1.1 8-6 8-11.2V7.5L16 4z" 
        fill="#ffffff" 
        fill-opacity="0.15"/>
  
  <!-- AI/Tech pattern -->
  <circle cx="16" cy="12" r="2" fill="#ffffff" fill-opacity="0.9"/>
  <circle cx="12" cy="16" r="1.5" fill="#ffffff" fill-opacity="0.7"/>
  <circle cx="20" cy="16" r="1.5" fill="#ffffff" fill-opacity="0.7"/>
  <circle cx="16" cy="20" r="1" fill="#ffffff" fill-opacity="0.5"/>
  
  <!-- Connection lines -->
  <line x1="16" y1="14" x2="12" y2="16" stroke="#ffffff" stroke-width="1" stroke-opacity="0.6"/>
  <line x1="16" y1="14" x2="20" y2="16" stroke="#ffffff" stroke-width="1" stroke-opacity="0.6"/>
  <line x1="12" y1="16" x2="16" y2="20" stroke="#ffffff" stroke-width="1" stroke-opacity="0.4"/>
  <line x1="20" y1="16" x2="16" y2="20" stroke="#ffffff" stroke-width="1" stroke-opacity="0.4"/>
</svg>`;
}

// Create placeholder PNG files (in a real scenario, you'd convert SVG to PNG)
function createPlaceholderPNG(filename, size) {
  const svgContent = generateSVGFavicon(size);
  const placeholderContent = `<!-- This is a placeholder. In production, convert the SVG to PNG -->
<!-- Size: ${size}x${size} -->
<!-- Filename: ${filename} -->
${svgContent}`;
  
  // For now, we'll create SVG files with PNG extensions as placeholders
  // In production, use a proper image conversion library
  fs.writeFileSync(path.join(publicDir, filename), svgContent);
}

// Generate all favicon files
console.log('Generating favicon files...');

faviconSizes.forEach(({ name, size }) => {
  createPlaceholderPNG(name, size);
  console.log(`✅ Created ${name} (${size}x${size})`);
});

// Create a proper ICO file (placeholder)
const icoContent = generateSVGFavicon(32);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoContent);
console.log('✅ Created favicon.ico');

console.log('\n🎉 All favicon files generated successfully!');
console.log('\n📝 Note: These are SVG placeholders. In production, convert them to proper PNG/ICO formats using tools like:');
console.log('   - sharp (Node.js)');
console.log('   - ImageMagick');
console.log('   - Online favicon generators');
