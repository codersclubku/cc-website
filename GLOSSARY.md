# Coders Club Kishkinda University — Brand & UX Glossary

This glossary defines standard terminology, approved microcopy, casing, and tone conventions for the Coders Club digital presence at Kishkinda University.

## 1. Identity & Naming

| Term | Approved Usage | Deprecated / Disallowed | Rationale |
| :--- | :--- | :--- | :--- |
| **Club Name** | **Coders Club** | Coder's Club, The Coders Club, CC | Official registration under Kishkinda University |
| **University** | **Kishkinda University** | KU, Kishkindha, Kishkinda Univ | Formal institutional attribution |
| **Email** | **codersclub.ku@gmail.com** | Personal email addresses | Single official point of contact |
| **Repository Org** | **Coders-Club-KU** | Personal GitHub accounts | All club projects are owned publicly by the club |

## 2. Navigation & Information Architecture

The six primary navigation labels are descriptive topic nouns:
- **Events** (Technical workshops, hackathons, and demo days)
- **Projects** (Production-grade open source projects built for students)
- **Team** (Directory of faculty coordinators, leads, web masters, and members)
- **Gallery** (Photographic record of workshops and hackathons)
- **About** (Mission, vision, history, and community principles)
- **Contact** (Official contact channels for collaborations and administration)

Secondary & Account Destinations:
- **Account** (Student profile and registration tickets)
- **Dashboard** (Internal coordinator administration)

## 3. Roles & Hierarchy

- **Faculty Coordinators**: Official university faculty sponsors (listed first).
- **President & Vice President**: Executive student leadership.
- **Secretary & Joint Secretary**: Administrative operations and scheduling.
- **Treasurer & Co-Treasurer**: Budgeting and logistics.
- **Web Masters**: Technical stewards of public repositories and website.
- **Club Organisers**: Event and logistics execution.
- **Members**: All enrolled Kishkinda University students with active club membership.

## 4. Status Labels & Tooltips

Status labels must use color, text, and an accompanying icon (never color alone):

| Status | Badge Token | Meaning | One-Line Tooltip |
| :--- | :--- | :--- | :--- |
| **Open** | `cc-badge--success` | Registration is actively accepting student sign-ups. | Registration is active and seats are available. |
| **Closing soon** | `cc-badge--warning` | Less than 24 hours remain before deadline. | Registration closes in less than 24 hours. |
| **Full** | `cc-badge--error` | All allocated capacity has been reached. | Capacity reached; no more seats remain. |
| **Closed** | `cc-badge--muted` | Registration deadline has passed. | Registration has officially closed. |
| **In progress** | `cc-badge--info` | Active project work underway. | Active software development in progress. |
| **Planned** | `cc-badge--muted` | Scheduled for an upcoming sprint. | Scope defined; development pending. |

## 5. Standard Action Verbs (Microcopy)

Buttons use verb + object in 2 to 3 words. Casing is sentence case:
- `See upcoming events` (Primary hero CTA)
- `View projects` (Secondary hero CTA)
- `Register for event` (EventDetail / Register CTA)
- `Send message` (Contact form submission)
- `Save changes` (Profile edit submission)
- `Sign in to register` (Authentication gate)
- `Create student account` (Student registration)
- `Delete event` (Destructive admin action with confirm dialog)

Disallowed alone: "Submit", "OK", "Click here", "Continue".

## 6. Formatting Conventions

- **Dates**: `Wed, 21 Oct, 3:00 PM IST` (always with `<time dateTime="...">` attribute).
- **Seat Counts**: `12 seats left` (singular: `1 seat left`).
- **Numbers & Data**: All dates, numbers, USNs, and codes in **JetBrains Mono**.
- **Headings & Body**: **Raleway** in sentence case. UPPERCASE is strictly reserved for mono eyebrow labels with 0.08em tracking.
