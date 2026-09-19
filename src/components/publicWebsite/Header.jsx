import { Link, useNavigate } from "react-router";
import Logo from "./Logo";

export default function Header() {
    const navigate = useNavigate();

    return (
        <header className="header">
            <div className="header-items">
                <Link to="/" aria-label="BoscoHam home"><Logo /></Link>
            </div>
            <div className="header-items">
                <nav className="header-nav" aria-label="Primary navigation">
                    <ul>
                        <li><Link to="/properties">Properties</Link></li>
                        <li><Link to="/apartments">Apartments</Link></li>
                        <li><Link to="/shortlets">Shortlets</Link></li>
                    </ul>
                    <label className="header-nav-select-label">
                        <span className="sr-only">Navigate to</span>
                        <select
                            className="header-nav-select"
                            defaultValue=""
                            aria-label="Navigate to"
                            onChange={(event) => {
                                if (event.target.value) navigate(event.target.value);
                            }}
                        >
                            <option value="" disabled>Explore BoscoHam</option>
                            <option value="/properties">Properties</option>
                            <option value="/apartments">Apartments</option>
                            <option value="/shortlets">Shortlets</option>
                        </select>
                    </label>
                </nav>
            </div>
        </header>
    );
}