import { FiEdit2, FiKey, FiMapPin, FiAlertCircle, FiChevronRight } from "react-icons/fi";
import { MdStorefront, MdPerson } from "react-icons/md";
import { useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const userData = useSelector((state) => state.userData.data);

  const profileOptions = [
    { 
      icon: FiEdit2, 
      label: "Edit Profile", 
      description: "Update your personal details",
      path: "/edit-user",
      color: "text-orange-500",
      bgColor: "bg-orange-50"
    },
    ...(!userData?.isGoogleID ? [{
      icon: FiKey, 
      label: "Reset Password", 
      description: "Change your account password",
      path: "/reset-password",
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    }] : []),
    { 
      icon: MdPerson, 
      label: "Change ID", 
      description: "Update your user identifier",
      path: "/change-id",
      color: "text-gray-600",
      bgColor: "bg-gray-100"
    },
    { 
      icon: MdStorefront, 
      label: userData?.isVendor ? "Switch to Vendor" : "Become a Vendor", 
      description: userData?.isVendor ? "Access your vendor dashboard" : "Start selling on Zelova",
      path: userData?.isVendor ? "/vendor" : "/request-vendor",
      color: "text-emerald-500",
      bgColor: "bg-emerald-50"
    },
    { 
      icon: FiMapPin, 
      label: "Saved Addresses", 
      description: "Manage delivery locations",
      path: "/address-manage",
      color: "text-amber-500",
      bgColor: "bg-amber-50"
    },
    { 
      icon: FiAlertCircle, 
      label: "Report a Problem", 
      description: "Get help with an issue",
      path: "/report",
      color: "text-red-500",
      bgColor: "bg-red-50"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {userData?.profilePicture ? (
                <img
                  referrerPolicy="no-referrer"
                  src={userData.profilePicture}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <MdPerson className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <button 
                onClick={() => navigate('/edit-user')}
                className="absolute -bottom-1 -right-1 p-1.5 bg-orange-500 text-white rounded-full"
              >
                <FiEdit2 className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {userData?.fullname || "User"}
              </h1>
              <p className="text-sm text-gray-500 truncate">
                {userData?.email || "email@example.com"}
              </p>
              {userData?.isVendor && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded">
                  <MdStorefront className="w-3 h-3" />
                  Vendor
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Options */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {profileOptions.map((option, index) => (
            <button
              key={option.path}
              onClick={() => navigate(option.path)}
              className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left ${
                index !== profileOptions.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <div className={`p-2 rounded-lg ${option.bgColor}`}>
                <option.icon className={`w-5 h-5 ${option.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{option.label}</p>
                <p className="text-xs text-gray-500">{option.description}</p>
              </div>
              <FiChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          ))}
        </div>

        {/* App Version */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Zelova v1.0.0
        </p>
      </div>
    </div>
  );
};

export default Profile;