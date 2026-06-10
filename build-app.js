const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, 'www');

// Helper to copy directory recursively
function copyFolderSync(from, to) {
    if (!fs.existsSync(to)) {
        fs.mkdirSync(to, { recursive: true });
    }
    fs.readdirSync(from).forEach(element => {
        const fromPath = path.join(from, element);
        const toPath = path.join(to, element);
        if (fs.lstatSync(fromPath).isDirectory()) {
            // Skip node_modules, .git, .vercel, and android folder
            if (element !== 'node_modules' && element !== '.git' && element !== '.vercel' && element !== 'android' && element !== 'www') {
                copyFolderSync(fromPath, toPath);
            }
        } else {
            fs.copyFileSync(fromPath, toPath);
        }
    });
}

// Clean and rebuild
console.log('Cleaning build folder...');
if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
}
fs.mkdirSync(BUILD_DIR);

console.log('Copying static assets to www/ ...');
// Copy specific root files
const filesToCopy = [
    'index.html',
    'style.css',
    'app.js',
    'manifest.json',
    'sw.js'
];

filesToCopy.forEach(file => {
    const src = path.join(__dirname, file);
    const dest = path.join(BUILD_DIR, file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${file}`);
    } else {
        console.warn(`File not found: ${file}`);
    }
});

// Copy assets folder
const assetsSrc = path.join(__dirname, 'assets');
const assetsDest = path.join(BUILD_DIR, 'assets');
if (fs.existsSync(assetsSrc)) {
    copyFolderSync(assetsSrc, assetsDest);
    console.log('Copied assets directory recursively.');
}

console.log('Build packaged successfully into www/!');
