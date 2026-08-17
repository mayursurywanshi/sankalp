import { Request, Response } from "express";
import { HOME_CONTENT } from "../../constants/home.constants";

export const getHome = (_request: Request, response: Response): void => {
  response.status(200).json({
    success: true,
    data: HOME_CONTENT,
  });
};
