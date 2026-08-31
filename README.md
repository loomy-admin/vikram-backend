# Student Learning Platform — Backend API (V1)

Production-ready Node.js, Express, TypeScript, and PostgreSQL backend service built with Prisma ORM for the V1 Student Learning Platform.

---

## 🛠 Technology Stack

* **Runtime:** Node.js (>=18.0.0)
* **Language:** TypeScript
* **Web Framework:** Express.js (v4.x)
* **Database & ORM:** PostgreSQL & Prisma ORM
* **Authentication:**
  * **Students:** Passwordless OTP-based authentication (6-digit hashed OTPs with rate-limiting & cooldown)
  * **Admins:** Email + bcrypt password hashing + JWT access tokens
* **Validation:** Zod schema validation middleware
* **Security & Utilities:** Helmet, CORS, Morgan HTTP logger, Multer file upload storage abstraction
* **Database Name:** `student_learning`

---

## 📁 Project Architecture & Directory Structure

```text
backend/
├── src/
│   ├── config/              # App environment and Prisma client singleton
│   │   ├── index.ts
│   │   └── prisma.ts
│   ├── constants/           # Error codes, pagination constants
│   │   └── index.ts
│   ├── types/               # TypeScript interfaces and request extensions
│   │   └── index.ts
│   ├── utils/               # Logger, response helpers, JWT, 10-digit code generator
│   │   ├── codeGenerator.ts
│   │   ├── jwt.ts
│   │   ├── logger.ts
│   │   └── response.ts
│   ├── validators/          # Zod validation schemas
│   │   ├── accessCode.validator.ts
│   │   ├── admin.validator.ts
│   │   ├── auth.validator.ts
│   │   ├── content.validator.ts
│   │   └── school.validator.ts
│   ├── services/            # Business and database logic
│   │   ├── accessCode.service.ts
│   │   ├── admin.service.ts
│   │   ├── auth.service.ts
│   │   ├── content.service.ts
│   │   ├── dashboard.service.ts
│   │   ├── otp.service.ts
│   │   ├── school.service.ts
│   │   ├── storage.service.ts
│   │   └── student.service.ts
│   ├── middleware/          # JWT auth, validation, error, and upload middlewares
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── upload.middleware.ts
│   │   └── validate.middleware.ts
│   ├── controllers/         # HTTP request handlers
│   │   ├── accessCode.controller.ts
│   │   ├── admin.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── content.controller.ts
│   │   └── student.controller.ts
│   ├── routes/              # Express API route declarations
│   │   ├── accessCode.routes.ts
│   │   ├── admin.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── index.ts
│   │   └── student.routes.ts
│   ├── app.ts               # Express application initialization
│   └── server.ts            # Server entry point with graceful shutdown
│
├── prisma/
│   ├── schema.prisma        # PostgreSQL database schema & relational models
│   └── seed.ts              # Seed script with realistic development data
│
├── uploads/                 # Local storage placeholder for uploaded media
├── postman_collection.json  # Complete Postman collection
├── .env.example             # Environment configuration template
├── .gitignore
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🚀 Quickstart & Setup Guide

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and adjust the PostgreSQL connection string:

```bash
cp .env.example .env
```

Example `.env`:

```env
PORT=5000
NODE_ENV=development

# PostgreSQL Connection String
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/student_learning"

JWT_SECRET="super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=60
ENABLE_DEV_OTP=true
DEV_STATIC_OTP="123456"

STORAGE_TYPE="local"
UPLOAD_DIR="./uploads"
BASE_URL="http://localhost:5000"

CORS_ORIGIN="*"
```

### 3. Generate Prisma Client & Run Migrations

```bash
# Generate the Prisma TypeScript client
npm run prisma:generate

# Apply migrations to PostgreSQL database
npm run prisma:migrate
```

### 4. Seed Database with Initial Data

```bash
npm run prisma:seed
```

The seed script initializes:
* **Admin User:** `admin@example.com` / `Admin@123456`
* **Schools:** Greenwood High School (`GWH001`), St. Jude Academy (`SJA002`), Oakridge Global School (`OGS003`)
* **Classes:** Class 6, Class 7, Class 8
* **Curriculum (Class 6):**
  * Mathematics $\rightarrow$ Number System $\rightarrow$ Factors and Multiples (Video, PDF, Image, Web Link)
  * Science $\rightarrow$ Light, Shadows & Reflections $\rightarrow$ Propagation of Light
  * English $\rightarrow$ Sentence Structure $\rightarrow$ Active and Passive Voice
* **Sample Students:** Alex Johnson (`ACTIVE`), Emma Watson (`PENDING`), Lucas Miller (`INACTIVE`)
* **Sample 10-Digit Access Codes:** `1029384756` (USED), `2048591736`, `3859201745`, `4920183756`, `5019283746` (UNUSED)

### 5. Start Development Server

```bash
npm run dev
```

Server will run on `http://localhost:5000`.

---

## 🔐 Core Authentication & Business Logic

### 1. Student Passwordless OTP Authentication Flow

1. Student requests OTP with `POST /api/auth/student/request-otp` passing either `email` or `phone`.
2. A 6-digit numeric OTP is generated, hashed via `bcrypt`, and stored with an expiration timestamp and attempt limit. In development mode (`ENABLE_DEV_OTP=true`), static/dev OTP `123456` is accepted or returned.
3. Student submits OTP with `POST /api/auth/student/verify-otp`:
   * **Existing Student:** Returns student profile, current status (`PENDING`, `ACTIVE`, `INACTIVE`), and a student JWT token.
   * **New Student:** Returns `isNewStudent: true` and a temporary `verificationToken` valid for completing registration details.
4. Unregistered student completes details with `POST /api/students/register` (specifying `name`, `schoolId`, `classId`). The account is created with `status: PENDING`.

### 2. 10-Digit Access Code Activation (Atomic Transaction)

1. Authenticated student with `PENDING` status submits their 10-digit numeric access code to `POST /api/access-codes/activate`.
2. An atomic Prisma transaction verifies:
   * Code is exactly 10 digits.
   * Code exists in the database.
   * If code is `INACTIVE` $\rightarrow$ returns `400` with code `ACCESS_CODE_INACTIVE`.
   * If code is `USED` $\rightarrow$ returns `400` with code `ACCESS_CODE_ALREADY_USED`.
   * If code is `UNUSED` $\rightarrow$ marks code `USED`, links `studentId`, timestamps `usedAt`, and sets student `status` to `ACTIVE`.

### 3. Curriculum Access Scoping

* Endpoints under `/api/student/home`, `/api/student/subjects`, `/api/student/chapters`, `/api/student/topics`, and `/api/student/content` are protected by `activeStudentAuthMiddleware`.
* Only students with `status: ACTIVE` can access learning content.
* Returned curriculum is automatically filtered to the student's registered `classId` (e.g. Class 6 students only receive Class 6 subjects).

---

## 📡 API Reference

### Health Check

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Check API server and database status |

---

### Student Authentication & Profile

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/student/request-otp` | Public | Request 6-digit OTP via email or phone |
| `POST` | `/api/auth/student/verify-otp` | Public | Verify OTP, returns student JWT or reg token |
| `POST` | `/api/students/register` | Reg Token | Register student name, schoolId, classId (`PENDING`) |
| `GET` | `/api/student/me` | Student | Get authenticated student profile & activation status |
| `POST` | `/api/access-codes/activate` | Student | Activate student account using 10-digit access code |

---

### Student Learning Curriculum & Progress

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/student/home` | Active Student | Home dashboard with subjects, progress stats, & resume learning |
| `GET` | `/api/student/subjects` | Active Student | List active subjects for student's class |
| `GET` | `/api/student/subjects/:id/chapters` | Active Student | List active chapters for a subject |
| `GET` | `/api/student/chapters/:id/topics` | Active Student | List active topics for a chapter |
| `GET` | `/api/student/topics/:id` | Active Student | Get topic details + visible content items & completion status |
| `GET` | `/api/student/content/:id` | Active Student | Get content metadata and stream/access URL |
| `POST` | `/api/student/content/:id/access` | Active Student | Log last accessed timestamp |
| `POST` | `/api/student/content/:id/complete` | Active Student | Mark content item completed |
| `GET` | `/api/student/recent-content` | Active Student | Retrieve recently accessed content list |

---

### Admin Authentication & Dashboard

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/admin/login` | Public | Admin login with email & password |
| `POST` | `/api/auth/admin/change-password` | Admin | Change admin password |
| `GET` | `/api/auth/admin/me` | Admin | Get current admin profile |
| `GET` | `/api/admin/dashboard` | Admin | Aggregate dashboard statistics |

---

### Admin School Management

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/schools` | Admin | Create a new school |
| `GET` | `/api/admin/schools` | Admin | List schools with search, status filter & pagination |
| `GET` | `/api/admin/schools/:id` | Admin | Get single school details |
| `PUT` | `/api/admin/schools/:id` | Admin | Update school details |
| `PATCH` | `/api/admin/schools/:id/status` | Admin | Update school status (`ACTIVE` / `INACTIVE`) |
| `GET` | `/api/admin/schools/:id/students` | Admin | List all students in school |
| `GET` | `/api/admin/schools/:id/access-codes` | Admin | List all access codes in school |

---

### Admin Student Management

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/students` | Admin | Search/filter students by name, email, phone, school, class, status |
| `GET` | `/api/admin/students/:id` | Admin | Get student details and access history |
| `PATCH` | `/api/admin/students/:id/status` | Admin | Update student status (`PENDING`, `ACTIVE`, `INACTIVE`) |

---

### Admin Access Code Management

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/access-codes` | Admin | Generate 1 unique 10-digit access code |
| `POST` | `/api/admin/access-codes/bulk` | Admin | Generate bulk 10-digit access codes (e.g. 100 codes) |
| `GET` | `/api/admin/access-codes` | Admin | List codes with search, school, status, used/unused filters |
| `GET` | `/api/admin/access-codes/:id` | Admin | Get code details |
| `PATCH` | `/api/admin/access-codes/:id/status` | Admin | Update code status (`UNUSED` / `INACTIVE`) |
| `PUT` | `/api/admin/access-codes/:id/reassign` | Admin | Reassign unused code to a different school |

---

### Admin Curriculum & Content Management

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/classes` | Admin | List classes |
| `POST` | `/api/admin/classes` | Admin | Create class |
| `PUT` | `/api/admin/classes/:id` | Admin | Update class |
| `POST` | `/api/admin/subjects` | Admin | Create subject |
| `GET` | `/api/admin/subjects` | Admin | List subjects |
| `GET` | `/api/admin/subjects/:id` | Admin | Get subject details |
| `PUT` | `/api/admin/subjects/:id` | Admin | Update subject |
| `DELETE` | `/api/admin/subjects/:id` | Admin | Delete subject |
| `POST` | `/api/admin/chapters` | Admin | Create chapter |
| `GET` | `/api/admin/chapters` | Admin | List chapters |
| `GET` | `/api/admin/chapters/:id` | Admin | Get chapter details |
| `PUT` | `/api/admin/chapters/:id` | Admin | Update chapter |
| `DELETE` | `/api/admin/chapters/:id` | Admin | Delete chapter |
| `POST` | `/api/admin/topics` | Admin | Create topic |
| `GET` | `/api/admin/topics` | Admin | List topics |
| `GET` | `/api/admin/topics/:id` | Admin | Get topic details |
| `PUT` | `/api/admin/topics/:id` | Admin | Update topic |
| `DELETE` | `/api/admin/topics/:id` | Admin | Delete topic |
| `POST` | `/api/admin/content` | Admin | Register content item (VIDEO, PDF, IMAGE, WEB_LINK) |
| `GET` | `/api/admin/content` | Admin | List content items with filters |
| `GET` | `/api/admin/content/:id` | Admin | Get content item details |
| `PUT` | `/api/admin/content/:id` | Admin | Update content details |
| `PATCH` | `/api/admin/content/:id/visibility` | Admin | Update visibility (`VISIBLE` / `HIDDEN`) |
| `DELETE` | `/api/admin/content/:id` | Admin | Delete content item |
| `POST` | `/api/admin/content/upload` | Admin | Upload media file (multipart/form-data) |

---

### Admin User Management

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/users` | Admin | Create new admin user |
| `GET` | `/api/admin/users` | Admin | List admin users |
| `GET` | `/api/admin/users/:id` | Admin | Get admin user details |
| `PUT` | `/api/admin/users/:id` | Admin | Update admin user |
| `PATCH` | `/api/admin/users/:id/status` | Admin | Update admin user status (`ACTIVE` / `INACTIVE`) |

---

## 🛡️ Standard Error Response Format

All error responses adhere to a consistent JSON structure:

```json
{
  "success": false,
  "message": "This access code has already been activated by another student.",
  "code": "ACCESS_CODE_ALREADY_USED"
}
```

### Key Error Codes

* `INVALID_CREDENTIALS` (401)
* `UNAUTHORIZED` (401)
* `FORBIDDEN` (403)
* `OTP_INVALID` (400)
* `OTP_EXPIRED` (400)
* `OTP_MAX_ATTEMPTS_EXCEEDED` (400)
* `OTP_RESEND_WAIT` (429)
* `STUDENT_PENDING_APPROVAL` (403)
* `STUDENT_INACTIVE` (403)
* `ACCESS_CODE_INVALID` (400)
* `ACCESS_CODE_ALREADY_USED` (400)
* `ACCESS_CODE_INACTIVE` (400)
* `ACCESS_CODE_CANNOT_REASSIGN_USED` (400)
* `VALIDATION_ERROR` (400)
* `RESOURCE_NOT_FOUND` (404)

---

## 📦 Production Build & Deployment

```bash
# Compile TypeScript to dist/
npm run build

# Run database migrations in production
npx prisma migrate deploy

# Start production server
npm start
```
