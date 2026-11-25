# TutorFinder - Project Documentation & Architecture Memory

> **TutorFinder** is a full-stack tutoring marketplace application designed for Bangladesh (Dhaka and all major divisions) connecting students/guardians with qualified home and online tutors.

---

## 1. Tech Stack & Dependencies

- **Frontend Core**: [React 19](https://react.dev/), [Vite 8](https://vitejs.dev/), [React Router v7](https://reactrouter.com/) (declarative routing with lazy-loading & code-splitting).
- **Styling & UI**: [Tailwind CSS v3](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (icon system), [Framer Motion](https://www.framer.com/motion/) (animations), [clsx](https://github.com/lukeed/clsx) + [tailwind-merge](https://github.com/dcastil/tailwind-merge).
- **State Management & Data Fetching**:
  - [Zustand v5](https://github.com/pmndrs/zustand) (`src/store/useAuthStore.js`) for global auth, profile state, real-time sync, and session handling.
  - [@tanstack/react-query v5](https://tanstack.com/query) for server-state caching and queries.
- **Backend & Database**:
  - [Supabase](https://supabase.com/) (`@supabase/supabase-js v2`): PostgreSQL database, Supabase Auth, Row Level Security (RLS), Realtime channels, Storage buckets (CVs, photos, NID, certificates).
  - Supabase Edge Functions: reCAPTCHA verification (`supabase/functions/auth-with-recaptcha`).
- **Date & Utilities**: [date-fns](https://date-fns.org/).

---

## 2. Directory Structure

```plaintext
TutorFinder/
├── public/                     # Static public assets
├── supabase/
│   └── functions/              # Supabase edge functions (e.g. auth-with-recaptcha)
├── src/
│   ├── assets/                 # Brand assets, hero images, SVGs
│   ├── components/
│   │   ├── auth/               # ProtectedRoute and role-based route guards
│   │   ├── common/             # Badges (Verified, Premium), ImageCropperModal, ReCAPTCHA, ScrollToTop, Alerts
│   │   ├── layout/             # Main Layout, DashboardLayout, MobileBottomNav, Header, Footer
│   │   └── tuition/            # TuitionJobsBoard (filters, job search & listing)
│   ├── lib/
│   │   └── supabase.js         # Supabase client instantiation
│   ├── pages/
│   │   ├── admin/              # Admin dashboard, assignment hub, user management, notices, support, reports
│   │   ├── auth/               # Login, Register, ForgotPassword, ResetPassword, AdminLogin
│   │   ├── guardian/           # Guardian dashboard, post request, edit request, profile, feedback, settings
│   │   ├── public/             # Home, FindTutors, JobBoard, TuitionDetails, PublicTutorProfile, Categories, FAQs
│   │   └── tutor/              # Tutor dashboard, profile edit/view, tuitions, verification, membership, batches, history
│   ├── store/
│   │   └── useAuthStore.js     # Global auth state, role resolution, real-time profile listeners
│   ├── App.jsx                 # Central router & route configurations
│   ├── App.css / index.css     # Global styles & Tailwind directives
│   └── main.jsx                # Application bootstrap
├── supabase_schema.sql         # Database schema snapshot
├── package.json
└── vite.config.js
```

---

## 3. User Roles & Capabilities

### 🌐 Public / Guest Users
- Browse verified tutors with filters (city, area, medium/category, subjects, gender, qualification) at `/find-tutors`.
- Browse active tuition job postings with filters (city, location, salary, class, category) at `/job-board`.
- Inspect detailed tuition requirements (`/tuition/:id`) and public tutor profiles (`/tutor/:id`).
- Explore categories, curriculum guides, and user FAQs (parent & tutor FAQs).

### 👨‍🏫 Tutors
- **Profile Management** (`/tutor/profile/update`): Comprehensive profile builder including academic degrees (School, College, Graduation, Post-grad), preferred subjects, courses, categories, teaching methods, available days, and salary expectations.
- **Document Uploads**: NID, University ID card, HSC/SSC certificates, and cropped profile picture.
- **Verification & Membership**:
  - Request profile verification (`/tutor/verification`) for "Verified Tutor" badge.
  - Upgrade membership (`/tutor/membership`, `/tutor/premium-request`) to Pro/Premium for higher job placement priority.
  - Automated trial downgrade management handled in `useAuthStore.js`.
- **Tuition Applications & Tracking**:
  - View applied tuition jobs and their status (`/tutor/tuitions`).
  - View tutoring history (`/tutor/history`), confirmation letters, and batch management (`/tutor/batches`).
  - Access support tickets, video tutorials, affiliate partner programs, and account settings.

### 🏡 Guardians / Parents
- **Post Tuition Request** (`/guardian/post-request`):
  - Multi-step job posting: student class, medium/curriculum, subjects, city & location, full address, salary type (range vs. fixed), schedule days/week, tutor gender preference, university preference, and specific requirements.
- **Job Management**:
  - Manage posted requests, edit active requests (`/guardian/edit-request/:id`), view applicants, and assign tutors.
- **Guardian Dashboard**: Track active tuitions, submit platform feedback, update profile details, and manage security settings.

### 🛡️ Admins
- **Admin Dashboard** (`/admin/dashboard`): Platform statistics, active tutors, open tuitions, revenue, and verification metrics.
- **Assignment Hub** (`/admin/requests`): Match and assign suitable tutors to guardian tuition requests.
- **User Management** (`/admin/users`): View all tutors and guardians, suspend/activate accounts, toggle verifications.
- **Platform Content & Operations**:
  - Manage categories & courses (`/admin/categories`).
  - Manage supported educational institutions (`/admin/institutions`).
  - Process membership upgrade requests (`/admin/membership`).
  - Broadcast system notices (`/admin/notices`).
  - Review guardian/tutor feedback (`/admin/feedbacks`) and reports (`/admin/reports`).
  - Resolve customer support tickets (`/admin/support`).

---

## 4. Location & Division Architecture

The platform supports all 8 administrative divisions of Bangladesh:
- **Barishal, Chattogram, Dhaka, Khulna, Mymensingh, Rajshahi, Rangpur, Sylhet**.

### All 64 Districts & Area Coverage
All 64 districts of Bangladesh (`CITIES`) and their relevant areas/upazilas/neighborhoods (`LOCATIONS_BY_CITY`, including 200+ Dhaka areas) are centralized in [locations.js](file:///d:/TutorFinder/src/data/locations.js) and shared across:
- [TutorProfileForm.jsx](file:///d:/TutorFinder/src/pages/tutor/TutorProfileForm.jsx)
- [FindTutors.jsx](file:///d:/TutorFinder/src/pages/public/FindTutors.jsx)
- [TuitionJobsBoard.jsx](file:///d:/TutorFinder/src/components/tuition/TuitionJobsBoard.jsx)
- [PostRequest.jsx](file:///d:/TutorFinder/src/pages/guardian/PostRequest.jsx)
- [EditRequest.jsx](file:///d:/TutorFinder/src/pages/guardian/EditRequest.jsx)
- [GuardianProfileForm.jsx](file:///d:/TutorFinder/src/pages/guardian/GuardianProfileForm.jsx)

---

## 5. Database Schema Overview (`supabase_schema.sql`)

| Table Name | Primary Purpose |
| :--- | :--- |
| `users` | Core user identity, role (`tutor`, `guardian`, `admin`), phone, status (`active`, `suspended`, `deactivated`, `pending_deletion`), notification settings. |
| `tutor_profiles` | Complete tutor dossier: bio, education details, preferred subjects/locations, expected salary, verification status, premium status, ratings, document URLs. |
| `guardian_profiles` | Guardian profile information, addresses, contact references. |
| `tuition_requests` | Tuition postings: student info, class, subjects, location, budget/salary, days count, preferred gender/university, hiring status (`open`, `assigned`, `closed`). |
| `job_applications` | Applications submitted by tutors for specific tuition requests. |
| `membership_requests` | Membership tier subscription requests (Free Trial, Basic, Pro, Premium) with transaction IDs and payment methods. |
| `support_tickets` & `support_messages` | In-app customer support ticketing system with threaded messaging. |
| `notices` | System-wide or role-targeted announcements. |
| `categories` & `courses` | Taxonomy for curricula (Bangla Medium, English Medium, English Version, Madrasah, etc.) and class grades. |
| `institutions` | Directory of universities, colleges, and schools. |
| `feedbacks` | Testimonials and reviews submitted by guardians and tutors. |
| `tuition_reports` | Problem reports filed against tuition requests or profiles. |
| `bookmarks` | Saved tuition posts or tutor profiles for quick access. |
| `platform_settings` | Dynamic platform configuration key-values. |

---

## 6. Real-time Authentication & Session Architecture

- **State Store (`src/store/useAuthStore.js`)**:
  - Handles session boot, token refresh, and account state checks (suspensions, scheduled deletions, deactivations).
  - Subscribes to Supabase Realtime Postgres Changes on `users`, `tutor_profiles`, and `guardian_profiles` to automatically sync profile changes without manual page reloads.
  - Automatically handles free trial expiry and downgrade logic for premium tutor tiers.

---

## 7. Upcoming Upgrades & Roadmap Tracker

> *Use this section to record and track your planned upgrades, feature additions, and fixes.*

- [x] **Upgrade Item 1**: Expand city/location system to all 64 districts of Bangladesh and relevant major areas per district (`src/data/locations.js`).
- [x] **Upgrade Item 2**: Add `Spoken`, `Quran`, `IELTS` + dynamic DB-synced categories/courses (`src/data/categories.js`) and custom category/class support across Admin (`AdminCategories.jsx`), Guardian (`PostRequest.jsx`, `EditRequest.jsx`), Tutor (`TutorProfileForm.jsx`), and Public (`FindTutors.jsx`, `TuitionJobsBoard.jsx`) + dynamic city/area normalization & filtering.
- [ ] **Upgrade Item 3**: *(Add your upgrade details here)*

---
*Created on 2026-11-25. This document serves as the project memory and architectural reference for TutorFinder.*
