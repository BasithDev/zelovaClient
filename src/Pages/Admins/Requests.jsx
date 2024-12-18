import { useQuery, useMutation , useQueryClient} from '@tanstack/react-query';
import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminSearchBar from "../../Components/SearchBar/AdminSearchBar";
import { AnimatePresence, motion } from 'framer-motion';
import { BeatLoader } from 'react-spinners';
import { acceptVenodrRequests, deleteImage, denyVenodrRequests, fetchVendorRequests } from '../../Services/apiServices';

const fetchVendorApplications = async () => {
    const { data } = await fetchVendorRequests()
    return data;
};

const Requests = () => {
    const { data: applications, isLoading, isError, refetch } = useQuery({
        queryKey: ['vendorApplications'],
        queryFn: fetchVendorApplications,
        staleTime: 60000,
        cacheTime: 300000,
        refetchInterval: 10000
    });

    if (isLoading) return <p>Loading...</p>;
    if (isError) return <p>Error loading vendor requests</p>;

    return (
        <div className="pb-3 bg-gray-100 min-h-screen transition-all duration-300">
            <ToastContainer position="top-right" />
            <AdminSearchBar />
            <h1 className="text-2xl mx-3 font-bold mb-4">Vendors Request</h1>
            <div className="space-y-4">
                {applications && applications.length > 0 ? (
                    applications.map((application) => (
                        <VendorApplicationCard key={application._id} application={application} refetchApplications={refetch} />
                    ))
                ) : (
                    <p className="text-center">No vendor applications available.</p>
                )}
            </div>
        </div>
    );
};

const VendorApplicationCard = ({ application }) => {

    
    const [isExpanded, setIsExpanded] = useState(false);
    const queryClient = useQueryClient();
    const acceptMutation = useMutation({
        mutationFn: async (requestId) => {
            await acceptVenodrRequests(requestId)
            await deleteImage({public_id:application.license.public_id})
        },
        onSuccess: async () => {
            toast.success("Vendor request accepted!");
            queryClient.setQueryData(['vendorApplications'], (oldApplications) => 
                oldApplications.filter((app) => app._id !== application._id)
            );
        },
        onError: () => {
            toast.error("Error accepting vendor request.");
        }
    });
    const denyMutation = useMutation({
        mutationFn: async (applicationId) => {
            await denyVenodrRequests(applicationId)
            await deleteImage({public_id:application.license.public_id})
        },
        onSuccess: async() => {
            toast.success("Vendor request denied!");
            queryClient.setQueryData(['vendorApplications'], (oldApplications) => 
                oldApplications.filter((app) => app._id !== application._id)
            );
        },
        onError: () => {
            toast.error("Error denying vendor request.");
        }
    });
    const toggleDetails = () => setIsExpanded(!isExpanded);


    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white mx-3 p-4 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 flex flex-col items-start"
        >
            <div className="flex items-center">
                <img src={application.user.profilePicture || "https://placehold.co/60x60"} alt={`Profile of ${application.user.fullname}`} className="w-16 h-16 rounded-full mr-4 border border-gray-300 shadow-sm" />
                <div className="flex-1">
                    <h2 className="text-xl font-semibold">{application.user.fullname}</h2>
                    <p className="text-gray-600">{application.restaurantName}</p>
                    <p className="text-gray-600">{application.user.email}</p>
                </div>
            </div>
            <div className="flex space-x-2 mt-4">
                <button
                    onClick={toggleDetails}
                    className="font-semibold text-lg transition-all duration-300 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transform hover:scale-105"
                >
                    {isExpanded ? "Close" : "View"}
                </button>
                <button
                    onClick={() => acceptMutation.mutate(application._id)}
                    className="font-semibold text-lg transition-all duration-300 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transform hover:scale-105"
                >
                    {acceptMutation.isPending ? <BeatLoader color="#FFF" size={10} /> : "Accept"}
                </button>
                <button
                    onClick={() => denyMutation.mutate(application._id)}
                    className="font-semibold text-lg transition-all duration-300 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transform hover:scale-105"
                >
                    {denyMutation.isPending ? <BeatLoader color="#FFF" size={10} /> : "Deny"}
                </button>
            </div>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 bg-gray-100 rounded-md shadow-xl p-4 w-full border-t border-gray-200"
                    >
                        <p><strong>License</strong></p>
                        <ImageZoom src={application.license.url} alt="License Image" />
                        <p><strong>Restaurant Name:</strong> {application.restaurantName}</p>
                        <p><strong>Address:</strong> {application.address}</p>
                        <p><strong>Description:</strong> {application.description}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
const ImageZoom = ({ src, alt }) => {
    const [isZoomed, setIsZoomed] = useState(false);
    const [isLoading,setIsLoading] = useState(true)
    const [backgroundPosition, setBackgroundPosition] = useState('50% 50%');
    const imageRef = useRef(null);
    const toggleZoom = () => setIsZoomed((prev) => !prev);
    const handleMouseMove = (e) => {
        const rect = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setBackgroundPosition(`${x}% ${y}%`);
    };
    const handleImageLoad = () => {
        setIsLoading(false); // Image has loaded, stop showing spinner
    };
    return (
        <div className="flex bg-white p-3 w-fit rounded-2xl space-x-4">
            <div
                className="relative w-96 h-96 overflow-hidden border border-gray-300 rounded-lg"
                onMouseMove={handleMouseMove}
                onClick={toggleZoom}
                ref={imageRef}
                style={{
                    cursor: 'zoom-in',
                    transition: 'transform 0.3s ease',
                }}
            >
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                        <BeatLoader color="#555" />
                    </div>
                )}
                <img
                    src={src}
                    alt={alt}
                    onLoad={handleImageLoad}
                    className="w-full h-full object-cover"
                    style={{
                        transform: isZoomed ? 'scale(1.05)' : 'scale(1)',
                        transition: 'transform 0.3s ease',
                    }}
                />
            </div>
            {isZoomed && (
                <div
                    className="w-96 h-96 border border-gray-300 rounded-lg shadow-lg overflow-hidden"
                    style={{
                        backgroundImage: `url(${src})`,
                        backgroundSize: "200%",  // Increased magnification for zoom
                        backgroundPosition: backgroundPosition,
                        backgroundRepeat: 'no-repeat',
                        transition: 'background-position 0.1s ease',
                    }}
                ></div>
            )}
        </div>
    );
};

VendorApplicationCard.propTypes = {
    application: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        restaurantName: PropTypes.string.isRequired,
        description: PropTypes.string,
        address: PropTypes.string,
        license: PropTypes.string.isRequired,
        user: PropTypes.shape({
            profilePicture: PropTypes.string,
            fullname: PropTypes.string.isRequired,
            email: PropTypes.string.isRequired,
        }).isRequired,
    }).isRequired,
    refetchApplications: PropTypes.func.isRequired,
};

ImageZoom.propTypes = {
    src: PropTypes.string.isRequired,
    alt: PropTypes.string.isRequired,
};
export default Requests;