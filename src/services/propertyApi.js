import { withIdempotencyHeader } from './idempotency.js';

const API_BASE_URL = import.meta.env.DEV
    ? '/api'
    : 'https://api.boscoham.homes/api';
const WHATSAPP_NUMBER = '2347049109862';

function serializeFormData(formData) {
    const payload = {};

    for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
            payload[key] = {
                name: value.name,
                size: value.size,
                type: value.type,
                lastModified: value.lastModified,
            };
            continue;
        }

        payload[key] = value;
    }

    return payload;
}

async function requestJson(endpoint, options = {}, resourceName = 'request') {
    const bodyForIdempotency = options.body instanceof FormData
        ? serializeFormData(options.body)
        : options.body;

    const requestOptions = withIdempotencyHeader(endpoint, options, bodyForIdempotency);
    const headers = new Headers(requestOptions.headers || {});

    if (!(requestOptions.body instanceof FormData) && !headers.has('Content-Type') && requestOptions.body !== undefined) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...requestOptions,
        credentials: 'include',
        headers,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.status === 'fail') {
        const error = new Error(payload.message || `Failed to submit ${resourceName}`);
        error.status = response.status;
        throw error;
    }

    return payload;
}

async function requestCollection(endpoint, resourceName) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { credentials: 'include' });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.status === 'fail') {
        throw new Error(payload.message || `Failed to fetch ${resourceName}`);
    }

    const data = payload.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[resourceName])) return data[resourceName];
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(payload[resourceName])) return payload[resourceName];

    return [];
}

function getImageUrl(images) {
    if (typeof images === 'string') return images;
    if (!Array.isArray(images)) return undefined;
    const image = images.find((item) => item?.image || item?.image_url || item?.url || typeof item === 'string');
    return typeof image === 'string' ? image : image?.image || image?.image_url || image?.url;
}

function formatLocation(...parts) {
    return parts.filter(Boolean).join(', ');
}

function formatPrice(price, suffix = '') {
    if (price === undefined || price === null || price === '') return 'Price on request';
    if (typeof price === 'number') return `N${price.toLocaleString()}${suffix}`;
    return `${price}${suffix}`;
}

function normalizeFeatures(features) {
    if (Array.isArray(features)) {
        return features.filter((feature) => typeof feature === 'string' && feature.trim());
    }

    if (typeof features === 'string') {
        try {
            return normalizeFeatures(JSON.parse(features));
        } catch {
            return features.trim() ? [features.trim()] : [];
        }
    }

    return [];
}

export async function healthCheck() {
    return requestJson('/health', { method: 'GET' }, 'health check');
}

export function fetchProperties() {
    return requestCollection('/properties', 'properties');
}

export function fetchPropertyById(propertyId) {
    return requestJson(`/properties/${propertyId}`, { method: 'GET' }, 'property');
}

export function createProperty(formData) {
    return requestJson('/properties', { method: 'POST', body: formData }, 'create property');
}

export function updateProperty(propertyId, formData) {
    return requestJson(`/properties/${propertyId}`, { method: 'PATCH', body: formData }, 'update property');
}

export function deleteProperty(propertyId) {
    return requestJson(`/properties/${propertyId}`, { method: 'DELETE' }, 'delete property');
}

export function fetchApartments() {
    return requestCollection('/apartments', 'apartments');
}

export function fetchApartmentById(apartmentId) {
    return requestJson(`/apartments/${apartmentId}`, { method: 'GET' }, 'apartment');
}

export function createApartment(formData) {
    return requestJson('/apartments', { method: 'POST', body: formData }, 'create apartment');
}

export function updateApartment(apartmentId, formData) {
    return requestJson(`/apartments/${apartmentId}`, { method: 'PATCH', body: formData }, 'update apartment');
}

export function deleteApartment(apartmentId) {
    return requestJson(`/apartments/${apartmentId}`, { method: 'DELETE' }, 'delete apartment');
}

export function updateApartmentUnit(apartmentId, unitId, payload) {
    return requestJson(`/apartments/${apartmentId}/units/${unitId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    }, 'update apartment unit');
}

export function deleteApartmentUnit(apartmentId, unitId) {
    return requestJson(`/apartments/${apartmentId}/units/${unitId}`, { method: 'DELETE' }, 'delete apartment unit');
}

export function fetchShortlets() {
    return requestCollection('/shortlets', 'shortlets');
}

export function fetchShortletById(shortletId) {
    return requestJson(`/shortlets/${shortletId}`, { method: 'GET' }, 'shortlet');
}

export function createShortlet(formData) {
    return requestJson('/shortlets', { method: 'POST', body: formData }, 'create shortlet');
}

export function updateShortlet(shortletId, formData) {
    return requestJson(`/shortlets/${shortletId}`, { method: 'PATCH', body: formData }, 'update shortlet');
}

export function deleteShortlet(shortletId) {
    return requestJson(`/shortlets/${shortletId}`, { method: 'DELETE' }, 'delete shortlet');
}

export function fetchShortletUnits(shortletId) {
    return requestCollection(`/shortlets/${shortletId}/units`, 'units');
}

export function createShortletUnit(shortletId, payload) {
    return requestJson(`/shortlets/${shortletId}/units`, {
        method: 'POST',
        body: JSON.stringify(payload),
    }, 'create shortlet unit');
}

export function updateShortletUnit(shortletId, unitId, payload) {
    return requestJson(`/shortlets/${shortletId}/units/${unitId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    }, 'update shortlet unit');
}

export function deleteShortletUnit(shortletId, unitId) {
    return requestJson(`/shortlets/${shortletId}/units/${unitId}`, { method: 'DELETE' }, 'delete shortlet unit');
}

export async function getCurrentUser() {
    try {
        const payload = await requestJson('/auth/me', { method: 'GET' }, 'load current user');
        return payload.data?.user || payload.data || payload.user || null;
    } catch (error) {
        if (error.status === 401 || error.status === 403) return null;
        throw error;
    }
}

export function signup({ firstName, lastName, email, password, confirmPassword }) {
    return requestJson('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email,
            password,
            confirmPassword,
        }),
    }, 'sign up');
}

export function login({ email, password }) {
    return requestJson('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    }, 'log in');
}

export function logout() {
    return requestJson('/auth/logout', { method: 'POST' }, 'log out');
}

export function forgotPassword(email) {
    return requestJson('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    }, 'forgot password');
}

export function resetPassword({ token, password, confirmPassword }) {
    return requestJson(`/auth/reset-password/${token}`, {
        method: 'POST',
        body: JSON.stringify({ password, confirmPassword }),
    }, 'reset password');
}

export function fetchBookings() {
    return requestCollection('/bookings', 'bookings');
}

export function createBooking({ resourceId, name, notes, checkIn, checkOut, amount }) {
    const nameParts = name.trim().split(/\s+/);

    return requestJson('/bookings', {
        method: 'POST',
        body: JSON.stringify({
            shortlet_unit_id: resourceId,
            first_name: nameParts.shift() || name,
            last_name: nameParts.join(' ') || name,
            ...(notes?.trim() ? { notes: notes.trim() } : {}),
            check_in: checkIn,
            check_out: checkOut,
            amount,
        }),
    }, 'booking request');
}

export function acceptBooking(bookingId) {
    return requestJson(`/bookings/accept/${bookingId}`, { method: 'PATCH' }, 'accept booking');
}

export function rejectBooking(bookingId) {
    return requestJson(`/bookings/reject/${bookingId}`, { method: 'PATCH' }, 'reject booking');
}

export function fetchTenancies() {
    return requestCollection('/tenancies', 'tenancies');
}

export function fetchTenancyById(tenancyId) {
    return requestJson(`/tenancies/${tenancyId}`, { method: 'GET' }, 'tenancy');
}

export function createTenancy(payload) {
    return requestJson('/tenancies', {
        method: 'POST',
        body: JSON.stringify(payload),
    }, 'create tenancy');
}

export function updateTenancy(tenancyId, payload) {
    return requestJson(`/tenancies/${tenancyId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    }, 'update tenancy');
}

export function deleteTenancy(tenancyId) {
    return requestJson(`/tenancies/${tenancyId}`, { method: 'DELETE' }, 'delete tenancy');
}

export function fetchViewings() {
    return requestCollection('/viewings', 'viewings');
}

export function createViewing({ resourceId, email, preferredDate, bookingNotes }) {
    return requestJson('/viewings', {
        method: 'POST',
        body: JSON.stringify({
            property_id: resourceId,
            email,
            preferred_date: `${preferredDate}T10:00:00.000Z`,
            ...(bookingNotes?.trim() ? { booking_notes: bookingNotes.trim() } : {}),
        }),
    }, 'viewing request');
}

export function acceptViewing(viewingId) {
    return requestJson(`/viewings/${viewingId}/accept`, { method: 'POST' }, 'accept viewing');
}

export function rejectViewing(viewingId) {
    return requestJson(`/viewings/${viewingId}/reject`, { method: 'POST' }, 'reject viewing');
}

export function openWhatsAppMessage(message) {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}

export function normalizeProperty(property) {
    return {
        ...property,
        listingId: property.id,
        viewingResourceId: property.id,
        features: normalizeFeatures(property.features),
        category: property.type || property.category || 'Property',
        location: formatLocation(property.address, property.city, property.state),
        beds: property.beds ?? property.bedrooms ?? property.bedroom,
        baths: property.baths ?? property.bathrooms ?? property.bathroom,
        price: formatPrice(property.price),
        image: getImageUrl(property.images),
    };
}

function normalizeUnits(listing, category, priceKey, titleFallback) {
    const units = Array.isArray(listing.units) && listing.units.length > 0
        ? listing.units
        : [{}];

    return units.map((unit, index) => ({
        ...listing,
        ...unit,
        listingId: listing.id,
        unitId: unit.id || unit.unit_id || unit.unitId,
        viewingResourceId: listing.id,
        features: normalizeFeatures(listing.features),
        category,
        location: formatLocation(listing.address, listing.city, listing.state),
        title: unit.title || unit.unit_name || unit.unit_number || unit.unitNumber || listing.title || `${titleFallback} ${index + 1}`,
        beds: unit.bedrooms ?? unit.bedroom,
        baths: unit.bathrooms ?? unit.bathroom,
        amount: Number(String(unit[priceKey] ?? unit.price ?? 0).replace(/[^\d.]/g, '')) || 0,
        price: formatPrice(unit[priceKey] ?? unit.price, category === 'Shortlet' ? ' / night' : ''),
        description: listing.description,
        image: getImageUrl(unit.images) || getImageUrl(listing.images),
    }));
}

export function normalizeApartments(apartments) {
    return apartments.flatMap((apartment) => normalizeUnits(apartment, 'Apartment', 'price', 'Apartment'));
}

export function normalizeShortlets(shortlets) {
    return shortlets.flatMap((shortlet) => normalizeUnits(shortlet, 'Shortlet', 'price_per_night', 'Shortlet'));
}
