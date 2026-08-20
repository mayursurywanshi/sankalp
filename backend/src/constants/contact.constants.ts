export const CONTACT_CONTENT = {
  hero: {
    title: "Get in Touch",
    description: "We are here to help you.",
  },
  details: [
    { id: "phone", label: "Phone", value: "+91 76201 49613", href: "tel:+917620149613" },
    { id: "whatsapp", label: "WhatsApp", value: "+91 76201 49613", href: "https://wa.me/917620149613" },
    { id: "email", label: "Email", value: "info@sankalp.com", href: "mailto:info@sankalp.com" },
    { id: "address", label: "Address", value: "Sankalp Physiotherapy And Child Development Clinic, Opposite Vithal Mandir, Navathe Stop, Navathe Nagar, Amravati, Maharashtra 444601" },
    { id: "timings", label: "Working Hours", value: "Monday–Saturday: 10:00 AM–7:30 PM\nSunday: Closed" },
  ],
  form: {
    title: "Send us a Message",
    successMessage: "Thank you for contacting Sankalp. Our team will Call you soon 😊",
  },
  map: {
    embedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3727.049738128745!2d77.74880807379336!3d20.91031849183895!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bd6a52ad856eeed%3A0xeb0d543946dc96b1!2sSankalp%20physiotherapy%20and%20child%20development%20clinic!5e0!3m2!1sen!2sin!4v1787237282994!5m2!1sen!2sin",
    label: "Sankalp Physiotherapy and Child Development Clinic",
    directionsUrl:
      "https://www.google.com/maps/search/?api=1&query=Sankalp+Physiotherapy+And+Child+Development+Clinic%2C+Amravati%2C+Maharashtra+444601",
  },
} as const;
