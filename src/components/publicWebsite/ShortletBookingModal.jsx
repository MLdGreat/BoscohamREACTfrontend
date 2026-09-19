import { useEffect } from 'react';
import propertyImage from './../../assets/boscohamprop3.jpg';

export default function ShortletBookingModal({ property, onClose }) {
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
                    <div className="property-modal-features">
                        <span>{property.beds} beds</span>
                        <span>{property.baths} baths</span>
                    </div>
                    <p className="property-modal-description">{property.description}</p>
                    <strong className="property-modal-price">{property.price}</strong>
                </div>
                <form className="viewing-form" onSubmit={(event) => event.preventDefault()}>
                    <p className="viewing-form-eyebrow">Reserve your stay</p>
                    <h3>Book this shortlet</h3>
                    <p className="viewing-form-intro">Share your stay details and our team will confirm availability with you.</p>
                    <label htmlFor="booking-name">Full name</label>
                    <input id="booking-name" name="name" type="text" placeholder="Your name" required />
                    <label htmlFor="booking-email">Email address</label>
                    <input id="booking-email" name="email" type="email" placeholder="you@example.com" required />
                    <label htmlFor="booking-check-in">Check-in date</label>
                    <input id="booking-check-in" name="checkIn" type="date" required />
                    <label htmlFor="booking-check-out">Check-out date</label>
                    <input id="booking-check-out" name="checkOut" type="date" required />
                    <label htmlFor="booking-guests">Number of guests</label>
                    <input id="booking-guests" name="guests" type="number" min="1" placeholder="2" required />
                    <button className="viewing-submit" type="submit">Request booking</button>
                </form>
            </div>
        </div>
    );
}