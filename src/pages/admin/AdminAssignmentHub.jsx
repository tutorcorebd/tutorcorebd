import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, BookOpen, Clock, Banknote, User, MessageCircle, CheckCircle, XCircle, Award, Eye, Settings, GraduationCap, AlertTriangle, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminAssignmentHub = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ isOpen: false, type: '', title: '', message: '', action: null });

  const showModal = (type, title, message, action = null) => {
    setModalState({ isOpen: true, type, title, message, action });
  };

  const handleModalConfirm = () => {
    if (modalState.action) modalState.action();
    if (modalState.type !== 'confirm') setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      await supabase.auth.getSession();
    } catch (e) {
      console.error('Session refresh error in AssignmentHub:', e);
    }
    const { data, error } = await supabase
      .from('tuition_requests')
      .select('*, guardian:guardian_id(full_name)')
      .order('created_at', { ascending: false });
    
    if (data) {
      setRequests(data);
      // Keep selectedRequest in sync if it is set
      if (selectedRequest) {
        const updated = data.find(r => r.id === selectedRequest.id);
        if (updated) setSelectedRequest(updated);
      }
    }
    setLoading(false);
  };

  const fetchApplications = async (requestId) => {
    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        tutor:tutor_id(
          full_name, phone_number,
          tutor_profiles(education_status, cv_url)
        )
      `)
      .eq('tuition_request_id', requestId);
      
    if (data) setApplications(data);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSelectRequest = (request) => {
    setSelectedRequest(request);
    fetchApplications(request.id);
  };

  const handleAssign = (applicationId, tutorId) => {
    showModal('confirm', 'Confirm Assignment', 'Are you sure you want to assign this tutor to this request?', async () => {
      setModalState(prev => ({ ...prev, isOpen: false }));
      
      // 1. Update tuition request status to 'assigned'
      await supabase.from('tuition_requests').update({ status: 'assigned' }).eq('id', selectedRequest.id);
      
      // 2. Update all applications for this request (reject others, select this one)
      await supabase.from('job_applications').update({ status: 'rejected' }).eq('tuition_request_id', selectedRequest.id);
      await supabase.from('job_applications').update({ status: 'selected' }).eq('id', applicationId);
      
      showModal('success', 'Assigned!', 'Tutor assigned successfully.');
      fetchRequests();
      fetchApplications(selectedRequest.id);
    });
  };

  const handleUpdateAppStatus = async (applicationId, newStatus) => {
    const { error } = await supabase
      .from('job_applications')
      .update({ status: newStatus })
      .eq('id', applicationId);
    
    if (!error) {
      showModal('success', 'Status Updated', `Application marked as ${newStatus}`);
      fetchApplications(selectedRequest.id);
    } else {
      showModal('error', 'Update Failed', `Error updating application: ${error.message}`);
    }
  };

  const handleUpdateRequestStatus = async (newStatus) => {
    const { error } = await supabase
      .from('tuition_requests')
      .update({ status: newStatus })
      .eq('id', selectedRequest.id);
    
    if (!error) {
      showModal('success', 'Status Updated', `Tuition request status updated to ${newStatus}`);
      fetchRequests();
    } else {
      showModal('error', 'Update Failed', `Error updating status: ${error.message}`);
    }
  };

  const displayEducation = (status) => {
    if (!status) return 'N/A';
    try {
      const parsed = JSON.parse(status);
      if (parsed.is_hsc_student) {
        return 'Running HSC/A Level/Alim Student';
      }
      return `${parsed.department || 'N/A'} at ${parsed.university || 'N/A'}`;
    } catch (e) {
      return status;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)] font-sans">
      {/* Left Panel: Requests List */}
      <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 sticky top-0 z-10 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Tuition Requests</h2>
          <span className="bg-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-full font-bold">
            {requests.length} Total
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {loading && requests.length === 0 ? (
            <div className="p-4 text-center text-slate-400 font-bold">Loading...</div>
          ) : requests.map(req => (
            <div 
              key={req.id} 
              onClick={() => handleSelectRequest(req)}
              className={`p-4 cursor-pointer hover:bg-slate-50/50 transition-colors ${selectedRequest?.id === req.id ? 'bg-[#f7fee7] border-l-4 border-[#86c240]' : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-extrabold text-slate-800">Class: {req.student_class}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  req.status === 'open' 
                    ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                    : req.status === 'assigned'
                      ? 'bg-green-50 text-green-600 border border-green-100'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {req.status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-500 mb-2 truncate">
                {req.subject ? req.subject.join(', ') : 'N/A'}
              </div>
              <div className="text-[10px] font-bold text-slate-400 flex justify-between">
                <span>By: {req.guardian?.full_name || 'Admin'}</span>
                <span>{formatDistanceToNow(new Date(req.created_at))} ago</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Request Details & Applications */}
      <div className="w-full lg:w-2/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-y-auto">
        {selectedRequest ? (
          <>
            {/* Request Info */}
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <div className="flex justify-between items-start gap-4 flex-wrap mb-4">
                <div>
                  <span className="text-[10px] font-black text-slate-400 block mb-0.5">Job ID: {selectedRequest.id.substring(0, 8).toUpperCase()}</span>
                  <h2 className="text-2xl font-black text-slate-800">Need Tutor for {selectedRequest.student_class}</h2>
                </div>
                
                {/* Request Status Dropdown */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                  <span className="text-xs font-bold text-slate-500">Request Status:</span>
                  <select
                    value={selectedRequest.status}
                    onChange={(e) => handleUpdateRequestStatus(e.target.value)}
                    className="text-xs font-extrabold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer"
                  >
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {selectedRequest.has_custom_institution && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl font-bold flex items-center gap-2 mb-4 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>⚠️ Pending Review: Contains custom institution suggestions being verified by admin.</span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-600 mb-5">
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> <span className="text-slate-400">Location:</span> {selectedRequest.location}</div>
                <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-slate-400" /> <span className="text-slate-400">Subjects:</span> {selectedRequest.subject?.join(', ')}</div>
                <div className="flex items-center gap-2"><Banknote className="w-4 h-4 text-slate-400" /> <span className="text-slate-400">Salary:</span> {selectedRequest.salary_range}</div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> <span className="text-slate-400">Days:</span> {selectedRequest.days_per_week} days/week</div>
                <div className="flex items-center gap-2"><User className="w-4 h-4 text-pink-400" /> <span className="text-slate-400">Gender:</span> {selectedRequest.preferred_gender || 'Any'}</div>
                <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-[#86c240]" /> <span className="text-slate-400">University:</span> {selectedRequest.preferred_university || 'Any'}</div>
              </div>

              <div className="flex gap-3">
                <a 
                  href={`https://wa.me/${selectedRequest.guardian_whatsapp.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#128C7E] transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp Guardian ({selectedRequest.guardian_whatsapp})
                </a>
              </div>

              {selectedRequest.children && Array.isArray(selectedRequest.children) && selectedRequest.children.length > 0 && (
                <div className="mt-5 border-t border-slate-200 pt-4">
                  <span className="text-slate-400 font-bold block mb-2 text-xs flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#86c240]" /> Children Breakdown:
                  </span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedRequest.children.map((child, i) => (
                      <div key={i} className="border border-slate-150 rounded-xl p-3 bg-white hover:bg-slate-50 transition-all">
                        <h4 className="font-extrabold text-xs text-[#86c240] mb-1.5 flex items-center gap-1">
                          <span>👶</span> Child #{i + 1}
                        </h4>
                        <div className="space-y-1 text-[11px] text-slate-700">
                          <div>
                            <span className="text-slate-400 font-bold block">Class / Grade</span>
                            <span className="text-slate-800 font-extrabold">{child.student_class} {child.student_group ? `(${child.student_group})` : ''}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block">Subjects Needed</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {child.subject && child.subject.map((s, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 text-[#86c240] font-bold rounded text-[9px]">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Applications List */}
            <div className="p-6 flex-1">
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#86c240]" /> Tutor Applications ({applications.length})
              </h3>
              
              {applications.length === 0 ? (
                <div className="text-center text-slate-400 font-bold py-12">No tutors have applied yet.</div>
              ) : (
                <div className="space-y-4">
                  {applications.map(app => {
                    const tp = app.tutor?.tutor_profiles ? (Array.isArray(app.tutor.tutor_profiles) ? (app.tutor.tutor_profiles[0] || {}) : app.tutor.tutor_profiles) : {};
                    return (
                      <div key={app.id} className="border border-slate-100 bg-white rounded-2xl p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shadow-sm hover:shadow-md transition-shadow">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <a 
                              href={`/tutor/${app.tutor_id}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="font-extrabold text-lg text-[#86c240] hover:underline flex items-center gap-1.5"
                            >
                              {app.tutor?.full_name} <Eye className="w-4 h-4 text-slate-400 hover:text-[#86c240]" />
                            </a>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              app.status === 'selected'
                                ? 'bg-green-50 text-green-600 border border-green-100'
                                : app.status === 'reviewed'
                                  ? 'bg-orange-50 text-orange-600 border border-orange-100'
                                  : app.status === 'rejected'
                                    ? 'bg-red-50 text-red-600 border border-red-100'
                                    : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                              {app.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-500 mt-1 mb-2">
                            {displayEducation(tp.education_status)}
                          </div>
                          <div className="text-xs font-bold text-slate-400 flex gap-4">
                            <span>Phone: {app.tutor?.phone_number}</span>
                            {tp.cv_url && (
                              <a 
                                href={tp.cv_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-[#86c240] hover:underline font-extrabold flex items-center gap-1"
                              >
                                View CV
                              </a>
                            )}
                          </div>
                        </div>
                        
                        {/* Action buttons per application */}
                        <div className="flex gap-2 flex-wrap md:flex-nowrap w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 mt-3 md:mt-0">
                          {app.status !== 'selected' && (
                            <>
                              {app.status !== 'reviewed' && (
                                <button 
                                  onClick={() => handleUpdateAppStatus(app.id, 'reviewed')}
                                  className="flex-1 md:flex-none px-3.5 py-2 border border-orange-200 hover:border-orange-500 text-orange-600 hover:bg-orange-50 rounded-xl text-xs font-bold transition-all"
                                >
                                  Shortlist
                                </button>
                              )}
                              
                              <button 
                                onClick={() => handleAssign(app.id, app.tutor_id)}
                                className="flex-grow md:flex-none px-4 py-2 bg-[#86c240] hover:bg-[#6a9c31] text-white rounded-xl text-xs font-bold shadow-md shadow-[#86c240]/10 transition-all"
                              >
                                Assign Tutor
                              </button>

                              {app.status !== 'rejected' && (
                                <button 
                                  onClick={() => handleUpdateAppStatus(app.id, 'rejected')}
                                  className="flex-1 md:flex-none px-3.5 py-2 border border-red-200 hover:border-red-500 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all"
                                >
                                  Reject
                                </button>
                              )}
                            </>
                          )}
                          
                          {app.status === 'selected' && (
                            <span className="flex items-center gap-1.5 text-green-600 font-extrabold bg-green-50 px-4 py-2 rounded-xl border border-green-100 text-xs">
                              <CheckCircle className="w-4 h-4" /> Assigned to Job
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Settings className="w-8 h-8 text-slate-300 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="font-bold text-sm">Select a request from the left panel to inspect details & applications.</span>
          </div>
        )}
      </div>
      {/* Custom Modal */}
      <AnimatePresence>
        {modalState.isOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-sans">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${
                modalState.type === 'success' ? 'bg-green-100 text-green-600' :
                modalState.type === 'error' ? 'bg-red-100 text-red-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {modalState.type === 'success' ? <CheckCircle className="w-8 h-8" /> :
                 modalState.type === 'error' ? <XCircle className="w-8 h-8" /> :
                 <AlertTriangle className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{modalState.title}</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">{modalState.message}</p>
              
              <div className="flex items-center gap-3 w-full">
                {modalState.type === 'confirm' && (
                  <button 
                    onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
                  >
                    Cancel
                  </button>
                )}
                <button 
                  onClick={handleModalConfirm}
                  className={`flex-1 px-4 py-2.5 text-white font-bold rounded-xl transition-colors text-sm ${
                    modalState.type === 'confirm' ? 'bg-blue-600 hover:bg-blue-700' :
                    modalState.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {modalState.type === 'confirm' ? 'Confirm' : 'Okay'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAssignmentHub;
