import { prisma } from "../../config/database.config";
import { parseDisplayDate } from "../admin-appointments/admin-appointments.validation";
import { getConfiguredSlots } from "../settings/settings.service";

export const clinicSlotAvailability = async (
  doctorDbId: string,
  displayDate: string,
  excludeReferenceId?: string,
) => {
  const date = parseDisplayDate(displayDate);
  if (!date) return { outcome: "INVALID_DATE" as const };
  const { settings, slots } = await getConfiguredSlots();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (date < today || !settings.workingDays.includes(date.getUTCDay()))
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
    slots: slots.map((time) => ({
      time,
      available: !bookedTimes.has(time),
    })),
  };
};
