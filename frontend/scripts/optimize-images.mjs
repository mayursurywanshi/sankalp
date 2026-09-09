import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url));
const assetRoot = fileURLToPath(new URL("../src/assets/", import.meta.url));

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]));
  return nested.flat();
};

const assetFiles = (await walk(assetRoot)).filter((file) => extname(file).toLowerCase() === ".png");
for (const file of assetFiles) {
  const output = file.replace(/\.png$/i, ".webp");
  const hero = /hero|background/i.test(file);
  await sharp(file).resize({ width: hero ? 1280 : 900, height: hero ? 900 : 900, fit: "inside", withoutEnlargement: true }).webp({ quality: 80, effort: 5 }).toFile(output);
}

const sourceFiles = (await walk(sourceRoot)).filter((file) => /\.(?:ts|tsx|css)$/i.test(file));
for (const file of sourceFiles) {
  const current = await readFile(file, "utf8");
  const updated = current.replace(/(assets\/[^"')]+)\.png/g, "$1.webp");
  if (updated !== current) await writeFile(file, updated);
}

console.log(`Optimized ${assetFiles.length} PNG assets to WebP.`);
