import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/database.config";
import { LoginInput } from "./auth.validation";
import { AuthenticatedUser, CreatedAuthenticationSession } from "./auth.types";

const STANDARD_SESSION_HOURS = 8;
const REMEMBERED_SESSION_DAYS = 30;
const DUMMY_PASSWORD_HASH = "$2b$12$5nvkpi.urID03Lds6Nmvge//SzdJ32sg.YZ2/YElNevIXP8SQhGae";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const toAuthenticatedUser = (admin: {
  id: string;
  loginId: string;
  fullName: string;
  role: "ADMIN" | "DOCTOR";
}): AuthenticatedUser => ({
  id: admin.id,
  loginId: admin.loginId,
  fullName: admin.fullName,
  role: admin.role,
});

export const authenticateUser = async (input: LoginInput): Promise<CreatedAuthenticationSession | null> => {
  const admin = await prisma.adminLoginLog.findUnique({ where: { loginId: input.loginId } });
  const passwordMatches = await bcrypt.compare(input.password, admin?.passwordHash ?? DUMMY_PASSWORD_HASH);

  if (!admin || !passwordMatches || !admin.isActive || admin.role !== input.role) {
    await prisma.adminLoginAudit.create({
      data: {
        adminId: admin?.id,
        attemptedLoginId: input.loginId,
        event: "LOGIN_FAILED",
      },
    });
    return null;
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  if (input.rememberMe) expiresAt.setDate(expiresAt.getDate() + REMEMBERED_SESSION_DAYS);
  else expiresAt.setHours(expiresAt.getHours() + STANDARD_SESSION_HOURS);

  await prisma.$transaction([
    prisma.adminAuthenticationSession.deleteMany({ where: { expiresAt: { lte: new Date() } } }),
    // Keep one active session per Admin. A new login revokes every older token.
    prisma.adminAuthenticationSession.deleteMany({ where: { adminId: admin.id } }),
    prisma.adminAuthenticationSession.create({
      data: { adminId: admin.id, tokenHash: hashToken(token), expiresAt },
    }),
    prisma.adminLoginAudit.create({
      data: { adminId: admin.id, attemptedLoginId: admin.loginId, event: "LOGIN_SUCCESS" },
    }),
  ]);

  return { token, expiresAt, user: toAuthenticatedUser(admin) };
};

export const getAuthenticatedUser = async (token?: string): Promise<AuthenticatedUser | null> => {
  if (!token) return null;

  const session = await prisma.adminAuthenticationSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: true },
  });

  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    await prisma.$transaction([
      prisma.adminLoginAudit.create({
        data: {
          adminId: session.admin.id,
          attemptedLoginId: session.admin.loginId,
          event: "SESSION_EXPIRED",
        },
      }),
      prisma.adminAuthenticationSession.delete({ where: { id: session.id } }),
    ]);
    return null;
  }

  if (!session.admin.isActive) return null;
  return toAuthenticatedUser(session.admin);
};

export const revokeAuthenticationSession = async (token?: string): Promise<void> => {
  if (!token) return;

  const tokenHash = hashToken(token);
  const session = await prisma.adminAuthenticationSession.findUnique({
    where: { tokenHash },
    include: { admin: true },
  });
  if (!session) return;

  await prisma.$transaction([
    prisma.adminLoginAudit.create({
      data: {
        adminId: session.admin.id,
        attemptedLoginId: session.admin.loginId,
        event: "LOGOUT",
      },
    }),
    prisma.adminAuthenticationSession.delete({ where: { id: session.id } }),
  ]);
};
