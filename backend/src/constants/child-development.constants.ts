export const CHILD_DEVELOPMENT_CONTENT = {
  hero: {
    title: "Child Development",
    tagline: "Support. Nurture. Grow.",
    description:
      "Understand your child’s developmental journey and the milestones they may achieve at every stage.",
  },

  milestones: {
    title: "Developmental Milestones",
    description:
      "Select an age group to explore common developmental milestones.",

    ageGroups: [
      {
        id: "0-2-years",
        label: "0–2 Years",
        title: "0–2 Years",
        milestones: [
          "Develops head and trunk control",
          "Rolls, sits, crawls and begins walking",
          "Reaches for and explores objects",
          "Responds to familiar sounds and voices",
          "Uses gestures, sounds and early words",
          "Shows interest in people and surroundings",
        ],
        guidance:
          "Early movement, play and interaction provide an important foundation for future development.",
      },
      {
        id: "2-4-years", label: "2–4 Years", title: "2–4 Years",
        milestones: ["Runs and climbs with improving coordination", "Jumps with both feet", "Uses short sentences to communicate", "Sorts objects by shape and colour", "Participates in pretend play", "Begins completing simple self-care tasks"],
        guidance: "Play, movement and simple daily routines help build early independence and confidence.",
      },
      {
        id: "4-6-years", label: "4–6 Years", title: "4–6 Years",
        milestones: ["Hops and balances on one foot", "Throws and catches a large ball", "Uses stairs with alternating feet", "Draws recognizable shapes and people", "Follows multi-step instructions", "Plays cooperatively with other children"],
        guidance: "School-readiness develops through active play, communication, creativity and social interaction.",
      },
      {
        id: "6-8-years", label: "6–8 Years", title: "6–8 Years",
        milestones: ["Shows improved balance and body coordination", "Participates in games with rules", "Develops stronger handwriting and fine-motor control", "Completes daily routines more independently", "Expresses ideas and emotions clearly", "Builds friendships and teamwork skills"],
        guidance: "Regular physical activity and supportive routines help strengthen coordination and independence.",
      },
      {
        id: "8-10-years", label: "8–10 Years", title: "8–10 Years",
        milestones: ["Demonstrates refined movement and ball skills", "Maintains posture during classroom activities", "Plans and completes multi-step tasks", "Manages age-appropriate self-care independently", "Works collaboratively in groups", "Develops confidence in sports and recreation"],
        guidance: "Encourage varied movement, problem-solving and participation in activities the child enjoys.",
      },
      {
        id: "10-12-years", label: "10–12 Years", title: "10–12 Years",
        milestones: ["Builds strength, endurance and flexibility", "Adapts coordination during growth changes", "Uses effective organization and planning skills", "Participates independently in school and home routines", "Communicates needs and manages emotions", "Develops responsibility and healthy activity habits"],
        guidance: "Balanced exercise, healthy posture and timely support are important during preteen growth.",
      },
      {
        id: "12-plus-years", label: "12+ Years", title: "12+ Years",
        milestones: ["Maintains mobility, strength and physical endurance", "Uses safe posture during study and device use", "Manages increasingly complex daily responsibilities", "Participates in chosen sports or fitness activities", "Builds self-advocacy and decision-making skills", "Prepares for greater independence in daily life"],
        guidance: "Personalized support can help teenagers stay active, confident and independent through adolescence.",
      },
    ],
  },

  earlyIntervention: {
    title: "Early intervention makes a difference.",
    description:
      "The earlier a child receives the right support, the better their outcomes.",
    buttonLabel: "Book a Developmental Assessment",
    buttonHref: "/appointment",
  },
} as const;
