import React from 'react';
import { Award } from 'lucide-react';

const PremiumBadge = ({ size = 16, position = 'top', align = 'center' }) => {
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
      <Award className="text-amber-500 fill-amber-500/20 shrink-0" width={size} height={size} />
      
      {/* Tooltip box */}
      <span 
        className={`pointer-events-none absolute ${
          position === 'bottom' 
            ? 'top-full mt-2' 
            : 'bottom-full mb-2'
        } ${alignClass} w-56 sm:w-64 bg-amber-600 text-white text-[11px] font-medium leading-relaxed p-2.5 rounded-xl shadow-xl border border-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[99] text-center normal-case tracking-normal`}
      >
        Premium Tutors are highly qualified professionals with a proven track record of excellence on Tutor Core.
        
        {/* Tooltip triangle arrow */}
        <span 
          className={`absolute ${
            position === 'bottom'
              ? `bottom-full ${arrowAlignClass} border-8 border-transparent border-b-amber-600`
              : `top-full ${arrowAlignClass} border-8 border-transparent border-t-amber-600`
          }`}
        ></span>
      </span>
    </span>
  );
};

export default PremiumBadge;
