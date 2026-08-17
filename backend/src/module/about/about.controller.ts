import { Request, Response } from "express";
import { ABOUT_CONTENT } from "../../constants/about.constants";

export const getAbout = (_request: Request, response: Response): void => {
  response.status(200).json({
    success: true,
    data: ABOUT_CONTENT,
  });
};
