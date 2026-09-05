import { prisma } from "../../config/database.config";

export const searchAdminRecords = async (query: string) => {
  const [patients, appointments, doctors] = await Promise.all([
    prisma.patient.findMany({ where: { OR: [{ patientId: { contains: query, mode: "insensitive" } }, { patientName: { contains: query, mode: "insensitive" } }, { parentName: { contains: query, mode: "insensitive" } }, { primaryPhone: { contains: query } }] }, orderBy: { updatedAt: "desc" }, take: 5, select: { patientId: true, patientName: true, parentName: true, primaryPhone: true, isActive: true } }),
    prisma.appointmentRequest.findMany({ where: { OR: [{ referenceId: { contains: query, mode: "insensitive" } }, { childName: { contains: query, mode: "insensitive" } }, { parentName: { contains: query, mode: "insensitive" } }, { phone: { contains: query } }] }, orderBy: { updatedAt: "desc" }, take: 5, select: { referenceId: true, childName: true, parentName: true, status: true, preferredDate: true, preferredTime: true } }),
    prisma.doctorDetail.findMany({ where: { OR: [{ doctorId: { contains: query, mode: "insensitive" } }, { generatedLoginId: { contains: query, mode: "insensitive" } }, { firstName: { contains: query, mode: "insensitive" } }, { lastName: { contains: query, mode: "insensitive" } }, { designation: { contains: query, mode: "insensitive" } }, { phone: { contains: query } }] }, orderBy: { updatedAt: "desc" }, take: 5, select: { doctorId: true, generatedLoginId: true, firstName: true, lastName: true, designation: true, isActive: true } }),
  ]);
  return { query, patients, appointments: appointments.map((item) => ({ ...item, preferredDate: item.preferredDate.toISOString().slice(0, 10).split("-").reverse().join("-") })), doctors: doctors.map(({ generatedLoginId, ...item }) => ({ ...item, loginId: generatedLoginId })), totalResults: patients.length + appointments.length + doctors.length };
};
