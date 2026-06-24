import React from 'react';
import { Check, AlertCircle, HelpCircle, Trash2 } from 'lucide-react';

const CustomAlert = ({
  isOpen,
  type = 'alert',
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'success',
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          {/* Icon based on severity */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            severity === 'success'
              ? 'bg-green-50 text-[#86c240]'
              : severity === 'danger'
                ? 'bg-red-50 text-red-600'
                : severity === 'warning'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-[#86c240]/10 text-[#86c240]'
          }`}>
            {severity === 'success' && <Check className="w-5 h-5" />}
            {severity === 'danger' && <Trash2 className="w-5 h-5" />}
            {severity === 'warning' && <AlertCircle className="w-5 h-5" />}
            {severity === 'info' && <HelpCircle className="w-5 h-5" />}
          </div>

          <h3 className="text-base font-extrabold text-slate-800 tracking-tight mb-2">
            {title}
          </h3>
          
          <p className="text-slate-500 text-xs leading-relaxed mb-6 px-2 font-medium">
            {message}
          </p>

          <div className="flex w-full gap-3 justify-center">
            {type === 'confirm' ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-all font-bold text-xs border border-slate-200"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    if (onConfirm) onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-2.5 text-white rounded-xl transition-all font-bold text-xs ${
                    severity === 'success'
                      ? 'bg-[#86c240] hover:bg-[#6a9c31]'
                      : severity === 'danger'
                        ? 'bg-red-600 hover:bg-red-700'
                        : severity === 'warning'
                          ? 'bg-amber-500 hover:bg-amber-600'
                          : 'bg-[#86c240] hover:bg-[#6a9c31]'
                  }`}
                >
                  {confirmText}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-[#86c240] hover:bg-[#6a9c31] text-white rounded-xl transition-all font-bold text-xs shadow-sm"
              >
                Okay
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;
