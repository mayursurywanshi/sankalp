import { prisma } from "../../config/database.config";
import { PerformancePeriod } from "./admin-performance.validation";

type Range = { start: Date; end: Date };
type AppointmentRow = Awaited<ReturnType<typeof loadAppointments>>[number];

const utcStartOfDay = (value: Date) =>
  new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );

const periodRange = (period: PerformancePeriod, now = new Date()): Range => {
  const day = utcStartOfDay(now);
  let start: Date;
  if (period === "WEEK") {
    const mondayOffset = (day.getUTCDay() + 6) % 7;
    start = new Date(day);
    start.setUTCDate(start.getUTCDate() - mondayOffset);
  } else if (period === "MONTH") {
    start = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1));
  } else if (period === "QUARTER") {
    const quarterMonth = Math.floor(day.getUTCMonth() / 3) * 3;
    start = new Date(Date.UTC(day.getUTCFullYear(), quarterMonth, 1));
  } else {
    start = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
  }
  const end = new Date(start);
  if (period === "WEEK") end.setUTCDate(end.getUTCDate() + 7);
  if (period === "MONTH") end.setUTCMonth(end.getUTCMonth() + 1);
  if (period === "QUARTER") end.setUTCMonth(end.getUTCMonth() + 3);
  if (period === "YEAR") end.setUTCFullYear(end.getUTCFullYear() + 1);
  return { start, end };
};

const previousRange = (range: Range, period: PerformancePeriod): Range => {
  const end = new Date(range.start);
  const start = new Date(range.start);
  if (period === "WEEK") start.setUTCDate(start.getUTCDate() - 7);
  if (period === "MONTH") start.setUTCMonth(start.getUTCMonth() - 1);
  if (period === "QUARTER") start.setUTCMonth(start.getUTCMonth() - 3);
  if (period === "YEAR") start.setUTCFullYear(start.getUTCFullYear() - 1);
  return { start, end };
};

const inRange = (value: Date, range: Range) =>
  value >= range.start && value < range.end;
const effectiveDate = (appointment: {
  scheduledDate: Date | null;
  preferredDate: Date;
}) => appointment.scheduledDate ?? appointment.preferredDate;

const percentageChange = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const average = (values: number[]) =>
  values.length
    ? Number(
        (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(
          1,
        ),
      )
    : 0;

const loadAppointments = () =>
  prisma.appointmentRequest.findMany({
    select: {
      id: true,
      status: true,
      preferredDate: true,
      scheduledDate: true,
      patientDbId: true,
      assignedDoctor: {
        select: {
          doctorId: true,
          firstName: true,
          lastName: true,
          designation: true,
        },
      },
    },
  });

const trendBuckets = (period: PerformancePeriod, range: Range) => {
  const buckets: Array<{ label: string; start: Date; end: Date }> = [];
  const cursor = new Date(range.start);
  let index = 1;
  while (cursor < range.end) {
    const start = new Date(cursor);
    const end = new Date(cursor);
    if (period === "WEEK") end.setUTCDate(end.getUTCDate() + 1);
    else if (period === "MONTH") end.setUTCDate(end.getUTCDate() + 7);
    else end.setUTCMonth(end.getUTCMonth() + 1);
    if (end > range.end) end.setTime(range.end.getTime());
    const label =
      period === "WEEK"
        ? start.toLocaleDateString("en-US", {
            weekday: "short",
            timeZone: "UTC",
          })
        : period === "MONTH"
          ? `Week ${index}`
          : start.toLocaleDateString("en-US", {
              month: "short",
              timeZone: "UTC",
            });
    buckets.push({ label, start, end });
    cursor.setTime(end.getTime());
    index += 1;
  }
  return buckets;
};

const appointmentTrend = (
  appointments: AppointmentRow[],
  period: PerformancePeriod,
  range: Range,
) =>
  trendBuckets(period, range).map((bucket) => ({
    label: bucket.label,
    appointments: appointments.filter((item) =>
      inRange(effectiveDate(item), bucket),
    ).length,
    completed: appointments.filter(
      (item) =>
        item.status === "COMPLETED" && inRange(effectiveDate(item), bucket),
    ).length,
  }));

const statusDistribution = (appointments: AppointmentRow[]) =>
  (["REQUESTED", "ASSIGNED", "COMPLETED", "CANCELLED"] as const).map(
    (status) => ({
      status,
      count: appointments.filter((item) => item.status === status).length,
    }),
  );

export const getPerformanceOverview = async (period: PerformancePeriod) => {
  const current = periodRange(period);
  const previous = previousRange(current, period);
  const [
    allAppointments,
    currentPatients,
    previousPatients,
    currentFeedback,
    previousFeedback,
  ] = await Promise.all([
    loadAppointments(),
    prisma.patient.count({
      where: { createdAt: { gte: current.start, lt: current.end } },
    }),
    prisma.patient.count({
      where: { createdAt: { gte: previous.start, lt: previous.end } },
    }),
    prisma.parentFeedbackResponse.findMany({
      where: { submittedAt: { gte: current.start, lt: current.end } },
      select: { rating: true, submittedAt: true },
    }),
    prisma.parentFeedbackResponse.findMany({
      where: { submittedAt: { gte: previous.start, lt: previous.end } },
      select: { rating: true },
    }),
  ]);
  const currentAppointments = allAppointments.filter((item) =>
    inRange(effectiveDate(item), current),
  );
  const previousAppointments = allAppointments.filter((item) =>
    inRange(effectiveDate(item), previous),
  );
  const completed = currentAppointments.filter(
    (item) => item.status === "COMPLETED",
  ).length;
  const previousCompleted = previousAppointments.filter(
    (item) => item.status === "COMPLETED",
  ).length;
  const satisfaction = average(currentFeedback.map((item) => item.rating));
  const previousSatisfaction = average(
    previousFeedback.map((item) => item.rating),
  );
  const specialization = new Map<string, number>();
  currentAppointments.forEach((item) => {
    const key = item.assignedDoctor?.designation ?? "Unassigned";
    specialization.set(key, (specialization.get(key) ?? 0) + 1);
  });
  return {
    period,
    range: {
      start: current.start.toISOString(),
      end: current.end.toISOString(),
    },
    metrics: {
      totalAppointments: currentAppointments.length,
      completedAppointments: completed,
      newPatients: currentPatients,
      overallSatisfaction: satisfaction,
      completionRate: currentAppointments.length
        ? Number(((completed / currentAppointments.length) * 100).toFixed(1))
        : 0,
      cancelledAppointments: currentAppointments.filter(
        (item) => item.status === "CANCELLED",
      ).length,
    },
    comparisons: {
      totalAppointments: percentageChange(
        currentAppointments.length,
        previousAppointments.length,
      ),
      completedAppointments: percentageChange(completed, previousCompleted),
      newPatients: percentageChange(currentPatients, previousPatients),
      overallSatisfaction: Number(
        (satisfaction - previousSatisfaction).toFixed(1),
      ),
    },
    appointmentTrend: appointmentTrend(currentAppointments, period, current),
    appointmentsBySpecialization: [...specialization.entries()].map(
      ([specializationName, count]) => ({
        specialization: specializationName,
        count,
      }),
    ),
    satisfactionTrend: trendBuckets(period, current).map((bucket) => ({
      label: bucket.label,
      rating: average(
        currentFeedback
          .filter((item) => inRange(item.submittedAt, bucket))
          .map((item) => item.rating),
      ),
    })),
    statusDistribution: statusDistribution(currentAppointments),
  };
};

export const listDoctorPerformance = async (period: PerformancePeriod) => {
  const range = periodRange(period);
  const [doctors, allAppointments] = await Promise.all([
    prisma.doctorDetail.findMany({
      where: { isActive: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        doctorId: true,
        firstName: true,
        lastName: true,
        designation: true,
      },
    }),
    loadAppointments(),
  ]);
  return doctors.map((doctor) => {
    const appointments = allAppointments.filter(
      (item) =>
        item.assignedDoctor?.doctorId === doctor.doctorId &&
        inRange(effectiveDate(item), range),
    );
    const completed = appointments.filter(
      (item) => item.status === "COMPLETED",
    ).length;
    return {
      ...doctor,
      assignedAppointments: appointments.length,
      completedAppointments: completed,
      uniquePatients: new Set(appointments.map((item) => item.patientDbId))
        .size,
      completionRate: appointments.length
        ? Number(((completed / appointments.length) * 100).toFixed(1))
        : 0,
    };
  });
};

export const getDoctorPerformance = async (
  doctorId: string,
  period: PerformancePeriod,
) => {
  const doctor = await prisma.doctorDetail.findUnique({
    where: { doctorId },
    select: {
      id: true,
      doctorId: true,
      firstName: true,
      lastName: true,
      designation: true,
      isActive: true,
    },
  });
  if (!doctor) return null;
  const current = periodRange(period);
  const previous = previousRange(current, period);
  const [allAppointments, feedback] = await Promise.all([
    loadAppointments(),
    prisma.parentFeedbackResponse.findMany({
      where: { invitation: { appointment: { assignedDoctor: { doctorId } } } },
      select: { rating: true, submittedAt: true },
    }),
  ]);
  const forDoctor = allAppointments.filter(
    (item) => item.assignedDoctor?.doctorId === doctorId,
  );
  const currentAppointments = forDoctor.filter((item) =>
    inRange(effectiveDate(item), current),
  );
  const previousAppointments = forDoctor.filter((item) =>
    inRange(effectiveDate(item), previous),
  );
  const completed = currentAppointments.filter(
    (item) => item.status === "COMPLETED",
  ).length;
  const previousCompleted = previousAppointments.filter(
    (item) => item.status === "COMPLETED",
  ).length;
  const currentRatings = feedback
    .filter((item) => inRange(item.submittedAt, current))
    .map((item) => item.rating);
  return {
    doctor: { ...doctor, id: undefined },
    period,
    range: {
      start: current.start.toISOString(),
      end: current.end.toISOString(),
    },
    metrics: {
      assignedAppointments: currentAppointments.length,
      completedAppointments: completed,
      cancelledAppointments: currentAppointments.filter(
        (item) => item.status === "CANCELLED",
      ).length,
      uniquePatients: new Set(
        currentAppointments.map((item) => item.patientDbId),
      ).size,
      completionRate: currentAppointments.length
        ? Number(((completed / currentAppointments.length) * 100).toFixed(1))
        : 0,
      averageRating: average(currentRatings),
      feedbackResponses: currentRatings.length,
    },
    comparisons: {
      assignedAppointments: percentageChange(
        currentAppointments.length,
        previousAppointments.length,
      ),
      completedAppointments: percentageChange(completed, previousCompleted),
    },
    appointmentTrend: appointmentTrend(currentAppointments, period, current),
    statusDistribution: statusDistribution(currentAppointments),
  };
};
