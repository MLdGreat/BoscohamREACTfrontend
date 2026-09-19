import PropertyCategoryPage from './PropertyCategoryPage';
import { fetchShortlets, normalizeShortlets } from '../../services/propertyApi';
import ShortletBookingModal from './ShortletBookingModal';

const loadShortlets = () => fetchShortlets().then(normalizeShortlets);

export default function ForShortletCategory() {
    return (
        <PropertyCategoryPage
            title="Luxury Shortlets"
            description="Find comfortable, fully serviced shortlets for business trips, celebrations, and relaxed city stays."
            searchLabel="shortlets"
            loadProperties={loadShortlets}
            ModalComponent={ShortletBookingModal}
        />
    );
}