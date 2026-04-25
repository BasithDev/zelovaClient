import PropTypes from "prop-types";
import { AnimatePresence, motion } from 'framer-motion';
import { MdEdit, MdPhone, MdAccessTime, MdStore, MdDescription, MdClose, MdCheck, MdCameraAlt, MdRestaurant, MdCloudUpload } from 'react-icons/md';
import { FaStar } from 'react-icons/fa';
import { useState, useEffect, useRef } from "react";
import { openOrCloseShop, updateRestaurantPic } from "../../../Services/apiServices";
import { uploadImageToCloud } from "../../../Helpers/uploadImageToCloud";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { fetchRestaurantData } from "../../../Redux/slices/seller/restaurantDataSlice";
import ImageCropper from "../../../Components/Common/ImageCropper";

const RestaurantEdit = ({
    restaurantDetails,
    isEditing,
    handleFieldChange,
    saveChanges,
    setIsEditing,
    detailFields,
}) => {
    const [isOpen, setIsOpen] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isImageUpdating, setIsImageUpdating] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState(null);
    const [croppedImage, setCroppedImage] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef(null);
    const dispatch = useDispatch();

    useEffect(() => {
        if (restaurantDetails && typeof restaurantDetails.isActive === "boolean") {
            setIsOpen(restaurantDetails.isActive);
        }
    }, [restaurantDetails]);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setSelectedImageSrc(reader.result);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedDataUrl) => {
        setCroppedImage(croppedDataUrl);
        setShowCropper(false);
    };

    const extractPublicId = (url) => {
        const regex = /\/v(\d+)\/(.*)\./;
        const match = url.match(regex);
        return match ? match[2] : null;
    };

    const dataURLtoBlob = (dataURL) => {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        return new Blob([u8arr], { type: mime });
    };

    const handleUpdateImage = async () => {
        if (!croppedImage) {
            toast.info("Please select and crop an image first");
            return;
        }
        setIsImageUpdating(true);
        try {
            const blob = dataURLtoBlob(croppedImage);
            const file = new File([blob], 'restaurant-image.jpg', { type: 'image/jpeg' });
            const cloudResponse = await uploadImageToCloud(file);
            if (cloudResponse) {
                const public_id = restaurantDetails.image ? extractPublicId(restaurantDetails.image) : null;
                await updateRestaurantPic({
                    imageURL: cloudResponse.secure_url,
                    public_id
                });
                toast.success("Image updated successfully");
                handleCloseModal();
                dispatch(fetchRestaurantData());
            }
        } catch (error) {
            toast.error("Failed to update image");
        } finally {
            setIsImageUpdating(false);
        }
    };

    const handleCloseModal = () => {
        setShowImageModal(false);
        setSelectedImageSrc(null);
        setCroppedImage(null);
    };

    const toggleShopStatus = async () => {
        setLoading(true);
        try {
            await openOrCloseShop(!isOpen);
            setIsOpen(!isOpen);
            dispatch(fetchRestaurantData());
            toast.success(isOpen ? "Restaurant is now closed" : "Restaurant is now open");
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        await saveChanges();
        setIsSaving(false);
    };

    const fieldIcons = {
        name: MdStore,
        description: MdDescription,
        phone: MdPhone,
        openingTime: MdAccessTime,
        closingTime: MdAccessTime,
    };

    return (
        <div className="">
            {/* Restaurant Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
                {/* Image Section */}
                <div className="relative h-48 sm:h-64 bg-gradient-to-br from-gray-800 to-gray-900">
                    {restaurantDetails.image && !restaurantDetails.image.includes('no-image') && !restaurantDetails.image.includes('placeholder') && !restaurantDetails.image.includes('pngtree') ? (
                        <img
                            src={restaurantDetails.image}
                            alt={restaurantDetails.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                            <MdRestaurant className="w-16 h-16 text-gray-600 mb-2" />
                            <p className="text-gray-500 text-sm">No cover image</p>
                        </div>
                    )}
                    
                    {/* Status Badge */}
                    <button
                        onClick={toggleShopStatus}
                        disabled={loading}
                        className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg transition-all ${
                            isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}
                    >
                        {loading ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                        ) : isOpen ? 'Open' : 'Closed'}
                    </button>

                    {/* Edit Image Button */}
                    <button
                        onClick={() => setShowImageModal(true)}
                        className="absolute bottom-4 right-4 p-2.5 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
                    >
                        <MdCameraAlt className="w-5 h-5 text-gray-700" />
                    </button>
                </div>

                {/* Restaurant Info */}
                <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{restaurantDetails.name || 'Restaurant Name'}</h2>
                            <p className="text-sm text-gray-500 mt-1">{restaurantDetails.description || 'No description'}</p>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded-lg text-sm font-semibold">
                            <FaStar className="w-3 h-3" />
                            {restaurantDetails.avgRating?.toFixed(1) || 'New'}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MdPhone className="w-4 h-4" />
                        <span>{restaurantDetails.phone || 'No phone'}</span>
                        <span className="mx-2">•</span>
                        <MdAccessTime className="w-4 h-4" />
                        <span>{restaurantDetails.openingTime || '00:00'} - {restaurantDetails.closingTime || '00:00'}</span>
                    </div>
                </div>
            </motion.div>

            {/* Edit Details Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {isEditing ? 'Edit Details' : 'Restaurant Details'}
                    </h3>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                            <MdEdit className="w-4 h-4" />
                            Edit
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    {Object.entries(detailFields).map(([label, key]) => {
                        const Icon = fieldIcons[key] || MdStore;
                        const isTime = key.includes("Time");
                        return (
                            <div key={key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                                <div className="relative">
                                    <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type={isTime ? "time" : "text"}
                                        value={restaurantDetails[key] || ''}
                                        onChange={(e) => handleFieldChange(key, e.target.value)}
                                        disabled={!isEditing}
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all ${
                                            isEditing 
                                                ? 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20' 
                                                : 'border-gray-100 bg-gray-50 text-gray-600'
                                        }`}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {isEditing && (
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 py-2.5 px-4 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <MdCheck className="w-5 h-5" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Image Upload Modal */}
            <AnimatePresence>
                {showImageModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">Update Restaurant Image</h3>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <MdClose className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="p-5">
                                {/* Show cropped preview or upload prompt */}
                                {croppedImage ? (
                                    <>
                                        <div className="relative h-48 bg-gray-900 rounded-xl overflow-hidden mb-4">
                                            <img
                                                src={croppedImage}
                                                alt="Cropped Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <p className="text-sm text-green-600 text-center mb-4 flex items-center justify-center gap-1">
                                            <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                                <MdCheck className="w-3 h-3 text-white" />
                                            </span>
                                            Image cropped and ready
                                        </p>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full py-2 text-sm text-gray-500 hover:text-orange-500 transition-colors mb-4"
                                        >
                                            Choose a different image
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-40 border-2 border-dashed border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all flex flex-col items-center justify-center gap-3 mb-4 group"
                                    >
                                        <div className="w-14 h-14 bg-gray-100 group-hover:bg-orange-100 rounded-full flex items-center justify-center transition-colors">
                                            <MdCloudUpload className="w-7 h-7 text-gray-400 group-hover:text-orange-500 transition-colors" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-gray-700">Click to select image</p>
                                            <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</p>
                                        </div>
                                    </button>
                                )}
                                
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCloseModal}
                                        className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdateImage}
                                        disabled={isImageUpdating || !croppedImage}
                                        className="flex-1 py-2.5 px-4 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                    >
                                        {isImageUpdating ? (
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : 'Update'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Image Cropper */}
            <ImageCropper
                isOpen={showCropper}
                onClose={() => setShowCropper(false)}
                imageSrc={selectedImageSrc}
                onCropComplete={handleCropComplete}
                aspect={16 / 9}
                title="Crop Restaurant Image"
            />
        </div>
    );
};

RestaurantEdit.propTypes = {
    restaurantDetails: PropTypes.shape({
        vendorId: PropTypes.string,
        name: PropTypes.string,
        description: PropTypes.string,
        phone: PropTypes.string,
        openingTime: PropTypes.string,
        closingTime: PropTypes.string,
        image: PropTypes.string,
        isActive: PropTypes.bool,
        avgRating: PropTypes.number
    }).isRequired,
    isEditing: PropTypes.bool.isRequired,
    handleFieldChange: PropTypes.func.isRequired,
    saveChanges: PropTypes.func.isRequired,
    setIsEditing: PropTypes.func.isRequired,
    detailFields: PropTypes.objectOf(PropTypes.string).isRequired,
};

export default RestaurantEdit;