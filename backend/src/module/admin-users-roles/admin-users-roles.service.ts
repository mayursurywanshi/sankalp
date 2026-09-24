import bcrypt from "bcryptjs";
import { prisma } from "../../config/database.config";
import {
  CreateUserRoleInput,
  UsersListInput,
} from "./admin-users-roles.validation";

const adminUser = (admin: {
  id: string;
  loginId: string;
  fullName: string;
  isActive: boolean;
  createdAt: Date;
}) => ({
  userId: admin.id,
  role: "ADMIN" as const,
  loginId: admin.loginId,
  fullName: admin.fullName,
  doctorId: null,
  email: null,
  phone: null,
  designation: "Administrator",
  status: admin.isActive ? ("ACTIVE" as const) : ("INACTIVE" as const),
  createdAt: admin.createdAt.toISOString(),
});

const doctorUser = (doctor: {
  id: string;
  doctorId: string;
  generatedLoginId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  isActive: boolean;
  credentialStatus: "PENDING" | "ACTIVE";
  createdAt: Date;
  login: { isActive: boolean } | null;
}) => ({
  userId: doctor.id,
  role: "DOCTOR" as const,
  loginId: doctor.generatedLoginId,
  fullName: `${doctor.firstName} ${doctor.lastName}`,
  doctorId: doctor.doctorId,
  email: doctor.email,
  phone: doctor.phone,
  designation: doctor.designation,
  status:
    doctor.credentialStatus === "PENDING" || !doctor.login
      ? ("PENDING" as const)
      : doctor.isActive && doctor.login.isActive
        ? ("ACTIVE" as const)
        : ("INACTIVE" as const),
  createdAt: doctor.createdAt.toISOString(),
});

export const getUsersRolesSummary = async () => {
  const [admins, activeAdmins, doctors, activeDoctors, pendingDoctors] =
    await Promise.all([
      prisma.adminLoginLog.count(),
      prisma.adminLoginLog.count({ where: { isActive: true } }),
      prisma.doctorDetail.count(),
      prisma.doctorDetail.count({
        where: {
          isActive: true,
          credentialStatus: "ACTIVE",
          login: { is: { isActive: true } },
        },
      }),
      prisma.doctorDetail.count({ where: { credentialStatus: "PENDING" } }),
    ]);
  return {
    totalUsers: admins + doctors,
    admins,
    doctors,
    active: activeAdmins + activeDoctors,
    inactive: admins + doctors - activeAdmins - activeDoctors - pendingDoctors,
    pending: pendingDoctors,
  };
};

export const listUsersRoles = async (input: UsersListInput) => {
  const search = input.search?.toLowerCase();
  const [admins, doctors] = await Promise.all([
    input.role === "DOCTOR"
      ? Promise.resolve([])
      : prisma.adminLoginLog.findMany({ orderBy: { createdAt: "desc" } }),
    input.role === "ADMIN"
      ? Promise.resolve([])
      : prisma.doctorDetail.findMany({
          include: { login: { select: { isActive: true } } },
          orderBy: { createdAt: "desc" },
        }),
  ]);
  const users = [...admins.map(adminUser), ...doctors.map(doctorUser)]
    .filter((user) => !input.status || user.status === input.status)
    .filter(
      (user) =>
        !search ||
        [
          user.loginId,
          user.fullName,
          user.doctorId,
          user.email,
          user.phone,
        ].some((value) => value?.toLowerCase().includes(search)),
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const start = (input.page - 1) * input.pageSize;
  return {
    items: users.slice(start, start + input.pageSize),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total: users.length,
      totalPages: Math.max(1, Math.ceil(users.length / input.pageSize)),
    },
  };
};

export const getUserRole = async (role: "ADMIN" | "DOCTOR", userId: string) => {
  if (role === "ADMIN") {
    const user = await prisma.adminLoginLog.findUnique({
      where: { id: userId },
    });
    return user ? adminUser(user) : null;
  }
  const user = await prisma.doctorDetail.findUnique({
    where: { id: userId },
    include: { login: { select: { isActive: true } } },
  });
  return user ? doctorUser(user) : null;
};

export const createUserRole = async (
  input: CreateUserRoleInput,
  createdBy: string,
) => {
  if (input.role === "ADMIN") {
    const [adminDuplicate, doctorDuplicate] = await Promise.all([
      prisma.adminLoginLog.findUnique({
        where: { loginId: input.loginId },
        select: { id: true },
      }),
      prisma.doctorLoginDetail.findUnique({
        where: { loginId: input.loginId },
        select: { id: true },
      }),
    ]);
    if (adminDuplicate || doctorDuplicate)
      return { outcome: "DUPLICATE" as const };
    const admin = await prisma.adminLoginLog.create({
      data: {
        loginId: input.loginId,
        fullName: input.fullName,
        passwordHash: await bcrypt.hash(input.password, 12),
        role: "ADMIN",
      },
    });
    return { outcome: "CREATED" as const, user: adminUser(admin) };
  }

  const doctor = await prisma.doctorDetail.findUnique({
    where: { doctorId: input.doctorId },
    include: { login: true },
  });
  if (!doctor) return { outcome: "NOT_FOUND" as const };
  if (doctor.login || doctor.credentialStatus === "ACTIVE")
    return { outcome: "ALREADY_CREATED" as const };
  const conflictingAdmin = await prisma.adminLoginLog.findUnique({
    where: { loginId: doctor.generatedLoginId },
    select: { id: true },
  });
  if (conflictingAdmin) return { outcome: "DUPLICATE" as const };
  const passwordHash = await bcrypt.hash(input.password, 12);
  const updated = await prisma.$transaction(async (transaction) => {
    await transaction.doctorLoginDetail.create({
      data: {
        doctorDetailsId: doctor.id,
        loginId: doctor.generatedLoginId,
        passwordHash,
        createdBy,
        updatedBy: createdBy,
      },
    });
    return transaction.doctorDetail.update({
      where: { id: doctor.id },
      data: { credentialStatus: "ACTIVE", isActive: true },
      include: { login: { select: { isActive: true } } },
    });
  });
  return { outcome: "CREATED" as const, user: doctorUser(updated) };
};

export const updateUserRoleStatus = async (
  role: "ADMIN" | "DOCTOR",
  userId: string,
  isActive: boolean,
  currentAdminId: string,
) => {
  if (role === "ADMIN") {
    if (userId === currentAdminId && !isActive)
      return { outcome: "SELF_DEACTIVATION" as const };
    const admin = await prisma.adminLoginLog.findUnique({
      where: { id: userId },
    });
    if (!admin) return { outcome: "NOT_FOUND" as const };
    const updated = await prisma.$transaction(async (transaction) => {
      const result = await transaction.adminLoginLog.update({
        where: { id: userId },
        data: { isActive },
      });
      if (!isActive)
        await transaction.adminAuthenticationSession.deleteMany({
          where: { adminId: userId },
        });
      return result;
    });
    return { outcome: "UPDATED" as const, user: adminUser(updated) };
  }
  const doctor = await prisma.doctorDetail.findUnique({
    where: { id: userId },
    include: { login: true },
  });
  if (!doctor) return { outcome: "NOT_FOUND" as const };
  if (!doctor.login) return { outcome: "CREDENTIALS_REQUIRED" as const };
  const updated = await prisma.$transaction(async (transaction) => {
    await transaction.doctorLoginDetail.update({
      where: { id: doctor.login!.id },
      data: { isActive, updatedBy: "Admin" },
    });
    const result = await transaction.doctorDetail.update({
      where: { id: userId },
      data: { isActive },
      include: { login: { select: { isActive: true } } },
    });
    if (!isActive)
      await transaction.doctorAuthenticationSession.deleteMany({
        where: { doctorLoginDetailsId: doctor.login!.id },
      });
    return result;
  });
  return { outcome: "UPDATED" as const, user: doctorUser(updated) };
};

export const getUserLoginActivity = async (
  role: "ADMIN" | "DOCTOR",
  userId: string,
) => {
  if (role === "ADMIN") {
    const exists = await prisma.adminLoginLog.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!exists) return null;
    const activity = await prisma.adminLoginAudit.findMany({
      where: { adminId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return activity.map((item) => ({
      id: item.id,
      event: item.event,
      attemptedLoginId: item.attemptedLoginId,
      createdAt: item.createdAt.toISOString(),
    }));
  }
  const doctor = await prisma.doctorDetail.findUnique({
    where: { id: userId },
    include: { login: { select: { id: true } } },
  });
  if (!doctor) return null;
  if (!doctor.login) return [];
  const activity = await prisma.doctorLoginAudit.findMany({
    where: { doctorLoginDetailsId: doctor.login.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return activity.map((item) => ({
    id: item.id,
    event: item.event,
    attemptedLoginId: item.attemptedLoginId,
    createdAt: item.createdAt.toISOString(),
  }));
};
