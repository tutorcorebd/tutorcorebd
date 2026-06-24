import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { Mail, Calendar, MapPin, Banknote, BookOpen, Clock, MessageCircle, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const ConfirmationLetter = () => {
  const { profile } = useAuthStore();
  const [confirmations, setConfirmations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConfirmations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          id,
          status,
          applied_at,
          tuition_request:tuition_request_id (
            id,
            student_class,
            subject,
            location,
            salary_range,
            days_per_week,
            tutoring_time,
            duration,
            tutoring_mode,
            guardian_whatsapp,
            guardian:guardian_id (
              full_name
            )
          )
        `)
        .eq('tutor_id', profile.id)
        .eq('status', 'selected')
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setConfirmations(data || []);
    } catch (err) {
      console.error('Error fetching confirmations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchConfirmations();
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px] text-slate-400 font-bold text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#86c240] mr-3"></div>
        Loading confirmation letters...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 py-6 font-sans text-slate-700">
      
      {/* Title */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Mail className="text-[#86c240] w-6 h-6" /> Confirmation letters
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Official assignment letters for the tuition requests you have been selected for.
        </p>
      </div>

      {confirmations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-extrabold text-slate-750">No confirmations yet</h3>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed max-w-sm mx-auto">
            Once an admin assigns you to a tuition request, your official job assignment letter will appear here. Keep applying on the job board!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {confirmations.map((conf) => {
            const req = conf.tuition_request || {};
            const shortId = req.id ? req.id.substring(0, 5).toUpperCase() : 'N/A';
            const assignDate = conf.applied_at ? format(new Date(conf.applied_at), 'dd MMMM yyyy') : 'N/A';

            return (
              <div 
                key={conf.id} 
                className="bg-white rounded-3xl border border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-6 sm:p-10 relative overflow-hidden border-t-8 border-t-[#86c240] animate-in fade-in duration-300"
              >
                
                {/* Official Stamp/Badge */}
                <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-150 text-[#86c240] font-black rounded-full text-[10px] tracking-wide uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Assigned
                </div>

                {/* Letter Header */}
                <div className="border-b border-slate-100 pb-6 mb-6">
                  <h4 className="text-lg font-black text-slate-800 tracking-tight">Tutor Core assignment confirmation letter</h4>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Date Issued: {assignDate}</p>
                </div>

                {/* Letter Body */}
                <div className="space-y-6 text-sm font-semibold text-slate-600 leading-relaxed">
                  
                  <p>
                    Dear <span className="font-extrabold text-slate-850">{profile.full_name}</span>,
                  </p>

                  <p>
                    We are pleased to inform you that you have been selected and assigned as the primary tutor for the tuition requirement listed below. Please review the details of your assignment carefully:
                  </p>

                  {/* Details Card Grid */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-455" />
                      <span><strong className="text-slate-500">Job ID:</strong> {shortId}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-slate-455" />
                      <span><strong className="text-slate-500">Subjects:</strong> {req.subject?.join(', ')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-455" />
                      <span><strong className="text-slate-500">Student Class:</strong> {req.student_class}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-[#86c240]" />
                      <span><strong className="text-slate-500">Salary:</strong> {req.salary_range}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-455" />
                      <span><strong className="text-slate-500">Days per Week:</strong> {req.days_per_week} days</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-455" />
                      <span><strong className="text-slate-500">Tutoring Duration:</strong> {req.duration || '1.5 Hour'}</span>
                    </div>

                    <div className="flex items-center gap-2 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-slate-455" />
                      <span><strong className="text-slate-500">Location:</strong> {req.location}</span>
                    </div>

                  </div>

                  {/* Contact Guardian via WhatsApp */}
                  {req.guardian_whatsapp && (
                    <div className="p-4 bg-green-50/30 border border-green-150/40 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Guardian Contact</span>
                        <p className="text-slate-800 font-black text-sm">{req.guardian?.full_name || 'Guardian'} ({req.guardian_whatsapp})</p>
                      </div>
                      
                      <a 
                        href={`https://wa.me/${req.guardian_whatsapp.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
                      >
                        <MessageCircle className="w-4 h-4" /> Message Guardian
                      </a>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-5 text-xs text-slate-400 space-y-2 leading-relaxed">
                    <h5 className="font-extrabold text-slate-500 text-xs">Guidelines & expectations:</h5>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Please contact the guardian immediately to finalize starting dates and tutoring sessions.</li>
                      <li>Direct negotiation of rates or shifting days without informing the admin team is forbidden.</li>
                      <li>Be punctual and dedicated to the student's academic excellence.</li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-50 text-xs text-slate-500">
                    <p className="font-bold">Regards,</p>
                    <p className="font-extrabold text-[#86c240] text-sm mt-0.5">Tutor Core Team</p>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default ConfirmationLetter;
