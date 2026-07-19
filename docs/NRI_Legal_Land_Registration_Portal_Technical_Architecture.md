# NRI Legal & Land Registration Portal
## Technical Architecture Document (MVP Scope)

**Prepared for:** Client-ready MVP build
**Team profile:** Small/student full-stack team (React + Node + MongoDB)
**Source:** Derived from the NRI Legal & Property Assistance Portal Product Blueprint, adjusted to the final scope (no payments, no video calling, no financial data; AI chatbot added)

---

## 1. Final System Architecture

The system is a classic 3-tier web application, kept intentionally simple (no microservices, no message queues, no Kubernetes) so a small team can build, debug, and ship it in a realistic timeframe.

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│   React.js SPA (Tailwind CSS) — 3 role-based portals:        │
│   Client Portal | Advocate Portal | Admin Portal              │
└───────────────────────────┬────────────────────────────────────┘
                            │ HTTPS (REST, JSON, JWT in headers)
┌───────────────────────────▼────────────────────────────────────┐
│                     APPLICATION LAYER                          │
│   Node.js + Express.js REST API (single deployable service)    │
│   - Auth module (JWT + bcrypt)                                 │
│   - RBAC middleware (client / advocate / admin)                │
│   - Property, Request, Case, Document, Message, Notification    │
│     modules                                                     │
│   - Chatbot module (calls Gemini API server-side)               │
│   - Verification module (advocate KYC review)                  │
└───────────┬───────────────────────────────┬────────────────────┘
            │                               │
┌───────────▼───────────┐       ┌───────────▼───────────────────┐
│   MongoDB (Atlas)      │       │   Cloudinary (file storage)    │
│   - Users, Properties  │       │   - Documents, credentials,    │
│   - Requests, Cases    │       │     avatars                    │
│   - Messages, Notifs   │       │   - Signed/private URLs        │
└────────────────────────┘       └─────────────────────────────────┘
            │
┌───────────▼────────────────────────────────────────────────────┐
│              EXTERNAL SERVICE: Google Gemini API                │
│   Called only from backend (never directly from frontend)       │
│   Used for: chatbot Q&A, FAQ guidance, document checklists       │
└──────────────────────────────────────────────────────────────────┘
```

**Key architectural decisions**
- **Monolith, not microservices.** One Express app with clearly separated modules/routers. This is easier to build, test, deploy, and debug for a small team, and is fully sufficient at MVP scale.
- **No WebRTC/video, no payment gateway** — removed per scope. This significantly reduces PCI-DSS/compliance burden and third-party SDK complexity.
- **Cloudinary instead of self-managed storage** — avoids building a file server; gives CDN delivery, on-the-fly transformations (thumbnails/previews), and access-controlled URLs.
- **MongoDB (document DB)** — a natural fit for the variable-shape data here (properties, documents, case timelines) and pairs well with Node/Express (Mongoose ODM).
- **Gemini calls are backend-only** — the API key must never reach the browser; the frontend calls our own `/api/chatbot` endpoint.

---

## 2. Frontend Architecture

**Stack:** React.js (Vite recommended over CRA for build speed) + Tailwind CSS + React Router + Axios + React Query (or simple Context/Redux Toolkit) for server state.

### 2.1 High-level structure
- **Three route groups**, guarded by role: `/client/*`, `/advocate/*`, `/admin/*`, plus a `/public/*` marketing/auth area.
- **Shared component library**: buttons, cards, modals, status badges, file uploader, data tables, timeline component — used across all three portals to keep a consistent design system.
- **Layout shell per role**: sidebar + topbar layout for advocate/admin, simplified nav for client (mobile-first, since NRIs largely use mobile — per blueprint's persona research).

### 2.2 State management approach
- **Server state** (properties, cases, requests, messages, notifications): fetched via React Query (or SWR) — handles caching, refetching, and loading/error states without a heavy Redux setup.
- **Client/UI state** (modals, form wizards, active tab): local component state or a lightweight Context.
- **Auth state**: JWT stored in memory + httpOnly cookie (see Section 7), user/role stored in a small `AuthContext`.

### 2.3 Key reusable UI modules
| Module | Used by | Notes |
|---|---|---|
| Multi-step wizard | Client (property add, request creation), Advocate (registration) | Generic stepper component driven by a config array |
| File uploader | All roles | Wraps Cloudinary unsigned/signed upload widget, shows progress, validates type/size client-side |
| Status tracker / timeline | Client, Advocate | Renders case/request stage array with color coding (matches blueprint's status model) |
| Chat widget | All roles (messaging) + separate floating AI Chatbot widget | Two distinct components: `<ConversationThread />` (human-to-human) and `<AIChatbotWidget />` (Gemini-powered) |
| Notification bell | All roles | Polls or uses socket (Section 13) |
| Data table | Admin | Reusable sortable/filterable table for user/case/verification lists |

### 2.4 Routing & guarding
```
<Routes>
  <Route path="/" element={<PublicLayout />}>...marketing pages...</Route>
  <Route path="/auth/*" element={<AuthLayout />}>...login/register...</Route>

  <Route element={<ProtectedRoute role="client" />}>
    <Route path="/client/*" element={<ClientLayout />}>...</Route>
  </Route>

  <Route element={<ProtectedRoute role="advocate" />}>
    <Route path="/advocate/*" element={<AdvocateLayout />}>...</Route>
  </Route>

  <Route element={<ProtectedRoute role="admin" />}>
    <Route path="/admin/*" element={<AdminLayout />}>...</Route>
  </Route>
</Routes>
```
`ProtectedRoute` decodes the JWT/role from `AuthContext`, redirects to `/auth/login` if absent, and to a "not authorized" page if role mismatches.

---

## 3. Backend Architecture

**Stack:** Node.js + Express.js, Mongoose (MongoDB ODM), JWT + bcrypt, Multer (temp handling) + Cloudinary SDK, Joi/Zod for validation.

### 3.1 Layered structure (within the monolith)
```
Routes  →  Controllers  →  Services  →  Models (Mongoose)
                 ↓
            Middleware (auth, RBAC, validation, error handling)
```
- **Routes**: only define endpoint + attach middleware + call controller.
- **Controllers**: parse request, call service, shape response. No business logic here.
- **Services**: business logic (e.g., "matching," "verification approval," "case stage transition rules").
- **Models**: Mongoose schemas only.

This layering keeps controllers thin and testable, and lets the same service logic be reused (e.g., admin force-closing a case calls the same `caseService.closeCase()` used elsewhere).

### 3.2 Core backend modules
- `auth` — register, login, OTP/email verification, JWT issue/refresh, password reset
- `users` — profile CRUD for client/advocate/admin
- `properties` — property CRUD, document linkage
- `documents` — upload (Cloudinary), metadata, verification status, soft delete
- `requests` — service request creation, listing, status
- `matching` — simple rule-based matching of requests to advocates (specialization + location + availability; NOT AI/ML at MVP)
- `proposals` — advocate proposals against a request
- `cases` — case lifecycle, milestones/stages, status transitions
- `messaging` — in-app conversation threads (REST + optional sockets)
- `notifications` — in-app + email notification generation
- `verification` — advocate KYC document review workflow (admin-facing)
- `chatbot` — Gemini proxy endpoint with guardrail prompt (Section 10)
- `admin` — dashboard metrics, user management, reports

### 3.3 Why no queue/worker system at MVP
The blueprint's original design implied heavier async workloads (payments, video). With those removed, the only async-ish work is email sending and Gemini calls — both can be done inline with `async/await` and basic retry logic. A job queue (e.g., BullMQ) can be introduced later if email volume grows, but is unnecessary complexity for MVP.

---

## 4. Recommended Project Folder Structure

### 4.1 Backend (`/server`)
```
server/
├── src/
│   ├── config/
│   │   ├── db.js                # Mongoose connection
│   │   ├── cloudinary.js
│   │   └── env.js               # centralizes process.env access
│   ├── middleware/
│   │   ├── auth.middleware.js    # verifies JWT
│   │   ├── rbac.middleware.js    # role checks
│   │   ├── validate.middleware.js
│   │   ├── upload.middleware.js  # multer -> cloudinary
│   │   └── error.middleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── AdvocateProfile.js
│   │   ├── Property.js
│   │   ├── Document.js
│   │   ├── ServiceRequest.js
│   │   ├── Proposal.js
│   │   ├── Case.js
│   │   ├── Conversation.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   └── ChatbotLog.js
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   └── auth.service.js
│   │   ├── users/
│   │   ├── properties/
│   │   ├── documents/
│   │   ├── requests/
│   │   ├── proposals/
│   │   ├── cases/
│   │   ├── messaging/
│   │   ├── notifications/
│   │   ├── verification/
│   │   ├── chatbot/
│   │   └── admin/
│   │       (each folder: *.routes.js, *.controller.js, *.service.js)
│   ├── utils/
│   │   ├── apiResponse.js
│   │   ├── apiError.js
│   │   ├── logger.js
│   │   └── mailer.js
│   ├── validators/               # Joi/Zod schemas per module
│   ├── app.js                    # express app, middleware wiring
│   └── server.js                 # entry point, http server bootstrap
├── .env
├── package.json
└── README.md
```

### 4.2 Frontend (`/client`)
```
client/
├── src/
│   ├── api/                      # axios instance + per-module api calls
│   │   ├── axiosClient.js
│   │   ├── authApi.js
│   │   ├── propertyApi.js
│   │   ├── requestApi.js
│   │   ├── caseApi.js
│   │   ├── documentApi.js
│   │   ├── messageApi.js
│   │   ├── notificationApi.js
│   │   ├── advocateApi.js
│   │   ├── adminApi.js
│   │   └── chatbotApi.js
│   ├── assets/
│   ├── components/
│   │   ├── common/                # Button, Modal, Badge, Table, Loader
│   │   ├── forms/                 # WizardStep, FileUploader, InputField
│   │   ├── layout/                # ClientLayout, AdvocateLayout, AdminLayout, PublicLayout
│   │   └── chat/                  # ConversationThread, AIChatbotWidget
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useCases.js
│   │   └── useNotifications.js
│   ├── pages/
│   │   ├── public/                # Landing, About, HowItWorks, FAQ, Contact
│   │   ├── auth/                  # Login, Register(Client), Register(Advocate)
│   │   ├── client/                # Dashboard, Properties, Requests, Cases, Advocates, Messages
│   │   ├── advocate/              # Dashboard, RequestFeed, MyCases, Clients, Reviews
│   │   └── admin/                 # Dashboard, Users, Verification, Cases, Disputes, Reports
│   ├── routes/
│   │   ├── AppRoutes.jsx
│   │   └── ProtectedRoute.jsx
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── tailwind.config.js
├── .env
└── package.json
```

---

## 5. Database Schema and Collections (MongoDB)

All collections use Mongoose with `timestamps: true`. IDs are ObjectId unless noted.

### 5.1 `users`
```js
{
  _id, role: enum['client','advocate','admin'],
  name, email (unique), phone (unique), passwordHash,
  countryOfResidence, currentAddress, indianAddress,
  isEmailVerified: Boolean, isPhoneVerified: Boolean,
  kycDocumentUrl, kycStatus: enum['not_submitted','pending','verified','rejected'],
  accountStatus: enum['active','suspended','deleted'],
  profilePhotoUrl,
  createdAt, updatedAt
}
```

### 5.2 `advocateProfiles` (1:1 with users where role=advocate)
```js
{
  _id, userId (ref: users),
  barCouncilNumber, stateBarCouncil,
  yearsOfExperience, specializations: [String],
  languagesSpoken: [String], courtJurisdictions: [String],
  bio, education: [{ degree, institution, year }],
  credentialDocuments: [{ type, url, uploadedAt }],
  verificationStatus: enum['pending','under_review','verified','rejected'],
  verificationNotes, rejectionReason,
  serviceOfferings: [{ serviceType, pricingModel, priceRange, estimatedTimelineDays }],
  averageRating, totalReviews, casesCompleted,
  averageResponseTimeHours,
  availability: [{ dayOfWeek, slots: [{start,end}] }],
  createdAt, updatedAt
}
```

### 5.3 `properties`
```js
{
  _id, ownerId (ref: users),
  name, type: enum['residential','agricultural','commercial','ancestral'],
  address: { line1, city, state, pincode, country: 'India' },
  ownershipDetails: { ownerName, sharePercentage, acquisitionDate },
  areaSqFt, currentStatus: enum['vacant','rented','occupied','disputed'],
  documents: [{ documentId (ref: documents), tag }],
  notes, isDeleted: Boolean, deletedAt,
  createdAt, updatedAt
}
```

### 5.4 `documents`
```js
{
  _id, ownerId (ref: users),
  fileName, fileType, fileSizeBytes,
  cloudinaryPublicId, cloudinaryUrl (private/signed),
  category: enum['property','identity','case','credential','other'],
  linkedProperty (ref: properties, optional),
  linkedCase (ref: cases, optional),
  tags: [String],
  verificationStatus: enum['not_required','pending','verified','rejected'],
  verifiedBy (ref: users, admin), verifiedAt,
  sharedWith: [{ userId, sharedAt }],
  version: Number, previousVersionId (ref: documents, optional),
  isDeleted: Boolean, deletedAt,      // soft delete, 30-day recovery per blueprint
  createdAt, updatedAt
}
```

### 5.5 `serviceRequests`
```js
{
  _id, clientId (ref: users),
  serviceCategory: enum['property','legal','consultation'],
  serviceType: String,               // e.g., 'Title Verification', 'Sale Deed Drafting'
  description, linkedProperty (ref: properties, optional),
  documents: [(ref: documents)],
  preferences: { language, urgency: enum['normal','urgent'], budgetRange },
  status: enum['draft','submitted','matching','matched','proposal_received',
               'accepted','cancelled','expired'],
  matchedAdvocates: [(ref: advocateProfiles)],
  createdAt, updatedAt
}
```

### 5.6 `proposals`
```js
{
  _id, requestId (ref: serviceRequests), advocateId (ref: advocateProfiles),
  approachSummary, timelineEstimateDays,
  pricingBreakdown: [{ item, amount }],   // informational only, no payment processing
  termsAndConditions, questionsForClient,
  status: enum['submitted','accepted','rejected','withdrawn'],
  createdAt, updatedAt
}
```

### 5.7 `cases`
```js
{
  _id, requestId (ref: serviceRequests),
  clientId (ref: users), advocateId (ref: advocateProfiles),
  serviceType, linkedProperty (ref: properties, optional),
  status: enum['active','on_hold','completed','cancelled','disputed'],
  milestones: [{
     title, description, dueDate,
     status: enum['pending','in_progress','completed','delayed'],
     deliverables: [(ref: documents)],
     completedAt
  }],
  currentStage, expectedCompletionDate,
  clientNotes, advocateNotes,          // private, per-role
  lastActivityAt,                      // used for "stalled case" detection
  createdAt, updatedAt
}
```

### 5.8 `conversations` & `messages`
```js
// conversations
{ _id, participants: [(ref: users)], relatedCase (ref: cases, optional),
  lastMessageAt, createdAt, updatedAt }

// messages
{ _id, conversationId (ref: conversations), senderId (ref: users),
  type: enum['text','document','system'], content,
  attachedDocument (ref: documents, optional),
  readBy: [{ userId, readAt }], createdAt }
```

### 5.9 `notifications`
```js
{
  _id, userId (ref: users),
  type: enum['case_update','message','verification','request_match','system'],
  title, body, relatedEntity: { entityType, entityId },
  isRead: Boolean, readAt,
  channel: enum['in_app','email'],
  createdAt
}
```

### 5.10 `disputes` (kept minimal, no payment linkage)
```js
{
  _id, caseId (ref: cases), raisedBy (ref: users),
  reason, description, evidenceDocuments: [(ref: documents)],
  status: enum['open','under_review','resolved'],
  resolutionNotes, resolvedBy (ref: users, admin), resolvedAt,
  createdAt, updatedAt
}
```

### 5.11 `chatbotLogs` (for QA/audit, not for training)
```js
{
  _id, userId (ref: users, optional if anonymous),
  sessionId, userMessage, botResponse,
  flaggedAsLegalAdviceRisk: Boolean,
  createdAt
}
```

### 5.12 `auditLogs`
```js
{ _id, actorId (ref: users), action, targetEntity: {type, id}, metadata, createdAt }
```

**Indexes to create:** `users.email`, `users.phone` (unique); `advocateProfiles.specializations`, `verificationStatus`; `properties.ownerId`; `serviceRequests.clientId+status`; `cases.clientId`, `cases.advocateId`, `cases.status`, `cases.lastActivityAt`; `messages.conversationId+createdAt`; `notifications.userId+isRead`.

---

## 6. User Roles and Permissions

| Capability | Client | Advocate | Admin |
|---|---|---|---|
| Register/login | ✅ (own account) | ✅ (own account, then pending verification) | ❌ (seeded/created by super-admin) |
| Manage own profile | ✅ | ✅ | ✅ |
| Add/edit/delete own properties | ✅ | ❌ | View only (support) |
| Upload/view own documents | ✅ | ✅ (credentials + case deliverables) | View all (for verification/support) |
| Create service requests | ✅ | ❌ | ❌ |
| Browse/view advocate profiles | ✅ | View own profile (public preview) | View all |
| Submit proposals | ❌ | ✅ (on requests) | ❌ |
| Accept proposal → create case | ✅ | ❌ (receives acceptance) | ❌ |
| Update case status / upload deliverables | View + approve/comment | ✅ | Override in disputes |
| Messaging | ✅ (with matched advocate) | ✅ (with matched client) | View for moderation/disputes only |
| Raise dispute | ✅ | ✅ | Resolve |
| View own notifications | ✅ | ✅ | ✅ |
| Verify advocate credentials | ❌ | ❌ | ✅ |
| Verify/flag documents | ❌ | ❌ | ✅ |
| Suspend/activate accounts | ❌ | ❌ | ✅ |
| View admin dashboard/reports | ❌ | ❌ (own performance stats only) | ✅ |
| Platform configuration (service categories, etc.) | ❌ | ❌ | ✅ |

**Enforcement:** role is embedded in the JWT payload; every protected route passes through `rbac.middleware.js(allowedRoles)`; ownership checks (e.g., "is this property mine?") are additionally enforced in the service layer, not just at the route level, to prevent IDOR-style access issues.

---

## 7. Authentication and Authorization Flow

### 7.1 Registration
1. Client/Advocate submits registration form → backend validates (Joi/Zod) → `bcrypt.hash(password, 12)` → user created with `isEmailVerified:false`.
2. Backend sends verification email (and/or OTP SMS) with a signed, short-lived token/OTP.
3. On verification, `isEmailVerified`/`isPhoneVerified` flips to true.
4. **Advocate-specific:** account is created but `advocateProfile.verificationStatus = 'pending'`; advocate has limited access (profile setup, credential upload only) until admin approves.

### 7.2 Login
1. POST `/api/auth/login` with email/phone + password.
2. Backend verifies `bcrypt.compare`, checks `accountStatus === 'active'`.
3. Issues:
   - **Access token** (JWT, short-lived ~15–30 min) — contains `{ userId, role }`.
   - **Refresh token** (JWT, long-lived ~7 days) — stored as an **httpOnly, secure, SameSite=strict cookie**; also persisted (hashed) in DB per user/device for revocation support.
4. Access token is returned in the response body and kept in memory on the frontend (not localStorage, to reduce XSS token-theft risk).

### 7.3 Session refresh
- Frontend axios interceptor: on 401, calls `/api/auth/refresh` (cookie sent automatically) → issues new access token silently → retries original request.
- Logout clears the refresh cookie and deletes/blacklists the stored refresh token hash.

### 7.4 Authorization (RBAC)
```
Request → auth.middleware (verify access token, attach req.user)
        → rbac.middleware(['client'])  // or ['advocate'], ['admin']
        → ownership check in service layer where applicable
        → controller
```

### 7.5 Password reset
Standard flow: request reset → emailed time-limited signed link/token → new password form → token validated → password updated → all existing refresh tokens for that user invalidated.

### 7.6 Advocate verification gating
`advocateProfile.verificationStatus` acts as an additional authorization gate: even a logged-in, email-verified advocate cannot appear in the client-facing directory or receive requests until `verificationStatus === 'verified'`. This is enforced in the `requests`/`matching` service, not just the UI.

---

## 8. API Endpoint Structure

All endpoints prefixed `/api/v1`. Auth required unless marked *(public)*.

### Auth
```
POST   /auth/register/client
POST   /auth/register/advocate
POST   /auth/verify-email
POST   /auth/verify-phone
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/forgot-password
POST   /auth/reset-password
```

### Users / Profile
```
GET    /users/me
PATCH  /users/me
PATCH  /users/me/password
DELETE /users/me
```

### Advocate Profile
```
POST   /advocates/profile              (advocate creates/updates own profile)
GET    /advocates                      (public directory, filters: specialization, location, language, rating)
GET    /advocates/:id                  (public profile view)
POST   /advocates/credentials          (upload credential docs)
GET    /advocates/me/dashboard-stats
```

### Properties
```
GET    /properties
POST   /properties
GET    /properties/:id
PATCH  /properties/:id
DELETE /properties/:id                 (soft delete)
GET    /properties/:id/timeline
```

### Documents
```
POST   /documents/upload
GET    /documents
GET    /documents/:id
GET    /documents/:id/preview-url
POST   /documents/:id/share
DELETE /documents/:id                  (soft delete, 30-day recovery)
POST   /documents/:id/restore
```

### Service Requests
```
POST   /requests
GET    /requests                       (own requests, role-aware)
GET    /requests/:id
PATCH  /requests/:id                   (edit draft)
DELETE /requests/:id                   (cancel)
GET    /requests/feed                  (advocate: available matched requests)
```

### Proposals
```
POST   /requests/:id/proposals         (advocate submits)
GET    /requests/:id/proposals         (client views)
PATCH  /proposals/:id/accept
PATCH  /proposals/:id/reject
PATCH  /proposals/:id/withdraw
```

### Cases
```
POST   /cases                          (system-generated on proposal acceptance)
GET    /cases                          (role-aware list)
GET    /cases/:id
PATCH  /cases/:id/status
POST   /cases/:id/milestones
PATCH  /cases/:id/milestones/:milestoneId
POST   /cases/:id/milestones/:milestoneId/deliverables
PATCH  /cases/:id/close
```

### Disputes
```
POST   /disputes
GET    /disputes/:id
PATCH  /disputes/:id/resolve           (admin only)
```

### Messaging
```
GET    /conversations
GET    /conversations/:id/messages
POST   /conversations/:id/messages
PATCH  /conversations/:id/read
```

### Notifications
```
GET    /notifications
PATCH  /notifications/:id/read
PATCH  /notifications/read-all
```

### Chatbot
```
POST   /chatbot/message                (public + authenticated; rate-limited)
GET    /chatbot/history                (own history, if logged in)
```

### Admin
```
GET    /admin/dashboard/metrics
GET    /admin/users?role=&status=&search=
PATCH  /admin/users/:id/status
GET    /admin/verification-queue
GET    /admin/verification/:advocateId
PATCH  /admin/verification/:advocateId/decision
GET    /admin/cases?status=&stalled=true
GET    /admin/cases/:id
GET    /admin/documents/verification-queue
PATCH  /admin/documents/:id/verify
GET    /admin/reports/case-volume
GET    /admin/reports/status-breakdown
GET    /admin/reports/top-advocates
GET    /admin/audit-logs
```

---

## 9. Document Upload and Storage Flow

```
Client selects file (React uploader component)
   │
   ▼
Frontend validation (type: pdf/jpg/png/doc/xls; size ≤ 25–50MB)
   │
   ▼
POST /api/v1/documents/upload  (multipart/form-data, JWT required)
   │
   ▼
Backend: Multer (memory storage) → basic MIME/size re-validation (never trust client)
   │
   ▼
Backend uploads buffer to Cloudinary via SDK
   - resource_type: 'auto'
   - folder: `nri-portal/{userId}/{category}`
   - access_mode: 'authenticated' (private assets, not publicly guessable)
   │
   ▼
Cloudinary returns { public_id, secure_url, format, bytes }
   │
   ▼
Backend creates `documents` record: owner, category, tags, linkedProperty/linkedCase,
   verificationStatus:'pending' if category requires it (identity/credential)
   │
   ▼
Response to frontend: document metadata (never the raw Cloudinary delivery URL directly —
   preview/download goes through backend-signed, time-limited URLs)
```

**Retrieval / preview:**
```
GET /documents/:id/preview-url
   → backend checks: is req.user the owner, a shared party, the matched advocate on
     the linked case, or an admin?
   → if authorized, backend generates a short-lived signed Cloudinary URL
     (expires in e.g. 5–10 minutes) and returns it
   → frontend renders in <iframe>/PDF.js or <img>, or triggers download
```

**Soft delete & recovery:** delete sets `isDeleted:true, deletedAt:now`; a scheduled job (simple cron via `node-cron`) permanently purges from Cloudinary + DB after 30 days; admin can restore within that window.

**Sensitive-data handling:** identity documents (passport, Aadhaar/PAN if present) are flagged `category:'identity'` and are visible only to the owner and admin — never exposed to advocates or other clients, per the blueprint's privacy requirements.

---

## 10. AI Chatbot Architecture and Secure Gemini API Integration

### 10.1 Design goals
- General guidance only (property registration process, required documents, portal how-tos, FAQs, request-status explanation in plain language).
- **Must never** give case-specific legal advice, predict case outcomes, or make legal determinations — must consistently redirect to "consult a verified advocate on the platform."
- Gemini API key must stay server-side only.

### 10.2 Flow
```
React <AIChatbotWidget/>
   │  POST /api/v1/chatbot/message  { message, sessionId }
   ▼
Backend chatbot.controller
   │
   ▼
chatbot.service:
   1. Rate-limit check (per user/IP)
   2. Light input moderation (block obvious abuse/PII dumping)
   3. Build request to Gemini with a SYSTEM/GUARDRAIL PROMPT (server-defined, not user-editable):
        - "You are an informational assistant for an NRI property/legal portal.
           Answer only general questions about property registration processes,
           required documents, and how to use the portal.
           Do NOT give definitive legal advice or predict case outcomes.
           Always remind the user to consult a verified advocate for
           case-specific matters. If asked for legal advice, politely decline
           and suggest booking a consultation with a verified advocate on
           the platform."
   4. Optionally inject lightweight context (e.g., "user's last request status:
      submitted") — only non-sensitive summary data, never raw documents.
   5. Call Gemini API (server-side, API key from env var, never sent to client)
   6. Post-process response: append a disclaimer if not already present;
      run a keyword check for advice-like phrasing ("you should sue",
      "you will win") and soften/flag if detected.
   7. Log { userMessage, botResponse, flaggedAsLegalAdviceRisk } to
      `chatbotLogs` for QA review.
   │
   ▼
Response returned to frontend and rendered in chat widget with a persistent
   visible disclaimer: "This assistant provides general information only and
   is not a substitute for advice from a verified legal professional."
```

### 10.3 Guardrails summary
- Fixed, backend-controlled system prompt — user messages cannot override it (no prompt injection surface exposed as "instructions").
- Every response includes a static disclaimer element rendered by the **frontend**, independent of what Gemini returns (defense in depth — even if the model forgets, the UI always shows it).
- Chatbot has **read-only, non-sensitive** context access at most (e.g., request status labels) — never direct DB/document access, never document contents.
- All chatbot interactions logged for admin review/audit (`chatbotLogs`), enabling periodic QA sampling.
- Rate limiting (e.g., 20 messages/hour per user) to control API cost and abuse.

---

## 11. Case/Request Lifecycle

```
[Client: Create Service Request]
        │  status: draft → submitted
        ▼
[System: Rule-based Matching]
   (specialization + property location/state + language + availability)
        │  status: matching → matched
        ▼
[Client views matched advocates] ──(no match found)──► [Admin: broaden/manual assign]
        │
        ▼
[Advocate: Submits Proposal]  (status: proposal_received)
        │
        ▼
[Client: Reviews & Accepts Proposal]
        │
        ▼
[System: Case auto-created from accepted proposal]
   (case.status = 'active', milestones initialized from proposal timeline)
        │
        ▼
[Case Execution Loop]
   Advocate updates status / uploads deliverables per milestone
        │
        ▼
[Client reviews milestone] ──(requests revision)──► back into current milestone
        │
        ├──(raises dispute)──► [Dispute created] → Admin reviews → Resolution
        │                                              │
        │                                              ▼
        │                                   (case reassigned / continued / closed)
        ▼ (approves)
[Milestone marked completed] → next milestone begins (repeat)
        │
        ▼
[Final milestone completed] → [Client approves closure]
        │
        ▼
[Case status: completed] → [Client leaves review/rating on advocate]
        │
        ▼
[Documents archived to vault; case read-only, retained for history]
```

**Note:** since escrow/payment is removed, "milestone approval" is purely a **status/quality gate** (client confirms deliverable received and satisfactory) — it no longer triggers any fund release, simplifying the state machine considerably versus the original blueprint.

**Stalled-case detection (admin):** a scheduled job flags any case where `lastActivityAt` exceeds a threshold (e.g., 7 days) and surfaces it in the admin "Stalled Cases" view for intervention (reminder, reassignment, or escalation) — reused directly from the blueprint's edge-case handling.

---

## 12. Admin and Advocate Dashboard Architecture

### 12.1 Data flow pattern (both dashboards)
```
Frontend dashboard page
   │  GET /admin/dashboard/metrics  (or /advocates/me/dashboard-stats)
   ▼
Backend controller → calls a dedicated *aggregation service*
   │  Uses MongoDB aggregation pipelines ($match, $group, $facet)
   │  computed on demand (MVP) — no separate analytics DB needed at this scale
   ▼
Returns pre-shaped JSON matching each chart/card's needs
   ▼
Frontend renders with a charting lib (Recharts recommended — pairs well with
   React + Tailwind, no extra backend work needed)
```

### 12.2 Admin Dashboard — final metrics (as scoped) and their source
| Metric | Source collection(s) | Computation |
|---|---|---|
| Active Cases | `cases` | count where status='active' |
| Pending Requests | `serviceRequests` | count where status in [submitted, matching, matched] |
| Completed Cases | `cases` | count where status='completed' |
| Pending Verifications | `advocateProfiles` | count where verificationStatus='pending' or 'under_review' |
| Active Clients | `users` | count where role='client' and accountStatus='active' |
| Verified Advocates | `advocateProfiles` | count where verificationStatus='verified' |
| Case Volume Trend | `cases` | group by week/month(createdAt), count — line chart |
| Platform User Distribution | `users` | group by role, or by country of residence — pie/bar |
| Case Status Breakdown | `cases` | group by status — pie chart |
| Document Verification Status | `documents` | group by verificationStatus — bar/donut |
| Advocate Response Time | `advocateProfiles.averageResponseTimeHours` | recomputed periodically from message-timestamp deltas |
| Platform Activity Overview | mixed (recent docs across `cases`, `serviceRequests`, `users`) | recent-activity feed query, sorted by updatedAt, limited |
| Top Performing Advocates | `advocateProfiles` | sort by casesCompleted desc + averageResponseTimeHours asc |

All admin metrics endpoints should be **paginated/limited** where they return lists, and heavy aggregations should be indexed appropriately (see Section 5 index list).

### 12.3 Advocate Dashboard
Simpler, scoped to `req.user.advocateProfileId`:
- Active cases count + breakdown
- New/available matched requests count
- Upcoming consultation reminders *(consultation = scheduling/booking only, since video calling itself is removed — see note below)*
- Own performance: rating, cases completed, response time, profile completeness

> **Scope note on "Consultations":** since video calling is removed, "Book Consultation" becomes a **scheduling/appointment request** (client requests a time, advocate confirms) that results in an **offline or externally-arranged call** (e.g., phone), tracked in-app only as an appointment record — not an in-app video session. If this isn't wanted at all for MVP, it can be dropped entirely without affecting other modules; it is not a dependency for the case lifecycle.

---

## 13. Notification Architecture

### 13.1 Channels (per final scope: email + in-app only; push deferred)
```
Event occurs in a service (e.g., caseService.updateMilestone())
        │
        ▼
notificationService.create({ userId, type, title, body, relatedEntity })
        │
        ├──► Save to `notifications` collection (in-app)
        │
        └──► If user's notification preference allows email for this type:
                  mailer.send(template, userEmail, data)   (Nodemailer + a
                  transactional provider, e.g. SMTP via SendGrid/SES free tier)
```

### 13.2 Delivery to frontend
- **MVP-simple approach:** frontend polls `GET /notifications?unread=true` every N seconds (e.g., 30s) via React Query's `refetchInterval` — no extra infrastructure needed.
- **Optional upgrade (if time allows):** Socket.IO for real-time push of both notifications and chat messages, using a single shared socket connection namespaced by `userId` room. This is a natural "should-have" upgrade, not required for MVP functionality.

### 13.3 Notification trigger points (derived from blueprint's phases, scope-adjusted)
- Registration/verification: email verified, phone verified, advocate approved/rejected/more-info-requested
- Requests: new match found, proposal received, proposal accepted/rejected
- Cases: milestone updated, milestone completed, revision requested, case closed
- Disputes: dispute raised, dispute resolved
- Messaging: new message received (in-app only, to avoid email overload — configurable)
- Documents: document verified/rejected by admin

---

## 14. Security Considerations

- **Passwords:** bcrypt with cost factor ≥ 12; never log or return password hashes.
- **JWT:** short-lived access tokens; refresh tokens in httpOnly + Secure + SameSite=Strict cookies; refresh tokens hashed at rest and revocable per device/session.
- **Transport:** HTTPS/TLS everywhere (enforced at hosting/reverse-proxy level); HSTS header.
- **Input validation:** Joi/Zod schema validation on every write endpoint; Mongoose schema-level constraints as a second layer.
- **Authorization depth:** RBAC middleware **plus** per-resource ownership checks in the service layer (prevents one client from reading another client's property/case by guessing an ID — classic IDOR).
- **File upload safety:** server-side re-validation of MIME type and size (never trust `Content-Type` header alone); virus/malware scanning is a nice-to-have (e.g., ClamAV) if budget allows, otherwise strict type allow-listing (pdf, jpg, png, doc, docx, xls, xlsx only).
- **Document access:** all document delivery via short-lived signed Cloudinary URLs, never permanent public links; identity documents restricted to owner + admin only.
- **Rate limiting:** `express-rate-limit` on auth endpoints (login, OTP, password reset) and the chatbot endpoint to prevent brute force and API-cost abuse.
- **CORS:** restricted to the known frontend origin(s) only.
- **Helmet.js:** standard secure HTTP headers.
- **Sensitive data in DB:** avoid storing raw Aadhaar/PAN numbers as plain searchable fields; if captured, store only as part of an encrypted/opaque document, not a queryable field.
- **Gemini API key:** stored only in backend environment variables, never exposed to frontend bundle or client-side network calls.
- **Audit logging:** all admin actions (verification decisions, suspensions, dispute resolutions, document verification) written to `auditLogs` for accountability.
- **Data export/deletion requests:** since PDP/GDPR-style requests were flagged as an edge case in the blueprint, design user deletion as a soft-delete + anonymization routine from day one (rename to "Deleted User", strip PII, retain only what's legally/operationally necessary) rather than bolting it on later.
- **Dependency hygiene:** `npm audit` in CI; pin versions; avoid unmaintained packages, especially around file upload and auth.

---

## 15. Environment Variables Required

### Backend (`server/.env`)
```
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=

# JWT
JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRY=7d

# Bcrypt
BCRYPT_SALT_ROUNDS=12

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (transactional)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="NRI Legal Portal <no-reply@domain.com>"

# SMS/OTP provider (if used)
SMS_PROVIDER_API_KEY=
SMS_PROVIDER_SENDER_ID=

# Gemini AI Chatbot
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash   # confirm current model name at build time

# CORS
CLIENT_ORIGIN=http://localhost:5173

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (`client/.env`)
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=      # if using unsigned client-side upload widget
```

> Note: Prefer **signed, server-mediated uploads** (frontend → backend → Cloudinary) over unsigned client-side upload presets for anything containing identity/legal documents, since this keeps validation and access rules centralized in the backend. An unsigned preset may be acceptable only for low-sensitivity assets like a profile photo.

---

## 16. Development Roadmap (Implementation Order)

### Phase 0 — Setup (Week 1)
- Repo setup (client/server), ESLint/Prettier config, CI skeleton
- MongoDB Atlas cluster, Cloudinary account, Gemini API key provisioning
- Base Express app + base React app + Tailwind config
- `.env` scaffolding for both

### Phase 1 — Auth & Users (Weeks 2)
- User model, registration (client + advocate), email/phone verification
- Login, JWT issue/refresh, RBAC middleware
- Basic profile view/edit for all roles

### Phase 2 — Advocate Verification Core (Week 3)
- Advocate profile creation + credential upload (Cloudinary)
- Admin verification queue + approve/reject/request-info flow
- Notification triggers for verification status changes

### Phase 3 — Property & Document Management (Weeks 4–5)
- Property CRUD + document linkage
- Document upload/preview/share/soft-delete flow (signed URLs)
- Document verification workflow (admin side, for identity docs)

### Phase 4 — Requests, Matching, Proposals (Weeks 6–7)
- Service request creation wizard
- Rule-based matching service (specialization/location/language)
- Advocate request feed + proposal submission
- Client proposal review + acceptance

### Phase 5 — Case Lifecycle (Weeks 8–9)
- Case auto-creation on proposal acceptance
- Milestone model + status update flow (advocate side)
- Client milestone review/approval + revision request
- Stalled-case detection job

### Phase 6 — Messaging & Notifications (Week 10)
- Conversation/message models + REST endpoints
- In-app notification generation + polling on frontend
- Email notification templates for key events

### Phase 7 — Disputes & Admin Case Oversight (Week 11)
- Dispute creation + admin resolution interface
- Admin case monitoring (active/stalled/all) views

### Phase 8 — AI Chatbot Integration (Week 12)
- Backend Gemini proxy endpoint with guardrail system prompt
- Chatbot logging + rate limiting
- Frontend chat widget with persistent disclaimer

### Phase 9 — Admin Dashboard & Reports (Week 13)
- Aggregation service for all 13 scoped metrics
- Recharts-based dashboard UI (admin)
- Advocate performance dashboard (advocate side)

### Phase 10 — Reviews & Ratings (Week 13, parallel)
- Client review/rating on case closure
- Advocate response-to-review

### Phase 11 — Hardening & QA (Weeks 14–15)
- Security pass (Section 14 checklist), rate limiting, Helmet, CORS lockdown
- Cross-role E2E testing of full lifecycle (register → verify → request → propose →
  case → milestones → close → review)
- Responsive/mobile QA (per blueprint's mobile-first NRI usage pattern)
- Soft delete/recovery testing for documents

### Phase 12 — Soft Launch & Handover (Week 16)
- Deploy (e.g., frontend on Vercel/Netlify, backend on Render/Railway, MongoDB Atlas)
- Seed initial admin account + a handful of verified advocates
- Beta user walkthrough, bug triage, client handover documentation

---

## Summary of Scope Simplifications vs. Original Blueprint

| Original Blueprint | This Architecture |
|---|---|
| Escrow payments, milestone fund release | Milestone approval is a status/quality gate only — no money movement |
| Video consultation (WebRTC/Zoom SDK) | Removed; optional lightweight "appointment request" record only |
| Revenue/GMV/payout financial analytics | Removed entirely from admin metrics |
| Transaction history, invoices | Removed entirely |
| AI document OCR, automated Bar Council verification (Phase 2/3 ideas) | Deferred — MVP uses manual admin verification |
| — | **Added:** Gemini-powered informational chatbot with legal-advice guardrails |

This keeps the build scoped to what the blueprint itself calls **P0/P1 features**, minus payment-dependent items, plus the one new AI chatbot requirement — realistic for a small team to deliver as a genuine, demoable, client-ready MVP.
