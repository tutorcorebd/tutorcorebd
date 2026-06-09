import { useState } from 'react';

const MyPayment = () => {
  const [activeTab, setActiveTab] = useState('My Balance');
  const tabs = [
    'My Balance', 'Payment Due', 'Invoice', 'Refund Status', 
    'Payment Method', 'Payment TXN', 'Membership TXN', 'Refund TXN'
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-slate-100 overflow-x-auto pb-2 scrollbar-hide">
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

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 w-full max-w-sm">
        <h3 className="text-xs font-bold text-slate-500 mb-1">My Balance</h3>
        <div className="text-2xl font-black text-slate-800 mb-6">0 BDT</div>
        <div className="flex justify-end border-t border-slate-50 pt-4 mt-8">
          <button className="px-4 py-2 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-lg transition-colors">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyPayment;
