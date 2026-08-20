export const APPOINTMENT_TIME_SLOTS = [
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM",
  "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM",
  "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM",
] as const;

export const APPOINTMENT_CONTENT = {
  hero: {
    title: "Book an Appointment",
    tagline: "Take the first step toward your child’s brighter tomorrow.",
  },
  help: {
    title: "We’re Here to Help",
    steps: [
      { title: "Share Basic Details", description: "Provide the parent and child details needed for the appointment." },
      { title: "Select a Convenient Time", description: "Pick a date and time that works best for you." },
      { title: "We’ll Confirm Your Appointment", description: "We’ll review your details and call you shortly." },
    ],
  },
  clinicHours: {
    weekdays: "Monday–Saturday: 10:00 AM–7:30 PM",
    sunday: "Sunday: Closed",
  },
  phone: "+91 76201 49613",
  email: "info@sankalp.com",
  timeSlots: APPOINTMENT_TIME_SLOTS,
  consentLabel: "I consent to be contacted by Sankalp regarding my appointment.",
  successMessage: "Your appointment request has been received. Our team will Call you soon 😊",
} as const;
