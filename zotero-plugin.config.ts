import { defineConfig } from "zotero-plugin-scaffold";
import fs from "fs";
import path from "path";

export async function copyFile(source, destination) {
  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  await fs.promises.copyFile(source, destination);
}

export default defineConfig({
  name: "kysely-dialect-dummy-plugin",
  id: "kysely-dialect-dummy-plugin",
  namespace: "kysely-dialect-dummy-plugin",
  updateURL: "https://example.com/update.json",
  dist: "build",
  build: {
    define: {
      author: "sneakers-the-rat"
    },
    makeManifest: {
      enable: false
    },
    hooks: {
      "build:copyAssets": () => {
        copyFile(
          "test/plugin/manifest.json",
          "build/addon/manifest.json",
        );
        copyFile(
          "test/plugin/bootstrap.js",
          "build/addon/bootstrap.js",
        );
      },
    }
  },
  test: {
    entries: ["test/tests/"],
    abortOnFail: false,
    exitOnFinish: true,
    waitForPlugin: `() => Zotero.Dummy`
  }
});
