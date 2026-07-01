// ResumeVault corpus. Real, hand-written ATS content per industry.
// This file powers: programmatic /resume/[industry] pages, the free bullet picker,
// and the paid downloadable kit (bullet library, cover-letter pack, keyword list).

export type Seniority = "entry" | "mid" | "senior";

export interface Bullet {
  text: string;
  category: string; // e.g. "Impact", "Leadership", "Efficiency"
  seniority: Seniority;
}

export interface Industry {
  slug: string;
  name: string; // e.g. "Registered Nurse"
  searchName: string; // how people search, e.g. "nursing"
  hero: string;
  atsSummary: string; // a ready-to-paste professional summary template
  roles: string[];
  atsKeywords: string[];
  coverLetterLines: string[];
  bullets: Bullet[];
}

export const industries: Industry[] = [
  {
    slug: "nursing",
    name: "Nursing",
    searchName: "nursing",
    hero: "ATS-safe resume kit for registered nurses, LPNs, and new-grad RNs.",
    atsSummary:
      "Compassionate and detail-oriented Registered Nurse with [X] years of experience delivering patient-centered care in [setting]. Skilled in [specialty], medication administration, and interdisciplinary collaboration. Committed to safety, evidence-based practice, and positive patient outcomes.",
    roles: ["Registered Nurse (RN)", "Licensed Practical Nurse (LPN)", "New-Grad RN", "Charge Nurse", "ICU / ER Nurse"],
    atsKeywords: [
      "patient care", "medication administration", "EMR / EHR (Epic, Cerner)", "vital signs",
      "IV therapy", "wound care", "care plans", "HIPAA compliance", "BLS / ACLS", "triage",
      "patient assessment", "discharge planning", "infection control", "interdisciplinary care",
      "charting", "telemetry", "phlebotomy", "patient education"
    ],
    coverLetterLines: [
      "I am writing to express my strong interest in the [Role] position at [Facility], where I can bring my clinical skills and patient-first mindset to your care team.",
      "Across [X] years in [specialty], I have consistently maintained high patient-satisfaction scores while managing full patient loads in fast-paced environments.",
      "My background in [EMR system] charting and evidence-based protocols means I can contribute safely from my first shift.",
      "What draws me to [Facility] is your reputation for [value], which mirrors the standard of care I hold myself to every day.",
      "I would welcome the opportunity to discuss how my clinical experience and calm-under-pressure approach can support your unit."
    ],
    bullets: [
      { text: "Delivered direct patient care for a caseload of 5-6 acute patients per shift while maintaining a 98% patient-satisfaction rating.", category: "Impact", seniority: "mid" },
      { text: "Administered medications and IV therapy for up to 30 patients per shift with a zero medication-error record over 18 months.", category: "Impact", seniority: "mid" },
      { text: "Documented assessments, interventions, and outcomes in Epic EHR, improving chart-completion timeliness by 22%.", category: "Efficiency", seniority: "mid" },
      { text: "Educated patients and families on discharge instructions and self-care, reducing 30-day readmissions on the unit by 15%.", category: "Impact", seniority: "mid" },
      { text: "Triaged incoming ER patients using ESI protocols, prioritizing critical cases and cutting average door-to-provider time.", category: "Efficiency", seniority: "senior" },
      { text: "Precepted and onboarded 8 new-graduate nurses, developing orientation checklists still in use by the department.", category: "Leadership", seniority: "senior" },
      { text: "Led rapid-response interventions on a telemetry floor, stabilizing patients and coordinating ICU transfers.", category: "Leadership", seniority: "senior" },
      { text: "Maintained strict HIPAA compliance and infection-control standards, contributing to a unit HAI rate below hospital average.", category: "Compliance", seniority: "mid" },
      { text: "Collaborated with physicians, pharmacists, and case managers in daily interdisciplinary rounds to update care plans.", category: "Collaboration", seniority: "mid" },
      { text: "Completed clinical rotations across med-surg, pediatrics, and labor & delivery totaling 700+ supervised hours.", category: "Foundation", seniority: "entry" },
      { text: "Assisted RNs with vital signs, patient hygiene, and mobility for 12+ patients per shift during preceptorship.", category: "Foundation", seniority: "entry" },
      { text: "Earned BLS and ACLS certifications and applied them during two successful in-unit code responses.", category: "Foundation", seniority: "entry" },
      { text: "Performed wound assessments and dressing changes per protocol, documenting healing progression accurately.", category: "Clinical", seniority: "mid" },
      { text: "Managed telemetry monitoring for 20+ patients, identifying arrhythmias and escalating per standing orders.", category: "Clinical", seniority: "mid" },
      { text: "Championed a hand-off communication (SBAR) initiative that reduced shift-change errors reported by staff.", category: "Leadership", seniority: "senior" },
      { text: "Trained on Cerner and Epic EHR systems and served as super-user resource for floor colleagues.", category: "Skills", seniority: "mid" }
    ]
  },
  {
    slug: "software-engineering",
    name: "Software Engineering",
    searchName: "software engineer",
    hero: "ATS-safe resume kit for software engineers, from new grads to senior ICs.",
    atsSummary:
      "Software Engineer with [X] years building and shipping [web/backend/mobile] applications used by [scale] users. Strong in [languages] and [frameworks], with a track record of improving performance, reliability, and developer velocity. Focused on clean code, testing, and measurable business impact.",
    roles: ["Frontend Engineer", "Backend Engineer", "Full-Stack Engineer", "New-Grad SWE", "Senior / Staff Engineer"],
    atsKeywords: [
      "JavaScript", "TypeScript", "Python", "React", "Node.js", "REST APIs", "GraphQL",
      "SQL / PostgreSQL", "AWS", "Docker", "Kubernetes", "CI/CD", "unit testing", "Git",
      "microservices", "system design", "Agile / Scrum", "code review", "performance optimization"
    ],
    coverLetterLines: [
      "I am excited to apply for the [Role] position at [Company] — your work on [product] is exactly the kind of high-impact engineering I want to contribute to.",
      "Over [X] years I have shipped production features serving [scale] users, owning work from design doc to deployment and on-call.",
      "I care about the parts of engineering that do not show up in demos: tests, observability, and code others can maintain.",
      "Your emphasis on [value — e.g. developer experience] resonates with how I approach my own work.",
      "I would love to walk you through a recent project where I [specific win] and discuss how I can help your team ship faster."
    ],
    bullets: [
      { text: "Built and shipped a React/TypeScript feature that increased checkout conversion by 12%, adding an estimated $400K in annual revenue.", category: "Impact", seniority: "mid" },
      { text: "Reduced API p95 latency from 850ms to 180ms by adding caching and rewriting N+1 database queries.", category: "Performance", seniority: "mid" },
      { text: "Designed and led a service migration to microservices, cutting deploy times from 40 minutes to under 5.", category: "System Design", seniority: "senior" },
      { text: "Authored the RFC and drove consensus for a new API gateway adopted across 6 engineering teams.", category: "Leadership", seniority: "senior" },
      { text: "Increased test coverage from 34% to 82%, reducing production incidents by roughly 40% quarter over quarter.", category: "Quality", seniority: "mid" },
      { text: "Mentored 3 junior engineers through onboarding and code review, with all reaching independent delivery within a quarter.", category: "Leadership", seniority: "senior" },
      { text: "Implemented CI/CD pipelines with GitHub Actions and Docker, enabling multiple safe deploys per day.", category: "Infrastructure", seniority: "mid" },
      { text: "Built a real-time notifications service in Node.js handling 2M+ events per day with 99.95% uptime.", category: "Impact", seniority: "senior" },
      { text: "Contributed to an open-source library and shipped a class project to production during a coding bootcamp.", category: "Foundation", seniority: "entry" },
      { text: "Developed a full-stack CRUD app with React, Express, and PostgreSQL as a capstone, deployed on AWS.", category: "Foundation", seniority: "entry" },
      { text: "Fixed 40+ bugs and closed a backlog of accessibility issues during a six-month internship.", category: "Foundation", seniority: "entry" },
      { text: "Refactored a legacy monolith module, removing 8K lines of dead code and improving build time by 25%.", category: "Quality", seniority: "mid" },
      { text: "Collaborated with product and design in Agile sprints, breaking down epics into shippable, well-scoped tickets.", category: "Collaboration", seniority: "mid" },
      { text: "Instrumented services with structured logging and dashboards, cutting mean time to resolution for incidents in half.", category: "Reliability", seniority: "senior" },
      { text: "Optimized a React bundle with code-splitting and lazy loading, dropping initial load size by 45%.", category: "Performance", seniority: "mid" },
      { text: "Owned the on-call rotation for a critical payments service, resolving Sev-1 incidents within SLA.", category: "Reliability", seniority: "senior" }
    ]
  },
  {
    slug: "sales",
    name: "Sales",
    searchName: "sales",
    hero: "ATS-safe resume kit for SDRs, account executives, and sales managers.",
    atsSummary:
      "Results-driven Sales professional with [X] years exceeding quota in [industry]. Skilled in full-cycle selling, pipeline management, and consultative discovery. Consistently ranked in the top [X]% of the team by revenue closed and known for building durable client relationships.",
    roles: ["Sales Development Rep (SDR)", "Account Executive (AE)", "Account Manager", "Sales Manager", "Inside Sales Rep"],
    atsKeywords: [
      "quota attainment", "pipeline management", "prospecting", "cold calling", "lead generation",
      "CRM (Salesforce, HubSpot)", "consultative selling", "closing", "upselling", "negotiation",
      "account management", "sales forecasting", "SaaS", "B2B", "discovery calls", "renewals"
    ],
    coverLetterLines: [
      "I am applying for the [Role] position at [Company] because your product solves a problem I have sold against and believe in.",
      "Over [X] years I have consistently exceeded quota — most recently closing [X]% of annual target with an average deal size of [$].",
      "I win by listening first: strong discovery and honest qualification let me build pipeline that actually converts.",
      "I am drawn to [Company]'s [value] and would love to bring that energy to your revenue team.",
      "I would welcome a conversation about how I can help you hit and beat your numbers next quarter."
    ],
    bullets: [
      { text: "Exceeded annual quota at 128% of target, closing $1.4M in new business across 42 accounts.", category: "Impact", seniority: "mid" },
      { text: "Built a pipeline of 90+ qualified opportunities per quarter through targeted outbound prospecting.", category: "Pipeline", seniority: "mid" },
      { text: "Booked 25+ qualified meetings per month as an SDR, ranking #1 on a team of 12 for three straight quarters.", category: "Impact", seniority: "entry" },
      { text: "Ran full-cycle deals from discovery to close, shortening average sales cycle from 71 to 52 days.", category: "Efficiency", seniority: "mid" },
      { text: "Grew a book of business by 34% year over year through upsells and multi-year renewals.", category: "Growth", seniority: "senior" },
      { text: "Led a team of 6 AEs to 112% of regional target, coaching reps on discovery and objection handling.", category: "Leadership", seniority: "senior" },
      { text: "Increased close rate from 18% to 27% by implementing a structured qualification framework (MEDDIC).", category: "Process", seniority: "senior" },
      { text: "Maintained clean Salesforce hygiene with accurate forecasting within 5% of actuals each quarter.", category: "Process", seniority: "mid" },
      { text: "Generated 40% of team pipeline through cold outreach across email, phone, and LinkedIn.", category: "Pipeline", seniority: "entry" },
      { text: "Sourced and qualified inbound leads, converting 30% to sales-accepted opportunities.", category: "Foundation", seniority: "entry" },
      { text: "Negotiated enterprise contracts up to $250K ACV, partnering with legal and procurement to close on time.", category: "Impact", seniority: "senior" },
      { text: "Ran product demos tailored to each buyer's use case, lifting demo-to-close rate by 9 points.", category: "Process", seniority: "mid" },
      { text: "Recovered $180K in at-risk renewals by proactively addressing churn signals with executive stakeholders.", category: "Retention", seniority: "senior" },
      { text: "Onboarded and ramped 4 new SDRs, cutting time-to-first-meeting from 6 weeks to 3.", category: "Leadership", seniority: "senior" },
      { text: "Consistently hit 100+ dials and 50+ personalized emails per day while maintaining reply rates above team average.", category: "Activity", seniority: "entry" },
      { text: "Partnered with marketing to refine ICP messaging, improving MQL-to-SQL conversion by 15%.", category: "Collaboration", seniority: "mid" }
    ]
  },
  {
    slug: "teaching",
    name: "Teaching",
    searchName: "teacher",
    hero: "ATS-safe resume kit for K-12 teachers, substitutes, and new educators.",
    atsSummary:
      "Dedicated and student-centered Teacher with [X] years of experience in [grade/subject]. Skilled in differentiated instruction, classroom management, and data-driven assessment. Passionate about creating inclusive environments where every student can grow academically and socially.",
    roles: ["Elementary Teacher", "Secondary / Subject Teacher", "Substitute Teacher", "Special Education Teacher", "New Educator"],
    atsKeywords: [
      "lesson planning", "differentiated instruction", "classroom management", "curriculum development",
      "student assessment", "IEP / 504 plans", "formative assessment", "Google Classroom", "SEL",
      "parent communication", "data-driven instruction", "Common Core", "small-group instruction",
      "behavior management", "co-teaching", "student engagement"
    ],
    coverLetterLines: [
      "I am excited to apply for the [Role] position at [School] and to contribute to a community that clearly values every learner.",
      "In [X] years teaching [grade/subject], I have raised student outcomes while building classrooms where students feel safe to take risks.",
      "I design instruction around data and differentiation so that both struggling and advanced learners are challenged appropriately.",
      "Your school's commitment to [value] aligns with my belief that relationships come before rigor.",
      "I would love to share sample lesson plans and discuss how I can support your students and staff."
    ],
    bullets: [
      { text: "Designed and delivered differentiated lesson plans for 28 students across three ability levels, raising proficiency rates by 18%.", category: "Impact", seniority: "mid" },
      { text: "Improved class average reading scores by one full grade level over a school year using data-driven small-group instruction.", category: "Impact", seniority: "mid" },
      { text: "Managed a classroom of 30 students with a positive-behavior system that reduced office referrals by 40%.", category: "Classroom Management", seniority: "mid" },
      { text: "Developed and implemented IEP accommodations in collaboration with special-education staff and families.", category: "Inclusion", seniority: "mid" },
      { text: "Integrated Google Classroom and formative assessment tools to give students real-time feedback on progress.", category: "Technology", seniority: "mid" },
      { text: "Led a grade-level team in aligning curriculum to state standards, creating shared unit plans still in use.", category: "Leadership", seniority: "senior" },
      { text: "Mentored two first-year teachers on classroom management and lesson design during their induction year.", category: "Leadership", seniority: "senior" },
      { text: "Communicated weekly with parents through newsletters and conferences, boosting family engagement measurably.", category: "Communication", seniority: "mid" },
      { text: "Substituted across K-8 classrooms, maintaining lesson continuity and consistent behavior expectations.", category: "Foundation", seniority: "entry" },
      { text: "Completed 600+ hours of supervised student teaching with strong evaluations in instruction and management.", category: "Foundation", seniority: "entry" },
      { text: "Created engaging, standards-aligned unit plans during student teaching that increased participation.", category: "Foundation", seniority: "entry" },
      { text: "Facilitated social-emotional learning (SEL) routines that improved classroom climate survey scores.", category: "Inclusion", seniority: "mid" },
      { text: "Analyzed benchmark assessment data to regroup students and target interventions each quarter.", category: "Data", seniority: "mid" },
      { text: "Coached an after-school program and academic club, expanding enrichment access for 40+ students.", category: "Engagement", seniority: "mid" },
      { text: "Led professional-development sessions on formative assessment for the department.", category: "Leadership", seniority: "senior" },
      { text: "Adapted instruction for English-language learners using scaffolding and visual supports.", category: "Inclusion", seniority: "mid" }
    ]
  },
  {
    slug: "skilled-trades",
    name: "Skilled Trades",
    searchName: "electrician",
    hero: "ATS-safe resume kit for electricians, HVAC techs, plumbers, and welders.",
    atsSummary:
      "Licensed [trade] with [X] years of hands-on experience in [residential/commercial/industrial] settings. Skilled in installation, troubleshooting, and code-compliant repair. Strong safety record with OSHA certification and a reputation for finishing jobs on time and to spec.",
    roles: ["Electrician", "HVAC Technician", "Plumber", "Welder", "Apprentice / Journeyman"],
    atsKeywords: [
      "installation", "troubleshooting", "preventive maintenance", "blueprint reading", "NEC code",
      "OSHA 10 / 30", "electrical systems", "wiring", "conduit", "HVAC", "hand and power tools",
      "safety compliance", "equipment repair", "journeyman license", "schematics", "quality control"
    ],
    coverLetterLines: [
      "I am applying for the [Role] position and bring [X] years of hands-on [trade] experience across [settings].",
      "I take pride in code-compliant work, a clean job site, and finishing on schedule without callbacks.",
      "My OSHA certification and strong safety record mean I contribute to a culture where everyone goes home safe.",
      "I am reliable, punctual, and comfortable reading blueprints and troubleshooting under pressure.",
      "I would welcome the chance to discuss how my skills can support your team and your customers."
    ],
    bullets: [
      { text: "Installed and terminated wiring, panels, and conduit for 50+ residential and commercial projects to NEC code.", category: "Technical", seniority: "mid" },
      { text: "Troubleshot and repaired electrical faults, reducing customer callbacks to under 2% of completed jobs.", category: "Quality", seniority: "mid" },
      { text: "Read blueprints and schematics to lay out circuits and equipment, completing jobs on or ahead of schedule.", category: "Technical", seniority: "mid" },
      { text: "Maintained a zero lost-time-incident safety record across three years by enforcing OSHA and lockout/tagout procedures.", category: "Safety", seniority: "senior" },
      { text: "Led a crew of 4 on a commercial build-out, coordinating inspections and passing on first submission.", category: "Leadership", seniority: "senior" },
      { text: "Performed preventive maintenance on HVAC and electrical systems, extending equipment life and reducing downtime.", category: "Maintenance", seniority: "mid" },
      { text: "Trained 3 apprentices on wiring standards, tool safety, and code compliance.", category: "Leadership", seniority: "senior" },
      { text: "Completed a 4-year apprenticeship (8,000 hours) and passed the journeyman licensing exam.", category: "Foundation", seniority: "entry" },
      { text: "Assisted journeymen with rough-in, fixture installation, and material handling on active job sites.", category: "Foundation", seniority: "entry" },
      { text: "Maintained OSHA 10 certification and a clean tool inventory throughout apprenticeship.", category: "Foundation", seniority: "entry" },
      { text: "Diagnosed and replaced faulty components in industrial control systems, restoring production quickly.", category: "Technical", seniority: "senior" },
      { text: "Managed material ordering and job-site inventory, cutting waste and avoiding schedule delays.", category: "Efficiency", seniority: "mid" },
      { text: "Documented all work and inspections accurately for permits and client records.", category: "Compliance", seniority: "mid" },
      { text: "Responded to emergency service calls with fast, code-compliant repairs and clear customer communication.", category: "Service", seniority: "mid" },
      { text: "Fabricated and welded structural components to spec, passing 100% of weld inspections.", category: "Technical", seniority: "mid" },
      { text: "Coordinated with general contractors and other trades to keep multi-phase projects on timeline.", category: "Collaboration", seniority: "senior" }
    ]
  },
  {
    slug: "accounting",
    name: "Accounting",
    searchName: "accountant",
    hero: "ATS-safe resume kit for accountants, bookkeepers, and finance analysts.",
    atsSummary:
      "Detail-oriented Accountant with [X] years of experience in [general ledger/AP/AR/audit]. Skilled in month-end close, reconciliation, and financial reporting under GAAP. Known for accuracy, meeting deadlines, and identifying process improvements that save time and reduce errors.",
    roles: ["Staff Accountant", "Bookkeeper", "Accounts Payable / Receivable", "Financial Analyst", "Senior Accountant"],
    atsKeywords: [
      "general ledger", "accounts payable", "accounts receivable", "month-end close", "reconciliation",
      "GAAP", "financial reporting", "QuickBooks", "SAP", "Excel (pivot tables, VLOOKUP)", "audit",
      "budgeting", "forecasting", "journal entries", "accruals", "variance analysis", "tax preparation"
    ],
    coverLetterLines: [
      "I am applying for the [Role] position at [Company], bringing [X] years of accounting experience and a passion for clean, accurate books.",
      "I have owned month-end close and reconciliations for accounts totaling [$], consistently closing on time.",
      "I look for the process behind the numbers — automating reports and tightening controls where I can.",
      "Your team's focus on [value] fits how I work: careful, deadline-driven, and audit-ready.",
      "I would welcome a conversation about how I can support your finance function."
    ],
    bullets: [
      { text: "Owned month-end close for a $12M-revenue business unit, consistently closing within 4 business days.", category: "Impact", seniority: "mid" },
      { text: "Reconciled 30+ balance-sheet accounts monthly, resolving discrepancies and reducing prior-period adjustments.", category: "Accuracy", seniority: "mid" },
      { text: "Processed 500+ invoices per month in accounts payable with 99.8% accuracy and on-time vendor payments.", category: "Efficiency", seniority: "entry" },
      { text: "Prepared GAAP-compliant financial statements and supporting schedules for external audit with zero material findings.", category: "Compliance", seniority: "senior" },
      { text: "Built an automated Excel reconciliation template that cut monthly close time by 6 hours.", category: "Efficiency", seniority: "mid" },
      { text: "Managed AR aging and collections, reducing days-sales-outstanding from 52 to 38 days.", category: "Impact", seniority: "mid" },
      { text: "Led the annual budgeting process across 5 departments, delivering forecasts within 3% of actuals.", category: "Leadership", seniority: "senior" },
      { text: "Performed variance analysis on monthly P&L, flagging overspend and informing corrective action.", category: "Analysis", seniority: "mid" },
      { text: "Maintained the general ledger and posted journal entries and accruals in QuickBooks and SAP.", category: "Foundation", seniority: "entry" },
      { text: "Assisted with tax preparation and 1099 filings, ensuring accurate and timely submissions.", category: "Foundation", seniority: "entry" },
      { text: "Supported month-end close by preparing bank reconciliations and expense reports during an internship.", category: "Foundation", seniority: "entry" },
      { text: "Documented accounting procedures and internal controls, strengthening the audit trail.", category: "Compliance", seniority: "mid" },
      { text: "Implemented a new AP workflow with approval routing, reducing invoice processing time by 30%.", category: "Process", seniority: "senior" },
      { text: "Trained 2 junior accountants on reconciliation standards and ERP data entry.", category: "Leadership", seniority: "senior" },
      { text: "Analyzed cash flow and prepared 13-week forecasts to support treasury decisions.", category: "Analysis", seniority: "senior" },
      { text: "Partnered with operations to true-up inventory accounts, correcting a recurring valuation error.", category: "Collaboration", seniority: "mid" }
    ]
  },
  {
    slug: "project-management",
    name: "Project Management",
    searchName: "project manager",
    hero: "ATS-safe resume kit for project managers, coordinators, and program leads.",
    atsSummary:
      "Organized and outcome-focused Project Manager with [X] years leading cross-functional projects on time and on budget. Skilled in Agile and Waterfall delivery, stakeholder management, and risk mitigation. Known for turning ambiguous goals into clear plans and shipped results.",
    roles: ["Project Coordinator", "Project Manager", "Program Manager", "Scrum Master", "PMO Lead"],
    atsKeywords: [
      "project planning", "stakeholder management", "Agile", "Scrum", "Waterfall", "risk management",
      "budget management", "Jira", "Asana", "roadmap", "cross-functional", "resource allocation",
      "KPIs", "status reporting", "scope management", "change management", "PMP", "sprint planning"
    ],
    coverLetterLines: [
      "I am excited to apply for the [Role] position at [Company] and to bring order and momentum to your key initiatives.",
      "Across [X] years I have delivered [N] projects on time and within budget, coordinating engineering, design, and business stakeholders.",
      "I keep projects honest with clear scope, visible risks, and status updates people actually read.",
      "Your focus on [value] matches how I lead: outcomes over ceremony.",
      "I would welcome the chance to discuss how I can drive your roadmap forward."
    ],
    bullets: [
      { text: "Delivered a $2M cross-functional program on time and 8% under budget across 4 workstreams.", category: "Impact", seniority: "senior" },
      { text: "Managed a portfolio of 12 concurrent projects, maintaining a 95% on-time delivery rate.", category: "Impact", seniority: "senior" },
      { text: "Facilitated Agile ceremonies for two Scrum teams, improving sprint predictability from 60% to 88%.", category: "Process", seniority: "mid" },
      { text: "Built project roadmaps and Gantt charts in Jira and Asana, giving stakeholders clear visibility into timelines.", category: "Planning", seniority: "mid" },
      { text: "Identified and mitigated project risks early, preventing an estimated 3-week slip on a key launch.", category: "Risk", seniority: "mid" },
      { text: "Coordinated a website replatform across 6 teams, launching on schedule with zero critical defects.", category: "Impact", seniority: "senior" },
      { text: "Ran weekly stakeholder updates and steering reviews that kept executives aligned and unblocked decisions.", category: "Communication", seniority: "mid" },
      { text: "Coordinated meeting logistics, notes, and action items as a project coordinator, keeping teams accountable.", category: "Foundation", seniority: "entry" },
      { text: "Tracked project tasks and deadlines in Asana, flagging blockers before they impacted delivery.", category: "Foundation", seniority: "entry" },
      { text: "Supported PMs with status reports and budget tracking during a rotational program.", category: "Foundation", seniority: "entry" },
      { text: "Managed scope and change requests through a formal control process, protecting timeline and budget.", category: "Process", seniority: "senior" },
      { text: "Defined KPIs and dashboards that gave leadership real-time visibility into delivery health.", category: "Data", seniority: "senior" },
      { text: "Led a process-improvement initiative that reduced project intake time by 40%.", category: "Process", seniority: "senior" },
      { text: "Allocated resources across teams to balance workload and hit competing deadlines.", category: "Planning", seniority: "mid" },
      { text: "Earned PMP certification and applied structured methodology to standardize delivery.", category: "Skills", seniority: "mid" },
      { text: "Negotiated with vendors and internal teams to resolve dependencies and keep projects moving.", category: "Collaboration", seniority: "mid" }
    ]
  },
  {
    slug: "customer-service",
    name: "Customer Service",
    searchName: "customer service",
    hero: "ATS-safe resume kit for customer service reps, support agents, and CS leads.",
    atsSummary:
      "Empathetic and efficient Customer Service professional with [X] years resolving customer issues across [phone/chat/email]. Skilled in de-escalation, CRM tools, and turning frustrated customers into loyal ones. Consistently exceeds satisfaction and resolution targets.",
    roles: ["Customer Service Rep", "Support Agent", "Call Center Rep", "Customer Success Associate", "Support Team Lead"],
    atsKeywords: [
      "customer support", "conflict resolution", "de-escalation", "CRM (Zendesk, Salesforce)", "ticketing",
      "CSAT", "first-contact resolution", "live chat", "phone support", "order management", "troubleshooting",
      "onboarding", "SLA", "escalation", "product knowledge", "multitasking"
    ],
    coverLetterLines: [
      "I am applying for the [Role] position at [Company] and bring [X] years of turning tough customer moments into loyalty.",
      "I consistently exceed CSAT and resolution targets by listening carefully and solving problems the first time.",
      "I stay calm under pressure and know how to de-escalate without escalating cost or churn.",
      "Your reputation for [value] is exactly the standard of care I hold in every interaction.",
      "I would welcome the chance to show how I can support your customers and your team."
    ],
    bullets: [
      { text: "Resolved 60+ customer tickets per day across phone, chat, and email while maintaining a 96% CSAT score.", category: "Impact", seniority: "mid" },
      { text: "Achieved a first-contact resolution rate of 84%, well above the team target of 75%.", category: "Efficiency", seniority: "mid" },
      { text: "De-escalated high-priority complaints, retaining accounts worth an estimated $120K in annual value.", category: "Retention", seniority: "senior" },
      { text: "Reduced average handle time by 22% by building a shared library of response templates.", category: "Efficiency", seniority: "mid" },
      { text: "Managed a Zendesk queue within SLA, maintaining a backlog of under 20 tickets during peak season.", category: "Process", seniority: "mid" },
      { text: "Onboarded and trained 5 new support agents, cutting ramp time from 4 weeks to 2.", category: "Leadership", seniority: "senior" },
      { text: "Handled 50+ inbound calls per day during a high-volume internship, maintaining professionalism throughout.", category: "Foundation", seniority: "entry" },
      { text: "Logged and categorized customer issues accurately in the CRM to support product and ops teams.", category: "Foundation", seniority: "entry" },
      { text: "Answered product questions and processed orders and returns with a friendly, solution-first approach.", category: "Foundation", seniority: "entry" },
      { text: "Identified recurring issues from ticket trends and flagged them to product, reducing repeat contacts.", category: "Analysis", seniority: "mid" },
      { text: "Led a support-team initiative to improve knowledge-base articles, deflecting 15% of common tickets.", category: "Leadership", seniority: "senior" },
      { text: "Maintained a personal quality-audit score above 95% across monthly reviews.", category: "Quality", seniority: "mid" },
      { text: "Supported customers across multiple channels simultaneously without dropping response quality.", category: "Efficiency", seniority: "mid" },
      { text: "Coordinated with billing and shipping teams to resolve complex, multi-department issues.", category: "Collaboration", seniority: "mid" },
      { text: "Handled escalations as a tier-2 agent, resolving cases other reps could not close.", category: "Impact", seniority: "senior" },
      { text: "Collected customer feedback and shared insights that informed a product-experience improvement.", category: "Analysis", seniority: "mid" }
    ]
  },
  {
    slug: "marketing",
    name: "Marketing",
    searchName: "marketing",
    hero: "ATS-safe resume kit for marketers, content, and growth roles.",
    atsSummary:
      "Data-driven Marketing professional with [X] years growing brands through [content/paid/SEO/lifecycle]. Skilled in campaign strategy, analytics, and cross-channel execution. Known for turning budgets into measurable pipeline and revenue.",
    roles: ["Marketing Coordinator", "Content Marketer", "Growth Marketer", "Digital Marketing Manager", "Marketing Manager"],
    atsKeywords: [
      "content marketing", "SEO", "SEM / PPC", "Google Analytics", "email marketing", "social media",
      "campaign management", "A/B testing", "conversion rate optimization", "HubSpot", "lead generation",
      "brand strategy", "copywriting", "marketing automation", "ROI", "funnel", "attribution"
    ],
    coverLetterLines: [
      "I am excited to apply for the [Role] position at [Company] and to grow a brand I already admire.",
      "Over [X] years I have turned marketing budgets into measurable pipeline — most recently driving [metric].",
      "I combine creative instinct with a bias for testing: every campaign has a hypothesis and a number attached.",
      "Your focus on [value] matches how I work — curious, analytical, and fast to iterate.",
      "I would love to share a campaign teardown and discuss how I can grow your channels."
    ],
    bullets: [
      { text: "Grew organic traffic 140% year over year through a programmatic SEO and content strategy.", category: "Impact", seniority: "mid" },
      { text: "Managed a $500K annual paid-media budget across Google and Meta, improving blended ROAS from 2.1x to 3.4x.", category: "Impact", seniority: "senior" },
      { text: "Launched an email lifecycle program that lifted repeat-purchase rate by 19%.", category: "Impact", seniority: "mid" },
      { text: "Ran 30+ A/B tests on landing pages, increasing average conversion rate by 27%.", category: "Optimization", seniority: "mid" },
      { text: "Built and scaled a content engine publishing 12 SEO articles per month, driving 50K monthly visits.", category: "Content", seniority: "mid" },
      { text: "Led a rebrand and website relaunch that increased demo requests by 45%.", category: "Leadership", seniority: "senior" },
      { text: "Generated 800+ marketing-qualified leads per quarter through gated content and paid campaigns.", category: "Demand", seniority: "mid" },
      { text: "Scheduled and published social content across 4 channels, growing followers 60% in a year.", category: "Foundation", seniority: "entry" },
      { text: "Assisted with email campaigns and reporting during an internship, learning HubSpot and GA4.", category: "Foundation", seniority: "entry" },
      { text: "Drafted blog posts and social copy that increased engagement rate above account benchmarks.", category: "Foundation", seniority: "entry" },
      { text: "Owned marketing analytics and attribution reporting, giving leadership clear channel-level ROI.", category: "Data", seniority: "senior" },
      { text: "Managed 3 marketing contractors and a content calendar, shipping campaigns on schedule.", category: "Leadership", seniority: "senior" },
      { text: "Optimized Google Ads campaigns, cutting cost-per-lead by 33% while holding volume.", category: "Optimization", seniority: "mid" },
      { text: "Partnered with sales to align messaging and improve MQL-to-opportunity conversion by 12 points.", category: "Collaboration", seniority: "mid" },
      { text: "Developed buyer personas and positioning that sharpened campaign targeting and copy.", category: "Strategy", seniority: "senior" },
      { text: "Created a marketing dashboard in Looker that replaced hours of manual weekly reporting.", category: "Data", seniority: "mid" }
    ]
  },
  {
    slug: "data-analyst",
    name: "Data Analyst",
    searchName: "data analyst",
    hero: "ATS-safe resume kit for data analysts, BI analysts, and reporting roles.",
    atsSummary:
      "Analytical and business-minded Data Analyst with [X] years turning data into decisions. Skilled in SQL, data visualization, and statistical analysis. Known for building dashboards and insights that leaders actually use to drive outcomes.",
    roles: ["Data Analyst", "Business Intelligence Analyst", "Reporting Analyst", "Junior / Entry Analyst", "Senior Data Analyst"],
    atsKeywords: [
      "SQL", "Excel", "Tableau", "Power BI", "Python", "data visualization", "dashboards", "ETL",
      "statistical analysis", "A/B testing", "data cleaning", "reporting", "KPIs", "forecasting",
      "stakeholder communication", "data modeling", "Google Analytics", "cohort analysis"
    ],
    coverLetterLines: [
      "I am applying for the [Role] position at [Company] because I love turning messy data into clear decisions.",
      "Over [X] years I have built dashboards and analyses that shifted real business outcomes, not just reports.",
      "I write clean SQL, question the data before trusting it, and translate findings into plain language.",
      "Your data-driven culture is exactly where I do my best work.",
      "I would welcome the chance to walk through an analysis and discuss how I can support your teams."
    ],
    bullets: [
      { text: "Built self-serve Tableau dashboards adopted by 5 departments, eliminating 10+ hours of manual reporting weekly.", category: "Impact", seniority: "mid" },
      { text: "Wrote complex SQL queries across multi-table joins to surface insights that informed a pricing change worth $300K.", category: "Impact", seniority: "senior" },
      { text: "Analyzed customer cohorts and retention curves, identifying a churn driver that cut monthly churn by 8%.", category: "Insight", seniority: "senior" },
      { text: "Automated a weekly KPI report with Python, reducing prep time from 5 hours to 20 minutes.", category: "Efficiency", seniority: "mid" },
      { text: "Designed and analyzed A/B tests, providing statistically sound recommendations to product teams.", category: "Analysis", seniority: "mid" },
      { text: "Cleaned and modeled raw event data into a reliable reporting layer used across the analytics team.", category: "Data Modeling", seniority: "mid" },
      { text: "Presented findings to executives in plain language, driving three data-backed strategic decisions.", category: "Communication", seniority: "senior" },
      { text: "Completed a data analytics program and built a portfolio of SQL and Tableau projects.", category: "Foundation", seniority: "entry" },
      { text: "Cleaned and analyzed datasets in Excel and SQL during an internship, delivering a demand-trend report.", category: "Foundation", seniority: "entry" },
      { text: "Built a Power BI dashboard as a capstone project that visualized sales trends for a mock client.", category: "Foundation", seniority: "entry" },
      { text: "Partnered with marketing to build an attribution model that reallocated spend toward higher-ROI channels.", category: "Collaboration", seniority: "senior" },
      { text: "Developed data-quality checks that caught pipeline errors before they reached executive reports.", category: "Quality", seniority: "mid" },
      { text: "Created forecasting models that improved inventory planning accuracy by 15%.", category: "Impact", seniority: "senior" },
      { text: "Documented data definitions and a metrics dictionary, aligning teams on a single source of truth.", category: "Process", seniority: "mid" },
      { text: "Trained business users on self-serve dashboards, reducing ad-hoc data requests by 30%.", category: "Enablement", seniority: "mid" },
      { text: "Ran cohort and funnel analyses in Google Analytics to explain a conversion drop and recommend fixes.", category: "Insight", seniority: "mid" }
    ]
  }
];

export function getIndustry(slug: string): Industry | undefined {
  return industries.find((i) => i.slug === slug);
}

export const industrySlugs = industries.map((i) => i.slug);
