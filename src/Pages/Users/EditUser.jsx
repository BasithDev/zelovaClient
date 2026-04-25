import { FiCamera, FiTrash2 } from 'react-icons/fi';
import { MdArrowBack, MdPerson } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadImageToCloud } from '../../Helpers/uploadImageToCloud';
import { deleteUserImage, updateUser } from '../../Services/apiServices';
import { fetchUserData } from '../../Redux/slices/user/userDataSlice';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const EditUser = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userData = useSelector((state) => state.userData.data);
  const userId = userData._id;
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoveImg, setIsRemoveImg] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [image, setImage] = useState(null);
  const [cropData, setCropData] = useState('');
  const [cropper, setCropper] = useState(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDone = () => {
    if (cropper) {
      setCropData(cropper.getCroppedCanvas().toDataURL());
      setShowCropper(false);
    }
  };

  const extractPublicId = (url) => {
    const regex = /\/v(\d+)\/(.*)\./;
    const match = url.match(regex);
    return match ? match[2] : null;
  };

  const handleRemoveProfilePicture = async () => {
    if (!userData.profilePicture) {
      toast.info('No profile picture to remove');
      return;
    }
    setIsRemoveImg(true);
    try {
      setImage(null);
      setCropData('');
      const public_id = extractPublicId(userData.profilePicture);
      if (public_id) {
        await deleteUserImage({ public_id, userId });
        dispatch(fetchUserData(userId));
        toast.success('Profile picture removed');
      } else {
        toast.error('Unable to remove picture');
      }
    } catch (error) {
      console.error('Error removing picture:', error);
      toast.error('Failed to remove picture');
    } finally {
      setIsRemoveImg(false);
    }
  };

  const validationSchema = Yup.object({
    fullname: Yup.string()
      .trim()
      .required('Full name is required')
      .min(3, 'At least 3 characters')
      .matches(/^[a-zA-Z\s]+$/, 'Only letters and spaces'),
    phoneNumber: Yup.string()
      .trim()
      .required('Phone number is required')
      .matches(/^[0-9]+$/, 'Only numbers')
      .min(10, 'At least 10 digits'),
    age: Yup.number()
      .required('Age is required')
      .min(10, 'Must be above 10')
      .max(115, 'Must be below 115'),
  });

  const initialValues = {
    fullname: userData?.fullname || '',
    phoneNumber: userData?.phoneNumber || '',
    age: userData?.age || '',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <button 
            onClick={() => navigate('/profile')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MdArrowBack className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Edit Profile</h1>
        </motion.div>

        {/* Profile Picture Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-4"
        >
          <h2 className="text-sm font-medium text-gray-500 mb-4">Profile Photo</h2>
          <div className="flex items-center gap-5">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.02 }}
            >
              {cropData || userData?.profilePicture ? (
                <img
                  referrerPolicy="no-referrer"
                  src={cropData || userData.profilePicture}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-orange-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-4 border-gray-100">
                  <MdPerson className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 p-2.5 bg-orange-500 text-white rounded-full cursor-pointer hover:bg-orange-600 transition-colors shadow-lg">
                <FiCamera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            </motion.div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-lg">{userData?.fullname}</p>
              <p className="text-sm text-gray-500 mb-3">{userData?.email}</p>
              {(userData?.profilePicture || cropData) && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRemoveProfilePicture}
                  disabled={isRemoveImg}
                  className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                  {isRemoveImg ? 'Removing...' : 'Remove photo'}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
        >
          <h2 className="text-sm font-medium text-gray-500 mb-4">Personal Information</h2>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            enableReinitialize
            onSubmit={async (values) => {
              setIsUpdating(true);
              try {
                let updatedProfileData = { 
                  fullname: values.fullname,
                  phoneNumber: values.phoneNumber,
                  age: Number(values.age),
                  userId 
                };
                if (cropData) {
                  const uploadedImage = await uploadImageToCloud(cropData);
                  updatedProfileData.profilePicture = uploadedImage.secure_url;
                }
                await updateUser(updatedProfileData);
                dispatch(fetchUserData(userId));
                toast.success('Profile updated successfully');
                navigate('/profile');
              } catch (error) {
                console.error('Error updating profile:', error);
                toast.error('Failed to update profile');
              } finally {
                setIsUpdating(false);
              }
            }}
          >
            {({ errors, touched }) => (
              <Form className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <Field
                    type="text"
                    name="fullname"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${
                      errors.fullname && touched.fullname ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Enter your full name"
                  />
                  <ErrorMessage name="fullname" component="p" className="text-red-500 text-xs mt-1" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <Field
                    type="tel"
                    name="phoneNumber"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${
                      errors.phoneNumber && touched.phoneNumber ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Enter your phone number"
                  />
                  <ErrorMessage name="phoneNumber" component="p" className="text-red-500 text-xs mt-1" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Age</label>
                  <Field
                    type="number"
                    name="age"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${
                      errors.age && touched.age ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Enter your age"
                  />
                  <ErrorMessage name="age" component="p" className="text-red-500 text-xs mt-1" />
                </div>

                <motion.button
                  type="submit"
                  disabled={isUpdating}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm mt-2"
                >
                  {isUpdating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </motion.button>
              </Form>
            )}
          </Formik>
        </motion.div>

        {/* Cropper Modal */}
        <AnimatePresence>
          {showCropper && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl"
              >
                <h3 className="text-lg font-semibold mb-4">Crop Photo</h3>
                {image && (
                  <Cropper
                    src={image}
                    style={{ height: 280, width: '100%' }}
                    initialAspectRatio={1}
                    aspectRatio={1}
                    guides={false}
                    viewMode={1}
                    onInitialized={(instance) => setCropper(instance)}
                    className="rounded-xl overflow-hidden"
                  />
                )}
                <div className="flex gap-3 mt-5">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowCropper(false);
                      setImage(null);
                    }}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDone}
                    className="flex-1 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
                  >
                    Apply
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EditUser;