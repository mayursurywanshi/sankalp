import { NextFunction, Request, Response } from "express";

export const preventSensitiveResponseCaching = (_request: Request, response: Response, next: NextFunction) => {
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.setHeader("Pragma", "no-cache");
  next();
};
