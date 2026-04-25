import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZoomIn, FiZoomOut, FiRotateCcw, FiRotateCw, FiX } from 'react-icons/fi';

/**
 * Creates a cropped image from the source and crop area
 */
async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return canvas.toDataURL('image/jpeg', 0.9);
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

/**
 * ImageCropper - Professional image cropping component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the cropper is visible
 * @param {function} props.onClose - Called when user cancels
 * @param {string} props.imageSrc - Source image URL/data
 * @param {function} props.onCropComplete - Called with cropped image data URL
 * @param {number} props.aspect - Aspect ratio (default: 1 for square)
 * @param {string} props.cropShape - 'rect' or 'round' (default: 'rect')
 */
const ImageCropper = ({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  aspect = 1,
  cropShape = 'rect',
  title = 'Crop Image'
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((location) => setCrop(location), []);
  const onZoomChange = useCallback((zoomValue) => setZoom(zoomValue), []);

  const onCropCompleteInternal = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(croppedImage);
      resetState();
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    resetState();
    onClose();
  };

  const resetState = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Cropper Area */}
            <div className="relative h-72 sm:h-80 bg-slate-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspect}
                cropShape={cropShape}
                showGrid={true}
                onCropChange={onCropChange}
                onZoomChange={onZoomChange}
                onCropComplete={onCropCompleteInternal}
              />
            </div>

            {/* Controls */}
            <div className="px-5 py-4 space-y-4">
              {/* Zoom Control */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
                  disabled={zoom <= 1}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FiZoomOut className="w-5 h-5 text-slate-600" />
                </button>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-orange-500"
                />
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                  disabled={zoom >= 3}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FiZoomIn className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Rotation Control */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setRotation((r) => r - 90)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  <FiRotateCcw className="w-4 h-4" />
                  Rotate Left
                </button>
                <button
                  onClick={() => setRotation((r) => r + 90)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  <FiRotateCw className="w-4 h-4" />
                  Rotate Right
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-5 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="px-5 py-2.5 text-slate-600 hover:text-slate-800 font-medium rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Apply'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageCropper;
