"use client";

export default function ImageModal({ isOpen, onClose, imageUrl, title }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-auto rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}