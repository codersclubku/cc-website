const fs = require('fs');
const path = require('path');

const publicLogoDir = path.join(__dirname, '..', 'public', 'logo');

// Ensure destination exists
if (!fs.existsSync(publicLogoDir)) {
  fs.mkdirSync(publicLogoDir, { recursive: true });
}

// Copy from E:\Coders Club KU\Logo\Coders Club (KU) svg\
const srcDir = 'E:/Coders Club KU/Logo/Coders Club (KU) svg';
const files = ['1.svg', '2.svg', '3.svg', '4.svg'];

for (const f of files) {
  const src = path.join(srcDir, f);
  const dest = path.join(publicLogoDir, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

// Create semantic file names
fs.copyFileSync(path.join(publicLogoDir, '1.svg'), path.join(publicLogoDir, 'cc-logo-stacked-lavender.svg'));
fs.copyFileSync(path.join(publicLogoDir, '2.svg'), path.join(publicLogoDir, 'cc-logo-stacked-ink.svg'));
fs.copyFileSync(path.join(publicLogoDir, '3.svg'), path.join(publicLogoDir, 'cc-logo-stacked-white.svg'));
fs.copyFileSync(path.join(publicLogoDir, '4.svg'), path.join(publicLogoDir, 'cc-logo-stacked-black.svg'));

// Read 1.svg and extract exact paths
const svgContent = fs.readFileSync(path.join(publicLogoDir, '1.svg'), 'utf8');

// Create a component that renders the exact SVG paths from user's file
console.log('Logo files copied and mapped successfully.');
