import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from "react-toastify";
import { motion } from 'framer-motion';
import { MdArrowBack, MdRestaurant } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import RestaurantLocation from './RestaurantMng/RestaurantLocation';
import { updateRestaurantDetails } from '../../Services/apiServices';
import { fetchRestaurantData } from '../../Redux/slices/seller/restaurantDataSlice';
import RestaurantEdit from './RestaurantMng/RestaurantEdit';

const ManageRestaurant = () => {
    const navigate = useNavigate();
    const restaurantData = useSelector((state) => state.restaurantData.data?.restaurant);
    const [isEditing, setIsEditing] = useState(false);
    const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
    const dispatch = useDispatch();
    
    const defaultDetails = useMemo(
        () => ({
            name: "No name",
            description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit.",
            address: "Add Address",
            phone: "Add Phone Number",
            openingTime: "09:00",
            closingTime: "21:00",
            photoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9oBl8oMj8unCKsHx9WuzVKgxc34HJnei-Qw&s",
        }),
        []
    );
    const [restaurantDetails, setRestaurantDetails] = useState(defaultDetails);

    useEffect(() => {
        if (restaurantData) {
            setRestaurantDetails({ ...defaultDetails, ...restaurantData });
            const [lat = 0, lng = 0] = restaurantData?.location?.coordinates || [];
            setCoordinates({ lat, lng });
        }
    }, [defaultDetails, restaurantData]);

    const saveChanges = async () => {
        const keysToCompare = [
            "name",
            "description",
            "address",
            "phone",
            "openingTime",
            "closingTime",
            "location",
        ];
    
        const hasChanges = keysToCompare.some((key) => {
            return restaurantData[key] !== restaurantDetails[key];
        });

        if (!hasChanges) {
            toast.info('No changes detected');
            setIsEditing(false);
            return;
        }

        try {
            await updateRestaurantDetails(restaurantDetails);
            toast.success('Restaurant updated successfully');
            dispatch(fetchRestaurantData());
        } catch (error) {
            console.error(error);
            toast.error('Failed to update restaurant');
        } finally {
            setIsEditing(false);
        }
    };

    const handleFieldChange = (field, value) => {
        setRestaurantDetails((prev) => ({ ...prev, [field]: value }));
    };

    const detailFields = {
        "Restaurant Name": "name",
        Description: "description",
        "Phone Number": "phone",
        "Opening Time": "openingTime",
        "Closing Time": "closingTime",
    };
    
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 py-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 mb-6"
                >
                    <button 
                        onClick={() => navigate('/vendor')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <MdArrowBack className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex items-center gap-2">
                        <MdRestaurant className="w-6 h-6 text-orange-500" />
                        <h1 className="text-xl font-semibold text-gray-900">Manage Restaurant</h1>
                    </div>
                </motion.div>

                {/* Restaurant Edit Component */}
                <RestaurantEdit
                    restaurantDetails={restaurantDetails}
                    isEditing={isEditing}
                    handleFieldChange={handleFieldChange}
                    saveChanges={saveChanges}
                    setIsEditing={setIsEditing}
                    detailFields={detailFields}
                />

                {/* Location Component */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6"
                >
                    <RestaurantLocation
                        restaurantDetails={restaurantDetails}
                        setRestaurantDetails={setRestaurantDetails}
                        coordinates={coordinates}
                        setCoordinates={setCoordinates}
                    />
                </motion.div>
            </div>
        </div>
    );
};

export default ManageRestaurant;