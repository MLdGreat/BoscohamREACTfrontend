import { useEffect, useState } from 'react';
import propertyImage from './../../assets/boscohamprop3.jpg';
import { createBooking, openWhatsAppMessage } from '../../services/propertyApi';

const MINIMUM_STAY_DATE = new Date().toISOString().slice(0, 10);

export default function ShortletBookingModal({ property, onClose }) {
    const [submissionState, setSubmissionState] = useState({ status: 'idle', message: '' });

    useEffect(() => {
        if (!property) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [property, onClose]);

    if (!property) return null;

    async function handleSubmit(event) {
        event.preventDefault();
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        const checkIn = form.get('checkIn');
        const checkOut = form.get('checkOut');
        const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000);
        const amount = property.amount * nights;
        const unitId = property.unitId || property.unit_id;

        if (nights < 1) {
            setSubmissionState({ status: 'error', message: 'Check-out must be after check-in.' });
            return;
        }

        if (!unitId) {
            setSubmissionState({ status: 'error', message: 'This shortlet does not currently have a bookable unit.' });
            return;
        }

        setSubmissionState({ status: 'submitting', message: 'Sending your booking request...' });

        try {
            await createBooking({
                resourceId: unitId,
                name: form.get('name'),
                notes: `Email: ${form.get('email')}. Guests: ${form.get('guests')}. ${form.get('notes') || ''}`.trim(),
                checkIn,
                checkOut,
                amount,
            });
            openWhatsAppMessage([
                'New shortlet booking request',
                `Property: ${property.title}`,
                `Location: ${property.location}`,
                `Name: ${form.get('name')}`,
                `Email: ${form.get('email')}`,
                `Check-in: ${checkIn}`,
                `Check-out: ${checkOut}`,
                `Guests: ${form.get('guests')}`,
                `Amount: N${amount.toLocaleString()}`,
            ].join('\n'));
            setSubmissionState({ status: 'success', message: 'Your booking request has been sent. We will confirm availability shortly.' });
            formElement.reset();
        } catch (error) {
            setSubmissionState({ status: 'error', message: error.message });
        }
    }

    return (
        <div className="property-modal" role="dialog" aria-modal="true" aria-labelledby="shortlet-modal-title">
            <button className="property-modal-backdrop" type="button" aria-label="Close booking form" onClick={onClose} />
            <div className="property-modal-content">
                <button className="property-modal-close" type="button" aria-label="Close booking form" onClick={onClose}>×</button>
                <div className="property-modal-details">
                    <p className="property-modal-eyebrow">{property.category}</p>
                    <p className="property-modal-location">{property.location}</p>
                    <img className="property-modal-image" src={property.image || propertyImage} alt={property.title} />
                    <h2 id="shortlet-modal-title">{property.title}</h2>
                    {(property.beds !== null && property.beds !== undefined) || (property.baths !== null && property.baths !== undefined) ? (
                        <div className="property-modal-features">
                            {property.beds !== null && property.beds !== undefined && <span>{property.beds} beds</span>}
                            {property.baths !== null && property.baths !== undefined && <span>{property.baths} baths</span>}
                        </div>
                    ) : null}
                    {property.features?.length > 0 && (
                        <ul className="property-modal-amenities" aria-label="Amenities">
                            {property.features.map((feature) => <li key={feature}>{feature}</li>)}
                        </ul>
                    )}
                    <p className="property-modal-description">{property.description}</p>
                    <strong className="property-modal-price">{property.price}</strong>
                </div>
                <form className="viewing-form" onSubmit={handleSubmit}>
                    <p className="viewing-form-eyebrow">Reserve your stay</p>
                    <h3>Book this shortlet</h3>
                    <p className="viewing-form-intro">Share your stay details and our team will confirm availability with you.</p>
                    <label htmlFor="booking-name">Full name</label>
                    <input id="booking-name" name="name" type="text" placeholder="Your name" required />
                    <label htmlFor="booking-email">Email address</label>
                    <input id="booking-email" name="email" type="email" placeholder="you@example.com" required />
                    <label htmlFor="booking-check-in">Check-in date</label>
                    <input id="booking-check-in" name="checkIn" type="date" min={MINIMUM_STAY_DATE} required />
                    <label htmlFor="booking-check-out">Check-out date</label>
                    <input id="booking-check-out" name="checkOut" type="date" min={MINIMUM_STAY_DATE} required />
                    <label htmlFor="booking-guests">Number of guests</label>
                    <input id="booking-guests" name="guests" type="number" min="1" placeholder="2" required />
                    <label htmlFor="booking-notes">Booking notes</label>
                    <textarea id="booking-notes" name="notes" rows="3" placeholder="Late arrival or other details" />
                    {submissionState.status !== 'idle' && (
                        <p className={`form-status form-status-${submissionState.status}`} role={submissionState.status === 'error' ? 'alert' : 'status'}>
                            {submissionState.message}
                        </p>
                    )}
                    <button className="viewing-submit" type="submit" disabled={submissionState.status === 'submitting'}>
                        {submissionState.status === 'submitting' ? 'Sending...' : 'Request booking'}
                    </button>
                </form>
            </div>
        </div>
    );
}
