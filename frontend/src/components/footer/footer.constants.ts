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
    { label: "Instagram", symbol: "◎", path: "https://www.instagram.com/sankalp_physiotherapy_center/?hl=en" },
    { label: "WhatsApp", symbol: "◔", path: "https://wa.me/917620149613?text=Hello%20Sankalp%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services." },
  ],
  copyright: `© ${new Date().getFullYear()} Sankalp Child Development Center. All Rights Reserved.`,
} as const;
