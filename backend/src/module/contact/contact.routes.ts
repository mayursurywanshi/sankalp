import { Router } from "express";
import { getContact, submitContactMessage } from "./contact.controller";
import { createPublicSubmissionRateLimit } from "../../middleware/public-submission-rate-limit";

const contactRouter = Router();

contactRouter.get("/", getContact);
contactRouter.post("/messages", createPublicSubmissionRateLimit(), submitContactMessage);

export default contactRouter;
