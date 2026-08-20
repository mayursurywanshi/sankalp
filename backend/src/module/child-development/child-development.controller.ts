import { Request, Response } from "express";
import { CHILD_DEVELOPMENT_CONTENT } from "../../constants/child-development.constants";

export const getChildDevelopment = (
  _request: Request,
  response: Response,
): void => {
  response.status(200).json({
    success: true,
    data: CHILD_DEVELOPMENT_CONTENT,
  });
};
