# TaskReminder — Push Notification Mobile App (SWE201 Assignment 4)

**TaskReminder** is a React Native (Expo) task management app that demonstrates practical push notification flows for due tasks, daily habit reminders, and server-triggered announcements.

## Domain and main scenario

Users create tasks with due dates and optional daily reminders. The app schedules **local notifications** (due soon, overdue, daily at a chosen time) and registers the device for **remote push notifications** via a Node/Express backend that stores Expo push tokens and calls Expo’s Push API.

Typical flows:

1. Create a task due in 2 hours with a 10-minute reminder → local notification fires before due time.
2. Enable daily reminder at 8:00 PM → recurring local notification.
3. Register device on Settings → backend stores Expo push token.
4. Trigger remote push (from app test UI, curl, or Postman) → device receives server notification; tap opens the relevant screen.

## Notification types

| Type | Trigger | Example |
|------|---------|---------|
| Local — due soon | Scheduled on device | “Task due in 10 minutes” |
| Local — overdue | Scheduled at due time | “Task is now overdue” |
| Local — daily | Daily trigger | “Time to work on …” at 8 PM |
| Remote — server | Backend → Expo Push API | “Your task list was synced” |

## Foreground, background, and tap handling

- **Foreground:** `Notifications.setNotificationHandler` shows system alerts; an in-app toast (`ForegroundToast`) appears for 5 seconds when a notification is received while the app is open.
- **Background / closed:** OS displays the notification in the system tray (standard Expo Notifications behavior).
- **Tap:** `addNotificationResponseReceivedListener` reads `data.taskId` / `data.screen` from the payload and navigates to **Task Detail** (or Home for remote announcements). Cold-start taps are handled via `getLastNotificationResponseAsync()`.

## Android notification channels

Configured in `app/src/notifications/setup.js`:

| Channel ID | Name | Importance | Use |
|------------|------|------------|-----|
| `task-reminders` | Task Reminders | HIGH | Due / overdue alerts |
| `daily-habits` | Daily Habit Reminders | DEFAULT | Recurring daily reminders |

## Rich notification customization

- **Data payload:** Each notification includes `{ taskId, screen, categoryId }` for deep-link navigation.
- **Category identifiers:** `task-due`, `task-overdue`, `daily-reminder`.
- **Android channel + sound:** HIGH-importance channel with default sound and vibration pattern.
- **Expo plugin:** Custom notification icon and accent color in `app.json`.

## Project structure

```
SWE201_A4/
├── app/                    # Expo React Native app
│   ├── src/
│   │   ├── api/            # HTTP client + task storage
│   │   ├── components/
│   │   ├── context/
│   │   ├── navigation/
│   │   ├── notifications/  # Expo Notifications setup
│   │   └── screens/
│   └── App.js
└── backend/                # Node/Express push token store + send API
    └── server.js
```

## Backend

**Technology:** Node.js, Express, JSON file storage (`backend/data/tokens.json`).

### Endpoints

| Method | URL | Auth | Purpose |
|--------|-----|------|---------|
| GET | `/health` | No | Health check |
| POST | `/api/register-token` | No | Register/update device push token and categories |
| GET | `/api/devices/:deviceId` | No | Lookup device registration |
| GET | `/api/devices` | API key | List all registered devices |
| POST | `/api/send-notification` | API key | Send push to one device or category group |

### Setup backend

```bash
cd backend
cp .env.example .env
# Edit .env and set API_KEY to a secret value
npm install
npm start
```

Server runs at `http://localhost:3000`.

### Example: send remote push with curl

Replace `YOUR_API_KEY` and `my-device-1` with values from your `.env` and app config.

**Single device:**

```bash
curl -X POST http://localhost:3000/api/send-notification \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d "{\"target\":\"device\",\"deviceId\":\"my-device-1\",\"title\":\"Assignment reminder\",\"body\":\"Check your overdue tasks.\",\"data\":{\"screen\":\"Home\",\"categoryId\":\"announcements\"}}"
```

**Category group (all devices subscribed to `reminders`):**

```bash
curl -X POST http://localhost:3000/api/send-notification \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d "{\"target\":\"category\",\"category\":\"reminders\",\"title\":\"Weekly digest\",\"body\":\"You have tasks due this week.\"}"
```

## Setup — Expo app

### Prerequisites

- Node.js 18+
- Expo Go on a **physical device** (recommended) or Android emulator
- Backend running (see above)

### Install and run

```bash
cd app
cp .env.example .env
# For physical device: set EXPO_PUBLIC_API_URL to your computer's LAN IP, e.g. http://192.168.1.10:3000
npm install
node scripts/create-assets.js
npm start
```

Press `a` for Android or scan the QR code with Expo Go.

### Expo push token (EAS project ID)

Remote push tokens require an Expo `projectId`:

1. Install EAS CLI: `npm install -g eas-cli`
2. Run `eas login` then `eas init` inside `app/`
3. Copy the generated project ID into `app.json` → `expo.extra.eas.projectId`

Alternatively, use a [development build](https://docs.expo.dev/push-notifications/push-notifications-setup/) for full push support outside Expo Go.

## Configuration

| Variable | Location | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | `app/.env` | Backend base URL |
| `EXPO_PUBLIC_DEVICE_ID` | `app/.env` | Stable device identifier for token storage |
| `API_KEY` | `backend/.env` | Secret for protected send endpoints |
| `PORT` | `backend/.env` | Backend port (default 3000) |

Do **not** commit `.env` files. Sample values are in `.env.example`.

## Screenshots (capture for submission)

1. **Settings screen** — permission banner, push token registration, category toggles.
2. **Task list / detail** — tasks with notification enabled/disabled indicators.
3. **System tray** — notification received on device (local or remote).

Optional 2-minute demo video: create task → schedule reminder → receive notification → tap → navigate to task detail.

## Limitations

- Tested primarily on **Android** (physical device recommended).
- **iOS** requires Apple Developer setup and physical device for push tokens.
- Local notification scheduling requires a real device or emulator — not web.
- Expo Go push tokens require a valid EAS `projectId`.
- Backend uses file-based storage (suitable for demo, not production).

## Assignment checklist

- [x] Create/manage tasks with per-task notification toggle
- [x] Runtime permission request and denied-state messaging
- [x] Local notifications: schedule, cancel, update (reschedule)
- [x] Remote push: Expo token registration + backend storage + send API
- [x] Foreground toast, background tray, tap → navigate with data payload
- [x] Android notification channels (2)
- [x] Rich customization: data payload, categories, channel importance, icon/color
- [x] Protected backend endpoint (API key)
- [x] Organized folders, README, `.env.example`, `.gitignore`
