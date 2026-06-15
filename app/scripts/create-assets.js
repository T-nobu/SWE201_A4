const fs = require('fs');
const path = require('path');

// Minimal valid 1x1 blue PNG
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const assetsDir = path.join(__dirname, 'assets');
const buffer = Buffer.from(PNG_BASE64, 'base64');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

['icon.png', 'splash-icon.png', 'adaptive-icon.png', 'notification-icon.png'].forEach(
  (file) => {
    fs.writeFileSync(path.join(assetsDir, file), buffer);
  }
);

console.log('Placeholder assets created in app/assets');
