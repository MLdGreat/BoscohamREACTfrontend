import { useEffect, useState } from "react"
import propertyImage from "./../../assets/boscohamprop3.jpg"
import { createViewing } from "../../services/propertyApi"

export default function FeaturedPropertyModal({ property, onClose }){
    const [submissionState, setSubmissionState] = useState({ status: "idle", message: "" })

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
        const form = new FormData(event.currentTarget)

        setSubmissionState({ status: "submitting", message: "Sending your viewing request..." })

        try {
            await createViewing({
                resourceId: property.id,
                name: form.get("name"),
                email: form.get("email"),
                preferredDate: form.get("preferred_date"),
            })
            setSubmissionState({ status: "success", message: "Your viewing request has been sent. We will be in touch shortly." })
            event.currentTarget.reset()
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
                    <div className="property-modal-features">
                        <span>{property.beds} beds</span>
                        <span>{property.baths} baths</span>
                    </div>
                    <p className="property-modal-description">{property.description}</p>
                    <strong className="property-modal-price">{property.price}</strong>
                </div>
                <form className="viewing-form" onSubmit={handleSubmit}>
                    <p className="viewing-form-eyebrow">Arrange a visit</p>
                    <h3>Plan your viewing</h3>
                    <p className="viewing-form-intro">Tell us when you would like to see this property and our team will confirm the details.</p>
                    <label htmlFor="viewing-name">Full name</label>
                    <input id="viewing-name" name="name" type="text" placeholder="Your name" required />
                    <label htmlFor="viewing-email">Email address</label>
                    <input id="viewing-email" name="email" type="email" placeholder="you@example.com" required />
                    <label htmlFor="viewing-date">Preferred date</label>
                    <input id="viewing-date" name="preferred_date" type="date" required />
                    {submissionState.status !== "idle" && (
                        <p className={`form-status form-status-${submissionState.status}`} role={submissionState.status === "error" ? "alert" : "status"}>
                            {submissionState.message}
                        </p>
                    )}
                    <button className="viewing-submit" type="submit" disabled={submissionState.status === "submitting"}>
                        {submissionState.status === "submitting" ? "Sending..." : "Request viewing"}
                    </button>
                </form>
            </div>
        </div>
    )
}