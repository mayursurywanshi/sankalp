import { prisma } from "../../config/database.config";
import { APPOINTMENT_TIME_SLOTS } from "../../constants/appointments.constants";
import { parseDisplayDate } from "../admin-appointments/admin-appointments.validation";

export const clinicSlotAvailability = async (
  doctorDbId: string,
  displayDate: string,
  excludeReferenceId?: string,
) => {
  const date = parseDisplayDate(displayDate);
  if (!date) return { outcome: "INVALID_DATE" as const };
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (date < today || date.getUTCDay() === 0)
    return { outcome: "CLOSED" as const };

  const booked = await prisma.appointmentRequest.findMany({
    where: {
      assignedDoctorId: doctorDbId,
      scheduledDate: date,
      status: "ASSIGNED",
      ...(excludeReferenceId
        ? { referenceId: { not: excludeReferenceId } }
        : {}),
    },
    select: { scheduledTime: true },
  });
  const bookedTimes = new Set(
    booked.map((item) => item.scheduledTime).filter(Boolean),
  );
  return {
    outcome: "AVAILABLE" as const,
    date: displayDate,
    slots: APPOINTMENT_TIME_SLOTS.map((time) => ({
      time,
      available: !bookedTimes.has(time),
    })),
  };
};
