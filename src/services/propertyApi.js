import { withIdempotencyHeader } from './idempotency.js';

const API_BASE_URL = import.meta.env.DEV
    ? '/api'
    : 'https://api.boscoham.homes/api';
const WHATSAPP_NUMBER = '2347049109862';

async function requestJson(endpoint, options, resourceName) {
    const requestOptions = withIdempotencyHeader(endpoint, options, options?.body);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...requestOptions,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(requestOptions?.headers || {}),
        },
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

export function fetchProperties() {
    return requestCollection('/properties', 'properties');
}

export function fetchApartments() {
    return requestCollection('/apartments', 'apartments');
}

export function fetchShortlets() {
    return requestCollection('/shortlets', 'shortlets');
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

export function createBooking({ resourceId, name, notes, checkIn, checkOut, amount }) {
    const nameParts = name.trim().split(/\s+/);

    return requestJson('/bookings', {
        method: 'POST',
        body: JSON.stringify({
            shortlet_unit_id: resourceId,
            first_name: nameParts.shift() || name,
            last_name: nameParts.join(' ') || name,
            ...(notes?.trim() ? { notes: notes.trim() } : {}),
            checkIn: `${checkIn}T14:00:00.000Z`,
            checkOut: `${checkOut}T11:00:00.000Z`,
            amount,
        }),
    }, 'booking request');
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
