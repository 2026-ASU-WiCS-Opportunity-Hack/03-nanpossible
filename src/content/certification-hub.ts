import type {
  CertificationRecertificationRule,
  CertificationTrack,
} from "@/lib/types";

type CertificationProgressionStep = {
  title: string;
  body: string;
};

export const certificationHero = {
  eyebrow: "Global certification hub",
  title: "The WIAL certification pathway, from CALC to MALC.",
  intro:
    "WIAL offers four levels of certification for Action Learning coaches. Each level represents increasing expertise, experience, and leadership in the Action Learning community. WIAL is an ICF-accredited training provider, and our CALC certification is an accredited ICF CCE program.",
  metrics: [
    { label: "Certification levels", value: "4" },
    { label: "ICF accredited", value: "CCE" },
    { label: "Global recognition", value: "Yes" },
  ],
  image: {
    src: "/certification/certification-hero.jpg",
    alt: "Coaches and program participants gathered in front of WIAL banners at an Action Learning session",
  },
} as const;

export const certificationBadging = {
  id: "badges",
  title: "Share your certification with a digital badge",
  intro: {
    beforeCredly:
      "Every WIAL certification comes with a free digital badge issued through ",
    credlyLabel: "Credly",
    afterCredly:
      ", so you can share your achievement on LinkedIn, in your email signature, or on your website in a way anyone can verify in real time.",
  },
  credlyUrl: "https://www.credly.com",
  image: {
    src: "/certification/digital-badges.jpg",
    alt: "The four WIAL digital badges: CALC, PALC, SALC, and MALC",
  },
  showsTitle: "What your badge shows",
  shows: [
    "The date your certification was awarded and when it expires.",
    "The competencies you demonstrated to earn it.",
    "Each step you completed along the way.",
    "The work you do to keep your certification current.",
  ],
  claimNote:
    "After you complete a certification, Credly emails you an invitation to claim your badge. There is no fee, participation is optional, and you control what is shared publicly.",
  verificationNote:
    "Because a badge links back to verified data, your credential is far harder to misrepresent than a logo on a resume, and an expired badge is clearly marked when checked.",
  directoryNote:
    "Certified coaches can also display their badge on their profile in the",
  directoryLinkLabel: "WIAL coach directory",
} as const;

export const certificationTracks: CertificationTrack[] = [
  {
    key: "calc",
    level: "CALC",
    anchor: "calc",
    title: "Certified Action Learning Coach",
    tagline: "The entry-level WIAL coaching credential.",
    summary:
      "The Certified Action Learning Coach (CALC) is the first formal certification level in the WIAL model, open to graduates of WIAL programs who have completed all requirements. CALCs can be internal or external to an organization and are authorized to coach Action Learning on behalf of WIAL.",
    eligibility: [
      "Complete WIAL Foundations and/or the Foundations e-learning course.",
      "Participate in the CALC Workshop.",
      "Complete a minimum of 5 WIAL Talk scenarios.",
    ],
    requirements: [
      "Lead or take part in a minimum of two 90-minute Action Learning sessions, with at least one reaching a solution.",
      "Meet the full CALC requirement checklist reviewed by WIAL's certification committee.",
    ],
    progressionLabel:
      "After earning CALC, build coaching hours and longer-term project experience before applying for PALC.",
  },
  {
    key: "palc",
    level: "PALC",
    anchor: "palc",
    title: "Professional Action Learning Coach",
    tagline: "For CALCs with documented practice and project depth.",
    summary:
      "The Professional Action Learning Coach (PALC) certification recognizes CALCs who have built at least 100 hours of WIAL coaching experience and have led an Intro to Action Learning or Leading with Questions (LWQ) workshop observed by a SALC or MALC. PALCs have a stronger desire to coach Action Learning teams than to train other coaches.",
    eligibility: [
      "Complete WIAL Foundations and/or the Foundations e-learning course, and the CALC Workshop.",
      "Document a minimum of 100 hours of Action Learning experience, at least 50 of which are coaching hours.",
      "Complete one long-term project spanning a minimum of 4 sessions over several weeks.",
    ],
    requirements: [
      "Lead a Leading with Questions or Introduction to Action Learning session, observed as part of the certification process.",
      "Complete the PALC requirements and application review.",
    ],
    progressionLabel:
      "PALC is the bridge from coached participation to independently leading introductory Action Learning experiences.",
  },
  {
    key: "salc",
    level: "SALC",
    anchor: "salc",
    title: "Senior Action Learning Coach",
    tagline: "For experienced coaches ready to lead core WIAL programs.",
    summary:
      "The Senior Action Learning Coach (SALC) certification is for CALCs or PALCs with at least 100 hours of WIAL coaching experience who have been cleared to teach all WIAL certification programs. SALCs frequently go on to develop an affiliate in their region. A PALC advancing to SALC does not need to complete a second long-term project.",
    eligibility: [
      "Complete WIAL Foundations and/or the Foundations e-learning course, and the CALC Workshop.",
      "Document a minimum of 100 hours of Action Learning experience, at least 50 of which are coaching hours, including one long-term project of at least 4 sessions.",
      "Lead a Leading with Questions or Introduction to Action Learning session.",
    ],
    requirements: [
      "Lead a Foundations program.",
      "Lead an Intensive CALC program.",
    ],
    progressionLabel:
      "SALC clears a coach to lead core certification experiences and mentor developing coaches.",
  },
  {
    key: "malc",
    level: "MALC",
    anchor: "malc",
    title: "Master Action Learning Coach",
    tagline: "The highest WIAL certification level and thought-leadership track.",
    summary:
      "The Master Action Learning Coach (MALC) is the highest level in the WIAL hierarchy, open to SALCs with at least 500 hours of coaching experience who are published, have presented at regional or higher-level WIAL and non-WIAL forums, and are regular contributors to WIAL social media or newsletters.",
    eligibility: [
      "Complete WIAL Foundations and/or the Foundations e-learning course, and the CALC Workshop.",
      "Document a minimum of 500 hours of Action Learning experience.",
      "Be published and actively presenting as a recognized Action Learning expert.",
    ],
    requirements: [
      "Lead a Leading with Questions or Introduction to Action Learning session, a Foundations program, and an Intensive CALC program.",
      "Demonstrate ongoing publishing and presenting as part of the certification review.",
    ],
    progressionLabel:
      "MALC is the capstone path for senior coaches who also contribute as visible thought leaders in the wider Action Learning field.",
  },
];

export const certificationProgression: CertificationProgressionStep[] = [
  {
    title: "CALC",
    body: "Build core Action Learning coaching proficiency through Foundations, the CALC Workshop, WIAL Talk scenarios, and observed coaching sessions.",
  },
  {
    title: "PALC",
    body: "Add at least 100 hours of documented coaching experience, a long-term project, and observed delivery of an introductory WIAL learning experience.",
  },
  {
    title: "SALC",
    body: "Get cleared to teach all WIAL certification programs, lead Foundations and Intensive CALC sessions, and mentor developing coaches.",
  },
  {
    title: "MALC",
    body: "Combine 500+ hours of senior-level experience with publication, presenting, mentoring, and broad contribution to the WIAL method.",
  },
];

export const certificationWhy = {
  id: "why",
  title: "Why get certified?",
  paragraphs: [
    "Research shows that a trained Action Learning coach is a key success factor for Action Learning programs. More organizations now want those programs led by a Certified Action Learning Coach (CALC).",
    "A WIAL certification also strengthens a professional's career and their value to the organization. There are four levels, each with more education and practice behind it.",
  ],
  levels: [
    {
      level: "CALC",
      title: "Certified Action Learning Coach",
      body: "CALCs can coach Action Learning sessions.",
    },
    {
      level: "PALC",
      title: "Professional Action Learning Coach",
      body: "PALCs have proven their ability as coaches.",
    },
    {
      level: "SALC",
      title: "Senior Action Learning Coach",
      body: "SALCs are cleared to lead all WIAL programs.",
    },
    {
      level: "MALC",
      title: "Master Action Learning Coach",
      body: "MALCs are thought leaders in the Action Learning community.",
    },
  ],
} as const;

export const certificationFoundations = {
  id: "foundations",
  title: "Foundations of Action Learning",
  intro: [
    "If you are ready for a deeper understanding of Action Learning, or are considering becoming a certified coach, this intensive two-day Foundations of Action Learning session is the next step.",
    "The session covers the six components of Action Learning and the two ground rules in detail. Participants learn why Action Learning works, and they experience it both as a participant and as a coach.",
  ],
  actionLearningHref: "/action-learning",
  actionLearningLabel: "What is Action Learning?",
  forTitle: "This program is for",
  forWho: ["Potential coaches", "Organizational champions", "Sponsors"],
  participantsTitle: "Participants will",
  participantsWill: [
    "Earn a certificate of participation.",
    "Be able to participate in an Action Learning team.",
    "Become familiar with the practical and conceptual principles behind Action Learning.",
    "Observe how Action Learning works.",
    "Understand the value of the learning coach in an Action Learning session.",
  ],
  inHouse: {
    title: "In-house Foundations option",
    paragraphs: [
      "WIAL can bring Foundations of Action Learning into your organization. The required two days of training can be arranged in several configurations to match your objectives.",
      "It is an effective way to introduce potential Action Learning coaches to the six components used to solve organizational problems, build leaders, and develop learning organizations.",
    ],
    moreHref: "#in-house",
    moreLabel: "See in-house certification programs",
  },
  contactHref: "/contact",
  contactLabel: "Ask about in-house training",
} as const;

export const certificationCalcCourses = {
  id: "calc-courses",
  title: "CALC courses",
  heading: "Certification for Action Learning Coaches",
  intro: [
    "Becoming a Certified Action Learning Coach builds professional skill, increases organizational value, and can lead to career advancement. This intensive program gives participants the skill and experience they need to coach Action Learning in a range of demanding situations.",
    "Participants enroll in an asynchronous e-learning course, attend a live workshop, and independently lead several Action Learning sessions beyond the class experiences. The program uses the same mix of concepts and practice as Foundations of Action Learning. Workshops may include presenters from organizations that need real solutions.",
    "Every participant coaches at least one session. A dedicated Senior or Master Action Learning Coach works with every team, so trainees get intensive feedback when they take the coaching role.",
  ],
  prerequisite: {
    label: "Prerequisite",
    body: "Foundations of Action Learning workshop",
    href: "#foundations",
  },
  forTitle: "This program is for",
  forWho: [
    "Professionals who want to become certified Action Learning coaches inside their organization",
    "Independent coaches and consultants who want to become certified in Action Learning",
  ],
  modules: [
    {
      title: "CALC 1",
      summary:
        "CALC 1 focuses on advanced coaching methods. Presentations and discussion cover these Action Learning team issues:",
      bullets: [
        "Developing complete problem statements, including root issues and solution goals",
        "Aligning questions with the stage of the problem-solving process",
        "Dealing with typical group-dynamics issues that face problem-solving teams",
      ],
    },
    {
      title: "CALC 2",
      summary:
        "CALC 2 focuses on the organizational issues that must be addressed to run a successful Action Learning program. Presentations and discussion cover:",
      bullets: [
        "Contracting issues",
        "Putting together a program development team",
        "Designing the program",
        "Identifying problems for solution",
        "Forming teams",
        "Building and maintaining team morale and motivation",
        "Maintaining senior management involvement and support",
        "Fostering a culture of Action Learning in the organization",
      ],
    },
  ],
  learnTitle: "What participants learn",
  learn: [
    "How to ask questions aligned with the team's problem-solving and team-development stage",
    "How to handle dysfunctional team behavior",
    "How to embed the Action Learning process successfully in the organization",
    "How to sell and manage the Action Learning process inside their organization",
  ],
  certifiedTitle: "Certified Action Learning Coaches will",
  certifiedWill: [
    "Be qualified to coach Action Learning teams within organizations",
    "Be capable of managing Action Learning programs",
    "Be authorized to use the WIAL brand in marketing materials",
    "Become a member of the community of Certified Action Learning Coaches",
  ],
  skillsTitle: "Top skills of tomorrow",
  skillsSource:
    "Extracted from the World Economic Forum Future of Jobs Report 2020.",
  skills: [
    "Analytical thinking and innovation",
    "Active learning and learning strategies",
    "Complex problem-solving",
    "Critical thinking and analysis",
    "Creativity, originality, and initiative",
    "Leadership and social influence",
    "Resilience, stress tolerance, and flexibility",
    "Reasoning, problem-solving, and ideation",
  ],
} as const;

export const certificationBecomeACoach = {
  id: "become-a-coach",
  title: "Who gets WIAL Action Learning certified?",
  intro: [
    "Action Learning is a powerful tool for individuals, teams, and organizations. WIAL is an international organization offering services on six continents.",
  ],
  industriesLead: "Members of the WIAL community come from many industries:",
  industries: [
    "Marketing",
    "Education",
    "Manufacturing",
    "Banking",
    "Retail",
    "Hospitality",
    "Technology",
  ],
  industriesMore: "and more",
  joinNote:
    "Join WIAL and notice improvements in your work, from problem solving to idea generation.",
  servicesBefore: "Check out our ",
  servicesLabel: "Solution Spheres",
  servicesHref: "/our-services",
  servicesAfter: " and the services we offer.",
  contactHref: "/contact",
  contactLabel: "Ask about becoming a coach",
} as const;

export const certificationPrograms = {
  id: "programs",
  title: "Programs",
  intro: [
    "WIAL's training programs for Action Learning coaches are listed here. Start with Foundations, continue into CALC courses, or bring certification in-house.",
  ],
  items: [
    {
      title: "Foundations of Action Learning",
      href: "#foundations",
      body: "An intensive two-day session covering the six components and two ground rules, with practice as both a participant and a coach.",
    },
    {
      title: "CALC courses",
      href: "#calc-courses",
      body: "The certification program for Action Learning coaches: e-learning, a live workshop, and independently led sessions.",
    },
    {
      title: "In-house programs",
      href: "#in-house",
      body: "Customized in-house certification and staffing for organizations in the United States and internationally.",
    },
  ],
} as const;

export const certificationInHouse = {
  id: "in-house",
  title: "In-house programs",
  intro: [
    "WIAL offers customized in-house training in the United States and internationally. We will run an in-house certification program for Action Learning coaches at your organization. The required six days of training can be arranged in several configurations to match your objectives.",
    "In-house programs follow the same objectives as the public programs, and they can be customized to address specific requirements and challenges in your organization. This is an effective way to train coaches assigned to Action Learning teams and to develop employee programs.",
    "WIAL can also provide the staffing for large leadership development programs that need highly qualified, experienced Action Learning coaches. Only certified, experienced coaches are used for this work.",
  ],
  quote: {
    quote:
      "Last week was one of the best leadership development experiences I've been a part of at Microsoft. You and the team should be proud of what you put together and the results!",
    attribution: "Dan Grady, Premier Field Engineering Director, Microsoft",
  },
  contactHref: "/contact",
  contactLabel: "Ask about in-house training",
} as const;

export const certificationRecertificationRules: CertificationRecertificationRule[] = [
  {
    track: "calc",
    validity: "2 years",
    annualRequirements: [
      "Submit proof of Action Learning coaching hours.",
      "Participate in one WIAL activity.",
      "Renew through WIAL's online renewal form.",
    ],
  },
  {
    track: "palc",
    validity: "2 years",
    annualRequirements: [
      "Submit proof of Action Learning coaching hours.",
      "Participate in two WIAL activities.",
      "Lead at least one Foundations, CALC, or Intensive program.",
      "Renew through WIAL's online renewal form.",
    ],
  },
  {
    track: "salc",
    validity: "2 years",
    annualRequirements: [
      "Submit proof of Action Learning coaching hours.",
      "Participate in three WIAL activities.",
      "Lead at least one Foundations, CALC, or Intensive program.",
      "Mentor two qualified CALCs, or successfully certify one CALC candidate.",
      "Review certification papers as requested.",
      "Renew through WIAL's online renewal form.",
    ],
  },
  {
    track: "malc",
    validity: "2 years",
    annualRequirements: [
      "Submit proof of Action Learning coaching hours.",
      "Participate in four WIAL activities.",
      "Submit a success story or publish content on social media.",
      "Lead at least one Foundations, CALC, or Intensive program.",
      "Mentor two qualified CALCs, or successfully certify one CALC candidate.",
      "Publish or present, and write at least one article for the WIAL newsletter.",
      "Review certification papers as requested.",
      "Renew through WIAL's online renewal form.",
    ],
  },
];