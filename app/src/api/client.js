import { API_BASE_URL, DEVICE_ID } from '../config';

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error || data.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export async function registerPushToken(expoPushToken, categories = ['reminders']) {
  return request('/api/register-token', {
    method: 'POST',
    body: JSON.stringify({
      deviceId: DEVICE_ID,
      expoPushToken,
      categories,
    }),
  });
}

export async function updateDeviceCategories(categories) {
  return request('/api/register-token', {
    method: 'POST',
    body: JSON.stringify({
      deviceId: DEVICE_ID,
      categories,
    }),
  });
}

export async function getDeviceInfo() {
  return request(`/api/devices/${encodeURIComponent(DEVICE_ID)}`);
}

export async function sendTestRemoteNotification(apiKey, payload) {
  return request('/api/send-notification', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });
}

export { DEVICE_ID };
