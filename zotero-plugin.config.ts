import {defineConfig} from 'zotero-plugin-scaffold';
import fs from 'fs';
import path from 'path';

function copyFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  fs.copyFileSync(source, destination);
}

export default defineConfig({
  name: 'kysely-dialect-dummy-plugin',
  id: 'kysely-dialect-dummy-plugin',
  namespace: 'kysely-dialect-dummy-plugin',
  updateURL: 'https://example.com/update.json',
  dist: 'build',
  build: {
    define: {
      author: 'sneakers-the-rat',
    },
    makeManifest: {
      enable: false,
    },
    hooks: {
      'build:copyAssets': () => {
        copyFile('test/plugin/manifest.json', 'build/addon/manifest.json');
        copyFile('test/plugin/bootstrap.js', 'build/addon/bootstrap.js');
      },
    },
  },
  test: {
    entries: ['test/'],
    abortOnFail: false,
    exitOnFinish: true,
    waitForPlugin: '() => Zotero.Dummy',
  },
});
