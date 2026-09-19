import { useState,useEffect } from "react"
import {Link} from 'react-router'
import PropertyCard from "./PropertyCard"
import FeaturedPropertyModal from "./Modal"
import Loading from "./Loading"
import { fetchProperties, normalizeProperty } from "../../services/propertyApi"

export default function FeaturedProperties(){
    const [properties, setProperties] = useState([])
    const [selectedProperty, setSelectedProperty] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(function(){
        async function loadFeaturedProperties(){
            try{
                const data = await fetchProperties()
                setProperties(data.map(normalizeProperty))
                console.log(data)
                setIsLoading(false)
            }catch(error){
                console.error(error)
                setIsLoading(false)
            }
        }
        loadFeaturedProperties()
    },[])

    // const properties = [
    //     {
    //         category: "Property",
    //         location: "Lekki Phase 1, Lagos",
    //         title: "Luxury Detached Duplex",
    //         beds: 4,
    //         baths: 5,
    //         price: "N1,000,000",
    //         description: "A refined detached duplex with generous entertaining spaces, private parking, and easy access to Lekki's best schools, restaurants, and business districts.",
    //     },
    //     {
    //         category: "Shortlet",
    //         location: "Victoria Island, Lagos",
    //         title: "Serviced City Retreat",
    //         beds: 2,
    //         baths: 2,
    //         price: "N250,000 / night",
    //         description: "A fully serviced shortlet designed for comfortable city stays, with hotel-style support and a calm interior close to Victoria Island's business district.",
    //     },
    //     {
    //         category: "Apartment",
    //         location: "Wuse 2, Abuja",
    //         title: "Contemporary Garden Apartment",
    //         beds: 3,
    //         baths: 3,
    //         price: "N850,000",
    //         description: "A bright apartment with considered finishes, practical living areas, and a peaceful garden setting in one of Abuja's most connected neighbourhoods.",
    //     },
    // ]

    return(
        <>
            <div className="featured-properties-header">
                <h4>FEATURED</h4>
                <div className="featured-properties-header-link">
                <h2>Curated Listings</h2>
        <Link to="/properties">View properties</Link>
                </div>
            </div>
    { isLoading ? <Loading /> :<div className="featured-properties-section">
            <div className="featured-properties">
                {properties.map((property) => (
                    <PropertyCard
                        key={property.title}
                        {...property}
                        onViewDetails={() => setSelectedProperty(property)}
                    />
                ))}
            </div>
        </div>}
        <FeaturedPropertyModal
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
        />
        </>
    )
}