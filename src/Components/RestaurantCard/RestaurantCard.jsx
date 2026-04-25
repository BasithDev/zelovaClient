import { FaStar, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { MdStorefront, MdDirectionsBike } from 'react-icons/md';
import PropTypes from 'prop-types';

const RestaurantCard = ({ restaurant, timeInMinutes, distanceInKm }) => {
    const hasRating = restaurant.avgRating && restaurant.avgRating > 0;
    
    return (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="flex">
                {/* Left: Restaurant Image */}
                <div className="w-40 sm:w-48 h-36 sm:h-40 flex-shrink-0 bg-gray-100">
                    {restaurant.image ? (
                        <img 
                            src={restaurant.image} 
                            alt={restaurant.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                            <MdStorefront className="w-12 h-12 text-orange-400" />
                        </div>
                    )}
                </div>

                {/* Middle: Main Info */}
                <div className="flex-1 p-4 flex flex-col justify-center">
                    {/* Name */}
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{restaurant.name}</h2>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 mt-2 text-gray-500 text-sm">
                        <FaMapMarkerAlt className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                            {restaurant.address && restaurant.address !== 'Add Address' 
                                ? restaurant.address 
                                : 'Location not available'}
                        </span>
                    </div>

                    {/* Delivery Info - More Prominent */}
                    <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <MdDirectionsBike className="w-5 h-5" />
                            <span className="font-bold text-base">{distanceInKm} km</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <FaClock className="w-4 h-4" />
                            <span className="font-bold text-base">{timeInMinutes} min</span>
                        </div>
                    </div>
                </div>

                {/* Right: Rating */}
                <div className="p-4 flex items-start">
                    {hasRating ? (
                        <div className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg">
                            <FaStar className="w-3 h-3" />
                            <span className="font-bold text-sm">{restaurant.avgRating.toFixed(1)}</span>
                        </div>
                    ) : (
                        <div className="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-lg">
                            <span className="text-sm font-semibold">New</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

RestaurantCard.propTypes = {
    restaurant: PropTypes.shape({
        name: PropTypes.string.isRequired,
        image: PropTypes.string,
        address: PropTypes.string,
        phone: PropTypes.string,
        avgRating: PropTypes.number,
    }).isRequired,
    timeInMinutes: PropTypes.number.isRequired,
    distanceInKm: PropTypes.string.isRequired,
};

export default RestaurantCard;
