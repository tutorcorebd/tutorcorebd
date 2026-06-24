import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Flag, Eye, Trash2, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tuition_reports')
        .select(`
          *,
          reporter:reporter_id (
            full_name,
            role
          ),
          tuition_request:tuition_request_id (
            id,
            student_class,
            location,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Error fetching tuition reports:', err);
      alert('Failed to load tuition reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDismiss = async (reportId) => {
    if (!confirm('Are you sure you want to dismiss this report?')) return;
    try {
      const { error } = await supabase
        .from('tuition_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
      alert('Report dismissed successfully.');
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      console.error('Error dismissing report:', err);
      alert('Failed to dismiss report.');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!confirm('WARNING: Are you sure you want to delete this tuition request? This will permanently delete the tuition and all linked applications/reports.')) return;
    try {
      const { error } = await supabase
        .from('tuition_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
      alert('Tuition request deleted successfully.');
      fetchReports();
    } catch (err) {
      console.error('Error deleting tuition request:', err);
      alert('Failed to delete tuition request.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-6 font-sans text-slate-700">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Flag className="text-[#86c240] w-6 h-6" /> Tuition reports
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review issues reported by users regarding tuition posts.</p>
        </div>
        <button 
          onClick={fetchReports}
          className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 font-bold text-xs"
        >
          <RefreshCw className="w-4 h-4" /> Reload reports
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6">
        {loading ? (
          <div className="flex justify-center items-center py-20 text-slate-400 font-bold text-sm">
            <RefreshCw className="w-5 h-5 animate-spin text-[#86c240] mr-2" /> Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-extrabold text-sm">No tuition reports found.</p>
            <p className="text-xs text-slate-400 mt-1">Everything looks safe and clean!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-150 text-slate-400 font-bold text-xs">
                  <th className="py-4 px-4">Reporter</th>
                  <th className="py-4 px-4">Reported Tuition</th>
                  <th className="py-4 px-4">Issue Category</th>
                  <th className="py-4 px-4">Brief Details</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                {reports.map((report) => {
                  const req = report.tuition_request || {};
                  return (
                    <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* Reporter */}
                      <td className="py-4 px-4">
                        <span className="font-extrabold text-slate-800 block">{report.reporter?.full_name || 'Anonymous'}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{report.reporter?.role || 'User'}</span>
                      </td>

                      {/* Reported Tuition */}
                      <td className="py-4 px-4">
                        {req.id ? (
                          <>
                            <Link 
                              to={`/tuition/${req.id}`} 
                              target="_blank"
                              className="font-extrabold text-[#86c240] hover:underline block"
                            >
                              Class: {req.student_class}
                            </Link>
                            <span className="text-[10px] text-slate-400 block">{req.location}</span>
                          </>
                        ) : (
                          <span className="text-red-500 font-bold italic">Already Deleted</span>
                        )}
                      </td>

                      {/* Issue Category */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 bg-red-50 text-red-655 rounded-full text-[10px] font-bold border border-red-100">
                          {report.issue_category}
                        </span>
                      </td>

                      {/* Brief Details */}
                      <td className="py-4 px-4 max-w-xs">
                        <p className="text-slate-600 line-clamp-2" title={report.description}>
                          {report.description || <span className="text-slate-400 italic">No description provided</span>}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-slate-400 whitespace-nowrap">
                        {report.created_at ? format(new Date(report.created_at), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleDismiss(report.id)}
                          className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg border border-green-100 transition-colors font-bold inline-flex items-center gap-1 text-[11px]"
                          title="Dismiss / Mark as Safe"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Dismiss
                        </button>
                        
                        {req.id && (
                          <>
                            <Link
                              to={`/tuition/${req.id}`}
                              target="_blank"
                              className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg border border-blue-100 transition-colors font-bold inline-flex items-center gap-1 text-[11px]"
                            >
                              <Eye className="w-3.5 h-3.5" /> Inspect
                            </Link>
                            
                            <button
                              onClick={() => handleDeleteRequest(req.id)}
                              className="p-2 bg-red-50 hover:bg-red-100 text-red-655 rounded-lg border border-red-100 transition-colors font-bold inline-flex items-center gap-1 text-[11px]"
                              title="Delete Tuition Post"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete Post
                            </button>
                          </>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminReports;
