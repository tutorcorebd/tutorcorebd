import React from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const CustomAlert = ({ 
  isOpen, onClose, type = 'success', title, message, 
  actionText = 'OK', onAction, showCancel = false, cancelText = 'Cancel' 
}) => {
  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle className="w-12 h-12 text-[#86c240]" />,
    error: <XCircle className="w-12 h-12 text-red-500" />,
    info: <Info className="w-12 h-12 text-blue-500" />
  };

  const colors = {
    success: 'border-[#86c240]',
    error: 'border-red-500',
    info: 'border-blue-500'
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className={`relative bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border-t-4 ${colors[type]} shadow-2xl transform transition-all z-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200`}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-650 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="mb-4 mt-2">
          {icons[type]}
        </div>

        {/* Content */}
        <h3 className="text-xl font-extrabold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
          {message}
        </p>

        {/* Action Button */}
        <div className="flex w-full gap-3">
          {showCancel && (
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors text-sm"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleAction}
            className={`flex-1 py-3 text-white font-bold rounded-xl transition-all shadow-md text-sm ${
              type === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' :
              type === 'info' ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20' :
              'bg-[#86c240] hover:bg-[#6a9c31] shadow-[#86c240]/20'
            }`}
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;
