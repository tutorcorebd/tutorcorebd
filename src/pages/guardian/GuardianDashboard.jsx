import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { Link } from 'react-router-dom';
import { PlusCircle, Search } from 'lucide-react';

const GuardianDashboard = () => {
  const { profile } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [bookmarkedTutors, setBookmarkedTutors] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);

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

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!profile?.id || requests.length === 0) {
        setBookmarkedTutors([]);
        return;
      }
      setBookmarksLoading(true);
      try {
        const { data: bookmarksData, error: bError } = await supabase
          .from('bookmarks')
          .select('id, tutor_id, tuition_request_id')
          .in('tuition_request_id', requests.map(r => r.id));

        if (bError) throw bError;

        if (bookmarksData && bookmarksData.length > 0) {
          const tutorIds = bookmarksData.map(b => b.tutor_id);
          const { data: tutorsList, error: tError } = await supabase
            .from('users')
            .select(`
              id,
              full_name,
              tutor_profiles (*)
            `)
            .in('id', tutorIds);

          if (tError) throw tError;

          if (tutorsList) {
            const mapped = bookmarksData.map(b => {
              const tutor = tutorsList.find(t => t.id === b.tutor_id);
              const tp = tutor?.tutor_profiles ? (Array.isArray(tutor.tutor_profiles) ? tutor.tutor_profiles[0] : tutor.tutor_profiles) : null;
              return {
                bookmarkId: b.id,
                tutorId: b.tutor_id,
                tutorName: tutor?.full_name || 'Unknown Tutor',
                tutorProfile: tp
              };
            }).filter(item => item.tutorProfile !== null);
            setBookmarkedTutors(mapped);
          }
        } else {
          setBookmarkedTutors([]);
        }
      } catch (err) {
        console.error('Error fetching bookmarked tutors:', err);
      } finally {
        setBookmarksLoading(false);
      }
    };

    fetchBookmarks();
  }, [profile?.id, requests]);

  const removeBookmark = async (bookmarkId) => {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', bookmarkId);

    if (!error) {
      setBookmarkedTutors(bookmarkedTutors.filter(b => b.bookmarkId !== bookmarkId));
    } else {
      alert('Failed to remove bookmark');
    }
  };

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

  const gp = profile?.guardian_profile || {};
  const completeness = gp.profile_completeness || 20;

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

      {/* Row 2: Promos / Action Cards */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* Profile Completeness Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* SVG Circular Progress Ring */}
            <div className="relative flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="32" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                <circle cx="40" cy="40" r="32" stroke="#86c240" strokeWidth="8" fill="transparent"
                  strokeDasharray={2 * Math.PI * 32}
                  strokeDashoffset={2 * Math.PI * 32 * (1 - completeness / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute text-lg font-black text-slate-800">{completeness}%</span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Profile Progress</h3>
              <p className="text-slate-500 text-sm leading-relaxed mt-1 font-medium">
                Complete your profile to build trust with tutors.
              </p>
            </div>
          </div>
          <Link to="/guardian/profile" className="px-4 py-2.5 bg-[#86c240] hover:bg-[#6a9c31] text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-[#86c240]/20 flex-shrink-0 self-center">
            Update Profile
          </Link>
        </div>

        {/* Post A Tuition Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#eaf4df] flex items-center justify-center text-[#86c240] flex-shrink-0">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Post Tuition</h3>
              <p className="text-slate-500 text-sm leading-relaxed mt-1 font-medium">
                Post new requirements to hire verified professional tutors.
              </p>
            </div>
          </div>
          <Link to="/guardian/post-request" className="mt-4 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all text-center">
            Post Requirement
          </Link>
        </div>

        {/* Find Tutors Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Find Tutors</h3>
              <p className="text-slate-500 text-sm leading-relaxed mt-1 font-medium">
                Browse qualified and verified tutors directly.
              </p>
            </div>
          </div>
          <Link to="/find-tutors" className="mt-4 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all text-center">
            Search Tutors
          </Link>
        </div>

      </div>
      
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
            Your Tuition Requests
          </h2>
          <span className="bg-slate-100 text-slate-500 text-sm px-2.5 py-1 rounded-full font-bold">
            {counts[activeTab]} showing
          </span>
        </div>

        {/* Async tabs toggling */}
        <div className="flex flex-wrap gap-2.5 border-b border-slate-100 pb-4 mb-6">
          {['all', 'open', 'assigned', 'closed'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              <span className="capitalize">{tab}</span>
              <span className="px-1.5 py-0.5 rounded-md text-xs font-black bg-slate-100 text-slate-600">
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
                        <span key={sub} className="bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
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

      {/* Row 4: Bookmarked Tutors Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 md:p-8 mt-8">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
              Bookmarked Tutors
            </h2>
            <p className="text-slate-400 text-xs mt-1 font-semibold">Tutor profiles you saved for your requirements.</p>
          </div>
          <span className="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full font-bold">
            {bookmarkedTutors.length} saved
          </span>
        </div>

        {bookmarksLoading ? (
          <div className="text-center py-6 text-slate-400 font-semibold text-xs">
            Loading saved profiles...
          </div>
        ) : bookmarkedTutors.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="font-semibold text-sm">No bookmarked tutors yet.</p>
            <Link to="/find-tutors" className="text-[#86c240] text-xs font-bold mt-2 inline-block hover:underline">
              Browse tutors to find the right match →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarkedTutors.map(bt => {
              const userInitial = bt.tutorName ? bt.tutorName.charAt(0).toUpperCase() : 'T';
              const profile = bt.tutorProfile || {};
              const shortId = bt.tutorId ? bt.tutorId.substring(0, 6).toUpperCase() : '------';
              
              return (
                <div key={bt.bookmarkId} className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-between hover:shadow-[0_4px_20px_rgb(0,0,0,0.04)] transition-all">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      {profile.photo_url ? (
                        <img 
                          src={profile.photo_url} 
                          alt={bt.tutorName} 
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white text-lg font-black">
                          {userInitial}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{bt.tutorName}</h4>
                        <p className="text-[10px] font-bold text-slate-400">Tutor ID: T-{shortId}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs font-medium text-slate-600 mb-6">
                      {profile.university && (
                        <p className="truncate">
                          <span className="font-bold text-slate-400 block text-[10px] tracking-wide">University</span>
                          <span className="text-slate-800 font-semibold">{profile.department ? `${profile.department}, ` : ''}{profile.university}</span>
                        </p>
                      )}
                      {profile.preferred_subjects && profile.preferred_subjects.length > 0 && (
                        <p className="truncate">
                          <span className="font-bold text-slate-400 block text-[10px] tracking-wide">Subjects</span>
                          <span className="text-slate-800">{profile.preferred_subjects.join(', ')}</span>
                        </p>
                      )}
                      <p>
                        <span className="font-bold text-slate-400 block text-[10px] tracking-wide">Expected Salary</span>
                        <span className="text-slate-800 font-bold">{profile.expected_salary || 'Negotiable'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-slate-100/60 pt-4 mt-auto">
                    <Link 
                      to={`/tutors/${bt.tutorId}`}
                      className="flex-1 text-center text-xs font-bold text-[#6a9c31] bg-[#eaf4df] hover:bg-[#e2edd3] py-2 rounded-lg transition-colors"
                    >
                      View Profile
                    </Link>
                    <button 
                      onClick={() => removeBookmark(bt.bookmarkId)}
                      className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100/70 px-3 py-2 rounded-lg transition-colors border border-rose-100/50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuardianDashboard;
