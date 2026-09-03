import { prisma } from "../../config/database.config";
import {
  DashboardActivity,
  DashboardAppointmentRequest,
  DashboardMetricSummary,
  DashboardScheduleSummary,
} from "./admin-dashboard.types";

const toDateString = (date: Date) => date.toISOString().slice(0, 10);

export const getDashboardData = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalAppointments,
    pendingRequests,
    patients,
    newEnquiries,
    totalDoctors,
    recentAppointments,
    todayStatuses,
    recentAppointmentActivity,
    recentContactActivity,
  ] = await Promise.all([
    prisma.appointmentRequest.count(),
    prisma.appointmentRequest.count({ where: { status: "REQUESTED" } }),
    prisma.appointmentRequest.groupBy({ by: ["childName", "phone"] }),
    prisma.contactMessage.count({ where: { status: "NEW" } }),
    prisma.doctorDetail.count({ where: { isActive: true } }),
    prisma.appointmentRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        referenceId: true,
        parentName: true,
        childName: true,
        childAge: true,
        preferredDate: true,
        preferredTime: true,
        status: true,
      },
    }),
    prisma.appointmentRequest.groupBy({
      by: ["status"],
      where: { preferredDate: { gte: today, lt: tomorrow } },
      _count: { _all: true },
    }),
    prisma.appointmentRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, childName: true, createdAt: true },
    }),
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, createdAt: true },
    }),
  ]);

  const metrics: DashboardMetricSummary = {
    totalAppointments,
    pendingRequests,
    totalPatients: patients.length,
    totalDoctors,
    newEnquiries,
  };

  const appointmentRequests: DashboardAppointmentRequest[] = recentAppointments.map((appointment) => ({
    ...appointment,
    preferredDate: toDateString(appointment.preferredDate),
  }));

  const statusCounts = new Map(todayStatuses.map((item) => [item.status, item._count._all]));
  const todaySchedule: DashboardScheduleSummary = {
    total: todayStatuses.reduce((total, item) => total + item._count._all, 0),
    requested: statusCounts.get("REQUESTED") ?? 0,
    assigned: statusCounts.get("ASSIGNED") ?? 0,
    completed: statusCounts.get("COMPLETED") ?? 0,
    cancelled: statusCounts.get("CANCELLED") ?? 0,
  };

  const recentActivities: DashboardActivity[] = [
    ...recentAppointmentActivity.map((appointment) => ({
      id: appointment.id,
      type: "APPOINTMENT_REQUEST" as const,
      message: `New appointment request received for ${appointment.childName}.`,
      createdAt: appointment.createdAt.toISOString(),
    })),
    ...recentContactActivity.map((contact) => ({
      id: contact.id,
      type: "CONTACT_ENQUIRY" as const,
      message: `New contact enquiry received from ${contact.name}.`,
      createdAt: contact.createdAt.toISOString(),
    })),
  ]
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    .slice(0, 5);

  return { metrics, appointmentRequests, todaySchedule, recentActivities };
};
