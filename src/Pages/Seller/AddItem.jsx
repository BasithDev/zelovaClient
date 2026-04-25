import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiPlus, FiTrash2, FiLayers, FiPackage } from 'react-icons/fi';
import { AiOutlineClose } from 'react-icons/ai';
import { HiOutlinePhotograph } from 'react-icons/hi';
import { addProduct, getOffers, getSubCategories, getCategories } from '../../Services/apiServices';
import SearchableDropdown from '../../Components/Common/SearchableDropdown';
import ImageCropper from '../../Components/Common/ImageCropper';
import { toast } from "react-hot-toast";
import { uploadImageToCloud } from '../../Helpers/uploadImageToCloud';

const AddItem = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    itemName: '',
    price: '',
    description: '',
    mainCategory: '',
    category: '',
    offer: '',
    isCustomizable: false,
    customFields: [],
    image: null,
  });

  const [croppedImage, setCroppedImage] = useState(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [dropdownData, setDropdownData] = useState({ 
    categories: [],
    subCategories: [], 
    offers: [] 
  });
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [catResponse, subCatResponse, offersResponse] = await Promise.all([
        getCategories(),
        getSubCategories(),
        getOffers()
      ]);
      setDropdownData({
        categories: catResponse.data.categories || [],
        subCategories: subCatResponse.data.subCategories || [],
        offers: offersResponse.data.offers || [],
      });
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  }, []);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  const filteredSubCategories = formData.mainCategory
    ? dropdownData.subCategories.filter(sub => sub.categoryName === formData.mainCategory)
    : dropdownData.subCategories;

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'mainCategory') {
      setFormData((prev) => ({ ...prev, mainCategory: value, category: '' }));
    }
  };

  const addCustomField = (type = 'addon') => {
    const newField = {
      fieldName: '',
      type: type,
      required: type === 'version',
      multiSelect: type === 'addon',
      options: [{ name: '', price: '' }]
    };
    setFormData((prev) => ({
      ...prev,
      customFields: [...prev.customFields, newField],
    }));
  };

  const updateCustomField = (index, field, value) => {
    const updatedFields = formData.customFields.map((f, i) => {
      if (i !== index) return f;
      const updated = { ...f, [field]: value };
      if (field === 'type') {
        updated.required = value === 'version';
        updated.multiSelect = value === 'addon';
      }
      return updated;
    });
    handleFieldChange('customFields', updatedFields);
  };

  const addOptionToField = (fieldIndex) => {
    const updatedFields = formData.customFields.map((f, i) => {
      if (i !== fieldIndex) return f;
      return { ...f, options: [...f.options, { name: '', price: '' }] };
    });
    handleFieldChange('customFields', updatedFields);
  };

  const updateOption = (fieldIndex, optionIndex, key, value) => {
    const updatedFields = formData.customFields.map((f, i) => {
      if (i !== fieldIndex) return f;
      const updatedOptions = f.options.map((opt, oi) => 
        oi === optionIndex ? { ...opt, [key]: value } : opt
      );
      return { ...f, options: updatedOptions };
    });
    handleFieldChange('customFields', updatedFields);
  };

  const removeOption = (fieldIndex, optionIndex) => {
    const updatedFields = formData.customFields.map((f, i) => {
      if (i !== fieldIndex) return f;
      return { ...f, options: f.options.filter((_, oi) => oi !== optionIndex) };
    });
    handleFieldChange('customFields', updatedFields);
  };

  const removeCustomField = (index) => {
    const updatedFields = formData.customFields.filter((_, i) => i !== index);
    handleFieldChange('customFields', updatedFields);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleFieldChange('image', reader.result);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedData) => {
    setCroppedImage(croppedData);
    setIsCropperOpen(false);
  };

  const validateForm = () => {
    const { itemName, price, category, customFields } = formData;
    if (!itemName.trim()) {
      toast.error('Please enter item name');
      return false;
    }
    if (!price || parseFloat(price) <= 0) {
      toast.error('Please enter a valid price');
      return false;
    }
    if (!category) {
      toast.error('Please select a category');
      return false;
    }
    if (!croppedImage) {
      toast.error('Please upload an image');
      return false;
    }
    if (customFields.length > 0) {
      for (let field of customFields) {
        if (!field.fieldName.trim()) {
          toast.error('Please enter a name for all customizations');
          return false;
        }
        const validOptions = field.options.filter(opt => opt.name.trim() && opt.price !== '');
        if (validOptions.length === 0) {
          toast.error(`Add at least one option for "${field.fieldName}"`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setIsAddingItem(true);
      const uploadedImage = await uploadImageToCloud(croppedImage);
      
      const transformedCustomFields = formData.customFields.map(field => ({
        fieldName: field.fieldName,
        type: field.type,
        required: field.required,
        multiSelect: field.multiSelect,
        options: field.options
          .filter(opt => opt.name.trim() && opt.price !== '')
          .map(opt => ({ name: opt.name.trim(), price: Number(opt.price) }))
      }));

      const updatedFormData = { 
        ...formData, 
        image: uploadedImage.secure_url,
        customFields: transformedCustomFields
      };
      await addProduct(updatedFormData);
      setShowSuccess(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add product!');
      console.error('Add Product Error:', error);
    } finally {
      setIsAddingItem(false);
    }
  };

  const resetForm = () => {
    setFormData({
      itemName: '',
      price: '',
      description: '',
      mainCategory: '',
      category: '',
      offer: '',
      isCustomizable: false,
      customFields: [],
      image: null,
    });
    setCroppedImage(null);
    setShowSuccess(false);
  };

  const categoryOptions = dropdownData.categories.map(cat => ({ value: cat.name, label: cat.name }));
  const subCategoryOptions = filteredSubCategories.map(sub => ({ value: sub._id, label: sub.name, subtitle: sub.categoryName }));
  const offerOptions = dropdownData.offers.map(offer => ({ value: offer._id, label: offer.offerName, subtitle: `${offer.discountAmount}% off` }));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-4 lg:px-6 py-4">
          <h1 className="text-xl font-bold text-slate-900">Add New Item</h1>
          <p className="text-sm text-slate-500">Add a new food item to your menu</p>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="p-6 space-y-6">
                
                {/* Image + Basic Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Image Upload */}
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Image <span className="text-rose-500">*</span>
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative aspect-square rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 overflow-hidden ${
                        croppedImage ? 'border-transparent' : 'border-slate-300 hover:border-orange-400 bg-slate-50'
                      }`}
                    >
                      {croppedImage ? (
                        <>
                          <img src={croppedImage} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-sm font-medium">Change</span>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <HiOutlinePhotograph className="w-10 h-10 text-slate-400 mb-2" />
                          <span className="text-xs text-slate-500">Click to upload</span>
                        </div>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                  </div>

                  {/* Basic Info */}
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Item Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.itemName}
                        onChange={(e) => handleFieldChange('itemName', e.target.value)}
                        placeholder="e.g. Chicken Biryani"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Price (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleFieldChange('price', e.target.value)}
                        placeholder="199"
                        min="0"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <SearchableDropdown
                        label="Main Category"
                        placeholder="Select type"
                        options={categoryOptions}
                        value={formData.mainCategory}
                        onChange={(val) => handleFieldChange('mainCategory', val)}
                        emptyMessage="Add categories first"
                      />
                      <SearchableDropdown
                        label="Sub Category"
                        placeholder={formData.mainCategory ? "Select" : "Select main first"}
                        options={subCategoryOptions}
                        value={formData.category}
                        onChange={(val) => handleFieldChange('category', val)}
                        disabled={!formData.mainCategory}
                        required
                        emptyMessage="No sub-categories"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Describe your item..."
                    rows={2}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Offer */}
                <SearchableDropdown
                  label="Apply Offer"
                  placeholder="Select an offer (optional)"
                  options={offerOptions}
                  value={formData.offer}
                  onChange={(val) => handleFieldChange('offer', val)}
                  emptyMessage="No offers available"
                />

                {/* Customizations */}
                <div className="border-t border-slate-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Customizations</label>
                      <p className="text-xs text-slate-500">Add variants or add-ons</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isCustomizable}
                        onChange={(e) => {
                          handleFieldChange('isCustomizable', e.target.checked);
                          if (!e.target.checked) handleFieldChange('customFields', []);
                        }}
                        className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm text-slate-600">Enable</span>
                    </label>
                  </div>

                  <AnimatePresence>
                    {formData.isCustomizable && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        {/* Add Buttons */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => addCustomField('version')}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium"
                          >
                            <FiLayers className="w-4 h-4" />
                            Variant
                          </button>
                          <button
                            type="button"
                            onClick={() => addCustomField('addon')}
                            className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 text-sm font-medium"
                          >
                            <FiPackage className="w-4 h-4" />
                            Add-on
                          </button>
                        </div>

                        {/* Custom Fields */}
                        {formData.customFields.map((field, fieldIndex) => (
                          <motion.div
                            key={fieldIndex}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`rounded-xl border p-4 ${
                              field.type === 'version' ? 'bg-blue-50/50 border-blue-200' : 'bg-emerald-50/50 border-emerald-200'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-2">
                                {field.type === 'version' ? (
                                  <FiLayers className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <FiPackage className="w-4 h-4 text-emerald-600" />
                                )}
                                <input
                                  type="text"
                                  placeholder={field.type === 'version' ? "e.g. Size" : "e.g. Toppings"}
                                  value={field.fieldName}
                                  onChange={(e) => updateCustomField(fieldIndex, 'fieldName', e.target.value)}
                                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium bg-white w-40"
                                />
                                {field.type === 'version' && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">Required</span>
                                )}
                              </div>
                              <button type="button" onClick={() => removeCustomField(fieldIndex)} className="text-slate-400 hover:text-rose-500">
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Options */}
                            <div className="space-y-2">
                              {field.options.map((option, optionIndex) => (
                                <motion.div 
                                  key={optionIndex} 
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex gap-2 items-center"
                                >
                                  <input
                                    type="text"
                                    placeholder="Option name"
                                    value={option.name}
                                    onChange={(e) => updateOption(fieldIndex, optionIndex, 'name', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                  />
                                  <div className="relative w-24">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={option.price}
                                      onChange={(e) => updateOption(fieldIndex, optionIndex, 'price', e.target.value)}
                                      className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                    />
                                  </div>
                                  {field.options.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeOption(fieldIndex, optionIndex)}
                                      className="p-2 text-slate-400 hover:text-rose-500"
                                    >
                                      <AiOutlineClose className="w-4 h-4" />
                                    </button>
                                  )}
                                </motion.div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addOptionToField(fieldIndex)}
                                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mt-2"
                              >
                                <FiPlus className="w-4 h-4" />
                                Add option
                              </button>
                            </div>
                          </motion.div>
                        ))}

                        {formData.customFields.length === 0 && (
                          <div className="text-center py-6 text-slate-400 text-sm">
                            Click the buttons above to add variants or extras
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/vendor/menu')}
                  className="px-5 py-2.5 text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingItem}
                  className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {isAddingItem ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <FiPlus className="w-4 h-4" />
                      Add Item
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </form>
        </div>
      </div>

      {/* Image Cropper */}
      <ImageCropper
        isOpen={isCropperOpen}
        onClose={() => { setIsCropperOpen(false); handleFieldChange('image', null); }}
        imageSrc={formData.image}
        onCropComplete={handleCropComplete}
        aspect={1}
        title="Crop Item Image"
      />

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full text-center"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <FiCheck className="w-8 h-8 text-emerald-600" />
              </motion.div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Item Added!</h3>
              <p className="text-slate-500 mb-6">Your item has been added to the menu.</p>
              <div className="flex gap-3">
                <button onClick={resetForm} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg font-medium hover:bg-slate-50">Add Another</button>
                <button onClick={() => navigate('/vendor/menu')} className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600">View Menu</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddItem;