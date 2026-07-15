import type {
  CertificationDocument,
  CertificationRecertificationRule,
  CertificationTrack,
  CertificationTrackKey,
} from "@/lib/types";

type CertificationProgressionStep = {
  title: string;
  body: string;
};

export const certificationHero = {
  eyebrow: "Global certification hub",
  title: "Certification pathways, renewal expectations, and LMS access in one place.",
  intro:
    "WIAL offers four levels of certification for Action Learning coaches. Each level represents increasing expertise, experience, and leadership in the Action Learning community. WIAL is an ICF-accredited training provider, and our CALC certification is an accredited ICF CCE program.",
  metrics: [
    { label: "Certification levels", value: "4" },
    { label: "ICF accredited", value: "CCE" },
    { label: "Global recognition", value: "Yes" },
  ],
  anchors: [
    { id: "calc", label: "CALC" },
    { id: "palc", label: "PALC" },
    { id: "salc", label: "SALC" },
    { id: "malc", label: "MALC" },
    { id: "progression", label: "Progression" },
    { id: "recertification", label: "Recertification" },
    { id: "lms", label: "LMS" },
  ],
} as const;

export const certificationTracks: CertificationTrack[] = [
  {
    key: "calc",
    level: "CALC",
    anchor: "calc",
    title: "Certified Action Learning Coach",
    tagline: "The entry-level WIAL coaching credential.",
    summary:
      "The Certified Action Learning Coach (CALC) is the first formal certification level in the WIAL model. CALCs can coach Action Learning sessions and form the first formal certification step in the WIAL model. This certification focuses on practical team coaching proficiency, observed coaching, written reflection, and an understanding of the full Action Learning process.",
    eligibility: [
      "Complete the WIAL Foundations, CALC1, and CALC2 sequence, or an approved intensive that blends the full curriculum.",
      "Use the Foundations program as the pre-requisite for CALC1 and CALC2.",
      "Train with a SALC or MALC lead while progressively increasing coaching proficiency.",
    ],
    requirements: [
      "Participate in the Foundations program and both CALC workshops or the combined intensive track.",
      "Coach Action Learning sessions in CALC1 and CALC2 and receive feedback from peers and the lead.",
      "Submit the CALC certification paper and related reflections.",
      "Complete the CALC application and review process.",
    ],
    progressionLabel:
      "After earning CALC, build coaching hours and longer-term project experience before applying for PALC.",
    lmsSummary:
      "Use the LMS to access CALC e-learning material and recertification refresh options.",
  },
  {
    key: "palc",
    level: "PALC",
    anchor: "palc",
    title: "Professional Action Learning Coach",
    tagline: "For CALCs with documented practice and project depth.",
    summary:
      "The Professional Action Learning Coach (PALC) certification recognizes coaches who have built a serious body of Action Learning work and can lead introductory WIAL learning experiences under senior observation. PALCs are coaches who have proven their ability and have accumulated meaningful WIAL Action Learning experience.",
    eligibility: [
      "Be a Certified Action Learning Coach (CALC).",
      "Document one hundred (100) hours of Action Learning coaching, including at least one longer-term project that spans weeks or months.",
      "Count at least fifty (50) hours as WIAL Action Learning coaching; the remaining hours may include WIAL continuing education or volunteer participation.",
    ],
    requirements: [
      "Submit an engagement list and a report documenting the challenges and learnings from the longer-term Action Learning project.",
      "Lead a Leading with Questions or Introduction to Action Learning session observed by a SALC or MALC.",
      "Complete the PALC application packet and committee review process.",
    ],
    progressionLabel:
      "PALC is the bridge from coached participation to independently leading introductory Action Learning experiences.",
    lmsSummary:
      "Use the LMS as the launch point for PALC-related learning paths and prerequisite refreshers.",
  },
  {
    key: "salc",
    level: "SALC",
    anchor: "salc",
    title: "Senior Action Learning Coach",
    tagline: "For experienced coaches ready to lead core WIAL programs.",
    summary:
      "The Senior Action Learning Coach (SALC) certification marks the move into senior coaching leadership. SALCs are cleared to lead all WIAL programs and represent a higher level of experience and readiness. The certification focuses on observed program leadership, critique of participant work, and committee-level review.",
    eligibility: [
      "Hold the documented coaching-hour threshold described in the current SALC requirements, including at least one longer-term project with a minimum of four 90-minute sessions.",
      "Count a minimum of fifty (50) hours as coaching; the balance may include WIAL-sponsored or organized continuing education activity.",
      "PALCs typically satisfy part of this project requirement through their PALC application work.",
    ],
    requirements: [
      "Secure sponsorship from a MALC who has recently observed the candidate's CALC-level coaching ability.",
      "Lead certification coursework while observed and submit the required critique of written participant reports.",
      "Complete the SALC application and committee review process.",
    ],
    progressionLabel:
      "SALC clears a coach to lead core certification experiences and mentor developing coaches.",
    lmsSummary:
      "The LMS remains the external launch point for senior-level WIAL learning pathways and program access.",
  },
  {
    key: "malc",
    level: "MALC",
    anchor: "malc",
    title: "Master Action Learning Coach",
    tagline: "The highest WIAL certification level and thought-leadership track.",
    summary:
      "The Master Action Learning Coach (MALC) is the highest level in the WIAL hierarchy. MALCs are thought leaders in the Action Learning community who combine significant coaching volume with published thought leadership, conference presence, and continued service to the WIAL method.",
    eligibility: [
      "Be a Senior Action Learning Coach for at least three years.",
      "Document five hundred (500) hours of Action Learning coaching, training, and/or consulting across diverse clients and projects.",
      "Demonstrate thought leadership through conference presentation, external publication, and steady contribution to the WIAL community.",
    ],
    requirements: [
      "Secure sponsorship from a MALC and complete the MALC review process.",
      "Provide evidence of publishing, presenting, and broader contribution to Action Learning outside routine delivery work.",
      "Submit the MALC application packet used by WIAL today.",
    ],
    progressionLabel:
      "MALC is the capstone path for senior coaches who also contribute as visible thought leaders in the wider Action Learning field.",
    lmsSummary:
      "The website links outward to WIAL's existing LMS and does not duplicate advanced learning modules.",
  },
];

export const certificationProgression: CertificationProgressionStep[] = [
  {
    title: "CALC",
    body: "Build core Action Learning coaching proficiency through Foundations, CALC1, CALC2, and written reflection.",
  },
  {
    title: "PALC",
    body: "Add documented coaching hours, a longer-term project, and observed delivery of an introductory WIAL learning experience.",
  },
  {
    title: "SALC",
    body: "Lead certification experiences under MALC sponsorship, critique participant work, and demonstrate readiness for senior program leadership.",
  },
  {
    title: "MALC",
    body: "Combine senior-level experience with publication, presenting, mentoring, and broad contribution to the WIAL method.",
  },
];

export const certificationRecertificationRules: CertificationRecertificationRule[] = [
  {
    track: "calc",
    validity: "2 years",
    annualRequirements: [
      "Document at least 5 hours of Action Learning coaching during the prior two years.",
      "Submit a short project write-up or testimonial to the Director of Certification.",
      "Complete at least one WIAL volunteer or continuing education activity from the current renewal categories.",
    ],
    expiredPolicy: [
      "If the credential expired within two years, renew by meeting the standard CALC renewal requirements.",
      "If the credential expired for more than two years, complete the WIAL portal e-learning assessments or arrange an audited session with a S/MALC.",
    ],
  },
  {
    track: "palc",
    validity: "2 years",
    annualRequirements: [
      "Document at least 10 hours of Action Learning coaching during the prior two years.",
      "Submit a brief project description that may be used in WIAL newsletter, website, or social content.",
      "Complete at least two WIAL volunteer or continuing education activities from the current renewal categories.",
    ],
  },
  {
    track: "salc",
    validity: "2 years",
    annualRequirements: [
      "Document at least 10 hours of WIAL Action Learning during the prior two years.",
      "Complete at least three WIAL volunteer and/or continuing education activities.",
      "Lead at least one program, mentor two qualified CALCs or certify one CALC candidate successfully, and review certification papers when requested.",
    ],
  },
  {
    track: "malc",
    validity: "1 year",
    annualRequirements: [
      "Document at least 10 hours of WIAL Action Learning during the prior two years.",
      "Participate in an annual WIAL conference or other sanctioned event, or actively volunteer with a local affiliate or WIAL committee.",
      "Lead at least one WIAL program, help certify a CALC candidate, publish and present, contribute a newsletter article, and review certification papers in a timely manner.",
    ],
  },
];