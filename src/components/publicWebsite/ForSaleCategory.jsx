import { useEffect, useState } from 'react';
import '../../styles/propertysectionstyling.css';
import Header from './Header';
import PropertyCard from "./PropertyCard";
import FeaturedPropertyModal from './Modal';
import Loading from './Loading';
import { fetchProperties, normalizeProperty } from '../../services/propertyApi';
export default function ForSaleCategory(){
    const [properties, setProperties] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProperties()
            .then((data) => setProperties(data.map(normalizeProperty)))
            .catch((fetchError) => setError(fetchError.message))
            .finally(() => setIsLoading(false));
    }, []);

    return(
        <>
        <Header/>
        <main className="for-sale-category">
            <h1 className="for-sale-category-title">Property Collection</h1>
            <p className="for-sale-category-description">Explore apartments, family homes, and shortlets in some of Nigeria's most sought-after addresses.</p>
            <div className="search-input">
                <label htmlFor="property-search">Search properties</label>
                <input
                    id="property-search"
                    name="search"
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search properties..."
                />
            </div>
            {isLoading ? <Loading /> : error ? <p role="alert">{error}</p> : <div className="for-sale-properties">
                <ul>
                    {properties
                        .filter((property) => {
                            const searchableText = `${property.category} ${property.location} ${property.title}`.toLowerCase();
                            return searchableText.includes(searchTerm.toLowerCase());
                        })
                        .map((property) => (
                            <li key={property.id || `${property.title}-${property.location}`}>
                                <PropertyCard
                                    {...property}
                                    onViewDetails={() => setSelectedProperty(property)}
                                />
                            </li>    
                        ))}
                </ul>
            </div>}
            <FeaturedPropertyModal
                property={selectedProperty}
                onClose={() => setSelectedProperty(null)}
            />
        </main>
        </>
    )

}


