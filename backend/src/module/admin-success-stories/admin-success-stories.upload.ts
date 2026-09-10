import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { open, unlink } from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { NextFunction, Request, Response } from "express";

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

export const matchesImpactMediaSignature = (mimeType: string, bytes: Buffer) => {
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/webp") return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  if (mimeType === "video/mp4") return bytes.subarray(4, 8).toString("ascii") === "ftyp";
  return false;
};

export const verifyImpactMediaSignature = async (request: Request, response: Response, next: NextFunction) => {
  if (!request.file) { next(); return; }
  const filePath = path.resolve(request.file.path);
  try {
    const handle = await open(filePath, "r");
    const bytes = Buffer.alloc(12);
    try { await handle.read(bytes, 0, bytes.length, 0); }
    finally { await handle.close(); }
    if (matchesImpactMediaSignature(request.file.mimetype, bytes)) { next(); return; }
    await unlink(filePath).catch(() => undefined);
    request.file = undefined;
    response.status(400).json({ success: false, message: "The uploaded file content does not match an allowed JPG, PNG, WebP, or MP4 format." });
  } catch (error) {
    await unlink(filePath).catch(() => undefined);
    request.file = undefined;
    next(error);
  }
};
