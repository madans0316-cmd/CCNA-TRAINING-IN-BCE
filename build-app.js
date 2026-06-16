const fs = require('fs');
const path = require('path');

const WWW_DIR = path.join(__dirname, 'www');
const SRC_DIR = __dirname;

// Files to copy to www directory
const FILES_TO_COPY = [
  'index.html',
  'styles.css',
  'app.js',
  'chatbot.js',
  'mentor.html',
  'mentor.js',
  'manifest.json',
  'sw.js'
];

// Create www directory if it doesn't exist
if (!fs.existsSync(WWW_DIR)) {
  fs.mkdirSync(WWW_DIR, { recursive: true });
}

// Copy assets directory if it exists
const assetsDir = path.join(SRC_DIR, 'assets');
const wwwAssetsDir = path.join(WWW_DIR, 'assets');

if (fs.existsSync(assetsDir)) {
  if (fs.existsSync(wwwAssetsDir)) {
    fs.rmSync(wwwAssetsDir, { recursive: true, force: true });
  }
  fs.cpSync(assetsDir, wwwAssetsDir, { recursive: true });
  console.log('✓ Copied assets/ directory');
}

// Copy all source files to www
FILES_TO_COPY.forEach(file => {
  const srcPath = path.join(SRC_DIR, file);
  const destPath = path.join(WWW_DIR, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✓ Copied ${file}`);
  } else {
    console.warn(`⚠ Source file not found: ${file}`);
  }
});

console.log('\n✅ Build completed! Files packaged into www/ directory');
console.log(`📦 Output: ${WWW_DIR}`);
