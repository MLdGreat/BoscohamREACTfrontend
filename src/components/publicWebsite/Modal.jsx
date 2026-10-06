import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import propertyImage from "./../../assets/boscohamprop3.jpg"
import { createViewing, getCurrentUser, openWhatsAppMessage } from "../../services/propertyApi"

const MINIMUM_VIEWING_DATE = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

export default function FeaturedPropertyModal({ property, onClose }){
    const [submissionState, setSubmissionState] = useState({ status: "idle", message: "" })
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!property) return undefined

        const handleKeyDown = (event) => {
            if (event.key === "Escape") onClose()
        }

        document.body.style.overflow = "hidden"
        document.addEventListener("keydown", handleKeyDown)

        return () => {
            document.body.style.overflow = ""
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [property, onClose])

    if (!property) return null

    async function handleSubmit(event) {
        event.preventDefault()
        const formElement = event.currentTarget
        const form = new FormData(formElement)

        setSubmissionState({ status: "submitting", message: "Sending your viewing request..." })

        try {
            const user = await getCurrentUser()
            if (!user) {
                navigate('/login', {
                    state: { from: location.pathname || '/' },
                });
                return;
            }
            const viewingResourceType = property.viewingResourceType || 'property';
            const viewingResourceId = viewingResourceType === 'apartment'
                ? property.viewingResourceId
                : property.viewingResourceId || property.listingId || property.id;
            if (!viewingResourceId) {
                setSubmissionState({ status: "error", message: "This apartment unit does not have a valid viewing ID." });
                return;
            }
            await createViewing({
                resourceId: viewingResourceId,
                resourceType: viewingResourceType,
                email: form.get("email"),
                preferredDate: form.get("preferred_date"),
                bookingNotes: form.get("booking_notes"),
            })
            openWhatsAppMessage([
                "New viewing request",
                `Property: ${property.title}`,
                `Location: ${property.location}`,
                `Email: ${form.get("email")}`,
                `Preferred date: ${form.get("preferred_date")}`,
                `Notes: ${form.get("booking_notes") || "None"}`,
            ].join("\n"))
            setSubmissionState({ status: "success", message: "Your viewing request has been sent. We will be in touch shortly." })
            formElement.reset()
        } catch (error) {
            setSubmissionState({ status: "error", message: error.message })
        }
    }

    return(
        <div className="property-modal" role="dialog" aria-modal="true" aria-labelledby="property-modal-title">
            <button className="property-modal-backdrop" type="button" aria-label="Close property details" onClick={onClose} />
            <div className="property-modal-content">
                <button className="property-modal-close" type="button" aria-label="Close property details" onClick={onClose}>×</button>
                <div className="property-modal-details">
                    <p className="property-modal-eyebrow">{property.category}</p>
                    <p className="property-modal-location">{property.location}</p>
                    <img className="property-modal-image" src={property.image || propertyImage} alt={property.title} />
                    <h2 id="property-modal-title">{property.title}</h2>
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
                    <p className="viewing-form-eyebrow">Arrange a visit</p>
                    <h3>Plan your viewing</h3>
                    <p className="viewing-form-intro">Tell us when you would like to see this property and our team will confirm the details.</p>
                    <label htmlFor="viewing-email">Email address</label>
                    <input id="viewing-email" name="email" type="email" placeholder="you@example.com" required />
                    <label htmlFor="viewing-date">Preferred date</label>
                    <input id="viewing-date" name="preferred_date" type="date" min={MINIMUM_VIEWING_DATE} required />
                    <label htmlFor="viewing-notes">Notes for the team</label>
                    <textarea id="viewing-notes" name="booking_notes" rows="3" placeholder="Anything we should know?" />
                    {submissionState.status !== "idle" && (
                        <p className={`form-status form-status-${submissionState.status}`} role={submissionState.status === "error" ? "alert" : "status"}>
                            {submissionState.message}
                        </p>
                    )}
                    {submissionState.status === "auth-required" && (
                        <p className="form-status-auth-links"><Link to="/signup">Sign up</Link> or <Link to="/login">log in</Link> to continue.</p>
                    )}
                    <button className="viewing-submit" type="submit" disabled={submissionState.status === "submitting"}>
                        {submissionState.status === "submitting" ? "Sending..." : "Request viewing"}
                    </button>
                </form>
            </div>
        </div>
    )
}
