# TodoList — Full Stack Web & Android Application

A full-stack To-Do List application built using **React, React Native CLI, Node.js, Express, and InfluxDB Cloud**, with automatic Excel-based timestamped activity logging.

The project provides a web application and a native Android application that communicate with the same Express backend. Task operations are stored as timestamped events in InfluxDB Cloud, while an Excel workbook maintains an activity history.

## Features

- Create new tasks from the website or Android application.
- View tasks stored in the shared backend.
- Mark tasks as completed.
- Reopen completed tasks.
- Delete tasks.
- Display task completion progress.
- Refresh the task list to retrieve updates from another platform.
- Store task events in InfluxDB Cloud.
- Automatically log task activities in an Excel (`.xlsx`) workbook.
- Record timestamps, task IDs, actions, test user IDs, and platform information.
- Rebuild the Excel activity log from retained InfluxDB events.
- Use a single VS Code workspace for web, Android, and backend development.

## Technology Stack

| Layer | Technologies |
|---|---|
| Web frontend | React, Vite, TypeScript, CSS |
| Mobile frontend | React Native CLI, TypeScript |
| Mobile platform | Android |
| Backend | Node.js, Express.js |
| Database | InfluxDB Cloud 2.x (TSM, Flux API) |
| Excel logging | ExcelJS |
| API communication | REST API, Fetch API |
| Development tools | VS Code, Android Studio, Node.js, npm |
| Version control | Git and GitHub |

The Android application uses **React Native CLI without Expo**.

## System Architecture

```text
              React + Vite Website
                 localhost:5173
                       |
                       |
                       v
                Express REST API
                 localhost:5000
                       ^
                       |
                       |
             React Native Android App
              (ADB reverse forwarding)

                       |
                       v
                 InfluxDB Cloud
                 Primary Database
                       |
                       v
                Excel Activity Log
                task_activity.xlsx
```

Both frontend applications send requests to the same Express backend.

The backend manages task operations, stores timestamped events in InfluxDB Cloud, and updates the Excel activity log after successful database writes.

## Project Folder Structure

```text
TodoList/
|
|-- android/                     # Native Android configuration
|-- ios/                         # Native iOS project (if generated)
|
|-- App.tsx                      # React Native Android interface
|-- index.js                     # React Native entry point
|-- app.json                     # React Native configuration
|-- babel.config.js
|-- metro.config.js
|-- tsconfig.json
|
|-- web/
|   |-- public/
|   |-- src/
|   |   |-- assets/
|   |   |-- App.tsx              # Website interface and API integration
|   |   |-- App.css              # Website styling
|   |   |-- index.css            # Global styles
|   |   |-- main.tsx             # Website entry point
|   |
|   |-- index.html
|   |-- vite.config.ts
|   |-- package.json
|
|-- backend/
|   |-- src/
|   |   |-- server.js            # Express REST API
|   |   |-- influx.js            # InfluxDB operations
|   |   |-- excel.js             # Excel logging
|   |   |-- sync-excel.js        # Excel synchronization
|   |
|   |-- data/
|   |   |-- task_activity.xlsx   # Generated locally
|   |
|   |-- .env                     # Local credentials (not committed)
|   |-- package.json
|
|-- __tests__/
|-- package.json
|-- package-lock.json
|-- .gitignore
<<<<<<< HEAD
=======
|-- .github/
|   |-- workflows/
|       |-- ci.yml               # GitHub Actions CI pipeline
>>>>>>> 01558f7 (docs: update README and add CI/CD workflow)
|-- README.md
```

Generated folders such as `node_modules`, Android build output, and local environment files should not be committed to Git.

## Prerequisites

Before running this project, install:

1. **Node.js and npm** — use an LTS version compatible with your React Native project.
2. **Git** — for cloning and version control.
3. **Visual Studio Code** — recommended development editor.
4. **Android Studio** — including the Android SDK, platform tools, and a compatible emulator.
5. **Java Development Kit (JDK)** — use the version supported by your React Native and Android Gradle Plugin versions.
6. **InfluxDB Cloud account** — with a TSM 2.x organization, bucket, and API token.

Follow the official [React Native environment setup guide](https://reactnative.dev/docs/set-up-your-environment) for Android SDK, JDK, and environment-variable configuration.

The commands below assume Windows PowerShell.

## Installation

### 1. Clone the repository

```bash
<<<<<<< HEAD
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

Replace the placeholders with your actual GitHub username and repository name after publishing the project.
=======
git clone https://github.com/Kumarsw04/ToDo-List.git
cd ToDo-List
```

This clones the project from the GitHub repository.
>>>>>>> 01558f7 (docs: update README and add CI/CD workflow)

### 2. Install React Native dependencies

From the project root:

```bash
npm install
```

### 3. Install website dependencies

```bash
cd web
npm install
```

### 4. Install backend dependencies

```bash
cd ../backend
npm install
```

If setting up backend dependencies manually, the project uses:

```bash
npm install express cors dotenv @influxdata/influxdb-client exceljs
npm install --save-dev nodemon
```

## InfluxDB Cloud Configuration

Create a `.env` file inside the `backend` directory:

```text
backend/.env
```

Add the following configuration:

```dotenv
PORT=5000

INFLUX_URL=https://YOUR_INFLUXDB_CLOUD_ENDPOINT
INFLUX_TOKEN=YOUR_INFLUXDB_API_TOKEN
INFLUX_ORG=YOUR_ORGANIZATION
INFLUX_BUCKET=todo_tasks
```

Replace the placeholder values with your actual InfluxDB Cloud configuration.

The token must have the appropriate permissions to read and write data in the configured bucket.

**Security:** Never commit `.env`, API tokens, passwords, or private credentials to GitHub.

## How to Run the Project

The backend, website, and Android application run independently but communicate with each other.

You can run everything from **one VS Code window using multiple integrated terminals**.

### Terminal 1 — Start Express Backend

From the project root:

```bash
cd backend
npm run dev
```

The backend runs at:

```text
http://localhost:5000
```

Test the health endpoint:

```text
http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "Backend running",
  "service": "TodoList API"
}
```

### Terminal 2 — Start React Website

From the project root:

```bash
cd web
npm run dev
```

Open the local URL displayed by Vite, normally:

```text
http://localhost:5173
```

The website communicates with the Express API using:

```typescript
const API_URL = 'http://localhost:5000/api';
```

### Terminal 3 — Start React Native Metro

From the project root:

```bash
npx react-native start
```

Keep Metro running while developing the Android application.

### Terminal 4 — Run Android Application

Start your Android emulator or connect an Android device with USB debugging enabled.

Check connected devices:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
```

Configure ADB reverse forwarding:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reverse tcp:5000 tcp:5000
```

This allows the Android application to access the Express backend running on your development computer.

With ADB reverse forwarding enabled, the React Native application uses:

```typescript
const API_URL = 'http://localhost:5000/api';
```

Finally, run:

```bash
npx react-native run-android
```

**Note:** ADB reverse forwarding may need to be configured again after reconnecting or restarting the Android device. `localhost` works in this setup because of the forwarding configuration; it does not automatically work for every physical-device or production deployment.

## REST API Endpoints

Base URL:

```text
http://localhost:5000/api
```

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check backend availability |
| GET | `/tasks` | Retrieve current tasks |
| POST | `/tasks` | Create a new task |
| PATCH | `/tasks/:id` | Complete or reopen a task |
| DELETE | `/tasks/:id` | Delete a task |

### Create Task

**Request**

```http
POST /api/tasks
Content-Type: application/json
x-test-user-id: user-web-01
x-client-source: web
```

```json
{
  "title": "Complete React Native project"
}
```

The backend creates a unique task ID and stores a `created` event.

### Update Task

**Request**

```http
PATCH /api/tasks/TASK_ID
Content-Type: application/json
```

```json
{
  "completed": true
}
```

Set `completed` to `false` to reopen the task.

### Delete Task

**Request**

```http
DELETE /api/tasks/TASK_ID
```

The backend records a `deleted` event in InfluxDB. Deleted tasks are excluded from the current task list, while their retained event history remains available for activity logging.

## InfluxDB Data Storage

InfluxDB Cloud is the primary database.

The application uses an event-based approach, recording task activity in the measurement:

```text
todo_events
```

Each event contains information such as:

| Field | Description |
|---|---|
| taskId | Unique task identifier |
| eventId | Unique event identifier for newly recorded events |
| userId | Test user identifier |
| source | Platform (`web` or `android`) |
| title | Task title |
| action | Task activity |
| _time | Event timestamp |

Supported actions:

- `created`
- `completed`
- `reopened`
- `deleted`

The backend reconstructs the current task list from the recorded events.

**Current limitation:** The implementation queries retained event history to reconstruct task state. This is suitable for a small development project but will need optimization as the dataset grows.

## Automatic Excel Timestamp Logging

In addition to InfluxDB Cloud, the backend maintains an Excel activity workbook:

```text
backend/data/task_activity.xlsx
```

The workbook is created automatically when task events are logged or when the synchronization command runs.

### Excel Columns

| Column | Description |
|---|---|
| Event ID | Unique identifier for the activity event |
| Timestamp (UTC) | Date and time of the event |
| Task ID | Unique task identifier |
| Task Title | Task description |
| Action | Created, completed, reopened, or deleted |
| User ID | Test user responsible for the action |
| Platform | Website or Android application |

Each successful task operation creates a new activity entry instead of overwriting previous events.

### Synchronize Excel with InfluxDB

From the `backend` directory:

```bash
npm run sync:excel
```

This command reads the event history retained in InfluxDB and rebuilds the Excel workbook.

It is useful for recovering missed Excel updates or importing previously stored task events.

**Important notes:**

- Close the Excel workbook before running operations that write to it, because Excel may lock the file.
- InfluxDB remains the primary source of truth.
- Excel synchronization replaces the workbook's generated activity data.
- The workbook is intended for local development and reporting, not as the application's primary database.
- The Excel logging implementation serializes writes within a single Node.js backend process.

## Cross-Platform Synchronization

Both the website and Android application communicate with the same backend.

Example workflow:

1. Create a task on the website.
2. Refresh the Android application to retrieve it.
3. Complete the task on Android.
4. Refresh the website to see the updated status.
5. Delete the task from either platform.
6. Inspect InfluxDB and the Excel activity log to review the recorded events.

The current implementation uses manual refresh or reload to retrieve changes. Real-time synchronization using WebSockets or another push mechanism is not yet implemented.

## Testing the Backend

### Check backend health

```powershell
curl.exe -i http://localhost:5000/api/health
```

### Retrieve tasks

```powershell
curl.exe -i http://localhost:5000/api/tasks
```

### Create a test task using PowerShell

```powershell
$body = @{ title = "Testing Excel Timestamp" } | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:5000/api/tasks" `
  -Method Post `
  -ContentType "application/json" `
  -Headers @{
    "x-test-user-id" = "user-web-01"
    "x-client-source" = "web"
  } `
  -Body $body
```

After successful creation, check:

```text
backend/data/task_activity.xlsx
```

The task creation event should be recorded with its timestamp and source information.

## Troubleshooting

### Website cannot reach the backend

Verify that Express is running on port `5000` and that the frontend API URL matches the backend address.

### Android cannot connect to Express

Verify that the device is connected through ADB, then run:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reverse tcp:5000 tcp:5000
```

For local HTTP development, ensure Android internet permission and the appropriate cleartext traffic configuration are present in `AndroidManifest.xml`.

### InfluxDB requests fail

Check the backend terminal for error details. Verify:

- InfluxDB Cloud endpoint
- API token and permissions
- Organization
- Bucket name
- Internet connectivity

### Excel file is not updating

Ensure the workbook is closed and check the backend terminal for Excel logging warnings.

To rebuild the workbook:

```bash
cd backend
npm run sync:excel
```

### Android application displays a blank screen

Check Metro for JavaScript errors and rebuild the application if necessary:

```bash
npx react-native start --reset-cache
```

In a separate terminal:

```bash
npx react-native run-android
```

<<<<<<< HEAD
=======
## CI/CD — GitHub Actions

The repository includes a GitHub Actions workflow at `.github/workflows/ci.yml`.
It runs on every push to `main`, on pull requests targeting `main`, and when manually started from the **Actions** tab.

| Job | Checks | Output |
|---|---|---|
| Web | `npm ci`, available lint/test scripts, Vite production build | `web-dist` artifact |
| Backend | `npm ci`, JavaScript syntax checks, available tests | Job result |
| Android | `npm ci`, Android SDK/JDK setup, Gradle `assembleDebug` | `android-debug-apk` artifact |

### CI pipeline

```text
Push / Pull Request / Manual Trigger
                 |
                 v
        GitHub Actions CI
                 |
      +----------+----------+
      |          |          |
      v          v          v
    Web       Backend     Android
  checks      checks     APK build
      |          |          |
      v          v          v
  web-dist    Results   debug APK
      +----------+----------+
                 |
                 v
         Review CI results
```

### How to run and inspect the workflow

1. Commit `.github/workflows/ci.yml` and push it to `main`.
2. Open [GitHub Actions](https://github.com/Kumarsw04/ToDo-List/actions).
3. Select **ToDo List CI** to inspect the jobs, or use **Run workflow** to start it manually.
4. After a successful run, download `web-dist` or `android-debug-apk` from the workflow run's **Artifacts** section.

### Build requirements and limitations

- Commit `package-lock.json` in the root, `web/`, and `backend/` so `npm ci` can install reproducibly.
- The Android job uses JDK 17 and NDK `27.1.12297006`; verify these match the project's Android Gradle configuration. Adjust the workflow if the project's React Native version requires a different Java/SDK version.
- Optional lint/test commands run only when corresponding scripts exist. **Skipping an absent test script does not mean tests passed.** Add automated unit and integration tests to strengthen the pipeline.
- CI does not connect to InfluxDB Cloud or write Excel activity data. Integration tests requiring InfluxDB should use dedicated test resources and GitHub Actions secrets.
- The APK is an **unsigned-for-release debug build**, intended for testing, not Google Play distribution.
- **Continuous deployment is not yet configured.** A hosting target, production environment variables, release signing, and deployment credentials are needed before automatic web/backend deployment or Android releases can be enabled.

>>>>>>> 01558f7 (docs: update README and add CI/CD workflow)
## Security and Current Limitations

This project is currently configured for local development and testing.

- `x-test-user-id` is a temporary identifier, not secure authentication.
- Tasks currently belong to a shared task list rather than isolated user accounts.
- The API is not yet protected by authentication and authorization.
- Local HTTP addresses are intended for development only.
- Environment credentials must remain outside version control.
- The Excel workbook is a generated local artifact.
- Event queries and Excel logging will require additional optimization for production-scale workloads.

Do not expose the development backend publicly without implementing appropriate security controls.

## Future Improvements

Potential improvements include:

- User registration and login.
- JWT-based authentication and authorization.
- Separate task lists for individual users.
- Real-time synchronization between website and Android.
- Task priorities, categories, and due dates.
- Search and filtering.
- Improved InfluxDB query performance.
- Excel and CSV export endpoints.
<<<<<<< HEAD
- Automated tests and CI/CD.
=======
- Expanded automated unit and integration tests.
- Automated deployment to production hosting.
>>>>>>> 01558f7 (docs: update README and add CI/CD workflow)
- Production deployment for the website and backend.
- Android release builds.

## License

No license has been specified yet. Add a `LICENSE` file if you intend to define how others may use, modify, or distribute this project.

---

**Project:** TodoList

**Frontend:** React + Vite and React Native CLI

**Backend:** Node.js + Express

**Database:** InfluxDB Cloud 2.x

**Activity Logging:** ExcelJS / Microsoft Excel

**Development Environment:** Visual Studio Code and Android Studio
