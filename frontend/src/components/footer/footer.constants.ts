export const FOOTER_CONTENT = {
  description: "Empowering little minds. Enriching young lives.",
  quickLinks: [
    { label: "Home", path: "/" },
    { label: "About Us", path: "/about" },
    { label: "Services", path: "/services" },
    { label: "Child Development", path: "/child-development" },
  ],
  importantLinks: [
    { label: "Our Impact", path: "/our-impact" },
    { label: "Book Appointment", path: "/book-appointment" },
    { label: "Contact Us", path: "/contact" },
  ],
  contact: {
    phone: "+91 76201 49613",
    email: "info@sankalp.com",
    address: "Sankalp Physiotherapy And Child Development Clinic Opposite Vithal Mandir, Navathe Stop, Navathe Nagar, Amravati, Maharashtra 444601",
  },
  socialLinks: [
    { label: "Instagram", symbol: "◎", path: "#instagram" },
    { label: "WhatsApp", symbol: "◔", path: "#whatsapp" },
  ],
  copyright: `© ${new Date().getFullYear()} Sankalp Child Development Center. All Rights Reserved.`,
} as const;
