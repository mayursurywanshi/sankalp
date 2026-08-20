import { Request, Response } from "express";
import { OUR_IMPACT_CONTENT } from "../../constants/our-impact.constants";

export const getOurImpact = (_request: Request, response: Response): void => {
  response.status(200).json({ success: true, data: OUR_IMPACT_CONTENT });
};
