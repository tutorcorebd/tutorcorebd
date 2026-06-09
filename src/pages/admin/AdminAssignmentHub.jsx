import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, BookOpen, Clock, Banknote, User, MessageCircle, CheckCircle } from 'lucide-react';

const AdminAssignmentHub = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tuition_requests')
      .select('*, guardian:guardian_id(full_name)')
      .order('created_at', { ascending: false });
    
    if (data) setRequests(data);
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

  const handleAssign = async (applicationId, tutorId) => {
    if (!confirm('Are you sure you want to assign this tutor?')) return;
    
    // 1. Update tuition request status to 'assigned'
    await supabase.from('tuition_requests').update({ status: 'assigned' }).eq('id', selectedRequest.id);
    
    // 2. Update all applications for this request (reject others, select this one)
    await supabase.from('job_applications').update({ status: 'rejected' }).eq('tuition_request_id', selectedRequest.id);
    await supabase.from('job_applications').update({ status: 'selected' }).eq('id', applicationId);
    
    alert('Tutor assigned successfully!');
    fetchRequests();
    fetchApplications(selectedRequest.id);
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
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
      {/* Left Panel: Requests List */}
      <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 sticky top-0">
          <h2 className="text-lg font-bold">Tuition Requests</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? <div className="p-4 text-center">Loading...</div> : requests.map(req => (
            <div 
              key={req.id} 
              onClick={() => handleSelectRequest(req)}
              className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${selectedRequest?.id === req.id ? 'bg-primary-light border-l-4 border-primary' : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-slate-800">Class: {req.student_class}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${req.status === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                  {req.status}
                </span>
              </div>
              <div className="text-sm text-slate-500 mb-2 truncate">{req.subject.join(', ')}</div>
              <div className="text-xs text-slate-400">By: {req.guardian?.full_name} • {formatDistanceToNow(new Date(req.created_at))} ago</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Request Details & Applications */}
      <div className="w-full lg:w-2/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-y-auto">
        {selectedRequest ? (
          <>
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <h2 className="text-2xl font-bold mb-4">Request Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div><span className="font-semibold">Location:</span> {selectedRequest.location}</div>
                <div><span className="font-semibold">Subjects:</span> {selectedRequest.subject.join(', ')}</div>
                <div><span className="font-semibold">Salary:</span> {selectedRequest.salary_range}</div>
                <div><span className="font-semibold">Guardian Phone:</span> {selectedRequest.guardian_whatsapp}</div>
              </div>
              <a 
                href={`https://wa.me/${selectedRequest.guardian_whatsapp.replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#128C7E] transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp Guardian
              </a>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Tutor Applications ({applications.length})
              </h3>
              
              {applications.length === 0 ? (
                <div className="text-center text-slate-500 py-8">No tutors have applied yet.</div>
              ) : (
                <div className="space-y-4">
                  {applications.map(app => (
                    <div key={app.id} className="border border-slate-200 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-lg">{app.tutor?.full_name}</div>
                        <div className="text-sm text-slate-600 mb-1">{displayEducation(app.tutor?.tutor_profiles?.[0]?.education_status)}</div>
                        <div className="text-xs text-slate-500">Phone: {app.tutor?.phone_number}</div>
                        {app.tutor?.tutor_profiles?.[0]?.cv_url && (
                          <a href={app.tutor.tutor_profiles[0].cv_url} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline mt-2 inline-block">
                            View CV
                          </a>
                        )}
                      </div>
                      
                      <div>
                        {app.status === 'selected' ? (
                          <span className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full">
                            <CheckCircle className="w-4 h-4" /> Assigned
                          </span>
                        ) : selectedRequest.status === 'open' ? (
                          <button 
                            onClick={() => handleAssign(app.id, app.tutor_id)}
                            className="btn-primary"
                          >
                            Assign Tutor
                          </button>
                        ) : (
                          <span className="text-slate-400 font-medium">Not Selected</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            Select a request from the left panel to view details and applications.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAssignmentHub;
