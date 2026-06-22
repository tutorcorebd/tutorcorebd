import React from 'react';

const VerifiedBadge = ({ size = 16, position = 'top', align = 'center' }) => {
  const alignClass = 
    align === 'left' ? 'left-0' :
    align === 'right' ? 'right-0' :
    'left-1/2 -translate-x-1/2';

  const arrowAlignClass =
    align === 'left' ? 'left-4' :
    align === 'right' ? 'right-4' :
    'left-1/2 -translate-x-1/2';

  return (
    <span className="group relative inline-block cursor-help select-none align-middle ml-1">
      <svg 
        className="text-[#86c240] fill-current shrink-0" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
      </svg>
      
      {/* Tooltip box */}
      <span 
        className={`pointer-events-none absolute ${
          position === 'bottom' 
            ? 'top-full mt-2' 
            : 'bottom-full mb-2'
        } ${alignClass} w-48 sm:w-60 bg-slate-900 text-white text-[11px] font-medium leading-relaxed p-2.5 rounded-xl shadow-xl border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[99] text-center normal-case tracking-normal`}
      >
        Accounts with a verified badge have been authenticated and can be Tutor Core Verified subscribers or notable persons or brands.
        
        {/* Tooltip triangle arrow */}
        <span 
          className={`absolute ${
            position === 'bottom'
              ? `bottom-full ${arrowAlignClass} border-8 border-transparent border-b-slate-900`
              : `top-full ${arrowAlignClass} border-8 border-transparent border-t-slate-900`
          }`}
        ></span>
      </span>
    </span>
  );
};

export default VerifiedBadge;
