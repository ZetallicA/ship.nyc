# OATH Logistics / InterShip — Full Project Description for Rebuild

This document describes the **OATH Logistics** (also named **InterShip**) internal mail and package tracking system so it can be recreated from scratch (e.g., by another developer or AI). It covers purpose, benefits, design, data model, requirements, challenges, and implementation notes.

---

## 1. Project Overview

**Name:** OATH Logistics (InterShip)  
**Type:** Internal mail & package tracking system (single-organization use).  
**Goal:** Let employees send internal packages, track them end-to-end, and manage offices, users, and drivers—with optional QR scanning, NFC, driver routes, and delivery notifications.

**Core value:** Replace ad-hoc internal mail (sticky notes, spreadsheets, verbal handoffs) with a single app: create shipments, assign tracking numbers, update status (pickup → in transit → delivered), and optionally notify senders and optimize driver routes.

---

## 2. Benefits

- **Visibility:** One place to see status of every internal package (Created → Picked Up → In Transit → Delivered / Returned).
- **Accountability:** Every status change is logged (who, when); optional audit log and proof of delivery.
- **Efficiency:** Drivers can scan QR codes or use manual entry to update status; optional route optimization (TSP) for multiple stops.
- **No external dependencies for auth:** JWT-based login (username/password and optional ID+PIN for drivers); no OAuth/SSO required.
- **Scalable to many offices:** Offices are first-class entities; shipments have origin/sender and destination office; drivers can be assigned to routes.
- **Optional extras:** Email on delivery, NFC tag scanning at locations, proof of delivery (signature/photo), CSV export for admins, print-friendly labels with QR codes.

---

## 3. Design

### 3.1 Architecture

- **Frontend:** Single-page-style web app (Next.js 15, App Router). Serves UI and calls backend API. Can run behind HTTPS (e.g., Cloudflare tunnel) with dynamic API URL based on hostname.
- **Backend:** REST API (FastAPI). Handles auth (JWT), CRUD for users/offices/shipments/events, status updates, NFC, routes, notifications. Stateless except for DB.
- **Database:** MongoDB (single database, e.g. `intership`). No SQL; collections for users, offices, shipments, shipment_events, nfc_tags, nfc_scans, notification_preferences, routes, route_stops, route_assignments, proof_of_delivery, audit_logs.
- **Deployment:** Docker Compose (recommended): services for `mongodb`, `backend`, `frontend`. Optional SSL (certs in `certs/`) for backend 8443 and frontend 3443. Frontend often exposed as 8080→3000, backend 8000 (HTTP) and 9443→8443 (HTTPS).

### 3.2 Tech Stack

| Layer     | Technologies |
|----------|----------------|
| Frontend | Next.js 15, React 18, TypeScript, Tailwind CSS, axios, js-cookie, qrcode.react, date-fns |
| Backend  | Python 3.11+ (avoid 3.13 for pydantic/crypto builds), FastAPI, Uvicorn, PyMongo, python-jose (JWT), passlib (bcrypt), pydantic, python-dotenv, optional: ortools (route optimization), qrcode[pil] |
| Database | MongoDB 7.x (auth: admin/password123, db: intership) |
| Auth     | JWT (HS256), httpOnly-style token storage (e.g. cookie or localStorage), optional PIN login (id_number + 4–8 digit PIN) for drivers |

### 3.3 User Roles

- **Sender:** Create shipments, view own shipments, track by tracking number. Cannot update status.
- **Driver:** View all (or filtered) shipments, update status (Created → PickedUp → InTransit → Delivered / Returned), optional QR scan page, optional NFC scan at locations, complete route stops.
- **Admin:** Full access: users, offices, all shipments, CSV export, timeline view, manage NFC tags, routes; can update any shipment status.
- **Supervisor:** (Optional) Like driver but can manage NFC tags and routes; can update status.

Role is stored on user document; API enforces by role (e.g. only Driver/Admin/Supervisor can call status update).

### 3.4 Data Model (Conceptual)

- **Users:** id, username, password_hash, full_name, role (Sender|Driver|Admin|Supervisor), email (optional), is_active, id_number (optional, for PIN login), pin_hash (optional), created/updated.
- **Offices:** id, name, address, created_date; optional coordinates for route optimization.
- **Shipments:** id, tracking_number (format `PKG-YYYY-NNNNN`), destination_office_id, destination_office_name, recipient_name, package_type (string), urgency (e.g. Normal/Urgent), notes, status (Created|PickedUp|InTransit|Delivered|Returned), sender_id, created_date, last_updated; optional nfc_scan_required, nfc_tag_id, assigned_route_id, route_stop_sequence, proof_of_delivery_id.
- **Shipment events:** tracking_number, event_type (same as status + “Created”), description, timestamp, updated_by (optional).
- **NFC tags:** tag_id (unique), office_id, location_name, coordinates (optional), is_active.
- **NFC scans:** tag_id, driver_id, scan_timestamp, location_coordinates; used to allow driver to update status if nfc_scan_required.
- **Routes:** route_name, assigned_driver_id, route_date, status (Planned|InProgress|Completed|Cancelled), optimized_waypoints, estimated_duration, actual_start_time, actual_end_time.
- **Route stops:** route_id, stop_sequence, office_id, nfc_tag_id, shipment_tracking_numbers[], estimated_arrival, actual_arrival, stop_status (Pending|InProgress|Completed|Skipped).
- **Proof of delivery:** tracking_number, driver_id, recipient_name, delivery_signature (base64/SVG), delivery_photo (optional), delivery_timestamp, delivery_location (lat/lng), notes.
- **Notification preferences:** user_id, notify_on_nfc_scan, notify_on_delivery, notification_methods (e.g. ["email"]), phone_number (optional).
- **Audit logs:** action, user_id, entity_type, entity_id, changes, timestamp, ip_address, user_agent (optional).

### 3.5 UI/UX Design

- **Layout:** Sticky header with logo (“OATH Logistics”), nav links (Dashboard, Send, Track, Mailbox, Admin/Driver by role, Settings), notification bell, logout. Mobile: hamburger menu.
- **Dashboard (logged-in):** Cards or links: Send Package, Track Package, Mailbox; role-specific shortcuts (e.g. Driver → scan page, Admin → admin panel).
- **Login:** Username + password; optional separate flow for ID number + PIN (driver-friendly). Redirect to `/dashboard` after login.
- **Register:** Full name, username, password, role (Sender/Driver/Admin). ID number/PIN set by admin later if needed.
- **Send package (wizard):** Multi-step (e.g. 6 steps): choose destination office, recipient name, package type, urgency (Normal/Urgent), notes; confirm; then show tracking number and print-friendly label with QR code.
- **Track:** Search by tracking number (or recipient/office); show shipment details and event timeline (Created → Picked Up → In Transit → Delivered/Returned) with timestamps and optional “who updated.”
- **Driver scan page:** Manual tracking number input and/or camera QR scan; dropdown to set status; list of recent scan history (e.g. last 20).
- **Admin:** Tabs or sections: Offices (CRUD), Users (list, create, edit, deactivate, assign ID/PIN), Shipments (list with filters: status, date range, office; CSV export; timeline modal per shipment).
- **Settings:** User profile, change password, change PIN (if id_number set), notification preferences.
- **Theming:** Tailwind; primary blue (#2563eb), orange, purple in palette; clean, form-based UIs; print-friendly label page (no nav, just label + QR).

### 3.6 API Base URL and CORS

- API mounted under `/api` (e.g. `http://localhost:8000/api`). Frontend uses `NEXT_PUBLIC_API_URL` or derives from `window.location` (e.g. same host, port 8000 for HTTP or 9443 for HTTPS).
- CORS: allow credentials; allow origins for localhost, 127.0.0.1, and any dev/prod frontend origins (or temporarily allow all for dev). Backend reads CORS_ORIGINS and optional CORS_ALLOW_ALL.

---

## 4. Functional Requirements

### 4.1 Authentication

- Register: username (letters, numbers, underscore, hyphen), password, full_name, role; optional email. Reject duplicate username/email.
- Login: POST with username + password → JWT access_token. Optional: POST with id_number + pin → JWT (driver PIN login).
- GET /auth/me: return current user (from JWT); used for session check and role.
- Password change: PUT /auth/password (current_password, new_password); require current password.
- PIN: PUT /auth/pin { pin } (4–8 digits); user must have id_number set (by admin).

### 4.2 Offices (Admin)

- List offices: GET /offices.
- Create office: POST /offices (name, address).
- Update/delete office: PUT/DELETE /offices/{id}. Consider not allowing delete if shipments reference it.

### 4.3 Shipments

- Create: POST /shipments (destination_office_id, recipient_name, package_type, urgency, notes). Require auth. Generate tracking_number = `PKG-{year}-{5-digit sequence}`. Initial status “Created”; create first event. Return full shipment (with destination_office_name, etc.).
- List: GET /shipments (optional query: status, office_id, search). Sender: only own; Driver: all (or filtered); Admin: all.
- Get my shipments: GET /shipments/my (sender’s own).
- Get one: GET /shipments/{tracking_number} (can be unauthenticated for public tracking if desired, or require auth).
- Get events: GET /events/{tracking_number} (ordered by timestamp).
- Update status: PUT /shipments/{tracking_number}/status { status }. Allowed statuses: Created, PickedUp, InTransit, Delivered, Returned. Only Driver/Admin/Supervisor. If shipment has nfc_scan_required and nfc_tag_id, driver must have a recent NFC scan for that tag (e.g. within 30 minutes). On “Delivered,” optionally send email to sender (if SMTP configured and sender has email). Append event with event_type = status, description, updated_by.

### 4.4 Users (Admin)

- List users: GET /users (Admin only).
- Update user: PUT /users/{user_id} (username, email, full_name, role, is_active, id_number). Allow admin to set id_number for PIN login.
- Delete/deactivate user: DELETE /users/{user_id} or set is_active = false.

### 4.5 NFC (Optional)

- Create/list/get/update/delete NFC tags (Admin/Supervisor): tag_id, office_id, location_name, coordinates, is_active.
- Scan: POST /nfc/scan { tag_id, coordinates }. Record scan (driver_id, timestamp); return success and optional “valid for 30 minutes” for status updates. Notify supervisors/admins if configured.

### 4.6 Routes (Driver/Admin/Supervisor)

- Create route: POST /routes (route_name, shipment_tracking_numbers[], driver_id, route_date). Create route_stops from shipments’ destination offices; optionally call route optimizer.
- List routes: GET /routes (filter by driver, date, status).
- Get route: GET /routes/{id}; GET /routes/{id}/stops for stops.
- Update/delete route: PUT/DELETE /routes/{id}.
- Start route: POST /routes/{id}/start (set status InProgress, actual_start_time).
- Complete stop: POST /routes/{id}/complete-stop (stop_sequence or stop_id); update stop_status; optionally update shipment statuses.
- Complete route: POST /routes/{id}/complete (actual_end_time, status Completed).
- Optimize: POST /routes/optimize (body with offices/shipments); return waypoints order, estimated_duration, distance (optional: use ortools TSP; fallback: same order if ortools missing).

### 4.7 Proof of Delivery (Optional)

- When marking Delivered, optionally accept signature (base64/SVG) and photo; create proof_of_delivery document; link to shipment (proof_of_delivery_id). GET endpoint for proof if needed.

### 4.8 Notifications

- Notification preferences: GET/PUT /users/me/notification-preferences (notify_on_nfc_scan, notify_on_delivery, notification_methods, phone_number).
- On delivery: if SMTP configured and sender email exists, send HTML email (tracking number, recipient, delivery time, sender name).

### 4.9 Admin Reporting

- Stats: GET /stats (counts by status, today’s deliveries, etc.) for dashboard.
- CSV export: admin shipments list filtered by status/date/office, export as CSV (tracking_number, status, recipient, destination, package_type, urgency, sender, created_date).
- Timeline view: per shipment, show all events (same as GET /events/{tracking_number}) in a modal or inline.

### 4.10 Health

- GET /health: return { status: "healthy" } for liveness/load balancer.

---

## 5. Non-Functional Requirements

- **Security:** Passwords and PINs hashed with bcrypt (e.g. rounds=12). JWT secret from env; never commit. Validate input (username format, status enum, object ids).
- **Availability:** Backend and frontend should start without requiring external auth provider. MongoDB can be single instance for small/medium scale.
- **Portability:** Run via Docker Compose on one machine; support Linux and Windows (PowerShell) for scripts.
- **Browser support:** Modern browsers; camera/QR for driver scan (HTTPS in production); NFC optional (Android; iOS limited).
- **Responsive UI:** Mobile-friendly driver scan and tracking; desktop for admin and send wizard.
- **Print:** One page per shipping label; include QR code (tracking number or URL); minimal chrome for printing.

---

## 6. Challenges and Pitfalls

- **Python 3.13:** pydantic/cryptography stack may require Rust toolchain or pre-built wheels; prefer Python 3.11 or 3.12 for backend.
- **Docker daemon:** Full stack (MongoDB + backend + frontend) needs Docker running; otherwise run MongoDB and backend/frontend manually and point to localhost.
- **CORS and credentials:** Use allow_credentials=True and explicit origins (or allow_origin_regex) rather than allow_origins=["*"] with credentials.
- **API URL in frontend:** Frontend must know backend URL (env or host-based); handle both HTTP (e.g. 8000) and HTTPS (e.g. 9443) and different hostnames (localhost vs IP vs production domain).
- **NFC scan enforcement:** If nfc_scan_required is true, backend must check for a recent scan by the same driver for the shipment’s nfc_tag_id before allowing status update; 30-minute window is a common choice.
- **Tracking number uniqueness:** Generate next number per year (e.g. last document with `PKG-{year}-*`, sort by created_date desc, increment).
- **Role checks:** Enforce on every endpoint (e.g. Sender cannot call status update; Admin can do everything).
- **Next.js App Router:** Ensure all routes that should be reachable have a `page.tsx` (or `page.js`); missing app/router pages yield 404.
- **Loading and auth context:** Provide an auth context (user, login, logout) and optional loading provider so nav and protected pages can show correct state and redirect unauthenticated users to login.

---

## 7. Environment Variables

**Backend**

- `MONGODB_URL` (default: mongodb://admin:password123@localhost:27017/intership?authSource=admin)
- `JWT_SECRET`, `JWT_ALGORITHM` (e.g. HS256), `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` (e.g. 30)
- `CORS_ORIGINS` (comma-separated), `CORS_ALLOW_ALL` (true/false)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` (optional; for delivery emails)

**Frontend**

- `NEXT_PUBLIC_API_URL` (e.g. http://localhost:8000/api); can be overridden at runtime via host-based logic.

**Docker Compose**

- Backend: MONGODB_URL, JWT_*, CORS_*; Frontend: NEXT_PUBLIC_API_URL (e.g. http://localhost:8000/api when using host port 8080).

---

## 8. File and Route Structure (Reference)

**Backend (e.g. `backend/`)**

- `main.py`: FastAPI app, all routes, Pydantic models, DB connection, auth helpers (password hash, JWT, get_current_user), CORS, health, auth, offices, shipments, events, users, stats, NFC, notification preferences, routes, route stops, optimize, proof of delivery, audit log, send_delivery_email.
- `requirements.txt`: fastapi, uvicorn, pymongo, python-jose[cryptography], passlib[bcrypt], pydantic, pydantic-settings, python-dotenv, python-multipart, email-validator; optional ortools, qrcode[pil].
- `services/route_optimizer.py`: Optional; ortools TSP; input list of offices (with coordinates), output waypoints order, estimated_duration, distance; fallback if not installed.

**Frontend (e.g. `frontend/`)**

- `src/app/layout.tsx`: Root layout; AuthProvider + LoadingProvider (or equivalent); globals.css.
- `src/app/page.tsx`: Redirect `/` to `/dashboard`.
- `src/app/dashboard/page.tsx`: Protected; show Send / Track / Mailbox cards; link to driver scan and admin by role.
- `src/app/login/page.tsx`: Login form (username/password); optional PIN login entry; redirect if already logged in.
- `src/app/register/page.tsx`: Register form; redirect if logged in.
- `src/app/send/*`: Multi-step send wizard; final step shows tracking number and printable label with QR.
- `src/app/track/page.tsx`: Search (tracking number/recipient/office); show shipment and event timeline.
- `src/app/mailbox/page.tsx`: Placeholder or list of incoming packages for current user/office.
- `src/app/driver/page.tsx`: Driver dashboard; link to `/driver/scan`.
- `src/app/driver/scan/page.tsx`: QR scan (camera + BarcodeDetector or manual entry); status dropdown; update status; scan history.
- `src/app/admin/page.tsx`: Tabs for Offices, Users, Shipments (filters, CSV export, timeline modal).
- `src/app/settings/page.tsx`: Profile, password, PIN, notification preferences.
- `src/hooks/useAuth.tsx`: Auth context (user, loading, login, loginPIN, register, logout, updatePassword, updatePIN).
- `src/lib/axios.ts`: Axios instance; baseURL from env or host; attach JWT (e.g. from cookie); optional retry and health check.
- Components: Navigation, SearchBar, NotificationBell, AuthProvider, PINPad (optional), NFCScanner (optional), PageHeader, LoadingLink, HideDevIndicators, HelpTooltip.

**Docker**

- `docker-compose.yml`: services mongodb (mongo:7.0, volume, healthcheck), backend (build backend/, ports 8000, 9443→8443, env, depends_on mongodb), frontend (build frontend/, ports 8080→3000, 9444→3443, env, depends_on backend). Optional: certs mount for HTTPS.
- Optional `docker-compose.dev.yml` for overrides (e.g. different ports or env for dev).

---

## 9. Deployment Summary

- **Local:** `docker compose up --build -d` (or `docker-compose`). Frontend: http://localhost:8080 (or 3000); Backend: http://localhost:8000/api; MongoDB: localhost:27017.
- **Production:** Same Compose; set JWT_SECRET, MONGODB_URL, CORS_ORIGINS, SMTP; use HTTPS and reverse proxy or Cloudflare tunnel as needed. Branch strategy: e.g. main → production, develop → staging (see DEVELOPMENT-WORKFLOW.md).

---

## 10. Testing and Validation Checklist

- Register → Login → Create shipment → Get tracking number → Print label (QR visible).
- Track by tracking number (with and without auth as designed).
- Driver: update status through scan page (manual or QR); confirm event timeline and optional email on Delivered.
- Admin: create office, create user, assign id_number; set PIN; login with PIN; list/filter shipments; export CSV; view timeline.
- NFC (if implemented): create tag, scan as driver, then update shipment that requires that tag.
- Route: create route, optimize (if ortools present), start, complete stop, complete route.
- Settings: change password, change PIN, notification preferences.
- Unauthenticated access to protected routes redirects to login; wrong role returns 403.

---

This document, plus the existing README, DEVELOPMENT-WORKFLOW, NEW-FEATURES-SUMMARY, and IMPROVEMENTS-ANALYSIS, should be enough to recreate the project from scratch with the same scope, design, and behavior.
