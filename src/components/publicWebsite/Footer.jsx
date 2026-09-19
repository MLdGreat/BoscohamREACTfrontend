import { Link } from "react-router";
import Logo from "./Logo";

export default function Footer() {
  return (
    <>
      <div className="footer">
        <div className="footer-items">
          <Logo />
          <p>
            Nigeria's premium property management platform connecting discerning
            clients with exceptional spaces.
          </p>
        </div>
        <div className="footer-items">
            <h4>Quick Links</h4>
            <ul className="quick-links">
              <Link to={"/properties"}>  <li className="quick-link">Properties</li></Link>
              <Link to={"/apartments"}>  <li className="quick-link">Aparments</li></Link>
              <Link to={"/shortlets"}>  <li className="quick-link">Shortlets</li></Link>
              <Link to={"/contact"}>  <li className="quick-link">Contact</li></Link>
            </ul>
        </div>
        <div className="footer-items">
            <h4>Contact</h4>
            <ul className="contacts">
                <li className="contact">info@boscoham.ng</li>
                <li className="contact">+2348002672426</li>
                <li className="contact">
                    <p>Lagos<span>.</span>Abuja</p>
                </li>
            </ul>
        </div>
      </div>
    </>
  );
}
