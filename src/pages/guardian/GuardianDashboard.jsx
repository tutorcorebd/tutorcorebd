import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { Link } from 'react-router-dom';

const GuardianDashboard = () => {
  const { profile } = useAuthStore();
  const [requests, setRequests] = useState([]);

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
        <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
          Your Tuition Requests
          <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full font-bold">{requests.length}</span>
        </h2>
        
        {requests.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
            <p className="text-slate-500 font-medium">You haven't posted any requirements yet.</p>
            <Link to="/guardian/post-request" className="text-[#86c240] font-bold mt-2 inline-block hover:underline">Post your first tuition →</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {requests.map(req => (
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
