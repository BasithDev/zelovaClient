import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiSave, FiPlus, FiLayers, FiPackage, FiCamera } from 'react-icons/fi';
import { AiOutlineClose } from 'react-icons/ai';
import ImageCropper from '../../Components/Common/ImageCropper';
import { toast } from 'react-hot-toast';

const ItemDetailModal = ({
  isOpen,
  onClose,
  product,
  onSave,
  onDelete,
  onToggleList,
  onImageUpdate,
  offers = []
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (product) {
      // Transform customizations for editing
      const customFields = (product.customizations || []).map(c => ({
        fieldName: c.fieldName,
        type: c.type || 'addon',
        required: c.required || false,
        multiSelect: c.multiSelect !== false,
        options: c.options.map(o => ({ name: o.name, price: o.price.toString() }))
      }));
      setEditData({
        name: product.name,
        price: product.price.toString(),
        description: product.description || '',
        image: product.image,
        offer: product.offers?._id || '',
        isCustomizable: product.customizable || false,
        customFields
      });
    }
  }, [product]);

  const handleFieldChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const addCustomField = (type) => {
    setEditData(prev => ({
      ...prev,
      customFields: [...prev.customFields, {
        fieldName: '',
        type,
        required: type === 'version',
        multiSelect: type === 'addon',
        options: [{ name: '', price: '' }]
      }]
    }));
  };

  const updateCustomField = (index, field, value) => {
    const updated = editData.customFields.map((f, i) => {
      if (i !== index) return f;
      const newField = { ...f, [field]: value };
      if (field === 'type') {
        newField.required = value === 'version';
        newField.multiSelect = value === 'addon';
      }
      return newField;
    });
    handleFieldChange('customFields', updated);
  };

  const addOptionToField = (fieldIndex) => {
    const updated = editData.customFields.map((f, i) => 
      i === fieldIndex ? { ...f, options: [...f.options, { name: '', price: '' }] } : f
    );
    handleFieldChange('customFields', updated);
  };

  const updateOption = (fieldIndex, optionIndex, key, value) => {
    const updated = editData.customFields.map((f, i) => {
      if (i !== fieldIndex) return f;
      const options = f.options.map((o, oi) => oi === optionIndex ? { ...o, [key]: value } : o);
      return { ...f, options };
    });
    handleFieldChange('customFields', updated);
  };

  const removeOption = (fieldIndex, optionIndex) => {
    const updated = editData.customFields.map((f, i) => 
      i === fieldIndex ? { ...f, options: f.options.filter((_, oi) => oi !== optionIndex) } : f
    );
    handleFieldChange('customFields', updated);
  };

  const removeCustomField = (index) => {
    handleFieldChange('customFields', editData.customFields.filter((_, i) => i !== index));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedImage) => {
    handleFieldChange('image', croppedImage);
    setIsCropperOpen(false);
    setTempImage(null);
  };

  const handleSave = async () => {
    if (!editData.name.trim() || !editData.price) {
      toast.error('Name and price are required');
      return;
    }

    try {
      setIsSaving(true);
      const updatedProduct = {
        ...product,
        name: editData.name,
        price: Number(editData.price),
        description: editData.description,
        image: editData.image,
        customizable: editData.isCustomizable,
        customizations: editData.customFields.map(f => ({
          fieldName: f.fieldName,
          type: f.type,
          required: f.required,
          multiSelect: f.multiSelect,
          options: f.options.filter(o => o.name && o.price).map(o => ({
            name: o.name,
            price: Number(o.price)
          }))
        }))
      };
      await onSave(updatedProduct);
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (!product || !editData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  {isEditing ? 'Edit Item' : 'Item Details'}
                </h2>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                  product.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {product.isActive ? 'Listed' : 'Unlisted'}
                </span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                <FiX className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Image */}
                <div className="md:col-span-1">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={isEditing ? editData.image : product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {isEditing && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <FiCamera className="w-8 h-8 text-white" />
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                </div>

                {/* Details */}
                <div className="md:col-span-2 space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => handleFieldChange('name', e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
                        <input
                          type="number"
                          value={editData.price}
                          onChange={(e) => handleFieldChange('price', e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                          value={editData.description}
                          onChange={(e) => handleFieldChange('description', e.target.value)}
                          rows={2}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-2xl font-bold text-slate-900">{product.name}</h3>
                      <p className="text-3xl font-bold text-orange-500">₹{product.price}</p>
                      {product.description && (
                        <p className="text-slate-600">{product.description}</p>
                      )}
                      {product.offers && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                          <span>{product.offers.discountAmount}% off on {product.offers.requiredQuantity}+ items</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Customizations */}
              {(isEditing || (product.customizable && product.customizations?.length > 0)) && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">Customizations</h4>
                    {isEditing && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editData.isCustomizable}
                          onChange={(e) => {
                            handleFieldChange('isCustomizable', e.target.checked);
                            if (!e.target.checked) handleFieldChange('customFields', []);
                          }}
                          className="w-4 h-4 text-orange-500 rounded"
                        />
                        <span className="text-sm text-slate-600">Enable</span>
                      </label>
                    )}
                  </div>

                  {isEditing && editData.isCustomizable && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => addCustomField('version')}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                        >
                          <FiLayers className="w-4 h-4" /> Variant
                        </button>
                        <button
                          type="button"
                          onClick={() => addCustomField('addon')}
                          className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium"
                        >
                          <FiPackage className="w-4 h-4" /> Add-on
                        </button>
                      </div>

                      {editData.customFields.map((field, fieldIndex) => (
                        <div
                          key={fieldIndex}
                          className={`rounded-xl border p-4 ${field.type === 'version' ? 'bg-blue-50/50 border-blue-200' : 'bg-emerald-50/50 border-emerald-200'}`}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              {field.type === 'version' ? <FiLayers className="w-4 h-4 text-blue-600" /> : <FiPackage className="w-4 h-4 text-emerald-600" />}
                              <input
                                type="text"
                                value={field.fieldName}
                                onChange={(e) => updateCustomField(fieldIndex, 'fieldName', e.target.value)}
                                placeholder={field.type === 'version' ? 'e.g. Size' : 'e.g. Toppings'}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white w-40"
                              />
                              {field.type === 'version' && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">Required</span>
                              )}
                            </div>
                            <button onClick={() => removeCustomField(fieldIndex)} className="text-slate-400 hover:text-rose-500">
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            {field.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={option.name}
                                  onChange={(e) => updateOption(fieldIndex, optionIndex, 'name', e.target.value)}
                                  placeholder="Option name"
                                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                />
                                <div className="relative w-24">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                  <input
                                    type="number"
                                    value={option.price}
                                    onChange={(e) => updateOption(fieldIndex, optionIndex, 'price', e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                  />
                                </div>
                                {field.options.length > 1 && (
                                  <button onClick={() => removeOption(fieldIndex, optionIndex)} className="p-2 text-slate-400 hover:text-rose-500">
                                    <AiOutlineClose className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              onClick={() => addOptionToField(fieldIndex)}
                              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
                            >
                              <FiPlus className="w-4 h-4" /> Add option
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isEditing && product.customizations?.map((custom, idx) => (
                    <div key={idx} className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        {custom.type === 'version' ? (
                          <FiLayers className="w-4 h-4 text-blue-600" />
                        ) : (
                          <FiPackage className="w-4 h-4 text-emerald-600" />
                        )}
                        <span className="font-medium text-slate-700">{custom.fieldName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${custom.type === 'version' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {custom.type === 'version' ? 'Variant' : 'Add-on'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {custom.options.map((opt, oi) => (
                          <span key={oi} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                            {opt.name} <span className="text-slate-500"> {custom.type === 'version' ? '₹' : '+₹'}{opt.price}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-t border-slate-100">
              <div className="flex gap-2">
                <button
                  onClick={() => onToggleList(product._id, !product.isActive)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                    product.isActive
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
                >
                  {product.isActive ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  {product.isActive ? 'Unlist' : 'List'}
                </button>
                <button
                  onClick={() => onDelete(product._id, product.name)}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 text-sm font-medium"
                >
                  <FiTrash2 className="w-4 h-4" /> Delete
                </button>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium disabled:opacity-50"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FiSave className="w-4 h-4" />
                      )}
                      Save
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
                  >
                    <FiEdit2 className="w-4 h-4" /> Edit
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Image Cropper */}
          <ImageCropper
            isOpen={isCropperOpen}
            onClose={() => { setIsCropperOpen(false); setTempImage(null); }}
            imageSrc={tempImage}
            onCropComplete={handleCropComplete}
            aspect={1}
            title="Crop Image"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ItemDetailModal;
