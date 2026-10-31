export interface Person {
  id: string;
  name: string;
  role: string;
  group: string;
  order?: number;
  department?: string;
  year?: string;
  semester?: string;
  designation?: string;
  bio?: string;
  responsibilities?: string[];
  skills?: string[];
  photo?: string;
  focalX?: number;
  focalY?: number;
  email?: string;
  phone?: string;
  github?: string;
  linkedin?: string;
  instagram?: string;
  website?: string;
  joinedYear?: number | string;
  showContact?: boolean;
}

export interface PeopleGroup {
  id: string;
  groupName: string;
  eyebrow?: string;
  description?: string;
  members: Person[];
}

export const FACULTY_COORDINATORS_HEADING = "Mr. G Vannurswamy, Mrs. Anusha A. M, and Mr. Venkatesh P";

export function getDefaultResponsibilities(role?: string, group?: string): string[] {
  const r = (role || '').toLowerCase();
  const g = (group || '').toLowerCase();

  if (r.includes('president') && !r.includes('vice')) {
    return [
      "Set the semester plan and review progress monthly with faculty",
      "Chair committee meetings",
      "Approve project scope and final review of major releases",
      "Resolve conflicts and unblock the team",
    ];
  }
  if (r.includes('vice president')) {
    return [
      "Run weekly sessions day-to-day",
      "Track tasks and deadlines on the project board",
      "Coordinate Web Masters, Event Coordinator and Organizers",
      "Stand in for the President when absent",
    ];
  }
  if (r.includes('secretary') && !r.includes('joint')) {
    return [
      "Take minutes of every meeting and session (within 48 hours)",
      "Maintain the club handbook and decision records",
      "Send announcements and manage official communication channels",
      "Maintain the member registry",
    ];
  }
  if (r.includes('joint secretary')) {
    return [
      "Understudy to the Secretary",
      "Shares minutes, registry and announcements",
      "Coordinate student outreach and internal notices",
    ];
  }
  if (r.includes('treasurer')) {
    return [
      "Prepare the semester budget and track all spending",
      "Collect and record fees or sponsorships",
      "Get expenses approved by the faculty coordinator before spending",
      "Plan logistics for workshops, hackathons and demo days",
    ];
  }
  if (r.includes('web master') || r.includes('webmaster') || g.includes('web')) {
    return [
      "Maintain the official club website and content",
      "Set up and administer the GitHub organization, repositories, access rules and templates",
      "Manage deployment and hosting for club projects",
      "Enforce repository standards (README, license, branch protection)",
    ];
  }
  if (r.includes('moment capture') || r.includes('media')) {
    return [
      "Capture photos and short videos at sessions, workshops and Demo Day",
      "Share approved media with the Secretary and Web Masters",
      "Maintain an organized media archive",
    ];
  }
  if (r.includes('organiser') || r.includes('organizer') || g.includes('events')) {
    return [
      "Help the VP run sessions and manage participants on the ground",
      "Assist the Event Coordinator with event logistics and day-of operations",
      "Help beginners during work sessions",
      "Review pull requests and guide contributors",
    ];
  }
  if (r.includes('faculty') || g.includes('faculty')) {
    return [
      "Monthly progress check-in with the President",
      "Approve expenses before the Treasurer spends",
      "Approve running the GitHub organization and website under the university's name",
      "Provide the time slot, room, club email and budget",
    ];
  }
  return [
    "Take starter issues: page sections, form validation, bug fixes",
    "Help beginners during work sessions",
    "Review pull requests and guide contributors",
    "Own specific project modules",
    "Shadow committee roles to prepare as successors",
  ];
}

export const PEOPLE_GROUPS: PeopleGroup[] = [
  {
    id: "faculty-coordinators",
    groupName: "Faculty coordinators",
    eyebrow: "Advisory & Mentorship",
    description: "Faculty members guiding the club's academic alignment, institutional support, and student initiatives.",
    members: [
      {
        id: "fc-vannurswamy",
        name: "Mr. G Vannurswamy",
        role: "Faculty Coordinator",
        group: "Faculty coordinators",
        designation: "Faculty Coordinator",
        department: "Computer Science & Engineering",
        email: "vannurswamy@kishkindauniversity.edu.in",
        showContact: true,
        responsibilities: [
          "Monthly progress check-in with the President",
          "Approve expenses before the Treasurer spends",
          "Approve running the GitHub organization and website under the university's name",
          "Provide the time slot, room, club email and budget",
        ],
      },
      {
        id: "fc-anusha",
        name: "Mrs. Anusha A. M",
        role: "Faculty Coordinator",
        group: "Faculty coordinators",
        designation: "Faculty Coordinator",
        department: "Computer Science & Engineering",
        email: "anusha@kishkindauniversity.edu.in",
        showContact: true,
        responsibilities: [
          "Monthly progress check-in with the President",
          "Approve expenses before the Treasurer spends",
          "Approve running the GitHub organization and website under the university's name",
          "Provide the time slot, room, club email and budget",
        ],
      },
      {
        id: "fc-venkatesh",
        name: "Mr. Venkatesh P",
        role: "Faculty Coordinator",
        group: "Faculty coordinators",
        designation: "Assistant Professor",
        department: "BCA / MCA",
        email: "venkateshpolepalli@kishkindauniversity.edu.in",
        showContact: true,
        responsibilities: [
          "Monthly progress check-in with the President",
          "Approve expenses before the Treasurer spends",
          "Approve running the GitHub organization and website under the university's name",
          "Provide the time slot, room, club email and budget",
        ],
      },
    ],
  },
  {
    id: "office-bearers",
    groupName: "Office bearers",
    eyebrow: "Leadership & Administration",
    description: "Elected student leadership steering operations, strategic planning, and university coordination.",
    members: [
      {
        id: "pres-vittala",
        name: "T Vittala",
        role: "President",
        group: "Office bearers",
        year: "3rd Year CSE",
        department: "Computer Science & Engineering",
        email: "vittala.t1@gmail.com",
        phone: "8867467492",
        showContact: true,
        responsibilities: [
          "Set the semester plan and review progress monthly with faculty",
          "Chair committee meetings",
          "Approve project scope and final review of major releases",
          "Resolve conflicts and unblock the team",
        ],
      },
      {
        id: "vp-abhiram",
        name: "D V N S Abhiram",
        role: "Vice President",
        group: "Office bearers",
        year: "2nd Year CSE",
        department: "Computer Science & Engineering",
        email: "dvnsabhiram071@gmail.com",
        phone: "8618842527",
        showContact: true,
        responsibilities: [
          "Run weekly sessions day-to-day",
          "Track tasks and deadlines on the project board",
          "Coordinate Web Masters, Event Coordinator and Organizers",
          "Stand in for the President when absent",
        ],
      },
      {
        id: "sec-chinmai",
        name: "V Chinmai Dhyan",
        role: "Secretary",
        group: "Office bearers",
        year: "2nd Year CSE",
        department: "Computer Science & Engineering",
        email: "mrchinmai07@gmail.com",
        showContact: true,
        responsibilities: [
          "Take minutes of every meeting and session (within 48 hours)",
          "Maintain the club handbook and decision records",
          "Send announcements and manage official communication channels",
          "Maintain the member registry",
        ],
      },
      {
        id: "jsec-harshitha",
        name: "K S Harshitha",
        role: "Joint Secretary",
        group: "Office bearers",
        year: "2nd Year CSE",
        department: "Computer Science & Engineering",
        email: "Ksharshitha141@gmail.com",
        showContact: true,
        responsibilities: [
          "Understudy to the Secretary",
          "Shares minutes, registry and announcements",
        ],
      },
      {
        id: "treas-bhumika",
        name: "Bhumika H Jain",
        role: "Treasurer / Event Co-Ordinator",
        group: "Office bearers",
        year: "3rd Year CSE",
        department: "Computer Science & Engineering",
        email: "jainbhumi709@gmail.com",
        showContact: true,
        responsibilities: [
          "Prepare the semester budget and track all spending",
          "Collect and record fees or sponsorships",
          "Get expenses approved by the faculty coordinator before spending",
          "Plan logistics for workshops, hackathons and demo days",
        ],
      },
      {
        id: "cotreas-vishmitha",
        name: "B K Vishmitha",
        role: "Co-Treasurer",
        group: "Office bearers",
        year: "2nd Year CSE",
        department: "Computer Science & Engineering",
        email: "vishmitha1407@gmail.com",
        showContact: true,
        responsibilities: [
          "Record keeping and understudy",
        ],
      },
    ],
  },
  {
    id: "web-team",
    groupName: "Web team",
    eyebrow: "Engineering & Platform",
    description: "Developers maintaining the club platform, internal tools, registration systems, and digital infrastructure.",
    members: [
      {
        id: "wm-priyanshu",
        name: "Priyanshu Kumar Singh",
        role: "Web Master",
        group: "Web team",
        year: "3rd Year CSE",
        department: "Computer Science & Engineering",
        email: "priyanshuk2021@gmail.com",
        showContact: true,
        responsibilities: [
          "Maintain the official club website and content",
          "Set up and administer the GitHub organization, repositories, access rules and templates",
          "Manage deployment and hosting for club projects",
          "Enforce repository standards (README, license, branch protection)",
        ],
      },
      {
        id: "wm-nagaraj",
        name: "Nagaraj Kalburgi",
        role: "Web Master",
        group: "Web team",
        year: "3rd Year CSE",
        department: "Computer Science & Engineering",
        email: "kalburginagaraj98@gmail.com",
        showContact: true,
        responsibilities: [
          "Maintain the official club website and content",
          "Set up and administer the GitHub organization, repositories, access rules and templates",
          "Manage deployment and hosting for club projects",
          "Enforce repository standards (README, license, branch protection)",
        ],
      },
      {
        id: "wm-bhuvan",
        name: "Bhuvan K",
        role: "Web Master",
        group: "Web team",
        year: "2nd Year CSE",
        department: "Computer Science & Engineering",
        email: "bhuvanraok07@gmail.com",
        showContact: true,
        responsibilities: [
          "Maintain the official club website and content",
          "Set up and administer the GitHub organization, repositories, access rules and templates",
          "Manage deployment and hosting for club projects",
          "Enforce repository standards (README, license, branch protection)",
        ],
      },
      {
        id: "wm-jatin",
        name: "Jatin Kumar",
        role: "Web Master",
        group: "Web team",
        year: "MCA",
        department: "Master of Computer Applications",
        email: "jatinkumar7422@gmail.com",
        showContact: true,
        responsibilities: [
          "Maintain the official club website and content",
          "Set up and administer the GitHub organization, repositories, access rules and templates",
          "Manage deployment and hosting for club projects",
          "Enforce repository standards (README, license, branch protection)",
        ],
      },
    ],
  },
  {
    id: "events-and-media",
    groupName: "Events and media",
    eyebrow: "Production & Outreach",
    description: "Organizers handling workshop execution, event logistics, and visual coverage for the community.",
    members: [
      {
        id: "org-rahul",
        name: "B Rahul Murthy",
        role: "Club Organiser",
        group: "Events and media",
        year: "3rd Year CSE",
        department: "Computer Science & Engineering",
        email: "rahulmurthy615@gmail.com",
        showContact: true,
        responsibilities: [
          "Help the VP run sessions and manage participants on the ground",
          "Assist the Event Coordinator with event logistics and day-of operations",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "org-saipavan",
        name: "Y Sai Pavan",
        role: "Club Organiser",
        group: "Events and media",
        year: "3rd Year CSE",
        department: "Computer Science & Engineering",
        email: "ypavan072@gmail.com",
        showContact: true,
        responsibilities: [
          "Help the VP run sessions and manage participants on the ground",
          "Assist the Event Coordinator with event logistics and day-of operations",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "mc-parvez",
        name: "Parvez Ahamed",
        role: "Moment Capture",
        group: "Events and media",
        year: "2nd Year CSE",
        department: "Computer Science & Engineering",
        email: "parvezahamed1717@gmail.com",
        showContact: true,
        responsibilities: [
          "Capture photos and short videos at sessions, workshops and Demo Day",
          "Share approved media with the Secretary and Web Masters",
          "Maintain an organized media archive",
        ],
      },
      {
        id: "org-suvarna",
        name: "Suvarna K B",
        role: "Club Organizer",
        group: "Events and media",
        year: "MCA",
        department: "Master of Computer Applications",
        email: "kbsuvarna18@gmail.com",
        showContact: true,
        responsibilities: [
          "Help the VP run sessions and manage participants on the ground",
          "Assist the Event Coordinator with event logistics and day-of operations",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "org-amrutha",
        name: "Amrutha R",
        role: "Club Organizer",
        group: "Events and media",
        year: "MCA",
        department: "Master of Computer Applications",
        email: "amruthar181122@gmail.com",
        showContact: true,
        responsibilities: [
          "Help the VP run sessions and manage participants on the ground",
          "Assist the Event Coordinator with event logistics and day-of operations",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "org-rathna",
        name: "Rathna K",
        role: "Club Organizer",
        group: "Events and media",
        year: "MCA",
        department: "Master of Computer Applications",
        email: "rathnakalinga442@gmail.com",
        showContact: true,
        responsibilities: [
          "Help the VP run sessions and manage participants on the ground",
          "Assist the Event Coordinator with event logistics and day-of operations",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "org-arshiya",
        name: "Arshiya Parveen",
        role: "Club Organizer",
        group: "Events and media",
        year: "MCA",
        department: "Master of Computer Applications",
        email: "Arshiyaparveenshaik2@gmail.com",
        showContact: true,
        responsibilities: [
          "Help the VP run sessions and manage participants on the ground",
          "Assist the Event Coordinator with event logistics and day-of operations",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "org-ranjitha",
        name: "Ranjitha",
        role: "Club Organizer",
        group: "Events and media",
        year: "MCA",
        department: "Master of Computer Applications",
        email: "ranjitha.sgp999@gmail.com",
        showContact: true,
        responsibilities: [
          "Help the VP run sessions and manage participants on the ground",
          "Assist the Event Coordinator with event logistics and day-of operations",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "org-roshini",
        name: "Roshini",
        role: "Club Organizer",
        group: "Events and media",
        year: "MCA",
        department: "Master of Computer Applications",
        email: "anjalroshnia@gmail.com",
        showContact: true,
        responsibilities: [
          "Help the VP run sessions and manage participants on the ground",
          "Assist the Event Coordinator with event logistics and day-of operations",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "org-saipoorvika",
        name: "Sai Poorvika",
        role: "Club Organizer",
        group: "Events and media",
        year: "MCA",
        department: "Master of Computer Applications",
        email: "saipoorvika161@gmail.com",
        showContact: true,
        responsibilities: [
          "Help the VP run sessions and manage participants on the ground",
          "Assist the Event Coordinator with event logistics and day-of operations",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "org-haritha",
        name: "Haritha",
        role: "Club Organizer",
        group: "Events and media",
        year: "MCA",
        department: "Master of Computer Applications",
        email: "pharithaind@gmail.com",
        showContact: true,
        responsibilities: [
          "Help the VP run sessions and manage participants on the ground",
          "Assist the Event Coordinator with event logistics and day-of operations",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "media-darshan",
        name: "Darshan Kumar D S",
        role: "Media",
        group: "Events and media",
        year: "MCA",
        department: "Master of Computer Applications",
        email: "drashankumar54@gmail.com",
        showContact: true,
        responsibilities: [
          "Capture photos and short videos at sessions, workshops and Demo Day",
          "Share approved media with the Secretary and Web Masters",
          "Maintain an organized media archive",
        ],
      },
      {
        id: "media-venu",
        name: "Venu C",
        role: "Media",
        group: "Events and media",
        year: "MCA",
        department: "Master of Computer Applications",
        email: "venuvenu6664@gmail.com",
        showContact: true,
        responsibilities: [
          "Capture photos and short videos at sessions, workshops and Demo Day",
          "Share approved media with the Secretary and Web Masters",
          "Maintain an organized media archive",
        ],
      },
      {
        id: "media-afzal",
        name: "Afzal",
        role: "Media",
        group: "Events and media",
        year: "MCA",
        department: "Master of Computer Applications",
        email: "azzuafzal6@gmail.com",
        showContact: true,
        responsibilities: [
          "Capture photos and short videos at sessions, workshops and Demo Day",
          "Share approved media with the Secretary and Web Masters",
          "Maintain an organized media archive",
        ],
      },
    ],
  },
  {
    id: "core-members",
    groupName: "Core members",
    eyebrow: "Execution & Collaboration",
    description: "Active members spearheading project teams, mentoring peers, and driving weekly club activities.",
    members: [
      {
        id: "core-vishwas",
        name: "Vishwas M",
        role: "Core Member",
        group: "Core members",
        year: "3rd Year CSE",
        department: "Computer Science & Engineering",
        email: "vishwas189@gmail.com",
        showContact: true,
        responsibilities: [
          "Take starter issues: page sections, form validation, bug fixes",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "core-vasantha",
        name: "Vasantha B",
        role: "Core Member",
        group: "Core members",
        year: "3rd Year CSE",
        department: "Computer Science & Engineering",
        email: "bellivasu@gmail.com",
        showContact: true,
        responsibilities: [
          "Take starter issues: page sections, form validation, bug fixes",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "core-bhagavath",
        name: "Bhagavath",
        role: "Core Member",
        group: "Core members",
        year: "2nd Year CSE",
        department: "Computer Science & Engineering",
        email: "bhagavathr.09@gmail.com",
        showContact: true,
        responsibilities: [
          "Take starter issues: page sections, form validation, bug fixes",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "core-rakshith",
        name: "Rakshith K S",
        role: "Core Member",
        group: "Core members",
        year: "2nd Year CSE",
        department: "Computer Science & Engineering",
        email: "rakshith.k.s511@gmail.com",
        showContact: true,
        responsibilities: [
          "Take starter issues: page sections, form validation, bug fixes",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "core-ganga",
        name: "G Ganga Kavya",
        role: "Core Member",
        group: "Core members",
        year: "2nd Year CSE",
        department: "Computer Science & Engineering",
        email: "gangakavya2325@gmail.com",
        showContact: true,
        responsibilities: [
          "Take starter issues: page sections, form validation, bug fixes",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "core-saibhavishya",
        name: "G Sai Bhavishya",
        role: "Core Member",
        group: "Core members",
        year: "2nd Year CSE",
        department: "Computer Science & Engineering",
        email: "bhavishyasg78@gmail.com",
        showContact: true,
        responsibilities: [
          "Take starter issues: page sections, form validation, bug fixes",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "core-lahari",
        name: "Lahari Unduru",
        role: "Core Member",
        group: "Core members",
        year: "2nd Year CSE",
        department: "Computer Science & Engineering",
        email: "lahariunduru@gmail.com",
        showContact: true,
        responsibilities: [
          "Take starter issues: page sections, form validation, bug fixes",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "core-hansika",
        name: "Sunkara Hansika",
        role: "Core Member",
        group: "Core members",
        year: "2nd Year CSE",
        department: "Computer Science & Engineering",
        email: "hansikahoney095@gmail.com",
        showContact: true,
        responsibilities: [
          "Take starter issues: page sections, form validation, bug fixes",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "core-ananya",
        name: "Ananya",
        role: "Core Member",
        group: "Core members",
        year: "2nd Year CSE",
        department: "Computer Science & Engineering",
        email: "shatterananya@gmail.com",
        showContact: true,
        responsibilities: [
          "Take starter issues: page sections, form validation, bug fixes",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "core-jashwanth",
        name: "V Jashwanth",
        role: "Core Member",
        group: "Core members",
        year: "2nd Year CSE",
        department: "Computer Science & Engineering",
        email: "jjashu580@gmail.com",
        showContact: true,
        responsibilities: [
          "Take starter issues: page sections, form validation, bug fixes",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "core-anushav",
        name: "Anusha V (Spoorthi)",
        role: "Core Member",
        group: "Core members",
        year: "2nd Year CSE",
        department: "Computer Science & Engineering",
        email: "anushaspurthi82@gmail.com",
        showContact: true,
        responsibilities: [
          "Take starter issues: page sections, form validation, bug fixes",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "core-vidya",
        name: "K Vidya",
        role: "Core Member",
        group: "Core members",
        year: "BCA",
        department: "Bachelor of Computer Applications",
        email: "vidyark2006@gmail.com",
        showContact: true,
        responsibilities: [
          "Take starter issues: page sections, form validation, bug fixes",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
      {
        id: "core-khushi",
        name: "Khushi Singh",
        role: "Core Member",
        group: "Core members",
        year: "BCA",
        department: "Bachelor of Computer Applications",
        email: "khushisingh.ks4343@gmail.com",
        showContact: true,
        responsibilities: [
          "Take starter issues: page sections, form validation, bug fixes",
          "Help beginners during work sessions",
          "Review pull requests and guide contributors",
          "Own specific project modules",
          "Shadow committee roles to prepare as successors",
        ],
      },
    ],
  },
];

export function formatPhoneHref(phone: string): string {
  if (!phone) return '';
  if (phone.startsWith('PHONE_')) return `tel:${phone}`;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `tel:+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `tel:+${digits}`;
  return `tel:${phone.startsWith('+') ? '+' + digits : '+91' + digits}`;
}

export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  if (phone.startsWith('PHONE_')) return phone;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    const num = digits.slice(2);
    return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
  }
  return phone;
}
