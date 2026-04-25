import { Tooltip } from 'react-tooltip'
import { LoadingScreen } from './LoadingScreen';
import { LocationConfirm } from '../Common/LocationConfirm';
import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IoMdLogOut } from "react-icons/io";
import { useNavigate, useLocation } from "react-router-dom";
import { logout } from "../../Services/apiServices";
import { logoutUser } from "../../Redux/slices/user/authUserSlice";
import { fetchUserData } from '../../Redux/slices/user/userDataSlice';
import { useDispatch, useSelector } from "react-redux";
import Cookies from "js-cookie";
import { 
  MdHome, 
  MdStorefront, 
  MdShare, 
  MdSearch, 
  MdKeyboardArrowLeft, 
  MdKeyboardArrowRight,
  MdShoppingBag,
  MdFavorite,
  MdPerson
} from "react-icons/md";
import { RiCoinsFill } from "react-icons/ri";
import LogoutConfirm from "../Common/LogoutConfirm";
import { Outlet } from 'react-router-dom';
import { setAddress, setCoordinates } from '../../Redux/slices/user/userLocationSlice'
import CartSnackbar from '../Cart/CartSnackbar';
import { BsThreeDots } from "react-icons/bs";

const UserLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [userAddress, setUserAddress] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    dispatch(fetchUserData());
  }, [dispatch]);

  const userData = useSelector((state) => state.userData.data);
  const isVendor = userData?.isVendor || null;
  const profilePicture = userData?.profilePicture?.replace(/=s\d+-c$/, "=s96-c");

  const navItems = [
    { path: "/", label: "Home", icon: MdHome },
    { path: "/favourites", label: "Favourites", icon: MdFavorite },
    { path: "/orders", label: "Orders", icon: MdShoppingBag },
    { path: "/coins", label: "Z-Coins", icon: RiCoinsFill },
    { path: "/share-supplies", label: "Share Supplies", icon: MdShare },
    { path: "/get-supplies", label: "Get Supplies", icon: MdSearch },
  ];

  const handleLogout = async () => {
    try {
      const role = "user";
      dispatch(logoutUser());
      await logout(role);
      navigate("/login");
    } catch (error) {
      console.log(error);
    }
  };

  if (isVendor) {
    Cookies.set("is_vendor", "true");
  }

  const fetchAddressFromCoordinates = useCallback(async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      const data = await response.json();

      if (data.display_name) {
        return data.display_name;
      } else {
        console.error("Error fetching address: No results found");
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
    return null;
  }, []);

  const getLocationAndSetAddress = useCallback(async () => {
    if (navigator.geolocation) {
      const geoOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          dispatch(setCoordinates({ lat: latitude, lng: longitude }));
          const address = await fetchAddressFromCoordinates(latitude, longitude);
          if (address) {
            setUserAddress(address);
            dispatch(setAddress(address))
          }
        },
        () => {
          setShowLocationPopup(true);
        },
        geoOptions
      );
    } else {
      setShowLocationPopup(true);
    }
  }, [fetchAddressFromCoordinates, dispatch]);


  useEffect(() => {
    getLocationAndSetAddress()
  }, [getLocationAndSetAddress]);


  if (!userData) return (
    <LoadingScreen />
  );

  const sidebarWidth = isCollapsed ? 'w-[70px]' : 'w-[260px]';
  const mainMargin = isCollapsed ? 'lg:ml-[70px]' : 'lg:ml-[260px]';

  return (
    <div className="flex flex-col lg:flex-row min-h-screen relative bg-gray-50">
      {/* Sidebar for desktop */}
      <aside className={`hidden lg:flex ${sidebarWidth} bg-white h-screen fixed top-0 left-0 bottom-0 flex-col justify-between overflow-visible border-r border-gray-200 transition-all duration-300 z-50`}>
        {/* Header */}
        <div>
          <div className={`relative p-4 border-b border-gray-100 ${isCollapsed ? 'flex justify-center' : ''}`}>
            {!isCollapsed ? (
              <span className="text-xl font-bold text-orange-500">Zelova</span>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">Z</span>
              </div>
            )}
            
            {/* Collapse Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
            >
              {isCollapsed ? (
                <MdKeyboardArrowRight className="w-4 h-4 text-gray-500" />
              ) : (
                <MdKeyboardArrowLeft className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-2 space-y-1 overflow-y-auto flex-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  title={isCollapsed ? label : ''}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    active 
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-200' 
                      : 'text-gray-600 hover:bg-gray-100'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{label}</span>
                  )}
                </button>
              );
            })}
            
            {/* Switch to Vendor */}
            {isVendor && (
              <button
                onClick={() => navigate("/vendor")}
                title={isCollapsed ? 'Switch to Vendor' : ''}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all ${
                  isCollapsed ? 'justify-center px-2' : ''
                }`}
              >
                <MdStorefront className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium">Switch to Vendor</span>}
              </button>
            )}
          </nav>
        </div>

        {/* Profile & Logout */}
        <div className="p-2 border-t border-gray-100 space-y-1">
          {/* Profile */}
          <button
            onClick={() => navigate('/profile')}
            title={isCollapsed ? userData?.fullname : ''}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              location.pathname === "/profile"
                ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                : "text-gray-600 hover:bg-gray-100"
            } ${isCollapsed ? 'justify-center px-2' : ''}`}
          >
            {userData?.profilePicture ? (
              <img
                referrerPolicy="no-referrer"
                src={profilePicture}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <MdPerson className="w-5 h-5 flex-shrink-0" />
            )}
            {!isCollapsed && (
              <div className="flex flex-col items-start overflow-hidden">
                <span className={`text-sm font-medium truncate max-w-[160px]`}>
                  {userData?.fullname}
                </span>
                <span className={`text-xs truncate max-w-[160px] ${
                  location.pathname === "/profile" ? 'text-orange-100' : 'text-gray-400'
                }`}>
                  {userAddress ? userAddress.split(',')[0] : "Set location"}
                </span>
              </div>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            title={isCollapsed ? 'Logout' : ''}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all ${
              isCollapsed ? 'justify-center px-2' : ''
            }`}
          >
            <IoMdLogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden w-full bg-white shadow-sm flex justify-between items-center fixed top-0 z-10 h-14 px-4 border-b border-gray-100">
        <span className="text-xl font-bold text-orange-500">Zelova</span>
        <div className="flex items-center gap-3">
          <p
            data-tooltip-id="address-tooltip"
            data-tooltip-content={userAddress}
            className="text-sm text-gray-500 truncate max-w-[120px]"
          >
            {userAddress ? userAddress.split(',')[0] : "Set location"}
          </p>
          {userData?.profilePicture ? (
            <img
              referrerPolicy="no-referrer"
              src={profilePicture}
              alt="Profile"
              onClick={() => setShowDropdown(!showDropdown)}
              className="rounded-full w-8 h-8 cursor-pointer"
            />
          ) : (
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <MdPerson className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden fixed top-14 right-4 bg-white rounded-lg shadow-lg z-50 min-w-[180px] border border-gray-100"
          >
            <div className="p-3 border-b border-gray-100">
              <p className="font-medium text-gray-900 truncate">{userData?.fullname}</p>
              <p className="text-xs text-gray-500 truncate">{userData?.email}</p>
            </div>
            <div className="p-1">
              <button
                onClick={() => {
                  navigate('/profile');
                  setShowDropdown(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Profile
              </button>
              {isVendor && (
                <button
                  onClick={() => {
                    navigate('/vendor');
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-gray-50 rounded-lg"
                >
                  Switch to Vendor
                </button>
              )}
              <button
                onClick={() => {
                  setShowLogoutConfirm(true);
                  setShowDropdown(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-gray-50 rounded-lg"
              >
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-1 ${mainMargin} mt-14 lg:mt-0 mb-16 lg:mb-0 transition-all duration-300`}>
        <Outlet />
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10">
        <div className="flex justify-around items-center h-14">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              location.pathname === '/' ? "text-orange-500" : "text-gray-400"
            }`}
          >
            <MdHome className="w-6 h-6" />
            <span className="text-xs mt-0.5">Home</span>
          </button>
          <button
            onClick={() => navigate('/favourites')}
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              location.pathname === '/favourites' ? "text-orange-500" : "text-gray-400"
            }`}
          >
            <MdFavorite className="w-6 h-6" />
            <span className="text-xs mt-0.5">Favourites</span>
          </button>
          <button
            onClick={() => navigate('/orders')}
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              location.pathname === '/orders' ? "text-orange-500" : "text-gray-400"
            }`}
          >
            <MdShoppingBag className="w-6 h-6" />
            <span className="text-xs mt-0.5">Orders</span>
          </button>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              showMoreMenu || ['/coins', '/get-supplies', '/share-supplies'].includes(location.pathname)
                ? "text-orange-500"
                : "text-gray-400"
            }`}
          >
            <BsThreeDots className="w-6 h-6" />
            <span className="text-xs mt-0.5">More</span>
          </button>
        </div>
      </nav>

      {/* More Menu Dropdown */}
      <AnimatePresence>
        {showMoreMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="lg:hidden fixed bottom-16 right-4 bg-white shadow-lg rounded-lg overflow-hidden z-20 min-w-[160px] border border-gray-100"
          >
            {[
              { path: '/coins', label: 'Z-Coins', icon: RiCoinsFill },
              { path: '/share-supplies', label: 'Share Supplies', icon: MdShare },
              { path: '/get-supplies', label: 'Get Supplies', icon: MdSearch },
            ].map(({ path, label, icon: Icon }) => (
              <button
                key={path}
                onClick={() => {
                  navigate(path);
                  setShowMoreMenu(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm ${
                  location.pathname === path
                    ? "text-orange-500 bg-orange-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals and Overlays */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <LogoutConfirm
            showLogoutConfirm={showLogoutConfirm}
            setShowLogoutConfirm={setShowLogoutConfirm}
            handleLogout={handleLogout}
          />
        )}
      </AnimatePresence>

      {showLocationPopup && (
        <LocationConfirm
          setShowLocationPopup={setShowLocationPopup}
          getLocationAndSetAddress={getLocationAndSetAddress}
        />
      )}

      <CartSnackbar />
      <Tooltip id="address-tooltip" />
    </div>
  );
};

export default UserLayout;