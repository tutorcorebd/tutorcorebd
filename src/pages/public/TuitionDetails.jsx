import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { 
  MapPin, BookOpen, Clock, Banknote, User, GraduationCap, 
  Calendar, Box, Users, Share2, Bookmark, Check, ArrowLeft,
  Navigation
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
  
  // Apply logic states (TOS, Success, etc.)
  const [showTOSModal, setShowTOSModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

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

      // 1. Increment views count
      await supabase
        .from('tuition_requests')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', id);

      // 2. Fetch bookmarks status if tutor logged in
      if (profile && profile.role === 'tutor') {
        const { data: bookmark } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('tutor_id', profile.id)
          .eq('tuition_request_id', id)
          .maybeSingle();
        setIsBookmarked(!!bookmark);
      }

      // 3. Fetch applications count
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
        'Profile Completeness Required',
        'Complete your profile at least 80% to apply for the tuitions.',
        () => navigate('/tutor/profile')
      );
      return;
    }

    const reqCheck = checkRequirements();
    if (!reqCheck.match) {
      showAlert('error', 'Requirements Mismatch', reqCheck.reason);
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
          showAlert('info', 'Already Applied', 'You have already applied for this tuition request.');
        } else {
          showAlert('error', 'Application Failed', `Failed to apply: ${error.message}`);
        }
        setShowTOSModal(false);
      } else {
        setShowTOSModal(false);
        setShowSuccessModal(true);
        setApplicationCount(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
      showAlert('error', 'Unexpected Error', 'An unexpected error occurred.');
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
        showAlert('success', 'Bookmark Removed', 'This tuition request was removed from your bookmarks.');
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert([{ tutor_id: profile.id, tuition_request_id: job.id }]);
        if (error) throw error;
        setIsBookmarked(true);
        showAlert('success', 'Bookmarked Successfully', 'This tuition request has been bookmarked.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', 'Action Failed', 'Failed to update bookmark status.');
    }
  };

  // Copy shareable link
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showAlert('success', 'Link Copied', 'Tuition details link has been copied to your clipboard.');
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 py-6 font-sans">
      
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Main Grid: Info Cards vs Actions Panel */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Side: Student & Requirements & Contact */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Student Informations */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-8 space-y-6 relative overflow-hidden">
            <h3 className="text-[#86c240] font-extrabold text-xl sm:text-2xl mb-6">Student Informations</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm font-semibold text-slate-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1 text-xs sm:text-sm">Category</span>
                  <span className="text-slate-800 text-sm sm:text-base font-extrabold">{job.preferred_category || 'Bangla Medium'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1 text-xs sm:text-sm">Course</span>
                  <span className="text-slate-800 text-sm sm:text-base font-extrabold">{job.student_class}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1 text-xs sm:text-sm">Subject</span>
                  <span className="text-slate-800 text-sm sm:text-base font-extrabold block" title={job.subject?.join(', ')}>
                    {job.subject?.join(', ')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1 text-xs sm:text-sm">Days</span>
                  <span className="text-slate-800 text-sm sm:text-base font-extrabold">{job.days_per_week} days</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1 text-xs sm:text-sm">Time</span>
                  <span className="text-slate-800 text-sm sm:text-base font-extrabold">{job.tutoring_time || 'Negotiable'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0">
                  <Clock className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1 text-xs sm:text-sm">Duration</span>
                  <span className="text-slate-800 text-sm sm:text-base font-extrabold">{job.duration || '1.5 Hour'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0">
                  <Box className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1 text-xs sm:text-sm">Method</span>
                  <span className="text-slate-800 text-sm sm:text-base font-extrabold">{job.tutoring_mode || 'Home Tutoring'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1 text-xs sm:text-sm">Salary</span>
                  <span className="text-[#86c240] text-sm sm:text-base font-black">{job.salary_range || 'Negotiable'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1 text-xs sm:text-sm">Students</span>
                  <span className="text-slate-800 text-sm sm:text-base font-extrabold">{job.number_of_students || 'One'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1 text-xs sm:text-sm">Gender</span>
                  <span className="text-pink-500 text-sm sm:text-base font-extrabold">{job.preferred_gender || 'Any'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Tutor Requirements */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-8 space-y-6">
            <h3 className="text-[#86c240] font-extrabold text-xl sm:text-2xl mb-6">Tutor Requirements</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm font-semibold text-slate-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1 text-xs sm:text-sm">Gender</span>
                  <span className="text-pink-500 text-sm sm:text-base font-extrabold">{job.preferred_gender || 'Any'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1 text-xs sm:text-sm">Hiring From</span>
                  <span className="text-slate-800 text-sm sm:text-base font-extrabold">
                    {job.hiring_from ? format(new Date(job.hiring_from), 'dd MMM yyyy') : 'Immediately'}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-50 pt-4 text-sm font-semibold text-slate-600">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#86c240] flex-shrink-0">
                  <Box className="w-5 h-5 text-[#86c240]" />
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1.5 text-xs sm:text-sm">Other Requirement</span>
                  <p className="text-slate-700 text-sm sm:text-base font-medium italic">
                    {job.other_requirement || '"Highly Experienced" tutors are cordially invited to apply.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Contact Informations */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-8 space-y-6">
            <h3 className="text-[#86c240] font-extrabold text-xl sm:text-2xl mb-6">Contact Informations</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm font-semibold text-slate-600">
              <div>
                <span className="text-slate-400 font-bold block mb-1 text-xs sm:text-sm">Country</span>
                <p className="text-slate-800 text-sm sm:text-base font-extrabold">Bangladesh</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-1 text-xs sm:text-sm">City</span>
                <p className="text-slate-800 text-sm sm:text-base font-extrabold">{cityName}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-1 text-xs sm:text-sm">Location</span>
                <p className="text-slate-800 text-sm sm:text-base font-extrabold">{areaName}</p>
              </div>
            </div>

            <div className="border-t border-slate-50 pt-4 text-sm font-semibold text-slate-600">
              <span className="text-slate-400 font-bold block mb-1.5 text-xs sm:text-sm">Full Address</span>
              <p className="text-slate-800 text-sm sm:text-base font-extrabold">
                {job.full_address || `Near By ${areaName} Road`}
              </p>
            </div>
          </div>

        </div>

        {/* Right Side: Quick Action Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 space-y-4">
            
            {/* Get Direction Button (Google Maps) */}
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${job.location}, Bangladesh`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm sm:text-base font-bold transition-all shadow-md"
            >
              <Navigation className="w-5 h-5" /> Get Direction
            </a>

            {/* Location (Text box) */}
            <div className="w-full py-3.5 text-center border border-slate-200 rounded-xl text-sm sm:text-base font-bold text-slate-700 bg-slate-50">
              {cityName} : {areaName}
            </div>

            {/* Share Button */}
            <button 
              onClick={handleShare}
              className="flex items-center justify-center gap-2 w-full py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm sm:text-base font-bold transition-all"
            >
              <Share2 className="w-5 h-5 text-slate-400" /> Share
            </button>

            {/* Bookmark Button */}
            <button 
              onClick={handleToggleBookmark}
              className={`flex items-center justify-center gap-2 w-full py-3.5 border rounded-xl text-sm sm:text-base font-bold transition-all ${
                isBookmarked 
                  ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100/50' 
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current text-red-500' : 'text-slate-400'}`} />
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>

            {/* Warn tutor if requirements mismatch */}
            {profile?.role === 'tutor' && !reqCheck.match && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 text-xs sm:text-sm text-red-500 font-bold">
                ⚠️ {reqCheck.reason}
              </div>
            )}

            {/* Apply Now Button */}
            {profile?.role !== 'guardian' && (
              <button 
                onClick={handleApplyClick}
                disabled={profile?.role === 'tutor' && !reqCheck.match}
                className={`flex items-center justify-center gap-2 w-full py-3.5 text-white rounded-xl text-sm sm:text-base font-bold transition-all shadow-md ${
                  profile?.role === 'tutor' && !reqCheck.match
                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-[#86c240] hover:bg-[#6a9c31]'
                }`}
              >
                Apply Now
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Footer stats */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row justify-around items-center text-sm sm:text-base font-black text-slate-500 gap-4">
        <div>Job Id: {shortId}</div>
        <div className="hidden sm:block text-slate-200">|</div>
        <div>Total Views: {(job.views || 0)}</div>
        <div className="hidden sm:block text-slate-200">|</div>
        <div>Total Applications: {applicationCount}</div>
      </div>

      {/* Terms of Service Modal */}
      {showTOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-800 mb-4 border-b pb-3">Terms of Service</h3>
            <div className="text-sm text-slate-600 font-medium space-y-3 max-h-60 overflow-y-auto mb-6 pr-2 leading-relaxed">
              <p>Please read out the terms of service carefully before applying for this tuition request:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>You must provide accurate qualification details in your profile.</li>
                <li>Applications once submitted cannot be withdrawn immediately.</li>
                <li>Admins will review your profile completeness and match with guardian expectations.</li>
                <li>Commission rates or service charges are applicable as per platform rules.</li>
                <li>Direct contact with guardians without admin authorization is strictly prohibited.</li>
              </ol>
            </div>
            <div className="flex gap-4 border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowTOSModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors text-sm"
              >
                I Disagree
              </button>
              <button
                onClick={handleAgreeTOS}
                disabled={isApplying}
                className="flex-1 bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold py-3 rounded-xl transition-colors text-sm disabled:opacity-50"
              >
                {isApplying ? 'Applying...' : 'I Agree'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-[#86c240]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-[#86c240]" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Success!</h3>
            <p className="text-slate-500 font-semibold mb-8">
              Successfully applied for the job. The admins will contact you.
            </p>
            <button 
              onClick={() => {
                setShowSuccessModal(false);
                fetchJobDetails(); // Reload values
              }}
              className="w-full bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold py-3.5 rounded-xl shadow-md transition-colors"
            >
              Close
            </button>
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
