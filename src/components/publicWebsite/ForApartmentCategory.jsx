import PropertyCategoryPage from './PropertyCategoryPage';
import { fetchApartments, normalizeApartments } from '../../services/propertyApi';

const loadApartments = () => fetchApartments().then(normalizeApartments);

export default function ForApartmentCategory() {
    return (
        <PropertyCategoryPage
            title="Serviced Apartments"
            description="Browse thoughtfully designed apartments with dependable amenities in Lagos and Abuja's premier neighbourhoods."
            searchLabel="apartments"
            loadProperties={loadApartments}
        />
    );
}