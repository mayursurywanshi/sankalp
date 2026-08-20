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
        id: "0-6-months",
        label: "0–6 Months",
        title: "0–6 Months",
        milestones: [
          "Lifts head while lying on tummy",
          "Rolls from tummy to back",
          "Responds to sounds and voices",
          "Brings hands to mouth",
          "Tracks objects with eyes",
          "Begins to smile and interact",
        ],
        guidance:
          "Every child develops at their own pace. If you notice any delay, early assessment can help.",
      },
      {
        id: "6-12-months",
        label: "6–12 Months",
        title: "6–12 Months",
        milestones: [
          "Sits independently with improved balance",
          "Rolls in both directions",
          "Crawls or moves to explore surroundings",
          "Transfers objects between hands",
          "Responds to their name",
          "Begins making repeated sounds",
        ],
        guidance:
          "Encourage safe floor play, movement and interaction to support your child’s development.",
      },
      {
        id: "1-2-years",
        label: "1–2 Years",
        title: "1–2 Years",
        milestones: [
          "Stands and begins walking independently",
          "Climbs onto low furniture with support",
          "Uses simple words and gestures",
          "Follows basic instructions",
          "Stacks blocks and explores toys",
          "Shows interest in other children",
        ],
        guidance:
          "Regular play, communication and movement opportunities help develop confidence and independence.",
      },
      {
        id: "2-3-years",
        label: "2–3 Years",
        title: "2–3 Years",
        milestones: [
          "Runs with improving coordination",
          "Walks up and down stairs with support",
          "Uses short sentences",
          "Sorts objects by shape or colour",
          "Participates in simple pretend play",
          "Begins expressing emotions and choices",
        ],
        guidance:
          "Support learning through play, simple routines and age-appropriate physical activities.",
      },
      {
        id: "3-5-years",
        label: "3–5 Years",
        title: "3–5 Years",
        milestones: [
          "Jumps, hops and balances with confidence",
          "Uses stairs with alternating feet",
          "Speaks clearly in longer sentences",
          "Draws simple shapes and figures",
          "Plays cooperatively with other children",
          "Completes simple self-care activities",
        ],
        guidance:
          "School-readiness skills develop through movement, communication, creativity and social interaction.",
      },
      {
        id: "5-plus-years",
        label: "5+ Years",
        title: "5+ Years",
        milestones: [
          "Demonstrates improved strength and coordination",
          "Participates in structured games and sports",
          "Completes age-appropriate daily activities",
          "Communicates thoughts and feelings clearly",
          "Develops friendships and teamwork skills",
          "Shows growing independence at home and school",
        ],
        guidance:
          "Continued encouragement and timely support can help children build confidence in everyday activities.",
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
