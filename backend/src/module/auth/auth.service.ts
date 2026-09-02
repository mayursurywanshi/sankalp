import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/database.config";
import { LoginInput } from "./auth.validation";
import { AuthenticatedUser, CreatedAuthenticationSession } from "./auth.types";

const STANDARD_SESSION_HOURS = 8;
const REMEMBERED_SESSION_DAYS = 30;
const DUMMY_PASSWORD_HASH = "$2b$12$5nvkpi.urID03Lds6Nmvge//SzdJ32sg.YZ2/YElNevIXP8SQhGae";
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const createToken = () => randomBytes(32).toString("hex");
const createExpiry = (rememberMe: boolean) => {
  const expiresAt = new Date();
  if (rememberMe) expiresAt.setDate(expiresAt.getDate() + REMEMBERED_SESSION_DAYS);
  else expiresAt.setHours(expiresAt.getHours() + STANDARD_SESSION_HOURS);
  return expiresAt;
};

const authenticateAdmin = async (input: LoginInput): Promise<CreatedAuthenticationSession | null> => {
  const admin = await prisma.adminLoginLog.findUnique({ where: { loginId: input.loginId } });
  const passwordMatches = await bcrypt.compare(input.password, admin?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!admin || !passwordMatches || !admin.isActive || admin.role !== "ADMIN") {
    await prisma.adminLoginAudit.create({ data: { adminId: admin?.id, attemptedLoginId: input.loginId, event: "LOGIN_FAILED" } });
    return null;
  }
  const token = createToken();
  const expiresAt = createExpiry(input.rememberMe);
  await prisma.$transaction([
    prisma.adminAuthenticationSession.deleteMany({ where: { expiresAt: { lte: new Date() } } }),
    prisma.adminAuthenticationSession.deleteMany({ where: { adminId: admin.id } }),
    prisma.adminAuthenticationSession.create({ data: { adminId: admin.id, tokenHash: hashToken(token), expiresAt } }),
    prisma.adminLoginAudit.create({ data: { adminId: admin.id, attemptedLoginId: admin.loginId, event: "LOGIN_SUCCESS" } }),
  ]);
  return { token, expiresAt, user: { id: admin.id, loginId: admin.loginId, fullName: admin.fullName, role: "ADMIN" } };
};

const authenticateDoctor = async (input: LoginInput): Promise<CreatedAuthenticationSession | null> => {
  const login = await prisma.doctorLoginDetail.findUnique({ where: { loginId: input.loginId }, include: { doctor: true } });
  const passwordMatches = await bcrypt.compare(input.password, login?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!login || !passwordMatches || !login.isActive || !login.doctor.isActive || login.doctor.credentialStatus !== "ACTIVE") {
    await prisma.doctorLoginAudit.create({ data: { doctorLoginDetailsId: login?.id, attemptedLoginId: input.loginId, event: "LOGIN_FAILED" } });
    return null;
  }
  const token = createToken();
  const expiresAt = createExpiry(input.rememberMe);
  await prisma.$transaction([
    prisma.doctorAuthenticationSession.deleteMany({ where: { expiresAt: { lte: new Date() } } }),
    prisma.doctorAuthenticationSession.deleteMany({ where: { doctorLoginDetailsId: login.id } }),
    prisma.doctorAuthenticationSession.create({ data: { doctorLoginDetailsId: login.id, tokenHash: hashToken(token), expiresAt } }),
    prisma.doctorLoginAudit.create({ data: { doctorLoginDetailsId: login.id, attemptedLoginId: login.loginId, event: "LOGIN_SUCCESS" } }),
  ]);
  return { token, expiresAt, user: { id: login.doctor.id, loginId: login.loginId, fullName: `${login.doctor.firstName} ${login.doctor.lastName}`, role: "DOCTOR" } };
};

export const authenticateUser = (input: LoginInput) => input.role === "ADMIN" ? authenticateAdmin(input) : authenticateDoctor(input);

export const getAuthenticatedUser = async (token?: string): Promise<AuthenticatedUser | null> => {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const adminSession = await prisma.adminAuthenticationSession.findUnique({ where: { tokenHash }, include: { admin: true } });
  if (adminSession) {
    if (adminSession.expiresAt <= new Date()) {
      await prisma.$transaction([
        prisma.adminLoginAudit.create({ data: { adminId: adminSession.admin.id, attemptedLoginId: adminSession.admin.loginId, event: "SESSION_EXPIRED" } }),
        prisma.adminAuthenticationSession.delete({ where: { id: adminSession.id } }),
      ]);
      return null;
    }
    if (!adminSession.admin.isActive) return null;
    return { id: adminSession.admin.id, loginId: adminSession.admin.loginId, fullName: adminSession.admin.fullName, role: "ADMIN" };
  }

  const doctorSession = await prisma.doctorAuthenticationSession.findUnique({ where: { tokenHash }, include: { doctorLogin: { include: { doctor: true } } } });
  if (!doctorSession) return null;
  const login = doctorSession.doctorLogin;
  if (doctorSession.expiresAt <= new Date()) {
    await prisma.$transaction([
      prisma.doctorLoginAudit.create({ data: { doctorLoginDetailsId: login.id, attemptedLoginId: login.loginId, event: "SESSION_EXPIRED" } }),
      prisma.doctorAuthenticationSession.delete({ where: { id: doctorSession.id } }),
    ]);
    return null;
  }
  if (!login.isActive || !login.doctor.isActive || login.doctor.credentialStatus !== "ACTIVE") return null;
  return { id: login.doctor.id, loginId: login.loginId, fullName: `${login.doctor.firstName} ${login.doctor.lastName}`, role: "DOCTOR" };
};

export const revokeAuthenticationSession = async (token?: string): Promise<void> => {
  if (!token) return;
  const tokenHash = hashToken(token);
  const adminSession = await prisma.adminAuthenticationSession.findUnique({ where: { tokenHash }, include: { admin: true } });
  if (adminSession) {
    await prisma.$transaction([
      prisma.adminLoginAudit.create({ data: { adminId: adminSession.admin.id, attemptedLoginId: adminSession.admin.loginId, event: "LOGOUT" } }),
      prisma.adminAuthenticationSession.delete({ where: { id: adminSession.id } }),
    ]);
    return;
  }
  const doctorSession = await prisma.doctorAuthenticationSession.findUnique({ where: { tokenHash }, include: { doctorLogin: true } });
  if (!doctorSession) return;
  await prisma.$transaction([
    prisma.doctorLoginAudit.create({ data: { doctorLoginDetailsId: doctorSession.doctorLogin.id, attemptedLoginId: doctorSession.doctorLogin.loginId, event: "LOGOUT" } }),
    prisma.doctorAuthenticationSession.delete({ where: { id: doctorSession.id } }),
  ]);
};
