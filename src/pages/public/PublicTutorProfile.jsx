import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { 
  Download, 
  Calendar, 
  Phone, 
  User, 
  MapPin, 
  GraduationCap, 
  BookOpen, 
  Award, 
  CheckCircle, 
  ArrowLeft, 
  Heart, 
  Eye, 
  FileText, 
  Clock, 
  Briefcase,
  DollarSign,
  Compass,
  Check,
  Shield,
  Layers
} from 'lucide-react';
import CustomAlert from '../../components/layout/CustomAlert';

const VerifiedBadge = ({ size = 16 }) => (
  <svg 
    className="inline-block text-[#86c240] fill-current shrink-0 ml-1.5 align-middle" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
  </svg>
);

const PublicTutorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [tutorData, setTutorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

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

  useEffect(() => {
    const fetchTutorProfile = async () => {
      setLoading(true);
      try {
        // Fetch tutor data
        const { data: user, error: userError } = await supabase
          .from('users')
          .select(`
            id,
            full_name,
            phone_number,
            created_at,
            tutor_profiles (*)
          `)
          .eq('id', id)
          .single();

        if (userError || !user) {
          throw new Error('Tutor not found.');
        }

        setTutorData(user);

        // Check if bookmarked if logged in
        if (currentUser) {
          const { data: bookmark, error: bookmarkError } = await supabase
            .from('bookmarks')
            .select('id')
            .eq('tutor_id', user.id)
            .eq('tuition_request_id', currentUser.id) // using logged-in user or checking direct relations
            .maybeSingle(); // standard query checking bookmark exists

          if (bookmark) {
            setIsBookmarked(true);
          }
        }
      } catch (err) {
        console.error(err);
        showAlert('error', 'Not Found', 'The requested tutor profile could not be found.', () => navigate('/'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTutorProfile();
    }
  }, [id, currentUser]);

  const getTutorProfile = (tutor) => {
    if (!tutor) return {};
    const tp = tutor.tutor_profiles;
    if (!tp) return {};
    return Array.isArray(tp) ? (tp[0] || {}) : tp;
  };

  const handleBookmarkToggle = async () => {
    if (!currentUser) {
      showAlert('warning', 'Login Required', 'Please log in as a guardian to bookmark tutor profiles.');
      return;
    }

    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        // Delete bookmark (assuming schema requires tutor_id match)
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('tutor_id', tutorData.id);
        
        if (error) throw error;
        setIsBookmarked(false);
        showAlert('success', 'Bookmark Removed', 'The tutor profile has been removed from bookmarks.');
      } else {
        // Insert bookmark (we need a tuition_request_id, but if none exists we can find or use a placeholder/recent request, or first available request)
        // Let's first fetch a tuition request created by this guardian
        const { data: requests } = await supabase
          .from('tuition_requests')
          .select('id')
          .eq('guardian_id', currentUser.id)
          .limit(1);

        const requestId = requests && requests.length > 0 ? requests[0].id : null;

        if (!requestId) {
          showAlert('info', 'Post a Job First', 'Please post a tuition job first to bookmark tutors for that job.');
          setBookmarkLoading(false);
          return;
        }

        const { error } = await supabase
          .from('bookmarks')
          .insert({
            tutor_id: tutorData.id,
            tuition_request_id: requestId
          });

        if (error) throw error;
        setIsBookmarked(true);
        showAlert('success', 'Bookmarked Successfully', 'This tutor profile has been bookmarked.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', 'Error', 'Failed to update bookmark status.');
    } finally {
      setBookmarkLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px] text-slate-400 font-bold text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#86c240] mr-3"></div>
        Loading profile...
      </div>
    );
  }

  if (!tutorData) return null;

  const profile = getTutorProfile(tutorData);
  const userInitial = tutorData.full_name ? tutorData.full_name.charAt(0).toUpperCase() : 'T';
  const shortId = tutorData.id ? tutorData.id.substring(0, 6).toUpperCase() : '------';

  // Format date of birth
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 py-8 bg-slate-50/50 min-h-screen">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Main Top Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Profile Card + Bio */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative flex-shrink-0">
                {profile.photo_url ? (
                  <img 
                    src={profile.photo_url} 
                    alt={tutorData.full_name} 
                    className="w-28 h-28 rounded-2xl object-cover border-4 border-slate-50 shadow-md"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl border-4 border-[#eaf4df] bg-gradient-to-tr from-slate-800 to-slate-900 flex items-center justify-center text-white text-4xl font-black shadow-md">
                    {userInitial}
                  </div>
                )}
                {profile.is_verified && (
                  <div className="absolute -bottom-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-md border border-slate-100">
                    <VerifiedBadge size={26} />
                  </div>
                )}
              </div>

              <div className="text-center sm:text-left space-y-2 flex-grow">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center sm:justify-start gap-0.5">
                    {tutorData.full_name}
                    {profile.is_verified && <VerifiedBadge size={22} />}
                  </h2>
                  {profile.is_verified && (
                    <span className="bg-[#eaf4df] text-[#6a9c31] text-[10px] font-extrabold px-3 py-1 rounded-full inline-flex items-center justify-center gap-1 self-center w-fit">
                      <Shield className="w-3 h-3 fill-current" /> Verified Profile
                    </span>
                  )}
                </div>

                {profile.university && (
                  <p className="text-sm font-semibold text-slate-600 flex items-center justify-center sm:justify-start gap-1">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    {profile.department ? `${profile.department} at ` : ''}{profile.university}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 pt-2 text-xs font-semibold text-slate-400">
                  <span className="bg-slate-50 px-2.5 py-1 rounded-md">Tutor ID: T-{shortId}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-slate-400" /> 230 Views
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Member since {new Date(tutorData.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {profile.bio && (
              <div className="mt-6 pt-6 border-t border-slate-100/80">
                <h4 className="text-xs font-bold text-slate-400 tracking-wider mb-2">Introduction</h4>
                <p className="text-slate-600 text-sm font-medium leading-relaxed whitespace-pre-line">{profile.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sidebar Action/Bookmark Card */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 sticky top-6">
            <div className="text-center pb-2 border-b border-slate-50">
              <h3 className="text-sm font-bold text-slate-700">Save This Tutor Profile</h3>
              <p className="text-xs text-slate-400 mt-1">Bookmark to view easily from your guardian dashboard anytime.</p>
            </div>

            <button
              onClick={handleBookmarkToggle}
              disabled={bookmarkLoading}
              className={`w-full py-3.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 border ${
                isBookmarked 
                  ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100/70' 
                  : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800 hover:border-slate-800'
              }`}
            >
              <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-current text-rose-600' : ''}`} />
              {isBookmarked ? 'Bookmarked' : 'Bookmark Profile'}
            </button>

            {profile.cv_url && (
              <a 
                href={profile.cv_url} 
                target="_blank" 
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Download className="w-4 h-4 text-slate-400" /> Download CV File
              </a>
            )}

            <div className="pt-2 text-center">
              <p className="text-[10px] text-slate-400 font-semibold">
                Completeness Score: {profile.profile_completeness || 0}%
              </p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div 
                  className="bg-[#86c240] h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${profile.profile_completeness || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Tutoring Information Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-6">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
          <BookOpen className="w-5 h-5 text-[#86c240]" /> Tutoring Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-50 gap-1">
              <span className="font-bold text-slate-400 text-xs">Living Country</span>
              <span className="font-semibold text-slate-700">Bangladesh</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-50 gap-1">
              <span className="font-bold text-slate-400 text-xs">Living City</span>
              <span className="font-semibold text-slate-700">{profile.current_city || 'N/A'}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-50 gap-1">
              <span className="font-bold text-slate-400 text-xs">Living Location / Area</span>
              <span className="font-semibold text-slate-700">{profile.living_location || 'N/A'}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-50 gap-1">
              <span className="font-bold text-slate-400 text-xs">Expected Salary</span>
              <span className="font-extrabold text-[#86c240]">{profile.expected_salary || 'Negotiable'}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-50 gap-1">
              <span className="font-bold text-slate-400 text-xs">Tutoring Experience</span>
              <span className="font-semibold text-slate-700">{profile.experience || 'N/A'}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-50 gap-1">
              <span className="font-bold text-slate-400 text-xs">Preferred Tutoring Time</span>
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {profile.available_from && profile.available_to 
                  ? `${profile.available_from} to ${profile.available_to}` 
                  : 'Negotiable'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <span className="font-bold text-slate-400 text-xs block">Preferred Locations</span>
              <div className="flex flex-wrap gap-1.5">
                {profile.preferred_locations && profile.preferred_locations.length > 0 ? (
                  profile.preferred_locations.map((loc, idx) => (
                    <span key={idx} className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-md border border-emerald-100/80">
                      {loc}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs font-semibold">N/A</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-400 text-xs block">Preferred Categories</span>
              <div className="flex flex-wrap gap-1.5">
                {profile.preferred_category ? (
                  <span className="bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-md border border-blue-100/80">
                    {profile.preferred_category}
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs font-semibold">N/A</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-400 text-xs block">Preferred Classes & Courses</span>
              <div className="flex flex-wrap gap-1.5">
                {profile.preferred_courses && profile.preferred_courses.length > 0 ? (
                  profile.preferred_courses.map((course, idx) => (
                    <span key={idx} className="bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2.5 py-1 rounded-md border border-indigo-100/80">
                      {course}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs font-semibold">N/A</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-400 text-xs block">Preferred Subjects</span>
              <div className="flex flex-wrap gap-1.5">
                {profile.preferred_subjects && profile.preferred_subjects.length > 0 ? (
                  profile.preferred_subjects.map((sub, idx) => (
                    <span key={idx} className="bg-amber-50 text-amber-700 text-[11px] font-bold px-2.5 py-1 rounded-md border border-amber-100/80">
                      {sub}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs font-semibold">N/A</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-400 text-xs block">Preferred Tutoring Method</span>
              <div className="flex flex-wrap gap-1.5">
                {profile.teaching_method ? (
                  <span className="bg-purple-50 text-purple-700 text-[11px] font-bold px-2.5 py-1 rounded-md border border-purple-100/80">
                    {profile.teaching_method}
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs font-semibold">N/A</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-400 text-xs block">Availability Days</span>
              <div className="flex flex-wrap gap-1.5">
                {profile.available_days && profile.available_days.length > 0 ? (
                  profile.available_days.map((day, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-md border border-slate-200/55">
                      {day}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs font-semibold">N/A</span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Educational Information Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-8">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
          <GraduationCap className="w-5 h-5 text-[#86c240]" /> Educational Information
        </h3>

        {/* Secondary Education (SSC/HSC) */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Undergraduate Information (SSC & HSC)</h4>
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-xs">
                  <th className="p-4">Exam Title</th>
                  <th className="p-4">Institute</th>
                  <th className="p-4">Board</th>
                  <th className="p-4">Group</th>
                  <th className="p-4">Passing Year</th>
                  <th className="p-4">GPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
                {profile.school_name ? (
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">SSC / O Level</td>
                    <td className="p-4">{profile.school_name}</td>
                    <td className="p-4">{profile.school_board || 'N/A'}</td>
                    <td className="p-4">{profile.school_group || 'N/A'}</td>
                    <td className="p-4">{profile.school_year || 'N/A'}</td>
                    <td className="p-4 text-[#86c240] font-bold">{profile.school_gpa || 'N/A'}</td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-slate-400 text-xs font-semibold">No SSC profile data provided</td>
                  </tr>
                )}
                {profile.college_name ? (
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">HSC / A Level</td>
                    <td className="p-4">{profile.college_name}</td>
                    <td className="p-4">{profile.college_board || 'N/A'}</td>
                    <td className="p-4">{profile.college_group || 'N/A'}</td>
                    <td className="p-4">{profile.college_year || 'N/A'}</td>
                    <td className="p-4 text-[#86c240] font-bold">{profile.college_gpa || 'N/A'}</td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-slate-400 text-xs font-semibold">No HSC profile data provided</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tertiary Education (Graduation/Post Graduation) */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Higher Education (Graduation & Post Graduation)</h4>
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-xs">
                  <th className="p-4">Exam Title</th>
                  <th className="p-4">Institute</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Passing Year</th>
                  <th className="p-4">CGPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
                {profile.university ? (
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">Graduation / Bachelor</td>
                    <td className="p-4">{profile.university}</td>
                    <td className="p-4">{profile.department || 'N/A'}</td>
                    <td className="p-4">{profile.grad_year || 'N/A'}</td>
                    <td className="p-4 text-[#86c240] font-bold">{profile.grad_gpa || 'N/A'}</td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-slate-400 text-xs font-semibold">No graduation data provided</td>
                  </tr>
                )}
                {profile.post_grad_university ? (
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">Post Graduation / Masters</td>
                    <td className="p-4">{profile.post_grad_university}</td>
                    <td className="p-4">{profile.post_grad_department || 'N/A'}</td>
                    <td className="p-4">{profile.post_grad_year || 'N/A'}</td>
                    <td className="p-4 text-[#86c240] font-bold">{profile.post_grad_gpa || 'N/A'}</td>
                  </tr>
                ) : (
                  null
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-6">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
          <User className="w-5 h-5 text-[#86c240]" /> Personal Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6 text-sm">
          
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider">Gender</div>
              <div className="text-sm font-semibold text-slate-700">{profile.gender || 'N/A'}</div>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider">Date of Birth</div>
              <div className="text-sm font-semibold text-slate-700">{formatDate(profile.dob)}</div>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider">Emergency Contact</div>
              <div className="text-sm font-semibold text-slate-700">
                {profile.emergency_contact 
                  ? `${profile.emergency_contact.substring(0, 5)}*****` 
                  : 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider">Father's Name</div>
              <div className="text-sm font-semibold text-slate-700">{profile.fathers_name || 'N/A'}</div>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider">Mother's Name</div>
              <div className="text-sm font-semibold text-slate-700">{profile.mothers_name || 'N/A'}</div>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider">National ID (NID)</div>
              <div className="text-sm font-semibold text-slate-700">
                {profile.nid 
                  ? `${profile.nid.substring(0, 4)}*****` 
                  : 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex gap-3 items-start sm:col-span-2 lg:col-span-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider">Full Address</div>
              <div className="text-sm font-semibold text-slate-700 mt-0.5">{profile.address || 'N/A'}</div>
            </div>
          </div>

        </div>
      </div>

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

export default PublicTutorProfile;

