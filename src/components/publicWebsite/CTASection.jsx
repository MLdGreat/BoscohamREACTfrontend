import { Link } from "react-router";

export default function CTASection() {
    return(
        <>
        <div className="cta-section">
            <div className="cta-section-text">
             <h3>Ready to find your place?</h3>
                <p>Browse our full portfolio or get in touch with our team for a personalized property consultation</p>
            </div>
                <div className="action-btns">
                  <Link to="/apartments">
                    <button className="view-apartments">View Apartments</button>
                  </Link>
                  <Link to="/shortlets">
                    <button className="book-a-shortlet">Book a Shortlet</button>
                  </Link>
                </div>
        </div>
        </>
    )
}