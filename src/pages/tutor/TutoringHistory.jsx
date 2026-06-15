import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Calendar, Info } from 'lucide-react';
import { format } from 'date-fns';

const TutoringHistory = () => {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Current Status');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define how the UI tabs map to the actual database status values
  const statusMapping = {
    'Applied': 'pending',
    'Shortlisted': 'reviewed',
    'Appointed': 'selected',
    'Confirmed': 'selected',
    'Payment': 'payment',
    'Due': 'due',
    'Refund': 'refund',
    'Cancel': 'rejected'
  };

  const baseTabs = [
    'Current Status', 'Applied', 'Shortlisted', 'Appointed', 
    'Confirmed', 'Payment', 'Due', 'Refund', 'Cancel'
  ];

  useEffect(() => {
    const fetchHistory = async () => {
      if (!profile?.id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('job_applications')
          .select(`
            *,
            tuition_requests (
              *,
              guardian:users (full_name)
            )
          `)
          .eq('tutor_id', profile.id)
          .order('applied_at', { ascending: false });

        if (!error && data) {
          setApplications(data);
        }
      } catch (err) {
        console.error('Error fetching tutoring history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [profile]);

  // Generate tabs with dynamic counts
  const tabsWithCounts = baseTabs.map(tab => {
    if (tab === 'Current Status') return tab;
    const dbStatus = statusMapping[tab];
    const count = applications.filter(app => app.status === dbStatus).length;
    return `${tab} (${count})`;
  });

  // Extract just the tab name from the clicked tab string
  const handleTabClick = (tabString) => {
    // If it's "Current Status", that's exactly the tab name
    if (tabString === 'Current Status') {
      setActiveTab('Current Status');
      return;
    }
    // Extract everything before the space and parenthesis e.g., "Applied (0)" -> "Applied"
    const tabName = tabString.split(' (')[0];
    setActiveTab(tabName);
  };

  // Get current active tab's full string to highlight it
  const getActiveTabString = () => {
    if (activeTab === 'Current Status') return 'Current Status';
    const count = applications.filter(app => app.status === statusMapping[activeTab]).length;
    return `${activeTab} (${count})`;
  };

  // Filter applications to display based on active tab
  const displayedApplications = activeTab === 'Current Status' 
    ? applications 
    : applications.filter(app => app.status === statusMapping[activeTab]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-100 overflow-x-auto pb-2 scrollbar-hide">
        {tabsWithCounts.map(tabStr => {
          const isActive = tabStr === getActiveTabString();
          return (
            <button
              key={tabStr}
              onClick={() => handleTabClick(tabStr)}
              className={`whitespace-nowrap pb-2 text-xs font-bold transition-all relative ${
                isActive 
                  ? 'text-[#86c240]' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tabStr}
              {isActive && (
                <div className="absolute bottom-[-9px] left-0 right-0 h-1 bg-[#86c240] rounded-t-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-20 text-slate-400 text-sm font-semibold">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#86c240] mr-3"></div>
            Loading history...
          </div>
        ) : displayedApplications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center justify-center text-center h-64">
            <div className="w-16 h-16 bg-[#eaf4df] rounded-full flex items-center justify-center mb-4">
              <Info className="w-8 h-8 text-[#86c240]" />
            </div>
            <p className="text-slate-400 text-sm font-semibold">
              You have no applications in this status yet.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedApplications.map((app) => {
              const job = app.tuition_requests;
              if (!job) return null;

              // Color coding based on status
              const statusColors = {
                pending: 'bg-yellow-50 text-yellow-600 border-yellow-200',
                reviewed: 'bg-blue-50 text-blue-600 border-blue-200',
                selected: 'bg-green-50 text-green-600 border-green-200',
                rejected: 'bg-red-50 text-red-600 border-red-200',
                payment: 'bg-purple-50 text-purple-600 border-purple-200',
                due: 'bg-orange-50 text-orange-600 border-orange-200',
                refund: 'bg-slate-100 text-slate-600 border-slate-300'
              };

              const currentStatusColor = statusColors[app.status] || 'bg-slate-50 text-slate-600 border-slate-200';

              return (
                <div key={app.id} className="bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="inline-block px-2.5 py-1 bg-[#eaf4df] text-[#86c240] text-[10px] font-black rounded-lg border border-[#86c240]/10">
                        {job.student_class}
                      </span>
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${currentStatusColor}`}>
                        {app.status}
                      </span>
                    </div>
                    
                    <h3 className="font-extrabold text-slate-800 text-base leading-tight">
                      <Link to={`/tuition/${job.id}`} className="hover:text-[#86c240] transition-colors">
                        {job.subject ? job.subject.join(', ') : 'All Subjects'}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">Posted by {job.guardian?.full_name || 'Guardian'}</p>

                    <div className="space-y-2.5 mt-5">
                      <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
                        <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{job.days_per_week} days/week</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
                        <DollarSign className="w-4 h-4 text-[#86c240] flex-shrink-0" />
                        <span className="font-extrabold text-slate-800">{job.salary_range || 'Negotiable'}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
                        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>Applied: {format(new Date(app.applied_at), 'dd MMM yyyy')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Link
                      to={`/tuition/${job.id}`}
                      className="w-full text-center py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      View Details
                    </Link>
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

export default TutoringHistory;
