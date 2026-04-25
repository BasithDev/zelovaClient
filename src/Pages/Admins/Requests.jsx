import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';
import AdminSearchBar from "../../Components/SearchBar/AdminSearchBar";
import { AnimatePresence, motion } from 'framer-motion';
import { FiCheck, FiX, FiEye, FiMail, FiMapPin, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { FaStoreAlt } from 'react-icons/fa';
import { HiOutlineClipboardList } from 'react-icons/hi';
import { acceptVenodrRequests, deleteImage, denyVenodrRequests, fetchVendorRequests } from '../../Services/apiServices';

// Skeleton Loader
const RequestSkeleton = () => (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-200" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-slate-200 rounded" />
                <div className="h-3 w-32 bg-slate-200 rounded" />
            </div>
        </div>
    </div>
);

// Empty State
const EmptyState = () => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
    >
        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
            <FiCheck className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">All caught up!</h2>
        <p className="text-slate-500 text-sm">No pending vendor requests at the moment.</p>
    </motion.div>
);

const fetchVendorApplications = async () => {
    const { data } = await fetchVendorRequests();
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

    const pendingCount = applications?.length || 0;

    return (
        <div className="min-h-screen bg-slate-50">
            <AdminSearchBar />
            
            <div className="px-6 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <HiOutlineClipboardList className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Vendor Requests</h1>
                            <p className="text-slate-500 text-sm">
                                {pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                        Refresh
                    </button>
                </div>

                {/* Requests List */}
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            <>
                                <RequestSkeleton />
                                <RequestSkeleton />
                            </>
                        ) : isError ? (
                            <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
                                <p className="text-rose-600">Error loading requests. Please try again.</p>
                            </div>
                        ) : applications && applications.length > 0 ? (
                            applications.map((application) => (
                                <VendorApplicationCard key={application._id} application={application} />
                            ))
                        ) : (
                            <EmptyState />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const VendorApplicationCard = ({ application }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const queryClient = useQueryClient();

    const acceptMutation = useMutation({
        mutationFn: async (requestId) => {
            await acceptVenodrRequests(requestId);
            if (application.license?.public_id) {
                await deleteImage({ public_id: application.license.public_id });
            }
        },
        onSuccess: () => {
            toast.success("Request accepted!");
            queryClient.setQueryData(['vendorApplications'], (old) =>
                old?.filter((app) => app._id !== application._id) || []
            );
        },
        onError: () => toast.error("Failed to accept request.")
    });

    const denyMutation = useMutation({
        mutationFn: async (applicationId) => {
            await denyVenodrRequests(applicationId);
            if (application.license?.public_id) {
                await deleteImage({ public_id: application.license.public_id });
            }
        },
        onSuccess: () => {
            toast.success("Request denied!");
            queryClient.setQueryData(['vendorApplications'], (old) =>
                old?.filter((app) => app._id !== application._id) || []
            );
        },
        onError: () => toast.error("Failed to deny request.")
    });

    const isProcessing = acceptMutation.isPending || denyMutation.isPending;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
            {/* Header Row */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <img
                        src={application.user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(application.user.fullname)}&background=3B82F6&color=fff`}
                        alt=""
                        className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{application.user.fullname}</h3>
                        <p className="text-sm text-blue-600 truncate flex items-center gap-1">
                            <FaStoreAlt size={12} />
                            {application.restaurantName}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                    >
                        <FiEye size={14} />
                        {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                    </button>
                    <button
                        onClick={() => acceptMutation.mutate(application._id)}
                        disabled={isProcessing}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                        <FiCheck size={14} />
                        Accept
                    </button>
                    <button
                        onClick={() => denyMutation.mutate(application._id)}
                        disabled={isProcessing}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50"
                    >
                        <FiX size={14} />
                        Deny
                    </button>
                </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden border-t border-slate-100"
                    >
                        <div className="p-4 bg-slate-50 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Info */}
                            <div className="space-y-3">
                                <div className="bg-white rounded-lg p-3">
                                    <p className="text-xs text-slate-400 mb-1">Email</p>
                                    <p className="text-sm text-slate-700 flex items-center gap-1">
                                        <FiMail size={12} className="text-slate-400" />
                                        {application.user.email}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg p-3">
                                    <p className="text-xs text-slate-400 mb-1">Address</p>
                                    <p className="text-sm text-slate-700 flex items-start gap-1">
                                        <FiMapPin size={12} className="text-slate-400 mt-0.5" />
                                        {application.address || "Not provided"}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg p-3">
                                    <p className="text-xs text-slate-400 mb-1">Description</p>
                                    <p className="text-sm text-slate-700">
                                        {application.description || "No description"}
                                    </p>
                                </div>
                            </div>

                            {/* License */}
                            <div>
                                <p className="text-xs text-slate-400 mb-2">License Document</p>
                                <LicenseViewer src={application.license?.url} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const LicenseViewer = ({ src }) => {
    const [zoom, setZoom] = useState(false);
    const [loading, setLoading] = useState(true);
    const [bgPos, setBgPos] = useState('50% 50%');
    const imgRef = useRef(null);

    const handleMove = (e) => {
        if (!imgRef.current) return;
        const rect = imgRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setBgPos(`${x}% ${y}%`);
    };

    if (!src) return <div className="bg-slate-200 rounded-lg h-48 flex items-center justify-center text-slate-400 text-sm">No license uploaded</div>;

    return (
        <div className="flex flex-col lg:flex-row gap-3">
            <div
                ref={imgRef}
                className="relative w-full lg:w-64 h-48 rounded-lg overflow-hidden border border-slate-200 cursor-zoom-in"
                onMouseMove={handleMove}
                onClick={() => setZoom(!zoom)}
            >
                {loading && (
                    <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                <img
                    src={src}
                    alt="License"
                    onLoad={() => setLoading(false)}
                    className="w-full h-full object-cover"
                />
            </div>
            {zoom && (
                <div
                    className="w-full lg:w-64 h-48 rounded-lg border border-slate-200"
                    style={{
                        backgroundImage: `url(${src})`,
                        backgroundSize: "200%",
                        backgroundPosition: bgPos,
                    }}
                />
            )}
        </div>
    );
};

VendorApplicationCard.propTypes = {
    application: PropTypes.object.isRequired,
};

LicenseViewer.propTypes = {
    src: PropTypes.string,
};

export default Requests;