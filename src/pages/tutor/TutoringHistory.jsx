import { useState } from 'react';

const TutoringHistory = () => {
  const [activeTab, setActiveTab] = useState('Current Status');
  const tabs = [
    'Current Status', 'Applied (0)', 'Shortlisted (0)', 'Appointed (0)', 
    'Confirmed (0)', 'Payment (0)', 'Due (0)', 'Refund (0)', 'Cancel (0)'
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-100 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap pb-2 text-xs font-bold transition-all relative ${
              activeTab === tab 
                ? 'text-[#86c240]' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-[-9px] left-0 right-0 h-1 bg-[#86c240] rounded-t-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Payment Stage</h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center justify-center text-center h-64">
            <div className="w-16 h-16 bg-[#eaf4df] rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-semibold">You have no Status yet. Got it?</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Other Stage</h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center justify-center text-center h-64">
            <div className="w-16 h-16 bg-[#eaf4df] rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-semibold">You have no Status yet. Got it?</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutoringHistory;
