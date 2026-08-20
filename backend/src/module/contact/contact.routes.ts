import { Router } from "express";
import { getContact, submitContactMessage } from "./contact.controller";

const contactRouter = Router();

contactRouter.get("/", getContact);
contactRouter.post("/messages", submitContactMessage);

export default contactRouter;
