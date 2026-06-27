import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { 
  Users, FileText, CheckCircle, Clock, AlertTriangle, 
  ShieldCheck, HelpCircle, ArrowRight, Send, LayoutGrid, Flag, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    tutors: 0,
    guardians: 0,
    openRequests: 0,
    assignedRequests: 0,
    pendingMemberships: 0,
    openTickets: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState([]);
  const [registrationStats, setRegistrationStats] = useState([]);
  const [pendingInstitutions, setPendingInstitutions] = useState([]);
  const [pendingInstitutionsCount, setPendingInstitutionsCount] = useState(0);
  const [showInstitutionsModal, setShowInstitutionsModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal and filters state for activity logs
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [allActivities, setAllActivities] = useState([]);
  const [loadingAllActivities, setLoadingAllActivities] = useState(false);
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [dateFilterRange, setDateFilterRange] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [modalPage, setModalPage] = useState(1);
  const modalItemsPerPage = 10;

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        tutorsCount,
        guardiansCount,
        openReqs,
        assignedReqs,
        pendingMemb,
        openTix
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'tutor'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'guardian'),
        supabase.from('tuition_requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('tuition_requests').select('*', { count: 'exact', head: true }).eq('status', 'assigned'),
        supabase.from('membership_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open')
      ]);

      setStats({
        tutors: tutorsCount.count || 0,
        guardians: guardiansCount.count || 0,
        openRequests: openReqs.count || 0,
        assignedRequests: assignedReqs.count || 0,
        pendingMemberships: pendingMemb.count || 0,
        openTickets: openTix.count || 0
      });

      const { data: recentUsers } = await supabase
        .from('users')
        .select('full_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(4);

      const { data: recentRequests } = await supabase
        .from('tuition_requests')
        .select('student_class, location, created_at')
        .order('created_at', { ascending: false })
        .limit(4);

      const combinedActivities = [
        ...(recentUsers || []).map(u => ({
          type: 'user',
          title: `${u.role === 'tutor' ? 'Tutor' : 'Guardian'} registration`,
          desc: u.full_name,
          time: new Date(u.created_at)
        })),
        ...(recentRequests || []).map(r => ({
          type: 'request',
          title: 'Tuition request posted',
          desc: `${r.student_class} in ${r.location}`,
          time: new Date(r.created_at)
        }))
      ]
        .sort((a, b) => b.time - a.time)
        .slice(0, 5);

      setRecentActivities(combinedActivities);

      const { data: requests } = await supabase
        .from('tuition_requests')
        .select('preferred_category');
      
      if (requests) {
        const counts = {};
        requests.forEach(r => {
          const cat = r.preferred_category || 'Other';
          counts[cat] = (counts[cat] || 0) + 1;
        });
        const formatted = Object.keys(counts).map(key => ({
          name: key,
          count: counts[key]
        })).sort((a, b) => b.count - a.count);
        setCategoryCounts(formatted);
      }

      // Fetch user registration dates for dynamic chart
      const { data: userDates } = await supabase
        .from('users')
        .select('created_at');

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const today = new Date();
      const dynamicMonths = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        dynamicMonths.push({
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          month: monthNames[d.getMonth()],
          year: d.getFullYear(),
          count: 0
        });
      }

      if (userDates) {
        userDates.forEach(u => {
          if (!u.created_at) return;
          const date = new Date(u.created_at);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const found = dynamicMonths.find(m => m.key === key);
          if (found) {
            found.count += 1;
          }
        });
      }
      setRegistrationStats(dynamicMonths);

      // Fetch pending institutions
      const { data: instData, count: instCount } = await supabase
        .from('institutions')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3);
      
      setPendingInstitutions(instData || []);
      setPendingInstitutionsCount(instCount || 0);

    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllActivities = async () => {
    setLoadingAllActivities(true);
    try {
      const [
        usersRes,
        requestsRes,
        appsRes,
        mReqsRes,
        ticketsRes
      ] = await Promise.all([
        supabase.from('users').select('full_name, role, created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('tuition_requests').select('student_class, location, created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('job_applications').select('applied_at, status, tutor:tutor_id(full_name), tuition_request:tuition_request_id(student_class)').order('applied_at', { ascending: false }).limit(100),
        supabase.from('membership_requests').select('created_at, plan_name, status, user:user_id(full_name)').order('created_at', { ascending: false }).limit(100),
        supabase.from('support_tickets').select('created_at, subject, category, status, user:user_id(full_name)').order('created_at', { ascending: false }).limit(100)
      ]);

      const events = [
        ...(usersRes.data || []).map(u => ({
          type: 'user',
          title: `User Registration (${u.role})`,
          desc: `${u.full_name} registered as a ${u.role}`,
          time: new Date(u.created_at)
        })),
        ...(requestsRes.data || []).map(r => ({
          type: 'request',
          title: 'Tuition Request Posted',
          desc: `Need tutor for ${r.student_class} in ${r.location}`,
          time: new Date(r.created_at)
        })),
        ...(appsRes.data || []).map(a => ({
          type: 'application',
          title: 'Tuition Job Application',
          desc: `${a.tutor?.full_name || 'Tutor'} applied for ${a.tuition_request?.student_class || 'tuition'} (status: ${a.status})`,
          time: new Date(a.applied_at)
        })),
        ...(mReqsRes.data || []).map(m => ({
          type: 'membership',
          title: `Membership Request (${m.plan_name})`,
          desc: `${m.user?.full_name || 'User'} requested ${m.plan_name} upgrade (status: ${m.status})`,
          time: new Date(m.created_at)
        })),
        ...(ticketsRes.data || []).map(t => ({
          type: 'ticket',
          title: `Support Ticket Opened`,
          desc: `"${t.subject}" in category ${t.category} (status: ${t.status})`,
          time: new Date(t.created_at)
        }))
      ];

      events.sort((a, b) => b.time - a.time);
      setAllActivities(events);
    } catch (err) {
      console.error("Error fetching activity logs:", err);
    } finally {
      setLoadingAllActivities(false);
    }
  };

  const getFilteredActivities = () => {
    let result = [...allActivities];
    
    if (activityTypeFilter !== 'all') {
      result = result.filter(act => act.type === activityTypeFilter);
    }
    
    const today = new Date();
    if (dateFilterRange === '7days') {
      const limit = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
      result = result.filter(act => act.time >= limit);
    } else if (dateFilterRange === '30days') {
      const limit = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);
      result = result.filter(act => act.time >= limit);
    } else if (dateFilterRange === 'custom') {
      if (customDateFrom) {
        const from = new Date(customDateFrom);
        result = result.filter(act => act.time >= from);
      }
      if (customDateTo) {
        const to = new Date(customDateTo);
        to.setHours(23, 59, 59, 999);
        result = result.filter(act => act.time <= to);
      }
    }
    
    return result;
  };

  useEffect(() => {
    if (showActivityModal) {
      fetchAllActivities();
    }
  }, [showActivityModal]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 text-slate-700">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm font-medium mt-0.5">Overview of the platform statistics, signups, and tuition metrics.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="text-xs font-semibold px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors shadow-sm"
        >
          Refresh Feed
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24 text-slate-400 text-sm font-semibold">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mr-3"></div>
          Loading metrics...
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Tutors', count: stats.tutors, icon: <Users className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50/50 border-emerald-100' },
              { label: 'Guardians', count: stats.guardians, icon: <Users className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50/50 border-blue-100' },
              { label: 'Open Requests', count: stats.openRequests, icon: <FileText className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50/50 border-amber-100' },
              { label: 'Matches', count: stats.assignedRequests, icon: <CheckCircle className="w-4 h-4 text-green-600" />, bg: 'bg-green-50/50 border-green-100' },
              { label: 'Pending Upgrades', count: stats.pendingMemberships, icon: <ShieldCheck className="w-4 h-4 text-purple-600" />, bg: 'bg-purple-50/50 border-purple-100', link: '/admin/membership', isUpgrade: true },
              { label: 'Support Tickets', count: stats.openTickets, icon: <AlertTriangle className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-50/50 border-rose-100', link: '/admin/support', isTicket: true }
            ].map((card, idx) => {
              const cardContent = (
                <>
                  <div className="flex justify-between items-center relative">
                    <span className="text-xs font-medium text-slate-400">{card.label}</span>
                    <div className="flex items-center gap-2">
                      {card.isUpgrade && card.count > 0 && (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                        </span>
                      )}
                      {card.isTicket && card.count > 0 && (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                        </span>
                      )}
                      <div className={`p-2 rounded-xl ${card.bg.split(' ')[0]}`}>
                        {card.icon}
                      </div>
                    </div>
                  </div>
                  <span className="text-2xl font-semibold text-slate-800 mt-4 block leading-none">{card.count}</span>
                </>
              );

              const baseClasses = `p-5 rounded-2xl border bg-white shadow-sm flex flex-col justify-between transition-all duration-300 ${card.bg.split(' ')[1]}`;
              
              let animatedClasses = '';
              if (card.isUpgrade && card.count > 0) {
                animatedClasses = ' animate-pulse-purple border-purple-300 hover:shadow-purple-100/50 hover:shadow-md';
              } else if (card.isTicket && card.count > 0) {
                animatedClasses = ' animate-pulse-rose border-rose-300 hover:shadow-rose-100/50 hover:shadow-md';
              } else {
                animatedClasses = ' hover:shadow-md hover:border-slate-300';
              }

              if (card.link) {
                return (
                  <Link 
                    key={idx} 
                    to={card.link}
                    className={`${baseClasses}${animatedClasses} block cursor-pointer select-none`}
                  >
                    {cardContent}
                  </Link>
                );
              }

              return (
                <div key={idx} className={`${baseClasses}${animatedClasses}`}>
                  {cardContent}
                </div>
              );
            })}
          </div>

          {/* Core Analytics Blocks */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Category distribution */}
            <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-800">Tuition Requests by Category</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5 mb-6">Distribution mapping of classes across different mediums.</p>
                
                <div className="space-y-4">
                  {categoryCounts.length === 0 ? (
                    <div className="text-center text-slate-400 text-sm py-8">No requests found.</div>
                  ) : (
                    categoryCounts.map((item, idx) => {
                      const totalCount = categoryCounts.reduce((acc, curr) => acc + curr.count, 0);
                      const percentage = Math.round((item.count / totalCount) * 100);
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium text-slate-650">
                            <span>{item.name}</span>
                            <span>{item.count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-primary h-full rounded-full transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Growth Bars */}
              <div className="mt-8 border-t border-slate-100 pt-6">
                <h4 className="text-xs font-semibold text-slate-500 mb-4">Registration Activity</h4>
                <div className="h-24 flex items-end justify-between gap-3 px-2 border-b border-slate-100 pb-2">
                  {registrationStats.map((d, idx) => {
                    const counts = registrationStats.map(x => x.count);
                    const maxCount = Math.max(...counts, 1);
                    const heightPercent = (d.count / maxCount) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                        <span className="text-[9px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mb-0.5">{d.count}</span>
                        <div 
                          className="w-full bg-[#86c240]/20 hover:bg-[#86c240] rounded-t-md transition-all cursor-pointer" 
                          style={{ height: `${Math.max(6, heightPercent)}%` }}
                          title={`${d.count} registrations`}
                        ></div>
                        <span className="text-[10px] font-bold text-slate-400 mt-1">{d.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right side items */}
            <div className="space-y-6">
              
              {/* Needs attention (White clean UI instead of harsh black background) */}
              <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">Pending Actions</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5 mb-5">Tasks waiting for admin intervention.</p>
                  
                  <div className="space-y-2">
                    <Link 
                      to="/admin/membership" 
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all text-xs font-semibold text-slate-600"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-500" /> Pending Memberships
                      </span>
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                        {stats.pendingMemberships}
                      </span>
                    </Link>
                    
                    <Link 
                      to="/admin/support" 
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all text-xs font-semibold text-slate-600"
                    >
                      <span className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-rose-500" /> Unresolved Tickets
                      </span>
                      <span className="bg-rose-100 text-rose-700 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                        {stats.openTickets}
                      </span>
                    </Link>

                    <Link 
                      to="/admin/requests" 
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all text-xs font-semibold text-slate-600"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-500" /> Open Assignments
                      </span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                        {stats.openRequests}
                      </span>
                    </Link>
                  </div>
                </div>

                <Link 
                  to="/admin/requests" 
                  className="w-full py-2.5 bg-primary hover:bg-[#75ad36] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors mt-6 shadow-sm shadow-primary/10"
                >
                  Access Assignment Hub <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Quick Shortcuts */}
              <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-semibold text-slate-500 mb-4">Shortcuts</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Requests', path: '/admin/requests', icon: <FileText className="w-3.5 h-3.5" /> },
                    { label: 'Users', path: '/admin/users', icon: <Users className="w-3.5 h-3.5" /> },
                    { label: 'Notices', path: '/admin/notices', icon: <Send className="w-3.5 h-3.5" /> },
                    { label: 'Categories', path: '/admin/categories', icon: <LayoutGrid className="w-3.5 h-3.5" /> }
                  ].map((link, idx) => (
                    <Link 
                      key={idx}
                      to={link.path}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/30 rounded-xl text-xs font-medium text-slate-650 transition-all flex items-center gap-2"
                    >
                      <span className="text-slate-400">{link.icon}</span>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Institutional Requests Widget */}
              <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <Flag className="w-4 h-4 text-rose-500" /> Institutional Requests
                  </h3>
                  {pendingInstitutionsCount > 0 && (
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {pendingInstitutionsCount} Pending
                    </span>
                  )}
                </div>
                
                {pendingInstitutionsCount === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-400">No pending institution requests.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingInstitutions.map((inst) => (
                      <div key={inst.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <p className="text-xs font-bold text-slate-800 line-clamp-1">{inst.name}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Requested by: <span className="font-semibold text-slate-600">{inst.requested_by_email || 'Unknown User'}</span></p>
                      </div>
                    ))}
                    <button
                      onClick={() => setShowInstitutionsModal(true)}
                      className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center justify-center transition-colors border border-rose-100/50 mt-2"
                    >
                      View all {pendingInstitutionsCount} requests
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Timeline Feed */}
          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-800">Recent Platform Activity</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5 mb-6">Real-time listing of platform actions.</p>
            
            <div className="relative border-l border-slate-150 pl-5 ml-2.5 space-y-6">
              {recentActivities.map((act, idx) => (
                <div key={idx} className="relative">
                  {/* Circle indicator */}
                  <span className={`absolute -left-[28px] top-1.5 w-3 h-3 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                    act.type === 'user' ? 'bg-primary' : 'bg-slate-800'
                  }`}></span>
                  
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                      {act.title}
                      <span className="text-[10px] text-slate-400 font-medium">
                        {act.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </h4>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{act.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {recentActivities.length > 0 && (
              <button
                onClick={() => setShowActivityModal(true)}
                className="mt-6 w-full py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                View all activities
              </button>
            )}
          </div>

          {/* Activity Log Modal */}
          {showActivityModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300 font-sans">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
                
                <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-800">All platform activities</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Filter, search and navigate through historical system logs.</p>
                  </div>
                  <button 
                    onClick={() => setShowActivityModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-850 transition-colors flex items-center justify-center font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Filters Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-650">
                  
                  {/* Type Filter */}
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">Activity type</label>
                    <select
                      value={activityTypeFilter}
                      onChange={e => { setActivityTypeFilter(e.target.value); setModalPage(1); }}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-[#86c240] text-slate-700"
                    >
                      <option value="all">All types</option>
                      <option value="user">User registrations</option>
                      <option value="request">Tuition postings</option>
                      <option value="application">Tutor applications</option>
                      <option value="membership">Membership requests</option>
                      <option value="ticket">Support tickets</option>
                    </select>
                  </div>

                  {/* Date Filter Range Preset */}
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">Time filter</label>
                    <select
                      value={dateFilterRange}
                      onChange={e => { setDateFilterRange(e.target.value); setModalPage(1); }}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-[#86c240] text-slate-700"
                    >
                      <option value="all">All time</option>
                      <option value="7days">Last 7 days</option>
                      <option value="30days">Last 30 days</option>
                      <option value="custom">Custom date range</option>
                    </select>
                  </div>

                  {/* Custom Date Range Selectors */}
                  {dateFilterRange === 'custom' && (
                    <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1.5">From</label>
                        <input 
                          type="date"
                          value={customDateFrom}
                          onChange={e => { setCustomDateFrom(e.target.value); setModalPage(1); }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1.5">To</label>
                        <input 
                          type="date"
                          value={customDateTo}
                          onChange={e => { setCustomDateTo(e.target.value); setModalPage(1); }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
                        />
                      </div>
                    </div>
                  )}

                </div>

                {/* Table / List Container */}
                <div className="flex-1 overflow-y-auto mb-6 pr-2">
                  {loadingAllActivities ? (
                    <div className="flex justify-center items-center py-20 text-slate-400 font-bold text-sm">
                      <RefreshCw className="w-5 h-5 animate-spin text-[#86c240] mr-2" /> Loading timeline...
                    </div>
                  ) : getFilteredActivities().length === 0 ? (
                    <div className="text-center py-16 text-slate-450 font-bold text-sm">
                      No activity found matching these filters.
                    </div>
                  ) : (
                    <div className="relative border-l border-slate-150 pl-6 ml-4 space-y-6">
                      {getFilteredActivities().slice((modalPage - 1) * modalItemsPerPage, modalPage * modalItemsPerPage).map((act, idx) => (
                        <div key={idx} className="relative">
                          <span className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                            act.type === 'user' ? 'bg-[#86c240]' 
                            : act.type === 'request' ? 'bg-blue-500' 
                            : act.type === 'application' ? 'bg-orange-500' 
                            : act.type === 'membership' ? 'bg-purple-500'
                            : 'bg-rose-500'
                          }`}></span>
                          
                          <div>
                            <h4 className="font-extrabold text-xs text-slate-800 flex flex-wrap items-center gap-2">
                              {act.title}
                              <span className="text-[10px] text-slate-455 font-bold">
                                {format(act.time, 'dd MMM yyyy, hh:mm a')}
                              </span>
                            </h4>
                            <p className="text-[11px] font-bold text-slate-500 mt-1">{act.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pagination block */}
                {!loadingAllActivities && getFilteredActivities().length > 0 && (
                  <div className="flex justify-between items-center border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
                    <span>
                      Showing {(modalPage - 1) * modalItemsPerPage + 1} - {Math.min(modalPage * modalItemsPerPage, getFilteredActivities().length)} of {getFilteredActivities().length} logs
                    </span>
                    
                    <div className="flex gap-2">
                      <button
                        disabled={modalPage === 1}
                        onClick={() => setModalPage(p => Math.max(1, p - 1))}
                        className="px-3.5 py-2 border rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        disabled={modalPage * modalItemsPerPage >= getFilteredActivities().length}
                        onClick={() => setModalPage(p => p + 1)}
                        className="px-3.5 py-2 border rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Institutional Requests Modal */}
          {showInstitutionsModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300 font-sans">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
                
                <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Pending Institutional Requests</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Approve or reject custom universities requested by users.</p>
                  </div>
                  <button 
                    onClick={() => setShowInstitutionsModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-850 transition-colors flex items-center justify-center font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto mb-2 space-y-3">
                  {pendingInstitutions.length === 0 ? (
                    <div className="text-center py-10">
                      <CheckCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500 font-bold">All caught up!</p>
                      <p className="text-slate-400 text-xs">No pending institutional requests.</p>
                    </div>
                  ) : (
                    pendingInstitutions.map(inst => (
                      <div key={inst.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800">{inst.name}</h4>
                          <p className="text-xs text-slate-500 mt-1">Requested by: <span className="font-bold">{inst.requested_by_email || 'Unknown'}</span></p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Submitted on: {new Date(inst.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              if (!confirm(`Are you sure you want to approve "${inst.name}"?`)) return;
                              try {
                                const { error } = await supabase.from('institutions').update({ status: 'approved' }).eq('id', inst.id);
                                if (error) throw error;
                                await supabase.from('tuition_requests').update({ has_custom_institution: false }).eq('preferred_university', inst.name);
                                fetchDashboardData();
                              } catch(e) { alert('Error: ' + e.message); }
                            }}
                            className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-bold text-xs rounded-xl border border-green-200 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm(`Are you sure you want to reject and delete "${inst.name}"?`)) return;
                              try {
                                const { error } = await supabase.from('institutions').delete().eq('id', inst.id);
                                if (error) throw error;
                                fetchDashboardData();
                              } catch(e) { alert('Error: ' + e.message); }
                            }}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {pendingInstitutions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                    <Link to="/admin/institutions" className="text-xs font-bold text-primary hover:underline">
                      Manage all institutions in dedicated page →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
};

export default AdminDashboard;
