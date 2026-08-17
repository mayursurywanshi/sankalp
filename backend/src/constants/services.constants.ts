export const SERVICES_CONTENT = {
  hero: {
    title: "Our Services",
    description:
      "Comprehensive care for every child's growth and development.",
  },
  services: [
    {
      id: "pediatric-physiotherapy",
      title: "Pediatric Physiotherapy",
      description:
        "Helps improve movement, strength, balance and coordination.",
      color: "teal",
    },
    {
      id: "developmental-assessment",
      title: "Developmental Assessment",
      description:
        "Detailed assessment to understand your child's needs.",
      color: "coral",
    },
    {
      id: "neuromotor-therapy",
      title: "Neuromotor Therapy",
      description:
        "Support for children with motor delay and neurological conditions.",
      color: "blue",
    },
    {
      id: "sensory-integration-therapy",
      title: "Sensory Integration Therapy",
      description:
        "Helps children process and respond to sensory information.",
      color: "pink",
    },
    {
      id: "gait-training",
      title: "Gait Training",
      description: "Improves walking patterns, balance and mobility.",
      color: "purple",
    },
    {
      id: "postural-management",
      title: "Postural Management",
      description:
        "Corrects posture and prevents secondary complications.",
      color: "green",
    },
  ],
  callToAction: {
    title: "Not sure which service is right for your child?",
    description: "Talk to our specialist for guidance.",
    buttonLabel: "Book an Appointment",
    buttonHref: "/appointment",
  },
} as const;
