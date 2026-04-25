import { Route } from 'react-router-dom';
import { lazy } from 'react';
import { UserRoleProtectedRoute } from './ProtectedRoute';
import VendorLayout from '../Components/Layouts/VendorLayout';

// Vendor Pages
const VendorHome = lazy(() => import('../Pages/Seller/VendorHome'));
const AddItem = lazy(() => import('../Pages/Seller/AddItem'));
const ManageRestaurant = lazy(() => import('../Pages/Seller/ManageRestaurant'));
const MenuManagement = lazy(() => import('../Pages/Seller/Menu'));
const Orders = lazy(() => import('../Pages/Seller/Orders'));
const OfferManagement = lazy(() => import('../Pages/Seller/OfferManagement'));
const CategoriesManagement = lazy(() => import('../Pages/Seller/CategoriesManagement'));

const VendorRoutes = [
    <Route key="vendor" element={<UserRoleProtectedRoute allowedRoles={['vendor']} />}>
        <Route path="/vendor" element={<VendorLayout />}>
            <Route index element={<VendorHome />} />
            <Route path="add-items" element={<AddItem />} />
            <Route path='manage-restaurant' element={<ManageRestaurant />} />
            <Route path='menu' element={<MenuManagement />} />
            <Route path='orders' element={<Orders />} />
            <Route path='offers' element={<OfferManagement />} />
            <Route path='categories' element={<CategoriesManagement />} />
        </Route>
    </Route>
];

export default VendorRoutes;

