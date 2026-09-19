import { Link } from "react-router";
export default function Hero() {
    return(
        <>
        <div className="hero-section">
            <div className="hero-text">
            <h3>PREMIUM PROPERTY MANAGEMENT</h3>
            <h1>Find your place in <span>Lagos and Abuja</span></h1>
            <p>Boscoham curates exceptional properties,serviced apartments and luxury shortlets across Nigeria's premier addresses</p>
            <div className="action-btns">
                <Link to="/properties">
                    <button className="browse-properties">Browse Properties</button>
                </Link>
                <Link to="/shortlets">
                    <button className="book-a-shortlet">Book a Shortlet</button>
                </Link>
            </div>
            </div>
        </div>
        {/* ------------------------------ */}
        <div className="achievements">
                <div className="achievement">
                    <h3>240+</h3>
                    <p>Properties Listed</p>
                </div>
                <div className="achievement">
                     <h3>180+</h3>
                    <p>Happy Tenants</p>
                </div>
                <div className="achievement">
                     <h3>12</h3>
                    <p>Years of Experience</p>
                </div>
                <div className="achievement">
                     <h3>2</h3>
                    <p>Cities </p>
                </div>
            </div>
        </>
    )
}