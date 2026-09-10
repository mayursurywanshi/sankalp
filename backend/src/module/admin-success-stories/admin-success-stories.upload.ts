import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import multer from "multer";

export const impactUploadDirectory = path.resolve(process.cwd(), "uploads", "our-impact");
mkdirSync(impactUploadDirectory, { recursive: true });

const allowedTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["video/mp4", ".mp4"],
]);

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, impactUploadDirectory),
  filename: (_request, file, callback) => callback(null, `${randomUUID()}${allowedTypes.get(file.mimetype)}`),
});

export const uploadImpactMedia = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (allowedTypes.has(file.mimetype)) callback(null, true);
    else callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "media"));
  },
}).single("media");
