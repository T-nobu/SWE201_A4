require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'dev-api-key-change-me';
const DATA_DIR = path.join(__dirname, 'data');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');

app.use(cors());
app.use(express.json());

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(TOKENS_FILE)) {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify({ devices: [] }, null, 2));
  }
}

function readStore() {
  ensureDataFile();
  const raw = fs.readFileSync(TOKENS_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeStore(store) {
  ensureDataFile();
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(store, null, 2));
}

function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  next();
}

async function sendExpoPush(messages) {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.errors?.[0]?.message || 'Expo push API request failed');
  }

  return result;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'taskreminder-backend' });
});

app.post('/api/register-token', (req, res) => {
  const { deviceId, expoPushToken, categories = ['reminders'] } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: 'deviceId is required' });
  }

  const store = readStore();
  const existingIndex = store.devices.findIndex((device) => device.deviceId === deviceId);

  const record = {
    deviceId,
    expoPushToken: expoPushToken || store.devices[existingIndex]?.expoPushToken || null,
    categories: Array.isArray(categories) ? categories : ['reminders'],
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    store.devices[existingIndex] = { ...store.devices[existingIndex], ...record };
  } else {
    store.devices.push({ ...record, createdAt: new Date().toISOString() });
  }

  writeStore(store);
  res.json({ success: true, device: record });
});

app.get('/api/devices/:deviceId', (req, res) => {
  const store = readStore();
  const device = store.devices.find((entry) => entry.deviceId === req.params.deviceId);

  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  res.json(device);
});

app.get('/api/devices', requireApiKey, (_req, res) => {
  const store = readStore();
  res.json({ count: store.devices.length, devices: store.devices });
});

/**
 * Protected endpoint to trigger remote push notifications.
 *
 * Body examples:
 * - Single device: { target: "device", deviceId: "...", title, body, data }
 * - Category group: { target: "category", category: "reminders", title, body, data }
 */
app.post('/api/send-notification', requireApiKey, async (req, res) => {
  const { target = 'device', deviceId, category, title, body, data = {} } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'title and body are required' });
  }

  const store = readStore();
  let recipients = [];

  if (target === 'device') {
    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required for target=device' });
    }
    recipients = store.devices.filter((device) => device.deviceId === deviceId);
  } else if (target === 'category') {
    if (!category) {
      return res.status(400).json({ error: 'category is required for target=category' });
    }
    recipients = store.devices.filter((device) => device.categories?.includes(category));
  } else {
    return res.status(400).json({ error: 'target must be device or category' });
  }

  const tokens = recipients
    .map((device) => device.expoPushToken)
    .filter(Boolean);

  if (tokens.length === 0) {
    return res.status(404).json({ error: 'No registered push tokens matched the request' });
  }

  const messages = tokens.map((to) => ({
    to,
    sound: 'default',
    title,
    body,
    data: {
      ...data,
      source: 'backend',
    },
    channelId: data.categoryId === 'announcements' ? 'task-reminders' : 'task-reminders',
  }));

  try {
    const expoResult = await sendExpoPush(messages);
    res.json({
      success: true,
      sent: tokens.length,
      expoResult,
    });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`TaskReminder backend listening on http://localhost:${PORT}`);
  console.log(`Protected routes require header: x-api-key: ${API_KEY === 'dev-api-key-change-me' ? '(set API_KEY in .env)' : '***'}`);
});
