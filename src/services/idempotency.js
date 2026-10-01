const IDEMPOTENT_ENDPOINTS = [
  '/properties',
  '/apartments',
  '/shortlets',
  '/shortlets/:id/units',
  '/bookings',
  '/viewings',
  '/tenants',
  '/tenants/assign/:apartmentUnitId',
  '/tenancies',
  '/admin/tenants',
  '/admin/assign-tenant/:id',
];

function normalizeRoute(route = '') {
  return route.replace(/^\/+|\/+$/g, '').replace(/^api\//i, '');
}

function normalizeValue(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => normalizeValue(entry)).join(',')}]`;
  }

  if (typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${normalizeValue(value[key])}`)
      .join(',')}}`;
  }

  return String(value);
}

function stableHash(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    hash ^= code;
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function createIdempotencyKey(endpoint, requestBody) {
  const keySource = `${normalizeRoute(endpoint)}:${normalizeValue(requestBody ?? {})}`;
  return `boscoham-${stableHash(keySource)}`;
}

export function matchesIdempotentRoute(endpoint, method = 'POST') {
  if (method.toUpperCase() !== 'POST') return false;

  const normalizedEndpoint = normalizeRoute(endpoint);

  return IDEMPOTENT_ENDPOINTS.some((pattern) => {
    const routePattern = normalizeRoute(pattern);
    if (routePattern === normalizedEndpoint) return true;

    const regex = new RegExp(`^${routePattern.replace(/:[^/]+/g, '[^/]+')}$`);
    return regex.test(normalizedEndpoint);
  });
}

export function withIdempotencyHeader(endpoint, options = {}, requestBody) {
  const method = (options.method || 'GET').toUpperCase();

  if (!matchesIdempotentRoute(endpoint, method)) {
    return options;
  }

  const headers = { ...(options.headers || {}) };
  const existingKey = headers['Idempotency-Key'] || headers['idempotency-key'];

  if (existingKey) {
    return { ...options, headers };
  }

  return {
    ...options,
    headers: {
      ...headers,
      'Idempotency-Key': createIdempotencyKey(endpoint, requestBody ?? options.body),
    },
  };
}
