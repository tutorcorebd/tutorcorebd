import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Users,
  MapPin,
  BookOpen,
  Clock,
  DollarSign,
  Briefcase,
  CheckCircle,
  Award,
  XCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  User,
  Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomAlert from '../../components/layout/CustomAlert';

const TutorDashboard = () => {
  const { profile } = useAuthStore();
  const [applications, setApplications] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [activeNotices, setActiveNotices] = useState([]);
  const [currentNoticePopup, setCurrentNoticePopup] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Custom alert state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'success',
    title: '',
    message: '',
    actionText: 'OK',
    onAction: null
  });

  const showAlert = (type, title, message, onAction = null, actionText = 'OK') => {
    setAlertConfig({ type, title, message, actionText, onAction });
    setAlertOpen(true);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile?.id) return;
      try {
        setLoading(true);
        // Fetch tutor's applications
        const { data: appsData, error: appsError } = await supabase
          .from('job_applications')
          .select('*, tuition_requests(*)')
          .eq('tutor_id', profile.id);

        if (!appsError && appsData) {
          setApplications(appsData);
        }

        // Fetch open tuition requests for recommendations
        const { data: jobsData, error: jobsError } = await supabase
          .from('tuition_requests')
          .select('*, guardian:users(full_name)')
          .eq('status', 'open')
          .limit(4);

        if (!jobsError && jobsData) {
          setRecommendedJobs(jobsData);
        }

        // Fetch tutor's bookmarks
        const { data: bookmarksData, error: bookmarksError } = await supabase
          .from('bookmarks')
          .select('*, tuition_requests(*, guardian:users(full_name))')
          .eq('tutor_id', profile.id);

        if (!bookmarksError && bookmarksData) {
          setBookmarks(bookmarksData);
        }

        // Fetch notices
        const { data: noticesData, error: noticesError } = await supabase
          .from('notices')
          .select('*')
          .gt('expires_at', new Date().toISOString());

        if (!noticesError && noticesData) {
          let tutorNotices = noticesData.filter(n => 
            n.target_audience === 'all' || 
            n.target_audience === 'tutor' || 
            (n.target_audience === 'specific' && n.specific_user_ids?.includes(profile.id))
          );

          // Inject auto completeness warning notice if < 80% completeness
          const compVal = calculateCompleteness();
          if (compVal < 80) {
            tutorNotices = [
              {
                id: 'profile-incomplete-notice',
                title: '⚠️ Profile Completeness Required',
                message: 'Complete your profile at least 80% to apply for tuitions.',
                created_at: new Date().toISOString(),
                is_system_auto: true
              },
              ...tutorNotices
            ];
          }

          setActiveNotices(tutorNotices);

          // Check if there is an unseen notice to trigger as popup
          const unseen = tutorNotices.find(n => !localStorage.getItem(`seen_notice_${n.id}`));
          if (unseen) {
            setCurrentNoticePopup(unseen);
            localStorage.setItem(`seen_notice_${unseen.id}`, 'true');
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile]);

  // Compute profile completeness dynamically
  const calculateCompleteness = () => {
    const tp = profile?.tutor_profile;
    if (!tp) return 20; // base profile setup complete

    // If database already has completeness calculated and saved, use it
    if (tp.profile_completeness !== undefined && tp.profile_completeness !== null && tp.profile_completeness > 0) {
      return tp.profile_completeness;
    }

    // Otherwise fallback to dynamic calculation matching the wizard rules
    let score = 20;

    // 1. Location (5%)
    if (tp.current_city && tp.living_location && tp.preferred_locations && tp.preferred_locations.length > 0) {
      score += 5;
    }
    // 2. Category (5%)
    if (tp.preferred_category && tp.preferred_subjects && tp.preferred_subjects.length > 0 && tp.preferred_courses && tp.preferred_courses.length > 0 && tp.experience) {
      score += 5;
    }
    // 3. School (5%)
    if (tp.school_name && tp.school_group && tp.school_curriculum && tp.school_board && tp.school_gpa && tp.school_year) {
      score += 5;
    }
    // 4. College (5%)
    if (tp.college_name && tp.college_group && tp.college_curriculum && tp.college_board && tp.college_gpa && tp.college_year) {
      score += 5;
    }
    // 5. Graduation (5%)
    if (tp.is_hsc_student || (tp.university && tp.department && tp.grad_gpa && tp.grad_year)) {
      score += 5;
    }
    // 6. Post Graduation (5%)
    if (tp.is_hsc_student || (tp.post_grad_university && tp.post_grad_department && tp.post_grad_gpa && tp.post_grad_year)) {
      score += 5;
    }
    // 7. Personal Information (40%)
    if (tp.gender && tp.fathers_name && tp.mothers_name && tp.emergency_contact && tp.address && tp.nid && tp.dob) {
      score += 40;
    }
    // 8. Credential (10%)
    if (tp.cv_url) {
      score += 10;
    }

    return score;
  };

  const completeness = calculateCompleteness();

  // Stats Counters mapping
  const stats = {
    applied: applications.filter(a => a.status === 'pending').length,
    reviewed: applications.filter(a => a.status === 'reviewed').length,
    selected: applications.filter(a => a.status === 'selected').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const handleApply = async (jobId) => {
    if (completeness < 80) {
      showAlert(
        'error',
        'Profile Completeness Required',
        'Complete your profile at least 80% to apply for the tuitions.',
        () => navigate('/tutor/profile'),
        'Complete Profile'
      );
      return;
    }

    try {
      const { error } = await supabase
        .from('job_applications')
        .insert({
          tutor_id: profile.id,
          tuition_request_id: jobId,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          showAlert('info', 'Already Applied', 'You have already applied to this job!');
        } else {
          showAlert('error', 'Application Error', error.message);
        }
      } else {
        showAlert('success', 'Applied Successfully', 'Your application has been submitted successfully.');
        // Refresh applications
        const { data: appsData } = await supabase
          .from('job_applications')
          .select('*, tuition_requests(*)')
          .eq('tutor_id', profile.id);
        if (appsData) setApplications(appsData);
      }
    } catch (err) {
      console.error(err);
      showAlert('error', 'Unexpected Error', 'An unexpected error occurred.');
    }
  };

  const handleDeleteBookmark = async (bookmarkId) => {
    if (!confirm('Are you sure you want to remove this bookmark?')) return;
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);
      if (error) throw error;
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
      showAlert('success', 'Bookmark Removed', 'Tuition post removed from bookmarks.');
    } catch (err) {
      console.error(err);
      showAlert('error', 'Error', 'Failed to remove bookmark.');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* Top Grid Section */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* Welcome Card (Top Left, spans 2 columns) */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-8 flex justify-between items-center relative overflow-hidden">
          <div className="z-10">
            <h1 className="text-2xl text-slate-600 font-medium">
              Good Morning, <span className="font-bold text-slate-800">{profile?.full_name || 'Tushar Undefined'}</span>
            </h1>
            <h2 className="text-3xl font-black text-slate-800 mt-1 mb-3">
              Welcome to TutorCore BD
            </h2>
            <p className="text-slate-500 text-sm max-w-lg leading-relaxed">
              We are so delighted about your arrival on our platform. You can apply your desired "Tuition Job" from your personalized dashboard. So, don't be late apply & enjoy your tutoring journey!!!
            </p>
          </div>
          {/* Decorative illustration placeholder */}
          <div className="hidden lg:block w-48 h-40 bg-slate-50 rounded-lg flex-shrink-0 flex items-center justify-center">
            {/* If you have the image, it goes here */}
            <span className="text-xs text-slate-400"></span>
          </div>
        </div>

        {/* Member Since (Top Right, spans 1 column) */}
        <div className="bg-[#e0f2fe] rounded-xl p-8 border border-[#bae6fd] shadow-sm flex flex-col justify-center gap-4">
          <h2 className="text-slate-600 font-medium">Member Since</h2>
          <div className="flex items-center gap-4 border border-[#7dd3fc] rounded-lg px-4 py-3 bg-white/50 mt-2">
            <div className="w-8 h-8 rounded-full bg-[#0ea5e9] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
              <User className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-800 text-sm">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Membership (Bottom Left, spans 2 columns) */}
        <div className="md:col-span-2 bg-gradient-to-r from-[#0f172a] to-[#1e1b4b] rounded-xl shadow-md p-8 relative overflow-hidden text-white flex flex-col justify-between min-h-[180px]">
          {/* Decorative background circles */}
          <div className="absolute -right-20 -top-20 w-64 h-64 border border-white/10 rounded-full"></div>
          <div className="absolute right-10 -bottom-32 w-64 h-64 border border-white/5 rounded-full"></div>

          <div className="flex justify-between items-start z-10 relative">
            <h2 className="text-2xl font-bold">Membership</h2>
            <span className="bg-white text-slate-800 text-xs font-bold px-3 py-1 rounded-sm shadow-sm">
              Save 39%
            </span>
          </div>

          <p className="text-slate-300 text-sm mt-4 mb-6 max-w-md z-10 relative leading-relaxed">
            Subscriptions to a Membership Package always be top rated. It helps to gain tuition jobs rapidly.
          </p>

          <div className="flex justify-between items-end z-10 relative mt-auto">
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold">499</span>
              <span className="text-slate-400 text-sm mb-1">/year</span>
            </div>
            <button
              onClick={() => navigate('/tutor/membership')}
              className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-sm font-bold px-6 py-2 rounded-md transition-colors"
            >
              Try 1 year
            </button>
          </div>
        </div>

        {/* Notice Board (Bottom Right, spans 1 column) */}
        <div className="bg-white rounded-xl p-8 border border-slate-100 shadow-sm flex flex-col justify-start max-h-[300px]">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
            <Megaphone className="w-5 h-5 text-[#86c240]" /> Notice Board
          </h2>
          {activeNotices.length === 0 ? (
            <p className="text-slate-450 text-sm font-semibold my-auto text-center">
              There are no notices for you at the moment!
            </p>
          ) : (
            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {activeNotices.map(n => (
                <div key={n.id} className="border-b border-slate-50 pb-3 last:border-b-0 last:pb-0">
                  <h4 className="font-extrabold text-sm text-slate-800 flex items-center justify-between gap-2">
                    <span className="truncate">{n.title}</span>
                    <span className="text-xs text-[#86c240] font-bold shrink-0">
                      {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed whitespace-pre-wrap font-medium">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Row 2: Promos / Action Cards */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* Profile Completeness Card (The Requested Prompt) */}
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
              <p className="text-slate-500 text-xs leading-relaxed mt-1">
                Complete your profile to unlock premium matches.
              </p>
            </div>
          </div>
          <Link to="/tutor/profile" className="px-4 py-2.5 bg-[#86c240] hover:bg-[#6a9c31] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#86c240]/20 flex-shrink-0 self-center">
            Update Profile
          </Link>
        </div>

        {/* Find Tuition Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#eaf4df] flex items-center justify-center text-[#86c240] flex-shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Find Tuitions</h3>
              <p className="text-slate-500 text-xs leading-relaxed mt-1">
                Browse student tuition postings and apply instantly.
              </p>
            </div>
          </div>
          <Link to="/tutor/tuitions" className="mt-4 w-full text-center py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md">
            Browse Tuitions
          </Link>
        </div>

        {/* Tutor Community Hub */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#eaf4df] flex items-center justify-center text-[#86c240] flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Tutor Hub</h3>
              <p className="text-slate-500 text-xs leading-relaxed mt-1">
                Connect and share tips with top educators.
              </p>
            </div>
          </div>
          <button className="mt-4 w-full py-2.5 bg-slate-50 border border-slate-150 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all">
            See Community
          </button>
        </div>

      </div>

      {/* Row 3: Stats Counters */}
      <div>
        <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#86c240]" />
          My Status
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{stats.applied}</div>
              <div className="text-xs text-slate-400 font-bold">Applied</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{stats.reviewed}</div>
              <div className="text-xs text-slate-400 font-bold">Reviewed</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500 flex-shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{stats.selected}</div>
              <div className="text-xs text-slate-400 font-bold">Selected</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{stats.rejected}</div>
              <div className="text-xs text-slate-400 font-bold">Rejected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Recommended Tuition Jobs */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">Recommended Tuitions</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Based on open student postings in your region</p>
          </div>
          <Link to="/tutor/tuitions" className="text-xs font-bold text-[#86c240] hover:text-[#6a9c31] flex items-center gap-1">
            See All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 text-sm">Loading tuitions...</div>
        ) : recommendedJobs.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No recommended tuitions found at this time.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedJobs.map((job) => {
              const applied = applications.some(app => app.tuition_request_id === job.id);
              return (
                <div key={job.id} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md">
                  <div>
                    {/* Badge */}
                    <span className="inline-block px-2.5 py-1 bg-[#eaf4df] text-[#86c240] text-[10px] font-black rounded-lg border border-[#86c240]/10">
                      {job.student_class}
                    </span>
                    <h3 className="font-extrabold text-slate-800 text-base leading-tight">
                      {job.subject ? job.subject.join(', ') : 'All Subjects'}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">Posted by {job.guardian?.full_name || 'Guardian'}</p>

                    {/* Meta info */}
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
                    </div>
                  </div>

                  <button
                    onClick={() => !applied && handleApply(job.id)}
                    disabled={applied}
                    className={`mt-6 w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${applied ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                  >
                    {applied ? 'Applied' : 'Apply Now'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Row 5: Bookmarked Tuitions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">Bookmarked Tuitions</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Your saved tuition requests</p>
          </div>
        </div>

        {bookmarks.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            You have not bookmarked any tuitions yet.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bookmarks.map((b) => {
              const job = b.tuition_requests;
              if (!job) return null;
              const applied = applications.some(app => app.tuition_request_id === job.id);
              
              return (
                <div key={b.id} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="inline-block px-2.5 py-1 bg-[#eaf4df] text-[#86c240] text-[10px] font-black rounded-lg border border-[#86c240]/10">
                        {job.student_class}
                      </span>
                      <button 
                        onClick={() => handleDeleteBookmark(b.id)}
                        className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition-colors"
                        title="Remove Bookmark"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
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
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Link
                      to={`/tuition/${job.id}`}
                      className="flex-1 text-center py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => !applied && handleApply(job.id)}
                      disabled={applied}
                      className={`flex-grow py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${applied ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#86c240] text-white hover:bg-[#6a9c31]'}`}
                    >
                      {applied ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CustomAlert
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        actionText={alertConfig.actionText}
        onAction={alertConfig.onAction}
      />

      {/* Notice Popup Modal */}
      <AnimatePresence>
        {currentNoticePopup && (
          <div className="fixed inset-0 z-[99] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setCurrentNoticePopup(null)}
              className="fixed inset-0 bg-slate-900"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-slate-150 p-6 md:p-8 max-w-lg w-full relative shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-50 text-[#86c240] rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">New Announcement</span>
                  <h3 className="font-extrabold text-slate-800 text-lg leading-tight mt-0.5">{currentNoticePopup.title}</h3>
                </div>
              </div>
              <p className="text-xs text-slate-650 leading-relaxed whitespace-pre-wrap font-medium pt-2 border-t border-slate-50">
                {currentNoticePopup.message}
              </p>
              <div className="flex justify-between items-center pt-4 border-t border-slate-55">
                <span className="text-[10px] text-slate-400 font-bold">
                  Published: {new Date(currentNoticePopup.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setCurrentNoticePopup(null)}
                  className="bg-[#86c240] hover:bg-[#6a9c31] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-[#86c240]/15"
                >
                  Acknowledge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TutorDashboard;
