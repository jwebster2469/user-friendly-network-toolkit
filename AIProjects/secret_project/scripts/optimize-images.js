const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '../frontend/assets/images');

fs.readdir(imagesDir, (err, files) => {
    if (err) {
        console.error('Error reading images directory:', err);
        return;
    }

    files.forEach(file => {
        const filePath = path.join(imagesDir, file);
        const outputFilePath = path.join(imagesDir, path.parse(file).name + '.webp');

        // Skip empty files
        fs.stat(filePath, (err, stats) => {
            if (err) {
                console.error('Error getting file stats:', err);
                return;
            }

            if (stats.size === 0) {
                console.log(`Skipping empty file: ${file}`);
                return;
            }

            // Check if the output file already exists
            if (fs.existsSync(outputFilePath)) {
                console.log(`Output file already exists, skipping: ${outputFilePath}`);
                return;
            }

            sharp(filePath)
                .webp({ quality: 85 })
                .toFile(outputFilePath, (err, info) => {
                    if (err) {
                        console.error('Error converting image:', err);
                    } else {
                        console.log('Image converted:', info);
                    }
                });
        });
    });
});
