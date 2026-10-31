export interface ClubConstants {
  name: string;
  university: string;
  universityUrl: string;
  email: string;
  githubOrg: string;
  githubOrgUrl: string;
  githubUser: string;
  githubUserUrl: string;
  instagram: string;
  instagramUrl: string;
  domain: string;
  hashtag: string;
  descriptor: string;
}

export interface StatItem {
  id: string;
  label: string;
  value: string;
  unit?: string;
  isConfirmed: boolean;
}

export interface WhatWeDoItem {
  id: string;
  title: string;
  description: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  description: string;
  status: 'In progress' | 'Planned' | 'Live' | 'Archived';
  techStack: string[];
  repositoryUrl: string;
  summary: string;
  howToContribute: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface Principle {
  title: string;
  description: string;
}

export const SITE_CONSTANTS: ClubConstants = {
  name: "Coders Club",
  university: "Kishkinda University",
  universityUrl: "https://www.kishkindauniversity.edu.in/",
  email: "codersclub.ku@gmail.com",
  githubOrg: "Coders-Club-KU",
  githubOrgUrl: "https://github.com/Coders-Club-KU",
  githubUser: "codersclubku",
  githubUserUrl: "https://github.com/codersclubku",
  instagram: "@codersclubku_",
  instagramUrl: "https://www.instagram.com/codersclubku_",
  domain: "codersclub.kishkindauniversity.edu.in",
  hashtag: "#CodersClubKU",
  descriptor: "A student-run technical community that builds real projects.",
};

export const STATS: StatItem[] = [
  {
    id: "workshops",
    label: "Hands-on workshops",
    value: "4+",
    isConfirmed: true,
  },
  {
    id: "sessions",
    label: "Weekly session",
    value: "2",
    unit: "hours",
    isConfirmed: true,
  },
  {
    id: "open-source-repos",
    label: "Public repositories",
    value: "2+",
    isConfirmed: true,
  },
];

export const WHAT_WE_DO: WhatWeDoItem[] = [
  {
    id: "projects",
    title: "Real projects",
    description: "Building production-grade software owned by the club rather than hypothetical or disposable exercises.",
  },
  {
    id: "open-source",
    title: "Open source",
    description: "Hands-on Git and GitHub workflows, first pull requests, and maintaining transparent public repositories.",
  },
  {
    id: "mentoring",
    title: "Technical mentorship",
    description: "Experienced student engineers guiding peers through structured workshops, code reviews, and project ownership.",
  },
];

export const PROJECTS: ProjectSummary[] = [
  {
    id: "club-website",
    title: "Club Website",
    description: "The public face of the club: information, events, projects, gallery, and contact.",
    status: "In progress",
    techStack: ["React", "TypeScript", "Tailwind CSS", "React Router"],
    repositoryUrl: "https://github.com/Coders-Club-KU",
    summary: "The official web portal providing public information, event schedules, project portfolios, and team directory with zero login friction for visitors.",
    howToContribute: "Pick up open issues in the club GitHub organization, follow coding style tokens in the brand pack, open a pull request, and request review from the Web Masters.",
  },
  {
    id: "event-registration",
    title: "Event Registration System",
    description: "Online sign-up, confirmation and attendee management for club events.",
    status: "In progress",
    techStack: ["React", "TypeScript", "Tailwind CSS", "Database"],
    repositoryUrl: "https://github.com/Coders-Club-KU",
    summary: "A reliable registration workflow that handles student sign-ups, ticket issuance, validation, and organizer attendee tracking without third-party form limitations.",
    howToContribute: "Check the GitHub repository for registration state handlers, form validation modules, and backend API integration endpoints.",
  },
];

export const ABOUT_CONTENT = {
  headline: "A student-run technical community that builds real projects",
  mission: "The Coders Club is a technical community that builds real things. It is not a classroom and not only an event organiser.",
  vision: "A student-run technical community that ships real projects, keeps its work public and documented, and trains members to lead the next batch.",
  principles: [
    {
      title: "Build, don't lecture",
      description: "Most of each session is hands-on work directly inside codebases.",
    },
    {
      title: "The club owns the work",
      description: "Every project lives in the club's GitHub organisation rather than private repositories.",
    },
    {
      title: "Document everything",
      description: "Processes, decisions and project docs are written down for future batches to inherit without friction.",
    },
    {
      title: "Delegate with ownership",
      description: "Every task has a named owner and a backup coordinator.",
    },
    {
      title: "Quality over quantity",
      description: "Nothing merges or publishes without thorough code review.",
    },
    {
      title: "Grow leaders",
      description: "Every committee role has an understudy preparing to lead next year.",
    },
  ] as Principle[],
  weeklySession: {
    duration: "Sessions run about 2 hours a week",
    structure: [
      "A short check-in on project boards",
      "An optional short talk or technical demo",
      "A long hands-on work and coding session",
      "A wrap-up and next steps alignment",
    ],
  },
  activities: [
    "Hands-on Git and GitHub sessions",
    "First pull request sessions for all newcomers",
    "Building and shipping the club's own projects",
    "Mentoring beginners in foundational stacks",
    "Technical events open to the entire department",
  ],
  goals: [
    "An active student-led technical community",
    "Regular but realistic events",
    "Two meaningful club projects (the website and the event registration system) owned by the club",
    "A live website and GitHub organisation",
    "Documented processes and handbooks",
    "A pipeline of members ready to take over leadership",
    "A strong foundation for future batches",
  ],
  howToJoin: "Direct membership for all Kishkinda University students. Simply create a student account with your USN to automatically join the club. No coordinator approval, emails, or paperwork needed—signing up activates your membership and unlocks 1-click registration for all workshops, hackathons, and projects.",
};

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is Coders Club?",
    answer: "Coders Club is a student-run technical community at Kishkinda University that builds real software projects, trains members in modern software practices, and prepares future leaders.",
  },
  {
    question: "Who can join and how do I become a member?",
    answer: "Any student at Kishkinda University can join instantly by creating a student account on this website. No coordinator contact or approval required—signing up activates your membership immediately.",
  },
  {
    question: "How do I register for events?",
    answer: "Once signed in with your student account, open any event page and click 'Register for this event'. Your profile is prefilled, confirming your seat and generating your entry QR pass in a single click.",
  },
  {
    question: "Do I need prior coding experience?",
    answer: "No. The club is open to beginners. We conduct first pull request sessions, practical Git workshops, and provide peer mentorship to help everyone get started.",
  },
  {
    question: "How much time is required each week?",
    answer: "Sessions run about 2 hours a week: a quick check-in, an optional demo, a long hands-on coding sprint, and a wrap-up.",
  },
  {
    question: "Where do club projects live?",
    answer: "All projects live under the official public GitHub organization (Coders-Club-KU). The club owns all collective work.",
  },
  {
    question: "Do visitors need an account to view events or projects?",
    answer: "No. Visitors never log in to browse the website, view events, read documentation, or view project repositories.",
  },
];
