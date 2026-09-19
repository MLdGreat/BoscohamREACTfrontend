const API_BASE_URL = 'https://boscoham.onrender.com/api';

async function requestJson(endpoint, options, resourceName) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.status === 'fail') {
        throw new Error(payload.message || `Failed to submit ${resourceName}`);
    }

    return payload;
}

async function requestCollection(endpoint, resourceName) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.status === 'fail') {
        throw new Error(payload.message || `Failed to fetch ${resourceName}`);
    }

    return Array.isArray(payload.data) ? payload.data : [];
}

function getImageUrl(images) {
    if (!Array.isArray(images)) return undefined;
    return images.find((image) => image?.image_url)?.image_url;
}

function formatLocation(...parts) {
    return parts.filter(Boolean).join(', ');
}

function formatPrice(price, suffix = '') {
    if (price === undefined || price === null || price === '') return 'Price on request';
    if (typeof price === 'number') return `N${price.toLocaleString()}${suffix}`;
    return `${price}${suffix}`;
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

export function createViewing({ resourceId, name, email, preferredDate }) {
    return requestJson('/viewings', {
        method: 'POST',
        body: JSON.stringify({
            property_id: resourceId,
            name,
            email,
            preferred_date: preferredDate,
        }),
    }, 'viewing request');
}

export function normalizeProperty(property) {
    return {
        ...property,
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
        category,
        location: formatLocation(listing.address, listing.city, listing.state),
        title: unit.unit_name || unit.unitNumber || listing.title || `${titleFallback} ${index + 1}`,
        beds: unit.bedrooms ?? unit.bedroom,
        baths: unit.bathrooms ?? unit.bathroom,
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
