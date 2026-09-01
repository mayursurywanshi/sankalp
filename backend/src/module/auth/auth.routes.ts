import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { getSession, login, logout } from "./auth.controller";

const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." },
});

authRouter.post("/login", loginLimiter, login);
authRouter.get("/session", getSession);
authRouter.post("/logout", logout);

export default authRouter;
