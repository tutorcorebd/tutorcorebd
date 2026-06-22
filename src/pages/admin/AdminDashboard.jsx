import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { 
  Users, FileText, CheckCircle, Clock, AlertTriangle, 
  ShieldCheck, HelpCircle, ArrowRight, Send, LayoutGrid
} from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

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

    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

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
                  {[
                    { month: 'Jan', count: 35 },
                    { month: 'Feb', count: 48 },
                    { month: 'Mar', count: 60 },
                    { month: 'Apr', count: 85 },
                    { month: 'May', count: 110 },
                    { month: 'Jun', count: 130 }
                  ].map((d, idx) => {
                    const maxHeight = 130;
                    const heightPercent = (d.count / maxHeight) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                        <span className="text-[9px] font-semibold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-0.5">{d.count}</span>
                        <div 
                          className="w-full bg-primary/25 hover:bg-primary/80 rounded-t-md transition-all cursor-pointer" 
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                        <span className="text-[10px] font-semibold text-slate-400 mt-1">{d.month}</span>
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
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
