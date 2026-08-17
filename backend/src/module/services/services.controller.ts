import { Request, Response } from "express";
import { SERVICES_CONTENT } from "../../constants/services.constants";

export const getServices = (_request: Request, response: Response): void => {
  response.status(200).json({
    success: true,
    data: SERVICES_CONTENT,
  });
};
