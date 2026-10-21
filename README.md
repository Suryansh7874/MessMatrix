Mess Matrix --- Kamar-Taj Refectory
Webster 2026 | Team EnigmaBreakers | Team ID: 377

Mess Matrix is a proposed smart meal-management and
resource-optimization platform for institutional messes, hostels, and
community dining facilities. It is designed to streamline meal bookings,
enforce cancellation cutoffs, validate meal check-ins using QR tokens,
maintain auditable billing records, support offline scan
synchronization, and help administrators understand meal demand and
potential food surplus.
Project status: This README describes the intended architecture
and workflows from the project abstract. Update the status, setup
instructions, screenshots, deployment links, and test results to match
the code that is actually implemented.

Table of Contents
- Problem Statement
- Goals
- Core Workflows
- Architecture
- Technology Stack
- Roles and Permissions
- Data Model
- Security and Data Integrity
- Offline Scanning
- Analytics and Rebate Policy
- Testing Strategy
- Proposed Local Setup
- Environment Variables
- API Design
- Known Limitations and Engineering
  Trade-offs
- Team
Problem Statement
Traditional mess systems can struggle with inaccurate meal-demand
estimates, late cancellations, surplus food, and incomplete records of
actual meal consumption. These issues can increase operating costs and
make resource planning difficult.

Mess Matrix addresses these problems through digital meal
opt-in/opt-out, server-enforced cancellation deadlines, QR-based
check-in, auditable consumption and billing records, offline event
queuing, and meal-demand and surplus analytics.
Goals
- Let students book or cancel meals within a configured time window.
- Enforce booking and cancellation cutoffs on the server.
- Generate time-limited, booking-specific QR tokens.
- Prevent duplicate successful redemption of a booking.
- Maintain traceable check-in, charge, and rebate records.
- Support queued scan events during network interruptions, followed by
  server-side reconciliation.
- Compare confirmed bookings, actual check-ins, prepared meals, and
  recorded leftovers.
- Provide role-specific views for students, mess administrators, and
  mess staff.
Core Workflows
1. Meal booking
1. A student signs in and views available meal slots.
2. The student opts in or opts out before the configured cutoff.
3. The backend validates the request and deadline.
4. The booking is saved and the confirmed headcount is updated.
5. After the cutoff, booking changes are rejected according to the
   configured policy.
The frontend countdown is informational only; the backend is
authoritative for deadline enforcement.
2. QR check-in
1. An eligible booking receives a time-limited QR token.
2. Mess staff scan the token using the staff interface.
3. The backend validates token authenticity, expiry, booking
   eligibility, meal slot, and redemption state.
4. A successful redemption is recorded atomically.
5. Expired, invalid, or previously redeemed tokens are rejected.
3. No-show handling
A booking should not be marked as a no-show while its meal service
window is still open. After service closes, the system can identify
eligible bookings without a successful check-in and mark their
attendance as NO_SHOW.

Billing and rebate treatment for no-shows must follow the institution's
configured policy. A no-show should not automatically be treated as an
eligible cancellation.
4. Offline scan synchronization
1. The scanning client caches required application resources.
2. If the network is unavailable, it stores scan events in persistent
   browser storage.
3. Each queued event has a unique event ID and device information.
4. When connectivity returns, the client submits queued events to the
   backend.
5. The backend revalidates events, deduplicates retries, records
   accepted events, and reports conflicts or rejected events.
Offline scans require an explicit conflict policy. Independent scanners
without connectivity cannot know immediately whether another scanner has
accepted the same token.
5. Rebate and billing
- The system identifies cancellations eligible for a rebate under the
  configured policy.
- Each charge or credit is recorded with an amount, reason, timestamp,
  and reference to the originating event.
- Unique event references and idempotent processing help prevent
  duplicate ledger entries.
- Students can view billing summaries and rebate history.
6. Food-waste analytics
The dashboard should distinguish between:
- Confirmed bookings: students who booked a meal.
- Actual check-ins: meals successfully redeemed.
- Prepared meals: portions prepared by the kitchen.
- Recorded leftovers: portions reported as remaining after
  service.
A gap between bookings and check-ins can indicate potential surplus, but
it does not prove that food was wasted. Actual waste analysis requires
preparation and leftover measurements.
Architecture
System topology
Student / Mess Staff / Administrator
                 |
                 v
       React Progressive Web App
          |                 |
          v                 v
     HTTPS REST API    Service Worker
          |            + IndexedDB queue
          v                 |
   Node.js / Express API    |
          |                 |
          +<-- Sync API <---+
          |
          v
      MongoDB Atlas
          |
          v
 Aggregation / Scheduled Jobs
          |
          v
 Booking, Check-in, Billing and
      Surplus Analytics
Data flow
1. The client sends requests over HTTPS.
2. The backend authenticates users, checks permissions, validates
   inputs, and applies business rules.
3. MongoDB stores users, menus, meal slots, bookings, redemption
   records, scan events, ledger entries, and analytics data.
4. Indexed queries support common booking and redemption lookups.
5. Aggregation pipelines and scheduled jobs can produce reporting data
   without putting expensive analytics work on every check-in request.
6. Offline events are submitted to a synchronization endpoint after
   connectivity returns.
Load and reliability considerations
The proposed design uses stateless API request handling, indexes,
bounded database operations, request validation, rate limiting, and
separation of non-critical analytics from the QR redemption path.
Multiple API instances and managed hosting can be considered for higher
availability. Actual capacity and availability must be verified through
deployment-specific load and recovery tests.
Technology Stack
  Area                    Proposed technology     Purpose
  Frontend                React, React Router,    Role-specific web
                          Vite                    interfaces and
                                                  navigation

  Styling                 Tailwind CSS            Responsive UI

  Charts                  Recharts                Booking, check-in,
                                                  rebate, and surplus
                                                  reports

  Backend                 Node.js, Express.js     REST APIs and business
                                                  rules

  Database                MongoDB Atlas, Mongoose Persistent data and
                                                  data models

  Request validation      Zod                     Validate request
                                                  payloads

  Authentication security bcrypt, Helmet,         Password hashing and
                          express-rate-limit,     API security controls
                          CORS                    

  QR generation           qrcode                Render QR codes

  QR scanning             html5-qrcode          Browser-based camera
                                                  scanning

  Offline support         Service Worker,         Cache application
                          IndexedDB               resources and persist
                                                  queued scan events

  Scheduled jobs          node-cron, where        Periodic tasks
                          appropriate             

  Testing                 Vitest, Supertest,      Unit, API, and
                          Playwright              end-to-end tests

  Proposed hosting        Vercel, Render, MongoDB Frontend, API, and
                          Atlas                   managed database
                                              hosting
Use only the libraries and services actually present in the repository.
Do not list a dependency as implemented until it has been added and
tested.
Roles and Permissions
Student
- View menus and meal slots.
- Opt in or opt out before the cutoff.
- Access eligible meal QR tokens.
- View meal history and billing/rebate statements.
Mess administrator
- Configure menus, meal slots, prices, and cutoff policies.
- View bookings and expected headcounts.
- Review check-in records, rebate summaries, and analytics.
- Manage user access according to the implemented permission model.
Mess staff
- Scan and validate meal QR tokens.
- View check-in outcomes and scan history.
- Submit and synchronize offline scan events where supported.
All permissions must be enforced by the backend, not only by hiding
frontend controls.
Data Model
The UML class diagram for Mess Matrix includes the following principal
entities.
  Entity                              Responsibility
  User                              Shared identity, credentials hash,
                                      role, and account status

  Student                           Student-specific details and
                                      meal-booking access

  MessAdmin                         Menu, slot, policy, and analytics
                                      administration

  MessStaff                         QR scanning and scan-history access

  Menu                              Menu details and meal offering
                                      information

  MealSlot                          Meal type, date, time window,
                                      cutoff, and slot status

  Booking                           Student's booking decision and
                                      attendance status

  QRToken                           Booking-bound token metadata,
                                      signature, expiry, and use state

  CheckIn                           Accepted or rejected check-in
                                      record

  ScanQueue                         Persistent offline scan event and
                                      synchronization status

  BillingLedger                     Auditable charges, credits,
                                      refunds, and adjustments

  Rebate                            Eligible rebate amount and
                                      processing status

  AnalyticsRecord                   Aggregated booking, check-in,
                                      no-show, preparation, and leftover
                                  counts
Important constraints
- A booking can have at most one successful redemption.
- Booking state and attendance state should be represented separately.
- Each offline scan event should have a unique event ID to support
  idempotent synchronization.
- Ledger entries should reference their originating booking or policy
  event.
- Reprocessing the same rebate event must not create a duplicate
  credit.
- The database schema and class diagram should be kept consistent with
  the implementation.
Security and Data Integrity
- Store password hashes, never plaintext passwords.
- Enforce authentication and role-based authorization on protected
  APIs.
- Validate request bodies, path parameters, and query parameters.
- Apply server-side cutoff and booking eligibility checks.
- Use cryptographically secure token generation and a defined
  token-signing/verification scheme.
- Do not expose a shared HMAC signing secret in browser code. If
  offline token verification is needed, consider signed tokens that
  can be verified using a public key on the client.
- Enforce single-use redemption through atomic database operations and
  unique constraints, not just frontend checks.
- Use idempotency keys or unique event references for retryable
  operations.
- Keep financial ledger entries auditable.
- Configure HTTPS, security headers, rate limits, logging, and secret
  management in deployment.
- Avoid storing unnecessary sensitive information in logs.
Offline Scanning
Offline scanning improves resilience but introduces consistency
trade-offs. A disconnected device cannot know whether another
disconnected device has already accepted the same token.

The proposed workflow uses a persistent queue with unique event
identifiers, followed by backend revalidation and conflict
reconciliation. The implementation should define:
- Which token information can be verified offline.
- How token expiry is evaluated when the device clock may be
  inaccurate.
- How duplicate events are detected.
- What happens when two devices submit conflicting offline scans.
- How staff are informed of pending, accepted, rejected, or conflicted
  events.
Do not claim a global zero-double-redemption guarantee for independently
operating offline scanners unless the design provides an exclusivity or
coordination mechanism that actually guarantees it.
Analytics and Rebate Policy
Analytics
The first version can calculate confirmed booking counts and compare
them with actual check-ins. More advanced demand estimation can use
historical attendance and no-show rates. Food waste should be measured
using prepared portions and recorded leftovers.
Rebate policy
The institution should configure cancellation deadlines, eligible rebate
conditions, and charge rules. Timely opt-outs may qualify for credits,
while no-shows follow the defined policy. The application should display
the policy to students and record the reason for every charge or credit.
Testing Strategy
The planned test suite should cover the following cases.
  Test                                Expected behavior
  Valid QR token                      One successful redemption

  Repeated QR scan                    Rejected as already redeemed

  Concurrent scans                    At most one successful redemption
                                      for a booking

  Expired or invalid token            Rejected

  Cancellation before cutoff          Accepted if all policy conditions
                                      are met

  Cancellation after cutoff           Rejected

  Repeated rebate request             No duplicate credit

  Offline event retry                 Same event is not recorded twice

  Conflicting offline events          Explicitly reconciled and reported

  No-show processing                  Runs only after the meal service
                                      window closes

  Analytics consistency               Bookings, check-ins, preparation,
                                      and leftovers remain distinct

  Load test                           Throughput, p95 latency, and error
                                      rate are measured under a
                                      documented workload

  Recovery test                       Backend/database reconnection and
                                  backup restoration are verified
Record the test environment, workload, observed results, and known
failures. Do not report performance figures until they have been
measured.
Proposed Local Setup
The exact commands and scripts depend on the repository. The following
is a typical setup for a React/Vite frontend and Node/Express backend;
adjust it to match the actual project.
Prerequisites
- Node.js LTS and npm
- A MongoDB instance or MongoDB Atlas database
- Git
1. Clone the repository
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_REPOSITORY_DIRECTORY>
2. Install dependencies
If the repository has separate frontend and backend directories:
cd backend
npm install

cd ../frontend
npm install
If your repository uses a different folder layout, use the corresponding
directories.
3. Configure environment variables
Create a .env file in the backend directory and set the variables
required by the implementation. Never commit real secrets.

Example variable names:
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/mess_matrix
JWT_SECRET=replace_with_a_strong_random_secret
CLIENT_ORIGIN=http://localhost:5173
These are example names. Match them to the variables read by your actual
application.
4. Start the backend
cd backend
npm run dev
Use the actual development script defined in backend/package.json.
5. Start the frontend
In another terminal:
cd frontend
npm run dev
Open the local URL printed by Vite. Ensure the frontend API base URL
points to the running backend.
Environment Variables
  Variable                Purpose                 Required
  PORT                  Backend listening port  If used by the server

  MONGODB_URI           MongoDB connection      Yes for database access
                          string                  

  JWT_SECRET            Signs/verifies          Yes if JWT is
                          authentication tokens   implemented
                          if JWT is used          

  CLIENT_ORIGIN         Allowed frontend origin If used by
                      for CORS                configuration
Your actual code may use different variable names. Document all required
variables and keep .env files containing real credentials out of
version control.
API Design
The following is a suggested endpoint outline, not a claim that these
routes already exist. Update it to match the implemented API.
  Method                  Example route                Purpose
  POST                  /api/auth/login            Authenticate a user

  GET                   /api/menus                 Retrieve menus

  GET                   /api/meal-slots            List meal slots

  POST                  /api/bookings              Create a booking or
                                                       opt-in

  PATCH                 /api/bookings/:id/cancel   Request cancellation
                                                       before cutoff

  POST                  /api/check-ins/verify      Verify and redeem a QR
                                                       token

  POST                  /api/scan-events/sync      Submit queued offline
                                                       scan events

  GET                   /api/billing/ledger        Retrieve authorized
                                                       billing records

  GET                   /api/analytics/daily       Retrieve daily
                                                   analytics
Use consistent error responses and ensure each endpoint enforces
authentication, authorization, validation, and the relevant business
rules.
