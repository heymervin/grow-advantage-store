# Luma MVP - Product Requirements Document

## Executive Summary

**Product Name:** Luma
**Tagline:** The Client Delivery Operating System
**Mission:** Make invisible delivery work visible - the client portal your clients will actually use

**Target Users:**
- **Primary:** Service providers (OBMs, agencies, fractional COOs, senior VAs)
- **Secondary:** Their clients (small business owners, executives)

---

## Problem Statement

Service providers complete high-value client work that is fragmented across CRMs, project management tools, email and messaging platforms. This creates three critical problems:

1. **Invisible Work:** Clients cannot see what has been delivered
2. **Scope Creep:** Boundaries blur, capacity becomes difficult to defend
3. **Value Articulation:** Providers struggle to demonstrate measurable impact

**Why Existing Solutions Fail:**
- ClickUp/Asana: Too overwhelming for clients (47 view types, complex task hierarchies)
- Basecamp: Too noisy (every update creates notification overload)
- Moxie: Outdated, limited scalability, not client-focused
- Current approach: Manual status reports via email/Loom (time-consuming, inconsistent)

**Client Adoption Problem:** When service providers give clients access to existing project tools, clients abandon them within 1-2 weeks because they're built for operators, not executives.

---

## Solution: Two-Sided Platform

### For Service Providers (Backend - Power User)
- Track all client deliverables across projects
- Monitor scope allocation and capacity usage
- Generate automated performance summaries
- Manage client requests and approvals

### For Clients (Frontend - Simple User)
- See "what you did this week" in 30 seconds
- Review completed deliverables (not tasks)
- Approve/request changes with one click
- Track retainer usage and upcoming milestones

### Translation Layer
Automatically converts complex operational work into client-friendly summaries:
- 47 tracked tasks → "Q1 Marketing: 80% complete"
- 12 hours logged → "Used 60% of your retainer"
- 8 deliverables → "4 completed, 3 in review, 1 pending"

---

## Core Design Principles

### 1. Client Simplicity (Non-Negotiable)
- **Read-only by default** - Clients review, they don't manage
- **Digest view** - Weekly summaries, not task lists
- **Action-only interactions** - Approve, request change, schedule call
- **Mobile-first** - Clients check on phones, not desktops
- **Zero onboarding** - If it needs a tutorial, it's too complex

### 2. Provider Efficiency
- **Quick entry** - Log deliverables in <30 seconds
- **Bulk operations** - Weekly recap in one flow
- **Template-driven** - Reusable delivery formats
- **Integration-ready** - Connect to existing tools (future)

### 3. Visual Hierarchy
```
Executive Summary (Client sees this)
└─ High-level metrics
   ├─ Deliverables completed this period
   ├─ Retainer/scope usage
   ├─ Pending approvals
   └─ Next milestones

Operational Detail (Provider sees this)
└─ Granular tracking
   ├─ Individual deliverables
   ├─ Time/scope allocation
   ├─ Client requests
   └─ Performance data
```

---

## MVP Feature Set

### Phase 1: Core Delivery Tracking (Weeks 1-4)

#### 1.1 Service Provider Dashboard
- [ ] Create new client workspace
- [ ] Log completed deliverables
  - Title
  - Description (rich text)
  - Category/project tag
  - Date completed
  - Time spent (optional)
  - Attachments/links
- [ ] Mark deliverables as "Pending Client Review" or "Approved"
- [ ] View all deliverables by client (list/calendar view)

#### 1.2 Client Portal (Simple View)
- [ ] Weekly digest email
  - "Here's what we delivered this week"
  - Top 3-5 deliverables with one-line descriptions
  - Retainer usage summary
  - One-click "View Full Report" link
- [ ] Client dashboard (web)
  - Current period summary card
  - Deliverables by category (collapsed by default)
  - Retainer usage progress bar
  - "Request Something" button
- [ ] Single deliverable view
  - Title, description, date
  - Attachments/links
  - "Approve" or "Request Change" buttons

#### 1.3 Scope & Capacity Tracking
- [ ] Define client retainer
  - Hours per month/quarter
  - Scope categories (e.g., "Content: 40%", "Strategy: 30%")
- [ ] Auto-calculate usage
  - Hours logged vs. retainer limit
  - Visual indicator (green/yellow/red)
- [ ] Scope alerts
  - Notify provider at 80% capacity
  - Suggest scope conversation at 90%

### Phase 2: Approvals & Requests (Weeks 5-6)

#### 2.1 Client Approval Flow
- [ ] Provider marks deliverable "Needs Approval"
- [ ] Client receives notification (email + in-app)
- [ ] Client can:
  - Approve (one click)
  - Request changes (simple form: "What needs to change?")
  - Add comment
- [ ] Status updates in provider dashboard

#### 2.2 Client Request System
- [ ] Client submits request via form
  - What do you need?
  - Priority (optional)
  - Due date (optional)
- [ ] Provider sees requests in queue
- [ ] Provider can:
  - Accept (adds to deliverables)
  - Decline (with reason)
  - Clarify (ask follow-up questions)
- [ ] Track request → deliverable lifecycle

### Phase 3: Reporting & Insights (Weeks 7-8)

#### 3.1 Performance Summaries
- [ ] Auto-generate monthly report
  - Total deliverables completed
  - Scope usage by category
  - Response times (approval turnaround)
  - Value delivered (estimated hours × rate)
- [ ] Export as PDF (for provider to share)

#### 3.2 Client-Facing Metrics
- [ ] "Your Impact This Quarter" card
  - X deliverables completed
  - Y hours of expert work
  - Z% retainer utilized
- [ ] Simple charts (mobile-friendly)
  - Deliverables over time (bar chart)
  - Scope allocation (pie chart)

---

## User Stories

### Service Provider Stories

**As a service provider, I want to:**
- Log what I've delivered this week in under 2 minutes
- Automatically show my client what they're paying for
- Protect my scope by seeing capacity in real-time
- Stop writing manual status reports every week
- Have proof of value when renewal conversations happen

### Client Stories

**As a client, I want to:**
- See what my provider did this week in 30 seconds
- Know if we're on track without reading 47 tasks
- Approve deliverables with one click from my phone
- Request something without sending an email
- Feel confident I'm getting value for my retainer

---

## Technical Requirements

### MVP Tech Stack (Suggested)

**Frontend:**
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React Hook Form (for forms)

**Backend:**
- Next.js API Routes (or separate Node.js backend)
- PostgreSQL (database)
- Prisma (ORM)
- NextAuth.js (authentication)

**Infrastructure:**
- Vercel (hosting)
- Supabase or Railway (database)
- Resend or SendGrid (transactional email)
- Cloudflare R2 or S3 (file storage)

**Key Integrations (Future):**
- Stripe (payments)
- Zapier/Make (workflow automation)
- Slack (notifications)

### Database Schema (Core Tables)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  role          String   // "provider" or "client"
  workspaces    Workspace[]
}

model Workspace {
  id            String   @id @default(cuid())
  name          String   // Client business name
  providerId    String
  clientIds     String[] // Multiple client users
  retainer      Retainer?
  deliverables  Deliverable[]
  requests      Request[]
}

model Retainer {
  id            String   @id @default(cuid())
  workspaceId   String   @unique
  hoursPerMonth Int
  scopeCategories Json   // { "Content": 40, "Strategy": 30, "Admin": 30 }
  startDate     DateTime
  renewalDate   DateTime
}

model Deliverable {
  id            String   @id @default(cuid())
  workspaceId   String
  title         String
  description   String   @db.Text
  category      String
  status        String   // "draft", "pending_approval", "approved"
  hoursSpent    Float?
  completedDate DateTime
  attachments   Json?    // Array of file URLs
  createdBy     String   // Provider user ID
  approvedBy    String?  // Client user ID
  approvedAt    DateTime?
}

model Request {
  id            String   @id @default(cuid())
  workspaceId   String
  description   String   @db.Text
  priority      String?  // "low", "medium", "high"
  status        String   // "pending", "accepted", "declined", "completed"
  requestedBy   String   // Client user ID
  requestedAt   DateTime
  respondedAt   DateTime?
  deliverableId String?  // If converted to deliverable
}
```

### API Endpoints (REST)

```
# Authentication
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me

# Workspaces
GET    /api/workspaces
POST   /api/workspaces
GET    /api/workspaces/:id
PUT    /api/workspaces/:id
DELETE /api/workspaces/:id

# Deliverables
GET    /api/workspaces/:id/deliverables
POST   /api/workspaces/:id/deliverables
GET    /api/deliverables/:id
PUT    /api/deliverables/:id
DELETE /api/deliverables/:id
POST   /api/deliverables/:id/approve
POST   /api/deliverables/:id/request-change

# Requests
GET    /api/workspaces/:id/requests
POST   /api/workspaces/:id/requests
PUT    /api/requests/:id
POST   /api/requests/:id/accept
POST   /api/requests/:id/decline

# Reports
GET    /api/workspaces/:id/reports/monthly
GET    /api/workspaces/:id/reports/scope-usage
```

---

## UI/UX Specifications

### Client Dashboard (Mobile-First)

```
┌─────────────────────────────┐
│  Luma                    ☰  │
├─────────────────────────────┤
│  This Week                  │
│  ┌────────────────────────┐ │
│  │ 8 Deliverables ✅      │ │
│  │ 12 hours logged        │ │
│  │ 60% of retainer used   │ │
│  │ ████████░░ 24/40 hrs   │ │
│  └────────────────────────┘ │
│                             │
│  Completed This Week        │
│  ┌────────────────────────┐ │
│  │ ▼ Content Marketing    │ │
│  │   • Blog post: AI...   │ │
│  │   • Social posts: 5x   │ │
│  └────────────────────────┘ │
│  ┌────────────────────────┐ │
│  │ ▼ Email Campaigns      │ │
│  │   • Newsletter v2      │ │
│  │   • Welcome series     │ │
│  └────────────────────────┘ │
│                             │
│  Needs Your Approval (2)    │
│  ┌────────────────────────┐ │
│  │ Q2 Strategy Deck       │ │
│  │ [Approve] [Changes]    │ │
│  └────────────────────────┘ │
│                             │
│  [+ Request Something]      │
└─────────────────────────────┘
```

### Provider Dashboard (Desktop)

```
┌──────────────────────────────────────────────────────────┐
│  Luma          Workspaces ▼    Acme Corp         [+ Add]  │
├──────────────────────────────────────────────────────────┤
│  Overview  │  Deliverables  │  Requests  │  Scope  │ ⚙️  │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Retainer Status                   Quick Actions          │
│  ┌────────────────────────┐       ┌──────────────────┐  │
│  │ 24/40 hours (60%)      │       │ [Log Deliverable]│  │
│  │ ████████░░░░░░         │       │ [Weekly Recap]   │  │
│  │                        │       │ [Send Report]    │  │
│  │ Scope Breakdown:       │       └──────────────────┘  │
│  │ • Content: 14h (58%)   │                              │
│  │ • Strategy: 8h (67%)   │                              │
│  │ • Admin: 2h (33%)      │                              │
│  └────────────────────────┘                              │
│                                                            │
│  Recent Deliverables              Pending Approvals (2)   │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Feb 10 │ Blog: AI Trends    │ Content │ ✅ Approved │ │
│  │ Feb 10 │ Newsletter v2      │ Email   │ ⏱ Pending  │ │
│  │ Feb 9  │ Social posts (5x)  │ Content │ ✅ Approved │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                            │
│  Client Requests (1)                                       │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ "Need help with LinkedIn strategy for Q2"           │ │
│  │ Requested: Feb 11  │  [Accept] [Decline] [Clarify] │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## MVP Scope Boundaries

### ✅ In Scope (MVP)
- Manual deliverable logging (provider)
- Simple client portal (web + mobile)
- Basic scope/retainer tracking
- Approval workflow
- Client request system
- Weekly email digest
- Monthly performance report (auto-generated)
- Single-tenant workspaces (1 provider, multiple clients per workspace)

### ❌ Out of Scope (Post-MVP)
- Time tracking integration (Toggl, Harvest)
- Project management integration (ClickUp, Asana)
- Calendar/scheduling
- Invoicing/payments
- Multi-provider workspaces
- White-label/custom branding
- Mobile apps (iOS/Android)
- AI-generated summaries
- Advanced analytics/dashboards
- Custom fields/workflows
- SSO/enterprise features

---

## Success Metrics

### Product Metrics (Track in MVP)
- **Client adoption rate:** % of invited clients who log in within 7 days
- **Client engagement:** % of clients who check dashboard weekly
- **Provider time saved:** Hours/week not spent on manual reporting
- **Approval velocity:** Average time from "pending" to "approved"

### Business Metrics (Post-Launch)
- **Retention impact:** Client retention rate before/after Luma
- **Scope protection:** % reduction in scope creep incidents
- **Revenue per client:** Average retainer value before/after
- **Provider NPS:** Net Promoter Score from service providers

### Target Benchmarks (90 Days)
- 80% client adoption rate (vs. <20% for ClickUp/Asana)
- 60% weekly active clients
- 5 hours/week saved per provider
- 48-hour average approval time

---

## MVP Development Timeline

### Week 1-2: Foundation
- Project setup (Next.js, database, auth)
- Database schema + migrations
- Authentication (provider + client login)
- Basic workspace creation

### Week 3-4: Core Features
- Deliverable CRUD (provider)
- Client dashboard (simple view)
- Retainer/scope tracking
- File upload (attachments)

### Week 5-6: Workflows
- Approval system
- Client request system
- Email notifications (weekly digest)
- Status updates

### Week 7-8: Polish & Testing
- Monthly report generation
- Mobile responsive design
- User testing (5 providers + their clients)
- Bug fixes + UX refinements

### Week 9-10: Launch Prep
- Onboarding flow
- Documentation
- Landing page
- Beta launch to 10 providers

---

## User Onboarding Flow

### Provider Onboarding (5 minutes)
1. Sign up (email/password)
2. Create first workspace
   - Client business name
   - Retainer details (hours, scope breakdown)
3. Invite client (email)
4. Log first deliverable (guided)
5. Preview client view

### Client Onboarding (30 seconds)
1. Receive email invite
2. Click "View Your Dashboard"
3. Set password (optional - magic link works too)
4. See dashboard (pre-populated if provider logged deliverables)

---

## Design System

### Colors
- **Primary:** `#2563eb` (Blue - trust, professionalism)
- **Success:** `#10b981` (Green - approved, on track)
- **Warning:** `#f59e0b` (Amber - approaching capacity)
- **Error:** `#ef4444` (Red - over capacity, urgent)
- **Neutral:** `#64748b` (Slate - text, borders)

### Typography
- **Headings:** Inter (clean, modern)
- **Body:** Inter
- **Monospace:** JetBrains Mono (for metrics)

### Component Library
Use shadcn/ui for:
- Buttons, forms, inputs
- Cards, dialogs, dropdowns
- Tables, tabs, tooltips
- Progress bars, badges

### Spacing
- 4px base unit (0.25rem)
- Component padding: 16px (1rem)
- Section spacing: 24px (1.5rem)
- Page margins: 32px (2rem)

---

## Email Templates

### Weekly Digest (Client)
```
Subject: Your weekly update from [Provider Name]

Hi [Client Name],

Here's what we delivered this week:

✅ Content Marketing (3 deliverables)
   • Blog post: "AI Trends for 2026" - published 2/10
   • Social posts: 5 LinkedIn updates
   • Newsletter: v2 draft (needs your approval)

✅ Email Campaigns (2 deliverables)
   • Welcome series: 3 emails written
   • Re-engagement campaign: scheduled

Your retainer: 24/40 hours used (60%) ✓

[View Full Dashboard →]

Need something? [Submit a Request →]

- [Provider Name]
```

### Approval Request (Client)
```
Subject: Please review: [Deliverable Title]

Hi [Client Name],

We've completed [Deliverable Title] and it's ready for your review.

[View & Approve →]

If you have any changes, just click "Request Changes" and let us know what to adjust.

- [Provider Name]
```

---

## Security & Compliance

### Authentication
- Password hashing (bcrypt)
- Session management (JWT or session cookies)
- Magic link login (optional, passwordless)
- 2FA (post-MVP)

### Data Protection
- HTTPS only
- Input validation + sanitization
- SQL injection prevention (Prisma)
- XSS protection
- File upload restrictions (type, size)

### Privacy
- GDPR-compliant (data export, deletion)
- User consent for emails
- Audit logs (who changed what)

---

## Go-to-Market Strategy (Post-MVP)

### Target Customer Profile
- **Industry:** Marketing agencies, operations agencies, fractional executives
- **Size:** 1-10 person service businesses
- **Revenue:** $200k-$2M annual
- **Pain:** Manual status reporting, scope creep, client churn

### Pricing (Hypothesis)
- **Solo:** $49/month (1 provider, 5 clients)
- **Team:** $99/month (3 providers, 15 clients)
- **Agency:** $199/month (10 providers, unlimited clients)

### Launch Channels
1. Product Hunt
2. LinkedIn (provider networks)
3. OBM/agency Facebook groups
4. Content marketing (scope creep, client retention)
5. Partnership with coaching programs

---

## Open Questions (To Validate)

1. **Should clients be able to add deliverables?**
   - Pro: Collaborative
   - Con: Complexity, defeats "simple" principle
   - Decision: No for MVP, request system instead

2. **How to handle multiple providers per client?**
   - Scenario: Agency with account manager + strategist + designer
   - MVP: Single provider view, team features post-MVP

3. **What if provider uses ClickUp already?**
   - Future: API integration to auto-sync deliverables
   - MVP: Manual entry (with templates for speed)

4. **Should we track time or just deliverables?**
   - MVP: Optional time field, not required
   - Focus on outcomes (deliverables), not inputs (hours)

---

## MVP Definition of Done

The MVP is complete when:

✅ A service provider can:
- Create a workspace for a client
- Log 5 deliverables in under 5 minutes
- See retainer usage in real-time
- Send a client their dashboard link

✅ A client can:
- Log in and see their dashboard in <30 seconds
- Understand what was delivered this week without questions
- Approve a deliverable with one click
- Submit a request via simple form

✅ System can:
- Send weekly digest emails automatically
- Generate a monthly performance report (PDF)
- Alert provider at 80% capacity
- Handle 10 concurrent users without issues

✅ Quality bars:
- Mobile-responsive (tested on iPhone/Android)
- 90+ Lighthouse score (performance)
- No critical bugs
- 5 beta users successfully onboarded

---

## Next Steps for Claude Code

1. **Set up project structure**
   - Initialize Next.js 14 + TypeScript
   - Configure Tailwind + shadcn/ui
   - Set up database (Supabase or Railway)

2. **Build authentication**
   - NextAuth.js setup
   - Provider/client role management
   - Magic link email

3. **Core data models**
   - Prisma schema (see above)
   - Migrations
   - Seed data for testing

4. **Provider features first**
   - Workspace creation
   - Deliverable logging
   - Dashboard

5. **Then client features**
   - Simple dashboard
   - Approval flow
   - Request system

6. **Polish**
   - Email templates
   - Mobile responsiveness
   - Performance optimization

---

## Support Materials Needed

- [ ] Landing page copy
- [ ] Demo video (Loom)
- [ ] User documentation
- [ ] Provider onboarding checklist
- [ ] Beta tester recruitment email
- [ ] Feedback survey
- [ ] MVP Ventures application (see separate doc)

---

**Document Version:** 1.0
**Last Updated:** February 12, 2026
**Owner:** Luma Team
**Next Review:** After MVP completion
