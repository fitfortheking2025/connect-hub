# Connect Hub

An internal church ministry operations platform built to streamline Sunday service guest intake, member care, discipleship tracking, and administrative ledgers. It features an **offline-capable visitor intake module** designed specifically to help on-site teams register first-time guests reliably during crowded Sunday services with unstable network connections.

---

## Key Features

- **Offline-Capable Guest Intake:** Local caching and background queueing so ushers and greeters can log first-time guests (VIPs) and visitors during services without network interruptions, automatically syncing once connection is restored.
- **Member Roster & Discipleship Tracking:** Centralized directory tracking member statuses, pastoral follow-ups, and milestone progress across the church discipleship pipeline.
- **Sunday Service Intake Management:** Multi-service attendee tracking with automated weekend date-window grouping for clean reporting.
- **Role-Based Access Control (RBAC):** Scoped permissions safeguarding pastoral confidentiality across Pastoral, Volunteer Leader, and Finance roles.
- **Ministry Contributions & Disbursements:** Contribution cycle tracking with forward projections, expense recording with transaction dates, and baseline reserve fund auditing.
- **Reporting & Outreach Dispatch:** Formatted SMS dispatch workflows, clipboard summary export cards, and tabular reports for leadership reviews.

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Server Actions)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database & ODM:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication:** [NextAuth.js / Auth.js](https://authjs.dev/)
- **Caching & Rate Limiting:** [Upstash Redis](https://upstash.com/)
- **Media Storage:** [Cloudinary](https://cloudinary.com/)
- **Utilities:** `html-to-image` (card generation), IndexedDB / Service Workers (offline intake sync)

---

## Getting Started

### 1. Prerequisites

Ensure you have installed:
- [Node.js](https://nodejs.org/) (v18.17 or higher recommended)
- A running MongoDB instance or MongoDB Atlas connection URI

### 2. Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=your_auth_secret_key

UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

NODE_ENV=development