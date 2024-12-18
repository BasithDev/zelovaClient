import cloudinaryInstance from './cloudnaryApi'
import api from './api'


export const loginUser = (data) => api.post('/auth/login',data)
export const registerUser = (data) => api.post('/auth/register',data)
export const verifyOTP = (data) => api.post('/auth/verify-otp',data)
export const resendOTP = (data) => api.post('/auth/resend-otp',data)
export const sendOTPForResetPassword = (data) => api.post('/auth/otp-reset-password',data)
export const verifyOTPForResetPassword = (data) => api.post('/auth/verify-otp-reset-password',data)
export const resetPassword = (data) => api.post('/auth/reset-password',data)
export const logout = (role) => api.post('/auth/logout', { role });

//for uploading image to cloudnairy
export const uploadToCloud = (data) => cloudinaryInstance.post(`/image/upload`,data)

//admin routes
export const getAdmin = () => api.get(`/admin`)
export const deleteImage = (data) => api.post('/admin/manage/delete-image',data)
export const getCategoriesToMng = ()=>api.get('/admin/manage/categories')
export const getSubCategoriesToMng = ()=>api.get('/admin/manage/subcategories')
export const deleteCategory = (id)=>api.delete(`/admin/manage/category/delete/${id}`)
export const deleteSubCategory = (id)=>api.delete(`/admin/manage/subcategory/delete/${id}`)
export const sendMail = (data) => api.post('/admin/send-mail',data)
export const deleteAnnouncementTemp = (id) => api.delete(`/admin/announcement-temp/delete/${id}`)
export const getAnnouncementTemp = () => api.get('/admin/announcement-temp')
export const addAnnouncementTemp = (data) => api.post('/admin/announcement-temp/add',data)
export const sendAnnouncement = (data) => api.post('/admin/send-mail/announcement',data)
export const getAnnouncementStatus = (jobId) => api.get(`/admin/send-mail/announcement/status/${jobId}`)
export const getRestaurants = () => api.get('/admin/restaurants')
export const blockUnblockRestaurant = (id) => api.patch(`/admin/restaurant/block-unblock/${id}`)
export const getDashboardData = () => api.get('/admin/dashboard')

//admin routes - reports
export const getReports = (type, getBy, startDate, endDate) => {
    let url = `admin/reports?type=${type}&getBy=${getBy}`;
    if (getBy === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
    }
    return api.get(url);
}
export const exportReportToPDF = (reportData) => api.post('/admin/reports/export/pdf', reportData, {
    responseType: 'blob'
});
export const exportReportToExcel = (reportData) => api.post('/admin/reports/export/excel', reportData, {
    responseType: 'blob'
});

//admin routes - users and vendor management
export const fetchVendorRequests = () => api.get('/admin/manage/requests')
export const getVendorPendingRequestsCount = () => api.get('/admin/manage/requests-count')
export const acceptVenodrRequests = (requestId) => api.post(`/admin/manage/accept-vendor/${requestId}`)
export const denyVenodrRequests = (applicationId) => api.post(`/admin/manage/deny-vendor/${applicationId}`)
export const fetchUsers = () => api.get('/admin/manage/users')
export const fetchVendors = () => api.get('/admin/manage/vendors')
export const blockUnblockUser = (userId,status) => api.patch(`/admin/manage/block-unblock-user/${userId}`,status)
export const blockUnblockVendor = (vendorId,status) => api.patch(`/admin/manage/block-unblock-user/${vendorId}`,status)

//admin routes - coupons management
export const addCoupon = (data) => api.post('/admin/coupon/add',data)
export const getCoupons = () => api.get('/admin/coupon')
export const updateCoupon = (id,data) => api.put(`/admin/coupon/update/${id}`,data)
export const deleteCoupon = (id) => api.delete(`/admin/coupon/delete/${id}`)

//admin routes - user issues management
export const getUserIssues = () => api.get('/admin/user-issues')
export const resolveUserIssues = (issueId) => api.delete(`/admin/user-issues/resolve?issueId=${issueId}`)
export const ignoreUserIssues = (issueId) => api.delete(`/admin/user-issues/ignore?issueId=${issueId}`)
export const refundUserIssues = (data) => api.put('/admin/user-issues/refund',data)
export const getOrderDetails = (orderId) => api.get(`/admin/user-issues/getOrderDetails/${orderId}`)


//user routes
export const getUser = () => api.get(`/user`)
export const updateUser = (data) => api.put('/user/update-profile',data)
export const deleteUserImage = (data) => api.post('/user/delete-image',data)
export const submitVendorReq = (data) => api.post('/user/req-vendor',data)
export const getRestaurantsForUser = (lat,lon)=> api.get(`/user/nearby-restaurants?lat=${lat}&lon=${lon}`)
export const getMenuForUser = (id,lat,lon)=> api.get(`/user/${id}/menu?lat=${lat}&lon=${lon}`)
export const getFoodCategories = () => api.get('/user/food-categories')
export const searchFoodItems = (searchQuery) => api.get(`/user/search?query=${searchQuery}`)
export const raiseIssue = (data) => api.post('/user/raise-issue',data)

//user routes - address management
export const addAddress = (data) => api.post('/user/address/new',data)
export const getAddresses = () => api.get('/user/addresses')
export const deleteAddress = (addressId) => api.delete(`/user/address/${addressId}/delete`)
export const updateAddress = (addressId,data) => api.put(`/user/address/${addressId}/update`,data)

//user routes - cart management
export const getCart = () => api.get('/user/cart')
export const getTotalItemsFromCart = () => api.get('/user/cart/total-items')
export const getTotalPriceFromCart = () => api.get('/user/cart/total-price')
export const updateCart = (data) => api.put('/user/cart/update',data)
export const getUserCoupons = () => api.get('/user/coupons')
export const getDeliveryFee = (lat,lon,restaurantId) => api.get(`/user/cart/delivery-fee?lat=${lat}&lon=${lon}&restaurantId=${restaurantId}`)

//user routes - order management
export const placeOrder = (data) => api.post('/user/orders/place-order',data)
export const getCurrentOrders = () => api.get('/user/orders/current')
export const userUpdateOrderStatus = (data) => api.patch('/user/orders/update-status',data)
export const getPreviousOrdersOnDate = (date) => api.get(`/user/orders/previous/${date}`)
export const createRazorpayOrder = (data) => api.post('/user/orders/create-razorpay-order', data)
export const verifyRazorpayPayment = (data) => api.post('/user/orders/verify-razorpay-payment', data)
export const rateRestaurant = (data) => api.post('/user/orders/rate-restaurant', data)

//user routes - zcoins management
export const getZcoinsData = () => api.get('/user/zcoins')
export const searchUsers = (searchQuery) => api.get(`/user/zcoins/search?searchQuery=${searchQuery}`)
export const sendZcoins = (data) => api.post('/user/zcoins/send',data)

//user routes - favourites management
export const getFavourites = () => api.get('/user/favourites')
export const addFavorite = (data) => api.post('/user/favourites/add',data)
export const removeFavorite = (data) => api.delete(`/user/favourites/remove?foodItemId=${data.foodItemId}`)

//user routes - supplies management
export const getSupplies = (lat,lon) => api.get(`/user/supplies?lat=${lat}&lon=${lon}`)
export const shareSupplies = (data) => api.post('/user/supplies/share',data)
export const viewSharedSupplies = () => api.get('/user/supplies/view')
export const updateSupplies = (data) => api.put('/user/supplies/update',data)
export const deleteSupplies = (id) => api.delete(`/user/supplies/delete?id=${id}`)

//vendor routes - restaruant management
export const getRestaurant = () => api.get(`vendor/restaurant`)
export const updateRestaurantDetails = (data) => api.put(`vendor/restaurant/details`, data);
export const openOrCloseShop = (isActive) => api.patch(`vendor/restaurant/status`, { isActive });
export const updateRestaurantPic = (data) => api.patch(`vendor/restaurant/image`,data);
export const setLocation = (locationData) => api.patch(`vendor/restaurant/location`, locationData);

//vendor routes - products management
export const addProduct = (data) => api.post('/vendor/product',data)
export const getProducts = () => api.get('/vendor/products')
export const listOrUnlistProduct = (id,isActive) => api.patch(`/vendor/product/${id}/list-or-unlist`,{isActive})
export const deleteProduct = (id) => api.delete(`/vendor/product/${id}/delete`)
export const updateProduct = (data) => api.put('/vendor/product/update',data)
export const updateProductOffer = (data) => api.patch('/vendor/product/offer/update',data)

//vendor routes - categories management
export const addCategory = (data) => api.post('vendor/category/add',data)
export const addSubCategory = (data) => api.post('vendor/subcategory/add',data)
export const getCategories = ()=> api.get('/vendor/categories')
export const getSubCategories = ()=> api.get('/vendor/subCategories')

//vendor routes - offers management
export const getOffers = ()=> api.get(`/vendor/offer/`)
export const addOffer = (data)=> api.post('/vendor/offer/add',data)
export const deleteOffer = (offerId) => api.delete(`/vendor/offer/delete/${offerId}`)

//vendor routes - orders management
export const getCurrentOrdersForVendor = () => api.get(`/vendor/orders/current`)
export const updateOrderStatus = (data) => api.patch(`/vendor/orders/update-status`,data)
export const getPreviousOrdersOnDateForVendor = (date) => api.get(`/vendor/orders/previous/${date}`)

//vendor routes - dashboard management
export const getDashboardDataForVendor = () => api.get(`/vendor/dashboard`)
export const getVendorReports = (type, getBy, startDate, endDate) => {
    let url = `vendor/dashboard/reports?type=${type}&getBy=${getBy}`;
    if (getBy === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
    }
    return api.get(url);
}
export const exportVendorReportToPDF = (reportData) => api.post('/vendor/dashboard/reports/export/pdf', reportData, {
    responseType: 'blob'
});
export const exportVendorReportToExcel = (reportData) => api.post('/vendor/dashboard/reports/export/excel', reportData, {
    responseType: 'blob'
});