import { useEffect, useState } from 'react';
import propertyImage from './../../assets/boscohamprop3.jpg';

export default function PropertyImageGallery({ images = [], title }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const galleryImages = images.length > 0 ? images : [propertyImage];
    const hasMultipleImages = galleryImages.length > 1;

    useEffect(() => {
        setActiveIndex(0);
    }, [images]);

    const showPrevious = () => {
        setActiveIndex((index) => (index - 1 + galleryImages.length) % galleryImages.length);
    };
    const showNext = () => {
        setActiveIndex((index) => (index + 1) % galleryImages.length);
    };

    return (
        <div className="property-image-gallery" aria-label={`${title} photos`}>
            <div className="property-image-gallery-stage">
                <img
                    className="property-modal-image"
                    src={galleryImages[activeIndex]}
                    alt={`${title}, photo ${activeIndex + 1} of ${galleryImages.length}`}
                />
                {hasMultipleImages && (
                    <>
                        <button className="property-gallery-arrow property-gallery-previous" type="button" onClick={showPrevious} aria-label="Show previous photo">‹</button>
                        <button className="property-gallery-arrow property-gallery-next" type="button" onClick={showNext} aria-label="Show next photo">›</button>
                        <span className="property-gallery-count" aria-live="polite">{activeIndex + 1} / {galleryImages.length}</span>
                    </>
                )}
            </div>
            {hasMultipleImages && (
                <div className="property-gallery-thumbnails" aria-label="Choose a photo">
                    {galleryImages.map((image, index) => (
                        <button
                            className={`property-gallery-thumbnail${index === activeIndex ? ' is-active' : ''}`}
                            type="button"
                            key={`${image}-${index}`}
                            onClick={() => setActiveIndex(index)}
                            aria-label={`Show photo ${index + 1}`}
                            aria-pressed={index === activeIndex}
                        >
                            <img src={image} alt="" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}