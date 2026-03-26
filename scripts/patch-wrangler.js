import fs from 'fs';
import path from 'path';

const WRANGLER_PATH = './dist/_worker.js/wrangler.json'; // Common path for Astro Cloudflare adapter

// Sometimes it's in dist/server/wrangler.json
const ALTERNATIVE_PATH = './dist/server/wrangler.json';

function patch(filePath) {
    if (fs.existsSync(filePath)) {
        console.log(`Patching ${filePath}...`);
        const config = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        // Remove Workers-only keys that break Pages
        const forbiddenKeys = ['main', 'rules', 'images', 'assets'];
        let changed = false;
        
        forbiddenKeys.forEach(key => {
            if (key in config) {
                delete config[key];
                changed = true;
                console.log(`- Removed forbidden key: ${key}`);
            }
        });

        // Ensure ASSETS binding is removed if present (Pages uses it internally)
        if (config.bindings) {
            const initialLen = config.bindings.length;
            config.bindings = config.bindings.filter(b => b.name !== 'ASSETS');
            if (config.bindings.length !== initialLen) {
                changed = true;
                console.log('- Removed ASSETS binding');
            }
        }

        if (changed) {
            fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
            console.log('✅ Patch applied successfully!');
        } else {
            console.log('No patching needed.');
        }
        return true;
    }
    return false;
}

if (!patch(WRANGLER_PATH)) {
    if (!patch(ALTERNATIVE_PATH)) {
        console.log('Wrangler config not found at expected paths.');
    }
}
