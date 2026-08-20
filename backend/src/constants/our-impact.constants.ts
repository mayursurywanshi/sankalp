export const OUR_IMPACT_CONTENT = {
  hero: {
    title: "Our Impact",
    tagline: "Real Journeys. Meaningful Progress.",
    description:
      "Every child’s journey matters. Discover the progress children have made and the experiences families have shared with Sankalp.",
  },
  statistics: [
    { id: "children-supported", value: "1,250+", label: "Children Supported", description: "Across diverse needs" },
    { id: "families-empowered", value: "980+", label: "Families Empowered", description: "Through guidance & care" },
    { id: "therapy-goals", value: "92%", label: "Therapy Goals Achieved", description: "Meaningful progress" },
    { id: "parent-satisfaction", value: "4.9/5", label: "Parent Satisfaction", description: "Based on feedback" },
  ],
  featuredStory: {
    id: "aarav-confident-walking",
    imageKey: "featured-aarav",
    childName: "Aarav",
    age: "3 years",
    title: "From First Steps to Confident Walking",
    summary:
      "With consistent therapy and family support, Aarav improved his balance, strength and confidence in independent walking.",
    highlights: [
      "Improved balance and lower-body strength",
      "Independent walking with greater confidence",
      "More active participation in daily play",
    ],
    buttonLabel: "Read Full Story",
    buttonHref: "/our-impact/aarav-confident-walking",
  },
  successStories: [
    {
      id: "vihaan-motor-skills",
      imageKey: "vihaan",
      childName: "Vihaan",
      age: "5 years",
      title: "Overcoming Delays with the Right Care",
      summary:
        "Personalized therapy strengthened Vihaan’s motor skills, attention and independence.",
      buttonLabel: "Read Full Story",
      buttonHref: "/our-impact/vihaan-motor-skills",
    },
    {
      id: "myra-balance-confidence",
      imageKey: "myra",
      childName: "Myra",
      age: "4 years",
      title: "Better Balance, Better Confidence",
      summary:
        "Play-based therapy helped Myra build coordination, balance and confidence.",
      buttonLabel: "Read Full Story",
      buttonHref: "/our-impact/myra-balance-confidence",
    },
    {
      id: "anaya-school-readiness",
      imageKey: "anaya",
      childName: "Anaya",
      age: "6 years",
      title: "Growing Ready for School",
      summary:
        "A structured developmental plan helped Anaya strengthen everyday and school-readiness skills.",
      buttonLabel: "Read Full Story",
      buttonHref: "/our-impact/anaya-school-readiness",
    },
  ],
  testimonials: {
    title: "What Parents Say",
    subtitle: "Their words, our inspiration.",
    items: [
      {
        id: "parent-anaya",
        rating: 5,
        quote:
          "Sankalp has been a blessing for our child. The therapy and care have improved her confidence and daily activities.",
        parentName: "Rita Sharma",
        relation: "Mother of Anaya",
      },
      {
        id: "parent-vihaan",
        rating: 5,
        quote:
          "The staff is very supportive and understanding. We saw meaningful progress within a few months.",
        parentName: "Amit Verma",
        relation: "Father of Vihaan",
      },
      {
        id: "parent-aarav",
        rating: 5,
        quote:
          "Professional, friendly and effective treatment. The team guided our entire family with patience.",
        parentName: "Neha Joshi",
        relation: "Mother of Aarav",
      },
    ],
  },
  videoTestimonials: {
    title: "Video Testimonials",
    items: [
      { id: "anaya-family", title: "Anaya’s Family Experience", thumbnailKey: "anaya-family", videoUrl: "#anaya-video" },
      { id: "vihaan-family", title: "Vihaan’s Progress Journey", thumbnailKey: "vihaan-family", videoUrl: "#vihaan-video" },
      { id: "aarav-family", title: "Aarav’s Parent Story", thumbnailKey: "aarav-family", videoUrl: "#aarav-video" },
    ],
  },
} as const;
