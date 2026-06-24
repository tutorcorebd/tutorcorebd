import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { 
  MapPin, BookOpen, Clock, Banknote, User, GraduationCap, 
  Calendar, Box, Users, Share2, Bookmark, Check, ArrowLeft,
  Navigation, AlertTriangle, Layers, Flag, MessageCircle, Eye, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import CustomAlert from '../../components/layout/CustomAlert';

const TuitionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [applicationCount, setApplicationCount] = useState(0);
  
  // Apply logic states
  const [showTOSModal, setShowTOSModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Report logic states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState('Fake / Spam Post');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Custom Alert
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'success',
    title: '',
    message: '',
    actionText: 'OK',
    onAction: null
  });

  const showAlert = (type, title, message, onAction = null) => {
    setAlertConfig({ type, title, message, actionText: 'OK', onAction });
    setAlertOpen(true);
  };

  // Compute profile completeness dynamically for tutor
  const calculateCompleteness = () => {
    const tp = profile?.tutor_profile;
    if (!tp) return 20; // base profile setup complete
    
    if (tp.profile_completeness !== undefined && tp.profile_completeness !== null && tp.profile_completeness > 0) {
      return tp.profile_completeness;
    }
    
    let score = 20;
    if (tp.current_city && tp.living_location && tp.preferred_locations && tp.preferred_locations.length > 0) score += 5;
    if (tp.preferred_category && tp.preferred_subjects && tp.preferred_subjects.length > 0 && tp.preferred_courses && tp.preferred_courses.length > 0 && tp.experience) score += 5;
    if (tp.school_name && tp.school_group && tp.school_curriculum && tp.school_board && tp.school_gpa && tp.school_year) score += 5;
    if (tp.college_name && tp.college_group && tp.college_curriculum && tp.college_board && tp.college_gpa && tp.college_year) score += 5;
    if (tp.is_hsc_student || (tp.university && tp.department && tp.grad_gpa && tp.grad_year)) score += 5;
    if (tp.is_hsc_student || (tp.post_grad_university && tp.post_grad_department && tp.post_grad_gpa && tp.post_grad_year)) score += 5;
    if (tp.gender && tp.fathers_name && tp.mothers_name && tp.emergency_contact && tp.address && tp.nid && tp.dob) score += 40;
    if (tp.cv_url) score += 10;
    
    return score;
  };

  const completeness = profile?.role === 'tutor' ? calculateCompleteness() : 0;

  const fetchJobDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tuition_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        throw new Error('Tuition request not found.');
      }

      setJob(data);

      // Fetch bookmarks status if tutor logged in
      if (profile && profile.role === 'tutor') {
        const { data: bookmark } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('tutor_id', profile.id)
          .eq('tuition_request_id', id)
          .maybeSingle();
        setIsBookmarked(!!bookmark);
      }

      // Fetch applications count
      const { count } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('tuition_request_id', id);
      setApplicationCount(count || 0);

    } catch (err) {
      console.error(err);
      showAlert('error', 'Not Found', 'The requested tuition job could not be found.', () => navigate('/job-board'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id, profile]);

  // Dynamic Viewer Counter: stays on page for 5 minutes = increment views count
  useEffect(() => {
    if (!job) return;

    const interval = setInterval(async () => {
      try {
        const { data: latestJob, error } = await supabase
          .from('tuition_requests')
          .select('views')
          .eq('id', job.id)
          .single();

        if (!error && latestJob) {
          const newViews = (latestJob.views || 0) + 1;
          await supabase
            .from('tuition_requests')
            .update({ views: newViews })
            .eq('id', job.id);

          setJob(prev => ({ ...prev, views: newViews }));
        }
      } catch (err) {
        console.error("Error auto-incrementing views:", err);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [job?.id]);

  // Requirement Check
  const checkRequirements = () => {
    if (!profile) return { match: false, reason: 'Please log in to check match status.' };
    const tp = profile.tutor_profile;
    if (!tp) return { match: false, reason: 'Tutor profile not created. Please update your profile first.' };

    // Gender check
    if (job?.preferred_gender && job.preferred_gender !== 'Any' && job.preferred_gender !== 'Both') {
      if (!tp.gender || tp.gender.toLowerCase() !== job.preferred_gender.toLowerCase()) {
        return { match: false, reason: `Requires ${job.preferred_gender} tutor, you are ${tp.gender || 'N/A'}.` };
      }
    }

    // University check
    if (job?.preferred_university && job.preferred_university !== 'Any') {
      if (!tp.university || !tp.university.toLowerCase().includes(job.preferred_university.toLowerCase())) {
        return { match: false, reason: `Requires ${job.preferred_university} student/alumni, you are from ${tp.university || 'N/A'}.` };
      }
    }

    return { match: true };
  };

  const handleApplyClick = () => {
    if (!profile) {
      showAlert('error', 'Login Required', 'Please log in as a tutor to apply.', () => navigate('/login'));
      return;
    }
    if (profile.role !== 'tutor') {
      showAlert('error', 'Unauthorized', 'Only registered tutors can apply for tuition requests.');
      return;
    }
    if (completeness < 80) {
      showAlert(
        'error',
        'Profile completeness required',
        'Complete your profile at least 80% to apply for the tuitions.',
        () => navigate('/tutor/profile')
      );
      return;
    }

    const reqCheck = checkRequirements();
    if (!reqCheck.match) {
      showAlert('error', 'Requirements mismatch', reqCheck.reason);
      return;
    }

    setShowTOSModal(true);
  };

  const handleAgreeTOS = async () => {
    if (!job || !profile) return;
    setIsApplying(true);

    try {
      const { error } = await supabase.from('job_applications').insert([
        { tutor_id: profile.id, tuition_request_id: job.id }
      ]);
      
      if (error) {
        if (error.code === '23505') {
          showAlert('info', 'Already applied', 'You have already applied for this tuition request.');
        } else {
          showAlert('error', 'Application failed', `Failed to apply: ${error.message}`);
        }
        setShowTOSModal(false);
      } else {
        setShowTOSModal(false);
        setShowSuccessModal(true);
        setApplicationCount(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
      showAlert('error', 'Unexpected error', 'An unexpected error occurred.');
    } finally {
      setIsApplying(false);
    }
  };

  // Bookmark Toggle
  const handleToggleBookmark = async () => {
    if (!profile) {
      showAlert('error', 'Login Required', 'Please log in as a tutor to bookmark this job.', () => navigate('/login'));
      return;
    }
    if (profile.role !== 'tutor') {
      showAlert('error', 'Unauthorized', 'Only tutors can bookmark tuition requests.');
      return;
    }

    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('tutor_id', profile.id)
          .eq('tuition_request_id', job.id);
        if (error) throw error;
        setIsBookmarked(false);
        showAlert('success', 'Bookmark removed', 'This tuition request was removed from your bookmarks.');
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert([{ tutor_id: profile.id, tuition_request_id: job.id }]);
        if (error) throw error;
        setIsBookmarked(true);
        showAlert('success', 'Bookmarked successfully', 'This tuition request has been bookmarked.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', 'Action failed', 'Failed to update bookmark status.');
    }
  };

  // Copy shareable link
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showAlert('success', 'Link copied', 'Tuition details link has been copied to your clipboard.');
  };

  // Submit Tuition Report
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!profile) {
      showAlert('error', 'Login Required', 'Please log in to report this tuition post.', () => navigate('/login'));
      return;
    }
    setIsSubmittingReport(true);
    try {
      const { error } = await supabase
        .from('tuition_reports')
        .insert([{
          reporter_id: profile.id,
          tuition_request_id: job.id,
          issue_category: reportCategory,
          description: reportDescription.trim() || null
        }]);

      if (error) throw error;

      showAlert('success', 'Report submitted', 'Thank you. The admin team has been notified and will audit this tuition request.');
      setShowReportModal(false);
      setReportDescription('');
    } catch (err) {
      console.error(err);
      showAlert('error', 'Submission failed', err.message || 'Failed to submit report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] text-slate-400 font-bold text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#86c240] mr-3"></div>
        Loading tuition details...
      </div>
    );
  }

  if (!job) return null;

  const shortId = job.id.substring(0, 5).toUpperCase();
  const reqCheck = checkRequirements();

  // Parsing location
  const locParts = job.location ? job.location.split(', ') : [];
  const areaName = locParts[0] || 'N/A';
  const cityName = locParts[1] || 'N/A';
  const postedDate = format(new Date(job.created_at), 'dd MMM yyyy');

  // Verify authorization to see guardian details
  const isAuthorized = profile?.role === 'admin' || (profile?.role === 'tutor' && job.status === 'assigned');

  return (
    <div className="w-full px-4 sm:px-8 py-8 font-sans animate-in fade-in duration-500">
      
      {/* Back navigation */}
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#86c240] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Warning banner for custom institution - strictly visible to ADMINS ONLY */}
      {job.has_custom_institution && profile?.role === 'admin' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-5 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-sm mb-6 animate-in slide-in-from-top-4 duration-300">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <span>Pending review: This requirement contains a custom institution suggestion and is currently being audited to prevent spam.</span>
        </div>
      )}

      {/* Main Container Layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Side: Main details and specs */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Top Header Block */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-green-50 text-[#86c240] rounded-full text-xs font-bold border border-green-100">
                {job.preferred_category || 'Bangla Medium'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                job.status === 'open' 
                  ? 'bg-blue-50 text-blue-600 border border-blue-100'
                  : 'bg-slate-50 text-slate-500 border border-slate-150'
              }`}>
                {job.status === 'open' ? 'Open' : job.status === 'assigned' ? 'Assigned' : 'Closed'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
              Home tutor needed for {job.student_class} student in {cityName}, {areaName}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-slate-400 pt-2 border-t border-slate-50">
              <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Job ID: {shortId}</span>
              <span className="hidden sm:inline text-slate-200">|</span>
              <span>Posted on: {postedDate}</span>
              <span className="hidden sm:inline text-slate-200">|</span>
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Views: {job.views || 0}</span>
              <span className="hidden sm:inline text-slate-200">|</span>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Applications: {applicationCount}</span>
            </div>
          </div>

          {/* Section A: Tuition Information */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8 space-y-6">
            <h2 className="text-slate-800 font-extrabold text-xl border-b border-slate-50 pb-3 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#86c240] rounded-full inline-block"></span>
              Tuition information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0 mt-0.5">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Category</span>
                  <span className="text-slate-800 text-sm font-semibold">{job.preferred_category || 'Bangla Medium'}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0 mt-0.5">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Course / class</span>
                  <span className="text-slate-800 text-sm font-semibold">{job.student_class}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Subjects</span>
                  <span className="text-slate-800 text-sm font-semibold">
                    {job.subject?.join(', ')}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Days weekly</span>
                  <span className="text-slate-800 text-sm font-semibold">{job.days_per_week} days</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Tutoring time</span>
                  <span className="text-slate-800 text-sm font-semibold">{job.tutoring_time || 'Negotiable'}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Duration</span>
                  <span className="text-slate-800 text-sm font-semibold">{job.duration || '1.5 Hour'}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0 mt-0.5">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Tutoring mode</span>
                  <span className="text-slate-800 text-sm font-semibold">{job.tutoring_mode || 'Home Tutoring'}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0 mt-0.5">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Salary</span>
                  <span className="text-slate-800 text-sm font-semibold">{job.salary_range || 'Negotiable'}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Number of students</span>
                  <span className="text-slate-800 text-sm font-semibold">{job.number_of_students || 'One'}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Student gender</span>
                  <span className="text-slate-800 text-sm font-semibold">{job.student_gender || 'Any'}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Section B: Detailed Multi-Children Breakdown (if applicable) */}
          {job.children && Array.isArray(job.children) && job.children.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8 space-y-6">
              <h2 className="text-slate-800 font-extrabold text-xl border-b border-slate-50 pb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#86c240] rounded-full inline-block"></span>
                Detailed children breakdown
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {job.children.map((child, i) => (
                  <div key={i} className="border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                    <h4 className="font-extrabold text-sm text-[#86c240] mb-2 flex items-center gap-1.5">
                      <span>👶</span> Child #{i + 1} details
                    </h4>
                    <div className="space-y-2 text-xs text-slate-700">
                      <div>
                        <span className="text-slate-500 font-semibold block">Class / level</span>
                        <span className="text-slate-800 font-semibold">{child.student_class} {child.student_group ? `(${child.student_group})` : ''}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block">Gender</span>
                        <span className="text-slate-800 font-semibold">{child.student_gender || 'Any'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block">Subjects needed</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {child.subject && child.subject.map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-white border border-slate-150 text-slate-650 font-medium rounded">
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

          {/* Section C: Tutor Requirements */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8 space-y-6">
            <h2 className="text-slate-800 font-extrabold text-xl border-b border-slate-50 pb-3 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#86c240] rounded-full inline-block"></span>
              Tutor requirements
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-500 flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Preferred gender</span>
                  <span className="text-slate-800 text-sm font-semibold">{job.preferred_gender || 'Any'}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0 mt-0.5">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Preferred university</span>
                  <span className="text-slate-800 text-sm font-semibold">{job.preferred_university || 'Any'}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Hiring from</span>
                  <span className="text-slate-800 text-sm font-semibold">
                    {job.hiring_from ? format(new Date(job.hiring_from), 'dd MMM yyyy') : 'Immediately'}
                  </span>
                </div>
              </div>

            </div>

            <div className="bg-slate-50/30 border border-slate-100 rounded-xl p-4 mt-2">
              <span className="text-slate-500 font-semibold block text-xs mb-1.5">Additional requirements</span>
              <p className="text-slate-700 text-sm font-medium leading-relaxed italic">
                {job.other_requirement || '"Highly Experienced" tutors are cordially invited to apply.'}
              </p>
            </div>
          </div>

          {/* Section D: Location & Contacts */}
          <div id="location-section" className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8 space-y-6">
            <h2 className="text-slate-800 font-extrabold text-xl border-b border-slate-50 pb-3 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#86c240] rounded-full inline-block"></span>
              Location & contact details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm font-bold text-slate-700">
              <div>
                <span className="text-slate-400 block text-xs mb-1">Country</span>
                <p className="text-slate-800 font-extrabold text-sm sm:text-base">Bangladesh</p>
              </div>
              <div>
                <span className="text-slate-400 block text-xs mb-1">City</span>
                <p className="text-slate-800 font-extrabold text-sm sm:text-base">{cityName}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-xs mb-1">Location / area</span>
                <p className="text-slate-800 font-extrabold text-sm sm:text-base">{areaName}</p>
              </div>
            </div>

            {/* Address */}
            <div className="border-t border-slate-50 pt-4 text-sm font-bold text-slate-700">
              <span className="text-slate-400 block text-xs mb-1">Full address</span>
              <p className="text-slate-800 font-extrabold">
                {job.full_address || `Near ${areaName}, ${cityName}`}
              </p>
            </div>

            {/* Phone/WhatsApp Contact Details: Only shown if authorized */}
            {isAuthorized ? (
              <div className="border-t border-slate-100 pt-4 flex items-center gap-4 bg-green-50/20 p-4 rounded-xl border border-green-150/40 animate-in fade-in duration-300">
                <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-bold">Guardian whatsapp</span>
                  <a 
                    href={`https://wa.me/${job.guardian_whatsapp.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-slate-800 font-black text-sm hover:underline hover:text-[#86c240] transition-all"
                  >
                    {job.guardian_whatsapp}
                  </a>
                </div>
              </div>
            ) : (
              <div className="border-t border-slate-50 pt-4 text-xs font-bold text-slate-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Contact info is hidden from tutors until they are assigned to this tuition.</span>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Quick Action Panel Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 space-y-5 sticky top-24">
            
            {/* Header info */}
            <div className="text-center pb-4 border-b border-slate-50">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Expected salary</span>
              <span className="text-2xl sm:text-3xl font-black text-[#86c240] block tracking-tight">
                {job.salary_range || 'Negotiable'}
              </span>
            </div>

            {/* Scroll to Location Details */}
            <button 
              onClick={() => {
                document.getElementById('location-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-all shadow-md active:scale-[0.98]"
            >
              <Navigation className="w-4 h-4" /> Get direction
            </button>

            {/* Area Badge block */}
            <div className="w-full py-3 text-center border border-slate-100 rounded-xl text-xs font-semibold text-slate-600 bg-slate-50 tracking-wide">
              {cityName} &bull; {areaName}
            </div>

            {/* Apply Button (hidden for guardians) */}
            {profile?.role !== 'guardian' && (
              <button 
                onClick={handleApplyClick}
                disabled={profile?.role === 'tutor' && !reqCheck.match}
                className={`flex items-center justify-center gap-2 w-full py-4 text-white rounded-xl text-sm font-black transition-all shadow-md active:scale-[0.98] ${
                  profile?.role === 'tutor' && !reqCheck.match
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300/40'
                    : 'bg-[#86c240] hover:bg-[#6a9c31] hover:shadow-lg hover:shadow-green-100/50'
                }`}
              >
                Apply now
              </button>
            )}

            {/* Quick utility buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-400" /> Share
              </button>

              <button 
                onClick={handleToggleBookmark}
                className={`flex items-center justify-center gap-1.5 py-3 border rounded-xl text-xs font-bold transition-colors ${
                  isBookmarked 
                    ? 'border-red-200 bg-red-50 text-red-650' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-750'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current text-red-500' : 'text-slate-450'}`} />
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
            </div>

            {/* Requirement failure warnings */}
            {profile?.role === 'tutor' && !reqCheck.match && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-[11px] text-red-500 font-bold leading-relaxed">
                ⚠️ {reqCheck.reason}
              </div>
            )}

            {/* Report to Admin option */}
            <button 
              onClick={() => setShowReportModal(true)}
              className="w-full text-center text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center gap-1 pt-3 border-t border-slate-50"
            >
              <Flag className="w-3.5 h-3.5" /> Report this tuition post
            </button>

          </div>
        </div>

      </div>

      {/* Terms of Service Modal */}
      {showTOSModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 mb-4 border-b pb-3">Terms of service</h3>
            <div className="text-xs sm:text-sm text-slate-550 font-semibold space-y-3 max-h-60 overflow-y-auto mb-6 pr-2 leading-relaxed">
              <p>Please review our terms of service before submitting your tuition application:</p>
              <ol className="list-decimal list-inside space-y-2 text-slate-600">
                <li>You confirm your educational certificates and credentials are authentic.</li>
                <li>You agree not to bypass the admin to establish direct contact with guardians.</li>
                <li>A standard service commission will be applicable upon matching/confirmation.</li>
                <li>You will prepare and deliver professional lesson plans for the child.</li>
                <li>Breaching the code of conduct will lead to profile termination and deactivation.</li>
              </ol>
            </div>
            <div className="flex gap-4 border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowTOSModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors text-xs"
              >
                I disagree
              </button>
              <button
                onClick={handleAgreeTOS}
                disabled={isApplying}
                className="flex-1 bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold py-3 rounded-xl transition-colors text-xs disabled:opacity-50"
              >
                {isApplying ? 'Applying...' : 'I agree'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="w-16 h-16 bg-[#86c240]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-[#86c240]" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Success!</h3>
            <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">
              Successfully applied for the tuition. Our admin team will audit details and reach out.
            </p>
            <button 
              onClick={() => {
                setShowSuccessModal(false);
                fetchJobDetails(); // Reload state values
              }}
              className="w-full bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold py-3.5 rounded-xl shadow-md transition-colors text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Report Modal Popup */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                <Flag className="w-5 h-5 text-red-500" /> Report tuition post
              </h3>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4 font-sans text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1.5">Select issue category</label>
                <select
                  value={reportCategory}
                  onChange={e => setReportCategory(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-red-500"
                >
                  <option value="Fake / Spam Post">Fake / Spam post</option>
                  <option value="Suspicious / Fraudulent behavior">Suspicious / Fraudulent behavior</option>
                  <option value="Incorrect / Misleading Information">Incorrect / Misleading information</option>
                  <option value="Abusive or inappropriate content">Abusive or inappropriate content</option>
                  <option value="Other">Other issue</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1.5">Describe the issue briefly</label>
                <textarea
                  placeholder="Type details about this issue..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-red-500 h-28"
                  value={reportDescription}
                  onChange={e => setReportDescription(e.target.value)}
                  required={reportCategory === 'Other'}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReport}
                className="w-full py-3 bg-red-500 hover:bg-red-650 text-white font-black rounded-xl transition-all shadow-md disabled:opacity-50 text-xs"
              >
                {isSubmittingReport ? 'Submitting...' : 'Submit report'}
              </button>
            </form>
          </div>
        </div>
      )}

      <CustomAlert 
        isOpen={alertOpen} 
        onClose={() => setAlertOpen(false)} 
        type={alertConfig.type} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        actionText="OK"
        onAction={alertConfig.onAction} 
      />
    </div>
  );
};

export default TuitionDetails;
