import bcrypt from "bcryptjs";
import { prisma } from "../../config/database.config";
import { DoctorCredentialsInput, DoctorDetailsInput, toDatabaseDate } from "./doctors.validation";

const formatDate = (value: Date) => `${String(value.getUTCDate()).padStart(2, "0")}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${value.getUTCFullYear()}`;
const namePart = (value: string, length: number) => value.normalize("NFKD").replace(/[^A-Za-z]/g, "").toUpperCase().padEnd(length, "X").slice(0, length);

const generateUniqueLoginId = async (input: DoctorDetailsInput) => {
  const datePart = input.dateOfBirth.slice(0, 2) + input.dateOfBirth.slice(3, 5);
  const base = `${namePart(input.firstName, 3)}${namePart(input.lastName, 2)}${datePart}`;
  for (let attempt = 0; attempt < 36; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base.slice(0, 8)}${attempt.toString(36).toUpperCase()}`;
    const exists = await prisma.doctorDetail.findUnique({ where: { generatedLoginId: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
  throw new Error("LOGIN_ID_EXHAUSTED");
};

const publicDoctor = (doctor: {
  doctorId: string; generatedLoginId: string; firstName: string; lastName: string; phone: string; email: string;
  designation: string; joiningDate: Date; dateOfBirth: Date; credentialStatus: "PENDING" | "ACTIVE"; isActive: boolean; createdAt: Date;
}) => ({
  doctorId: doctor.doctorId,
  loginId: doctor.generatedLoginId,
  firstName: doctor.firstName,
  lastName: doctor.lastName,
  phone: doctor.phone,
  email: doctor.email,
  designation: doctor.designation,
  joiningDate: formatDate(doctor.joiningDate),
  dateOfBirth: formatDate(doctor.dateOfBirth),
  credentialStatus: doctor.credentialStatus,
  isActive: doctor.isActive,
  createdAt: doctor.createdAt.toISOString(),
});

export const createDoctorDetails = async (input: DoctorDetailsInput) => {
  const generatedLoginId = await generateUniqueLoginId(input);
  const doctor = await prisma.doctorDetail.create({
    data: {
      generatedLoginId,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      designation: input.designation,
      joiningDate: toDatabaseDate(input.joiningDate),
      dateOfBirth: toDatabaseDate(input.dateOfBirth),
    },
  });
  return publicDoctor(doctor);
};

export const listDoctors = async () => (await prisma.doctorDetail.findMany({ orderBy: { createdAt: "desc" } })).map(publicDoctor);

export const findDoctor = async (doctorId: string) => {
  const doctor = await prisma.doctorDetail.findUnique({ where: { doctorId } });
  return doctor ? publicDoctor(doctor) : null;
};

export const createDoctorCredentials = async (doctorId: string, input: DoctorCredentialsInput, adminLoginId: string) => {
  const doctor = await prisma.doctorDetail.findUnique({ where: { doctorId }, include: { login: true } });
  if (!doctor) return { outcome: "NOT_FOUND" as const };
  if (doctor.login || doctor.credentialStatus === "ACTIVE") return { outcome: "ALREADY_CREATED" as const };

  const passwordHash = await bcrypt.hash(input.password, 12);
  const result = await prisma.$transaction(async (transaction) => {
    await transaction.doctorLoginDetail.create({
      data: {
        doctorDetailsId: doctor.id,
        loginId: doctor.generatedLoginId,
        passwordHash,
        createdBy: adminLoginId,
        updatedBy: adminLoginId,
      },
    });
    return transaction.doctorDetail.update({ where: { id: doctor.id }, data: { credentialStatus: "ACTIVE" } });
  });
  return { outcome: "CREATED" as const, doctor: publicDoctor(result) };
};

export const deleteDoctorById = async (doctorId: string) => {
  const doctor = await prisma.doctorDetail.findUnique({ where: { doctorId }, select: { id: true, doctorId: true } });
  if (!doctor) return null;
  const [appointments, caseHistories, appointmentLogs] = await Promise.all([
    prisma.appointmentRequest.count({ where: { assignedDoctorId: doctor.id } }),
    prisma.patientCaseHistory.count({ where: { attendingDoctorId: doctor.id } }),
    prisma.appointmentLog.count({ where: { OR: [{ previousDoctorId: doctor.id }, { assignedDoctorId: doctor.id }] } }),
  ]);
  if (appointments || caseHistories || appointmentLogs) return { doctorId: doctor.doctorId, blocked: true as const };
  await prisma.doctorDetail.delete({ where: { id: doctor.id } });
  return { doctorId: doctor.doctorId, blocked: false as const };
};
