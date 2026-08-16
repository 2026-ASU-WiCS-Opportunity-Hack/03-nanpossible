export const AWARD_CATEGORIES = [
  {
    value: 'Application Award',
    description:
      'High-impact applications of WIAL Action Learning — scale of programs, project impact, use of certified coaches, and visibility.',
  },
  {
    value: 'Innovation Award',
    description:
      'A unique solution created with WIAL Action Learning, with an emphasis on creative ways of integrating the methodology.',
  },
  {
    value: 'Coaching Excellence Award',
    description:
      'Superior coaching, demonstrated through endorsements and praise from team members and clients.',
  },
  {
    value: 'Marquardt Research Award',
    description:
      'Published work that contributes to the body of Action Learning knowledge. Includes a $500 prize.',
  },
  {
    value: 'Pro Bono Coaching Award',
    description:
      'Volunteer Action Learning coaching that delivers meaningful social impact.',
  },
] as const;

export const AWARD_CATEGORY_VALUES: string[] = AWARD_CATEGORIES.map((c) => c.value);
