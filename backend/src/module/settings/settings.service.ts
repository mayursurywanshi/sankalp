import { prisma } from "../../config/database.config";

export const DEFAULT_SETTINGS = {
  id: 1,
  phone: "+91 76201 49613",
  whatsapp: "+91 76201 49613",
  email: "info@sankalp.com",
  address:
    "Sankalp Physiotherapy And Child Development Clinic, Opposite Vithal Mandir, Navathe Stop, Navathe Nagar, Amravati, Maharashtra 444601",
  instagramUrl: "https://www.instagram.com/sankalp_physiotherapy_center/?hl=en",
  mapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3727.049738128745!2d77.74880807379336!3d20.91031849183895",
  directionsUrl:
    "https://www.google.com/maps/search/?api=1&query=Sankalp+Physiotherapy+And+Child+Development+Clinic%2C+Amravati%2C+Maharashtra+444601",
  openingTime: "10:00",
  closingTime: "19:30",
  slotDurationMinutes: 30,
  workingDays: [1, 2, 3, 4, 5, 6],
  maximumAdvanceBookingDays: 90,
  feedbackExpiryHours: 24,
} as const;

export const getSettings = () =>
  prisma.clinicSettings.upsert({
    where: { id: 1 },
    create: {
      ...DEFAULT_SETTINGS,
      workingDays: [...DEFAULT_SETTINGS.workingDays],
    },
    update: {},
  });
type SettingsUpdate = Partial<{
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagramUrl: string;
  mapEmbedUrl: string;
  directionsUrl: string;
  openingTime: string;
  closingTime: string;
  slotDurationMinutes: number;
  workingDays: number[];
  maximumAdvanceBookingDays: number;
  feedbackExpiryHours: number;
}>;
export const updateContactLocation = (data: SettingsUpdate, adminId: string) =>
  prisma.clinicSettings.upsert({
    where: { id: 1 },
    create: {
      ...DEFAULT_SETTINGS,
      workingDays: [...DEFAULT_SETTINGS.workingDays],
      ...data,
      updatedByAdminId: adminId,
    },
    update: { ...data, updatedByAdminId: adminId },
  });
export const updateWorkingHours = updateContactLocation;
export const updateFeedbackSettings = updateContactLocation;

export const publicSettings = async () => {
  const settings = await getSettings();
  return {
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    email: settings.email,
    address: settings.address,
    instagramUrl: settings.instagramUrl,
    mapEmbedUrl: settings.mapEmbedUrl,
    directionsUrl: settings.directionsUrl,
    openingTime: settings.openingTime,
    closingTime: settings.closingTime,
    slotDurationMinutes: settings.slotDurationMinutes,
    workingDays: settings.workingDays,
    maximumAdvanceBookingDays: settings.maximumAdvanceBookingDays,
    feedbackExpiryHours: settings.feedbackExpiryHours,
    timezone: "Asia/Kolkata",
  };
};

const minutes = (time: string) => {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  return hour * 60 + minute;
};
const displayTime = (value: number) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, Math.floor(value / 60), value % 60)));
export const getConfiguredSlots = async () => {
  const settings = await getSettings();
  const slots: string[] = [];
  for (
    let value = minutes(settings.openingTime);
    value + settings.slotDurationMinutes <= minutes(settings.closingTime);
    value += settings.slotDurationMinutes
  )
    slots.push(displayTime(value));
  return { settings, slots };
};
