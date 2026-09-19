import { Link } from "react-router"

export default function ServicesOverview() {
    return(
        <>
        <div className="service-overview-section">
            
            <div className="services-overview-container">
            <div className="service-overview-text">
                <h4>WHAT WE OFFER</h4>
                <h2>A complete property ecosystem</h2>
            </div>
            <div className="service-overview">
                <div className="overviews">
                    <span className="service-overview-icon"></span>
                    <h3>Properties for Sale</h3>
                    <p>Exclusive residential and commercial properties across Lagos and Abuja's most sought-after addresses.</p>
                    <span><Link to="/properties">Explore</Link></span>
                </div>
                <div className="overviews">
                    <span className="service-overview-icon"></span>
                    <h3>Service Apartments</h3>
                    <p>Wide range of rental properties from apartments to commercial spaces in prime locations.</p>
                    <span><Link to="/apartments">Explore</Link></span>
                </div>
                <div className="overviews">
                    <span className="service-overview-icon"></span>
                    <h3>Luxury Shortlets</h3>
                    <p>Hotel Standard short stay apartments for business travellers and holiday guests</p>
                    <span><Link to="/shortlets">Explore</Link></span>
                </div>
            </div>

            </div>
        </div>
        </>
    )
}