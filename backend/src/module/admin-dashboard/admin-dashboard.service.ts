import { prisma } from "../../config/database.config";
import {
  DashboardActivity,
  DashboardAppointmentRequest,
  DashboardMetricSummary,
  DashboardScheduleSummary,
} from "./admin-dashboard.types";
import { DashboardQuery } from "./admin-dashboard.validation";

const toDateString = (date: Date) => date.toISOString().slice(0, 10);

const indiaDateRange = () => {
  const indiaNow = new Date(Date.now() + 330 * 60 * 1000);
  const today = new Date(
    Date.UTC(
      indiaNow.getUTCFullYear(),
      indiaNow.getUTCMonth(),
      indiaNow.getUTCDate(),
    ),
  );
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return { today, tomorrow };
};

const scheduleDateRange = (input: DashboardQuery) => {
  const current = indiaDateRange().today;
  let from = new Date(current);
  let to = new Date(current);
  let label = "Today";
  if (
    input.schedulePeriod === "LAST_7_DAYS" ||
    input.schedulePeriod === "LAST_15_DAYS"
  ) {
    const days = input.schedulePeriod === "LAST_7_DAYS" ? 7 : 15;
    from.setUTCDate(from.getUTCDate() - days + 1);
    label = `Last ${days} Days`;
  } else if (input.schedulePeriod === "THIS_MONTH") {
    from = new Date(
      Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1),
    );
    label = "This Month";
  } else if (input.schedulePeriod === "CUSTOM") {
    from = new Date(`${input.fromDate}T00:00:00.000Z`);
    to = new Date(`${input.toDate}T00:00:00.000Z`);
    label = `${input.fromDate} to ${input.toDate}`;
  }
  const exclusiveTo = new Date(to);
  exclusiveTo.setUTCDate(exclusiveTo.getUTCDate() + 1);
  return { from, exclusiveTo, displayTo: to, label };
};

const appointmentActivityMessage = (event: string, childName: string) => {
  const messages: Record<string, string> = {
    REQUEST_CREATED: `New appointment request received for ${childName}.`,
    DOCTOR_ASSIGNED: `${childName}'s appointment was assigned to a Doctor.`,
    DOCTOR_REASSIGNED: `${childName}'s appointment was reassigned to another Doctor.`,
    APPOINTMENT_COMPLETED: `${childName}'s appointment was completed.`,
    APPOINTMENT_CANCELLED: `${childName}'s appointment was cancelled.`,
    STATUS_CHANGED: `${childName}'s appointment status was updated.`,
  };
  return messages[event] ?? `${childName}'s appointment was updated.`;
};

const contactActivityMessage = (event: string, name: string) => {
  const messages: Record<string, string> = {
    RECEIVED: `New contact enquiry received from ${name}.`,
    DOCTOR_ASSIGNED: `${name}'s contact request was assigned to a Doctor.`,
    DOCTOR_REASSIGNED: `${name}'s contact request was reassigned.`,
    FOLLOW_UP_UPDATED: `Follow-up details were updated for ${name}.`,
    STATUS_CHANGED: `${name}'s contact request status was updated.`,
    APPOINTMENT_CREATED: `An appointment was created from ${name}'s contact request.`,
  };
  return messages[event] ?? `${name}'s contact request was updated.`;
};

export const getDashboardData = async (
  query: DashboardQuery = { schedulePeriod: "TODAY" },
) => {
  const range = scheduleDateRange(query);

  const [
    totalAppointments,
    pendingRequests,
    totalPatients,
    newEnquiries,
    totalDoctors,
    recentAppointments,
    todayAppointments,
    recentAppointmentActivity,
    recentContactActivity,
  ] = await Promise.all([
    prisma.appointmentRequest.count(),
    prisma.appointmentRequest.count({ where: { status: "REQUESTED" } }),
    prisma.patient.count(),
    prisma.contactMessage.count({ where: { status: "NEW" } }),
    prisma.doctorDetail.count({ where: { isActive: true } }),
    prisma.appointmentRequest.findMany({
      where: { status: "REQUESTED" },
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
    prisma.appointmentRequest.findMany({
      where: {
        OR: [
          {
            status: "REQUESTED",
            preferredDate: { gte: range.from, lt: range.exclusiveTo },
          },
          {
            status: { in: ["ASSIGNED", "COMPLETED", "CANCELLED"] },
            scheduledDate: { gte: range.from, lt: range.exclusiveTo },
          },
        ],
      },
      select: { status: true },
    }),
    prisma.appointmentLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        event: true,
        createdAt: true,
        appointment: { select: { childName: true } },
      },
    }),
    prisma.contactRequestActivity.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        event: true,
        createdAt: true,
        contactMessage: { select: { name: true } },
      },
    }),
  ]);

  const metrics: DashboardMetricSummary = {
    totalAppointments,
    pendingRequests,
    totalPatients,
    totalDoctors,
    newEnquiries,
  };

  const appointmentRequests: DashboardAppointmentRequest[] =
    recentAppointments.map((appointment) => ({
      ...appointment,
      preferredDate: toDateString(appointment.preferredDate),
    }));

  const statusCounts = todayAppointments.reduce(
    (counts, item) =>
      counts.set(item.status, (counts.get(item.status) ?? 0) + 1),
    new Map<string, number>(),
  );
  const todaySchedule: DashboardScheduleSummary = {
    total: todayAppointments.length,
    requested: statusCounts.get("REQUESTED") ?? 0,
    assigned: statusCounts.get("ASSIGNED") ?? 0,
    completed: statusCounts.get("COMPLETED") ?? 0,
    cancelled: statusCounts.get("CANCELLED") ?? 0,
    range: {
      period: query.schedulePeriod,
      fromDate: toDateString(range.from),
      toDate: toDateString(range.displayTo),
      label: range.label,
    },
  };

  const recentActivities: DashboardActivity[] = [
    ...recentAppointmentActivity.map((appointment) => ({
      id: appointment.id,
      type: "APPOINTMENT" as const,
      message: appointmentActivityMessage(
        appointment.event,
        appointment.appointment.childName,
      ),
      createdAt: appointment.createdAt.toISOString(),
    })),
    ...recentContactActivity.map((contact) => ({
      id: contact.id,
      type: "CONTACT" as const,
      message: contactActivityMessage(
        contact.event,
        contact.contactMessage.name,
      ),
      createdAt: contact.createdAt.toISOString(),
    })),
  ]
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    .slice(0, 5);

  return { metrics, appointmentRequests, todaySchedule, recentActivities };
};
