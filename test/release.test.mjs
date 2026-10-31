import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = new URL('../', import.meta.url);
test('icon remains compact RGBA and SVG embeds the exact PNG',()=>{
 const png=fs.readFileSync(new URL('assets/icon.png',root));
 assert.equal(png.readUInt32BE(16),256);
 assert.equal(png.readUInt32BE(20),256);
 assert.equal(png[25],6,'Icon must retain RGBA transparency');
 const svg=fs.readFileSync(new URL('assets/icon.svg',root),'utf8');
 assert.ok(Buffer.byteLength(svg)<256*1024);
 assert.ok(svg.includes(png.toString('base64')));
});

test('release manifest exports real resources and contains no personal configuration', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('package.json', root), 'utf8'));
  assert.equal(manifest.name, 'dsh-comfyui-mcp');
  assert.equal(manifest.dependencies['comfyui-mcp'], '0.52.206');
  assert.equal(manifest.exports['./icon'], './assets/icon.svg');
  assert.ok(!manifest.files.includes('node_modules'));
  const inspect = relative => {
    const url = new URL(relative, root);
    if (fs.statSync(url).isDirectory()) {
      for (const entry of fs.readdirSync(url)) inspect(path.posix.join(relative, entry));
      return;
    }
    assert.ok(!/\.(?:safetensors|ckpt|pt|pth|exe|dll|pyc)$/i.test(relative), relative);
    const text = fs.readFileSync(url, 'utf8');
    assert.ok(!/[A-Z]:[\\/]Users[\\/]|\/home\/[^/]+\//i.test(text), relative + ' contains a personal path');
    assert.ok(!/sk-[a-zA-Z0-9]{24,}|-----BEGIN PRIVATE KEY-----/.test(text), relative + ' contains a credential pattern');
  };
  for (const entry of manifest.files) inspect(entry);
  inspect('package.json');
});
