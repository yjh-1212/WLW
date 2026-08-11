export class ApiClient {
  constructor({ baseUrl = '/api', timeout = 8000 } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeout = timeout;
    this.controllers = new Set();
  }

  async get(path, params = {}) {
    const controller = new AbortController();
    this.controllers.add(controller);
    const timer = window.setTimeout(() => controller.abort('timeout'), this.timeout);
    const url = new URL(`${this.baseUrl}${path}`, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    });
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.json();
    } finally {
      window.clearTimeout(timer);
      this.controllers.delete(controller);
    }
  }

  cancelAll() {
    this.controllers.forEach((controller) => controller.abort('cancelled'));
    this.controllers.clear();
  }
}
