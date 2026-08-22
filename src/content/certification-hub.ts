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