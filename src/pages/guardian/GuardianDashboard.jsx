import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { Link } from 'react-router-dom';

const GuardianDashboard = () => {
  const { profile } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('tuition_requests')
        .select('*')
        .eq('guardian_id', profile?.id)
        .order('created_at', { ascending: false });
      if (data) setRequests(data);
    };
    if (profile?.id) fetchRequests();
  }, [profile]);

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('tuition_requests')
      .update({ status: newStatus })
      .eq('id', id);
      
    if (!error) {
      setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
    } else {
      alert('Failed to update status');
    }
  };

  const counts = {
    all: requests.length,
    open: requests.filter(r => r.status === 'open').length,
    assigned: requests.filter(r => r.status === 'assigned').length,
    closed: requests.filter(r => r.status === 'closed').length
  };

  const filteredRequests = requests.filter(req => {
    if (activeTab === 'all') return true;
    return req.status === activeTab;
  });

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto mt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Welcome, {profile?.full_name}</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Manage your posted tuition requirements here.</p>
        </div>
        <Link to="/guardian/post-request" className="bg-[#86c240] hover:bg-[#6a9c31] text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-colors text-sm">
          Post New Requirement
        </Link>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
            Your Tuition Requests
          </h2>
          <span className="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full font-bold">
            {counts[activeTab]} showing
          </span>
        </div>

        {/* Async tabs toggling */}
        <div className="flex flex-wrap gap-2.5 border-b border-slate-100 pb-4 mb-6">
          {['all', 'open', 'assigned', 'closed'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                activeTab === tab 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <span className="capitalize">{tab}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                activeTab === tab 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>
        
        {filteredRequests.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
            <p className="text-slate-500 font-medium">No requirements found in this section.</p>
            {activeTab === 'all' && (
              <Link to="/guardian/post-request" className="text-[#86c240] font-bold mt-2 inline-block hover:underline">Post your first tuition →</Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {filteredRequests.map(req => (
              <div key={req.id} className="bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 rounded-2xl flex flex-col justify-between hover:shadow-[0_4px_25px_rgb(0,0,0,0.06)] transition-shadow">
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 leading-tight mb-1">{req.student_class}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {req.subject.slice(0, 3).map(sub => (
                        <span key={sub} className="bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {sub}
                        </span>
                      ))}
                      {req.subject.length > 3 && (
                        <span className="bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          +{req.subject.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Status Dropdown */}
                  <select 
                    value={req.status}
                    onChange={(e) => updateStatus(req.id, e.target.value)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 cursor-pointer transition-colors ${
                      req.status === 'open' ? 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500/20' : 
                      req.status === 'assigned' ? 'bg-green-50 text-green-700 border-green-200 focus:ring-green-500/20' : 
                      'bg-slate-50 text-slate-600 border-slate-200 focus:ring-slate-500/20'
                    }`}
                  >
                    <option value="open">OPEN</option>
                    <option value="assigned">ASSIGNED</option>
                    <option value="closed">CLOSED</option>
                  </select>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-slate-500 font-medium">
                    <span className="w-5 flex justify-center mr-2">📍</span>
                    {req.location}
                  </div>
                  <div className="flex items-center text-sm text-slate-500 font-medium">
                    <span className="w-5 flex justify-center mr-2">💰</span>
                    {req.salary_range || 'Negotiable'}
                  </div>
                  <div className="flex items-center text-sm text-slate-500 font-medium">
                    <span className="w-5 flex justify-center mr-2">📅</span>
                    {req.days_per_week} Days / Week
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                  <span className="text-xs font-bold text-slate-400">
                    Posted on {new Date(req.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  
                  <div className="flex gap-2">
                    <Link 
                      to={`/guardian/edit-request/${req.id}`}
                      className="text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 px-4 py-2 rounded-lg transition-colors border border-slate-200"
                    >
                      Modify
                    </Link>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuardianDashboard;
