const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const destDir = path.join(__dirname, 'www');

// Files to copy
const filesToCopy = [
    'index.html',
    'style.css',
    'app.js',
    'manifest.json',
    'sw.js'
];

// Folders to copy
const foldersToCopy = [
    'assets'
];

// Helper to copy directory recursively
function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Clean destination directory
if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
    console.log('Cleaned existing www/ directory.');
}

fs.mkdirSync(destDir, { recursive: true });

// Copy files
filesToCopy.forEach(file => {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${file} to www/`);
    } else {
        console.warn(`Warning: File ${file} not found.`);
    }
});

// Copy folders
foldersToCopy.forEach(folder => {
    const srcPath = path.join(srcDir, folder);
    const destPath = path.join(destDir, folder);
    if (fs.existsSync(srcPath)) {
        copyDir(srcPath, destPath);
        console.log(`Copied folder ${folder} to www/`);
    } else {
        console.warn(`Warning: Folder ${folder} not found.`);
    }
});

console.log('Build completed! Files are ready in www/ directory.');
