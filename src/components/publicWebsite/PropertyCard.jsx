import propertyImage from './../../assets/boscohamprop3.jpg';

export default function PropertyCard({ category, location, title, beds, baths, features = [], price, image, onViewDetails }) {
    return(
        <>
        <div className="property-card">
            <div className="property-image-container">
                <img src={image || propertyImage} alt={title} className="property-image"/>
                <span className="property-category">
                    {category}
                </span>
            </div>
            <div>
                <h5 className="property-location">
                    {location}
                </h5>
                <h3 className="property-title">
                    {title}
                </h3>
                {(beds !== null && beds !== undefined) || (baths !== null && baths !== undefined) ? (
                    <div className="property-features">
                        {beds !== null && beds !== undefined && (
                            <span className="property-feature">{beds} beds</span>
                        )}
                        {baths !== null && baths !== undefined && (
                            <span className="property-feature">{baths} baths</span>
                        )}
                    </div>
                ) : null}
                {features.length > 0 && (
                    <ul className="property-amenities" aria-label="Amenities">
                        {features.map((feature) => <li key={feature}>{feature}</li>)}
                    </ul>
                )}
                <div className="property-prices">
                    <p className="property-price">
                        {price}
                    </p>
                    <p className="property-link">
                        <button type="button" onClick={onViewDetails}>View details</button>
                    </p>
                </div>
            </div>
        </div>
        </>
    )
}
