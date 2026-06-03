import { readdirSync, copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, extname } from 'path';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']);
const SCENES_SRC = './src/content/stories';
const SCENES_DEST = './public/scenes';

function copySceneImages(srcDir, destDir, relativePath = '') {
  const entries = readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      copySceneImages(srcPath, destDir, relPath);
    } else if (IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      const destPath = join(destDir, relPath);
      const destFolder = join(destDir, relativePath);
      if (!existsSync(destFolder)) mkdirSync(destFolder, { recursive: true });
      copyFileSync(srcPath, destPath);
      console.log(`📷 Copied: ${relPath}`);
    }
  }
}

copySceneImages(SCENES_SRC, SCENES_DEST);
console.log('✅ Scene images copied to public/scenes/');