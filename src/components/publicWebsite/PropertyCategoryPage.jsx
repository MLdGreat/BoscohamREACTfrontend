import { useEffect, useState } from 'react';
import '../../styles/propertysectionstyling.css';
import Header from './Header';
import PropertyCard from './PropertyCard';
import FeaturedPropertyModal from './Modal';
import Loading from './Loading';

export default function PropertyCategoryPage({ title, description, searchLabel, loadProperties, ModalComponent = FeaturedPropertyModal }) {
    const [properties, setProperties] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isCurrent = true;

        loadProperties()
            .then((data) => {
                if (isCurrent) setProperties(data);
            })
            .catch((fetchError) => {
                if (isCurrent) setError(fetchError.message);
            })
            .finally(() => {
                if (isCurrent) setIsLoading(false);
            });

        return () => {
            isCurrent = false;
        };
    }, [loadProperties]);

    const filteredProperties = properties.filter((property) => {
        const searchableText = `${property.category} ${property.location} ${property.title}`.toLowerCase();
        return searchableText.includes(searchTerm.toLowerCase());
    });

    return (
        <>
            <Header />
            <main className="for-sale-category">
                <h1 className="for-sale-category-title">{title}</h1>
                <p className="for-sale-category-description">{description}</p>
                <div className="search-input">
                    <label htmlFor={`${searchLabel}-search`}>Search {searchLabel}</label>
                    <input
                        id={`${searchLabel}-search`}
                        name="search"
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder={`Search ${searchLabel.toLowerCase()}...`}
                    />
                </div>
                {isLoading ? <Loading /> : error ? <p role="alert">{error}</p> : (
                    <div className="for-sale-properties">
                        <ul>
                            {filteredProperties.map((property) => (
                                <li key={property.id || `${property.title}-${property.location}`}>
                                    <PropertyCard
                                        {...property}
                                        onViewDetails={() => setSelectedProperty(property)}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <ModalComponent
                    property={selectedProperty}
                    onClose={() => setSelectedProperty(null)}
                />
            </main>
        </>
    );
}