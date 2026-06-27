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
  ArrowLeft, 
  Heart, 
  Eye, 
  FileText, 
  Clock, 
  Layers,
  Star,
  Bookmark,
  DollarSign,
  Globe,
  Building2,
  Briefcase
} from 'lucide-react';
import CustomAlert from '../../components/layout/CustomAlert';
import { motion } from 'framer-motion';
import VerifiedBadge from '../../components/common/VerifiedBadge';
import PremiumBadge from '../../components/common/PremiumBadge';

const PublicTutorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, profile: currentProfile } = useAuthStore();
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

  // Check if current user is admin
  const isAdmin = currentProfile?.role === 'admin';

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[500px] gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-[#86c240] animate-spin"></div>
        </div>
        <p className="text-slate-400 font-semibold text-sm">Loading profile...</p>
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

  // Render a tag pill with green border (matching reference)
  const TagPill = ({ children, color = 'green' }) => {
    const colorMap = {
      green: 'border-[#86c240]/40 text-slate-700 bg-[#86c240]/5 hover:border-[#86c240]/70 hover:bg-[#86c240]/10',
      blue: 'border-blue-300/50 text-slate-700 bg-blue-50/50 hover:border-blue-400/70 hover:bg-blue-50',
      amber: 'border-amber-300/50 text-slate-700 bg-amber-50/50 hover:border-amber-400/70 hover:bg-amber-50',
      purple: 'border-purple-300/50 text-slate-700 bg-purple-50/50 hover:border-purple-400/70 hover:bg-purple-50',
      slate: 'border-slate-200 text-slate-600 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50',
    };
    return (
      <span className={`inline-block text-sm font-semibold px-3.5 py-1.5 rounded-full border tag-hover cursor-default ${colorMap[color] || colorMap.green}`}>
        {children}
      </span>
    );
  };

  // Info row component for tutoring information
  const InfoRow = ({ label, value, isLast = false }) => (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between py-4 ${!isLast ? 'border-b border-slate-100/80' : ''} gap-1`}>
      <span className="font-bold text-slate-500 text-[15px]">{label} :</span>
      <span className="font-semibold text-slate-800 text-[15px]">{value || 'N/A'}</span>
    </div>
  );

  return (
    <div className="max-w-[1400px] w-full mx-auto px-4 md:px-8 py-6 md:py-10 min-h-screen">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="animate-fade-in-up flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
      </button>

      {/* =================== HERO CARD =================== */}
      <div className="animate-fade-in-up stagger-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden card-lift mb-6">
        <div className="flex flex-col lg:flex-row">
          
          {/* Left: Avatar + Basic Info (centered) */}
          <div className="lg:w-[380px] flex-shrink-0 flex flex-col items-center justify-center py-10 px-6 lg:border-r border-slate-100/80">
            
            {/* Avatar with green glow ring */}
            <div className="relative mb-5">
              <div className="animate-avatar-glow rounded-full p-1.5 border-[3px] border-[#86c240]/60">
                {profile.photo_url ? (
                  <img 
                    src={profile.photo_url} 
                    alt={tutorData.full_name} 
                    className="w-28 h-28 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-4xl font-black">
                    {userInitial}
                  </div>
                )}
              </div>
              {/* Badges below avatar */}
              {(profile.is_verified || profile.is_premium) && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white rounded-full px-1 py-0.5 shadow-sm border border-slate-100">
                  {profile.is_verified && <VerifiedBadge size={24} position="bottom" />}
                  {profile.is_premium && <PremiumBadge size={24} position="bottom" />}
                </div>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight text-center">
              {tutorData.full_name}
            </h1>

            {/* Rating */}
            {profile.rating > 0 && (
              <div className="flex gap-0.5 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < profile.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Info Grid */}
            <div className="mt-6 w-full max-w-[320px] space-y-4 text-center">
              {profile.university && (
                <div>
                  <p className="text-sm font-bold text-slate-400 mb-0.5">University :</p>
                  <p className="text-base font-semibold text-slate-700">{profile.university}</p>
                </div>
              )}
              {profile.department && (
                <div>
                  <p className="text-sm font-bold text-slate-400 mb-0.5">Department :</p>
                  <p className="text-base font-semibold text-slate-700">{profile.department}</p>
                </div>
              )}
              <div className="flex justify-center gap-8 pt-2">
                <div>
                  <p className="text-sm font-bold text-slate-400 mb-0.5">Tutor ID :</p>
                  <p className="text-base font-semibold text-slate-700">T-{shortId}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 mb-0.5">Profile Views :</p>
                  <p className="text-base font-semibold text-slate-700 flex items-center justify-center gap-1">
                    <Eye className="w-4 h-4 text-[#86c240]" /> 230
                  </p>
                </div>
              </div>
              <div className="pt-1">
                <p className="text-sm font-bold text-slate-400 mb-0.5">Member Since :</p>
                <p className="text-base font-semibold text-slate-700 flex items-center justify-center gap-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {new Date(tutorData.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Completeness Score */}
            <div className="w-full max-w-[260px] mt-6 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completeness</span>
                <span className="text-xs font-black text-[#86c240]">{profile.profile_completeness || 0}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#86c240] to-[#6a9c31] h-2 rounded-full animate-progress-grow" 
                  style={{ width: `${profile.profile_completeness || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Right: Bio / Preface / Experience (like reference) */}
          <div className="flex-1 p-6 md:p-8 lg:py-10 space-y-0">
            
            {(profile.about_yourself || profile.bio) && (
              <div className="pb-6 border-b border-slate-100/80">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Preface</h3>
                <p className="text-[15px] text-slate-600 leading-relaxed whitespace-pre-line">{profile.about_yourself || profile.bio}</p>
              </div>
            )}

            {profile.tuition_experience_details && (
              <div className="py-6 border-b border-slate-100/80">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Tution Job Experience</h3>
                <p className="text-[15px] text-slate-600 leading-relaxed whitespace-pre-line">{profile.tuition_experience_details}</p>
              </div>
            )}

            {profile.reasons_for_hiring && (
              <div className="py-6 border-b border-slate-100/80">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Reasons To be Getting Hired</h3>
                <p className="text-[15px] text-slate-600 leading-relaxed whitespace-pre-line">{profile.reasons_for_hiring}</p>
              </div>
            )}

            {profile.personal_motivation && (
              <div className="pt-6">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Personal Motivation</h3>
                <p className="text-[15px] text-slate-600 leading-relaxed whitespace-pre-line">{profile.personal_motivation}</p>
              </div>
            )}

            {/* If none of the optional sections are filled, show a placeholder */}
            {!profile.about_yourself && !profile.bio && !profile.tuition_experience_details && !profile.reasons_for_hiring && !profile.personal_motivation && (
              <div className="flex items-center justify-center h-full min-h-[120px] text-slate-300">
                <p className="text-base font-semibold">No additional details provided yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =================== BOOKMARK BAR =================== */}
      <div className="animate-fade-in-up stagger-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 card-lift">
        <p className="text-base font-semibold text-slate-600 text-center sm:text-left">
          Bookmark it right now to save this tutor profile
        </p>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Admin-only CV Download */}
          {isAdmin && profile.cv_url && (
            <a 
              href={profile.cv_url} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            >
              <Download className="w-4 h-4" /> Download CV
            </a>
          )}
          <button
            onClick={handleBookmarkToggle}
            disabled={bookmarkLoading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              isBookmarked 
                ? 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100' 
                : 'bg-[#86c240] border border-[#86c240] text-white hover:bg-[#6a9c31] hover:border-[#6a9c31] shadow-sm'
            }`}
          >
            <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
        </div>
      </div>

      {/* =================== TUTORING INFORMATION =================== */}
      <div className="animate-fade-in-up stagger-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 mb-6 card-lift">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-1 flex items-center gap-2">
          Tutoring Information
          <span className="flex-1 h-px bg-slate-100 ml-3"></span>
        </h2>
        
        <div className="mt-6 space-y-0">
          <InfoRow label="Living Country" value="Bangladesh" />
          <InfoRow label="Living City" value={profile.current_city} />
          <InfoRow label="Living Location" value={profile.living_location} />
          
          {/* Preferred Locations (tags) */}
          <div className="py-3.5 border-b border-slate-100/80">
            <span className="font-bold text-slate-500 text-[15px] block mb-2.5">Preferred Tutoring Location :</span>
            <div className="flex flex-wrap gap-2">
              {profile.preferred_locations && profile.preferred_locations.length > 0 ? (
                profile.preferred_locations.map((loc, idx) => (
                  <TagPill key={idx} color="green">{loc}</TagPill>
                ))
              ) : (
                <span className="text-slate-400 text-xs font-semibold">N/A</span>
              )}
            </div>
          </div>

          {/* Preferred Category */}
          <div className="py-3.5 border-b border-slate-100/80">
            <span className="font-bold text-slate-500 text-[15px] block mb-2.5">Preferred Tutoring Category :</span>
            <div className="flex flex-wrap gap-2">
              {profile.preferred_category ? (
                <TagPill color="green">{profile.preferred_category}</TagPill>
              ) : (
                <span className="text-slate-400 text-xs font-semibold">N/A</span>
              )}
            </div>
          </div>

          {/* Preferred Classes & Courses */}
          <div className="py-3.5 border-b border-slate-100/80">
            <span className="font-bold text-slate-500 text-[15px] block mb-2.5">Preferred Tutoring Classes & Courses :</span>
            <div className="flex flex-wrap gap-2">
              {profile.preferred_courses && profile.preferred_courses.length > 0 ? (
                profile.preferred_courses.map((course, idx) => (
                  <TagPill key={idx} color="green">{course}</TagPill>
                ))
              ) : (
                <span className="text-slate-400 text-xs font-semibold">N/A</span>
              )}
            </div>
          </div>

          {/* Preferred Subjects */}
          <div className="py-3.5 border-b border-slate-100/80">
            <span className="font-bold text-slate-500 text-[15px] block mb-2.5">Preferred Tutoring Subjects :</span>
            <div className="flex flex-wrap gap-2">
              {profile.preferred_subjects && profile.preferred_subjects.length > 0 ? (
                profile.preferred_subjects.map((sub, idx) => (
                  <TagPill key={idx} color="green">{sub}</TagPill>
                ))
              ) : (
                <span className="text-slate-400 text-xs font-semibold">N/A</span>
              )}
            </div>
          </div>

          {/* Preferred Tutoring Method */}
          <div className="py-3.5 border-b border-slate-100/80">
            <span className="font-bold text-slate-500 text-[15px] block mb-2.5">Preferred Tutoring Method :</span>
            <div className="flex flex-wrap gap-2">
              {profile.teaching_method ? (
                typeof profile.teaching_method === 'string' && profile.teaching_method.includes(',') 
                  ? profile.teaching_method.split(',').map((m, idx) => (
                      <TagPill key={idx} color="green">{m.trim()}</TagPill>
                    ))
                  : <TagPill color="green">{profile.teaching_method}</TagPill>
              ) : (
                <span className="text-slate-400 text-xs font-semibold">N/A</span>
              )}
            </div>
          </div>

          {/* Availability Days */}
          <div className="py-3.5 border-b border-slate-100/80">
            <span className="font-bold text-slate-500 text-[15px] block mb-2.5">Availability Day :</span>
            <div className="flex flex-wrap gap-2">
              {profile.available_days && profile.available_days.length > 0 ? (
                profile.available_days.map((day, idx) => (
                  <TagPill key={idx} color="green">{day}</TagPill>
                ))
              ) : (
                <span className="text-slate-400 text-xs font-semibold">N/A</span>
              )}
            </div>
          </div>

          {/* Available Time */}
          <InfoRow 
            label="Available From" 
            value={profile.available_from || 'Negotiable'} 
          />
          <InfoRow 
            label="Available To" 
            value={profile.available_to || 'Negotiable'} 
          />

          {/* Experience & Salary */}
          <InfoRow 
            label="Tutoring Experience" 
            value={profile.experience ? `${profile.experience} Year(S)` : 'N/A'} 
          />
          <InfoRow 
            label="Expected Salary" 
            value={
              profile.expected_salary 
                ? <span className="text-[#86c240] font-bold">{profile.expected_salary} Tk</span>
                : 'Negotiable'
            }
            isLast 
          />
        </div>
      </div>

      {/* =================== EDUCATIONAL INFORMATION — SSC/HSC =================== */}
      <div className="animate-fade-in-up stagger-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 mb-6 card-lift">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-1 flex items-center gap-2">
          Educational Information
          <span className="flex-1 h-px bg-slate-100 ml-3"></span>
        </h2>
        <p className="text-sm font-semibold text-slate-400 mb-4">Undergraduate Info :</p>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-[15px] border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-700 text-white text-xs font-bold">
                <th className="p-4">Exam Title</th>
                <th className="p-4">Institute</th>
                <th className="p-4">Board</th>
                <th className="p-4">Group</th>
                <th className="p-4">Year</th>
                <th className="p-4">GPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              {profile.school_name ? (
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 font-bold text-slate-800">SSC / O Level / Dakhil</td>
                  <td className="p-4">{profile.school_name}</td>
                  <td className="p-4">{profile.school_board || 'N/A'}</td>
                  <td className="p-4">{profile.school_group || 'N/A'}</td>
                  <td className="p-4">{profile.school_year || 'N/A'}</td>
                  <td className="p-4 text-[#86c240] font-bold">{profile.school_gpa || 'N/A'}</td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-slate-400 text-xs font-semibold">No SSC data provided</td>
                </tr>
              )}
              {profile.college_name ? (
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 font-bold text-slate-800">HSC / A Level / Alim</td>
                  <td className="p-4">{profile.college_name}</td>
                  <td className="p-4">{profile.college_board || 'N/A'}</td>
                  <td className="p-4">{profile.college_group || 'N/A'}</td>
                  <td className="p-4">{profile.college_year || 'N/A'}</td>
                  <td className="p-4 text-[#86c240] font-bold">{profile.college_gpa || 'N/A'}</td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-slate-400 text-xs font-semibold">No HSC data provided</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================== EDUCATIONAL INFORMATION — GRADUATION =================== */}
      <div className="animate-fade-in-up stagger-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 mb-6 card-lift">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-1 flex items-center gap-2">
          Educational Information
          <span className="flex-1 h-px bg-slate-100 ml-3"></span>
        </h2>
        <p className="text-sm font-semibold text-slate-400 mb-4">Graduation Info :</p>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-[15px] border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-700 text-white text-xs font-bold">
                <th className="p-4">Exam Title</th>
                <th className="p-4">Institute</th>
                <th className="p-4">Study Type</th>
                <th className="p-4">Department</th>
                <th className="p-4">Year</th>
                <th className="p-4">CGPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              {profile.university ? (
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 font-bold text-slate-800">Graduation / Diploma</td>
                  <td className="p-4">{profile.university}</td>
                  <td className="p-4">{profile.study_type || 'N/A'}</td>
                  <td className="p-4">{profile.department || 'N/A'}</td>
                  <td className="p-4">{profile.grad_year || 'N/A'}</td>
                  <td className="p-4 text-[#86c240] font-bold">{profile.grad_gpa || 'N/A'}</td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-slate-400 text-xs font-semibold">No graduation data provided</td>
                </tr>
              )}
              {profile.post_grad_university && (
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 font-bold text-slate-800">Postgraduate / Masters</td>
                  <td className="p-4">{profile.post_grad_university}</td>
                  <td className="p-4">{profile.post_grad_study_type || 'N/A'}</td>
                  <td className="p-4">{profile.post_grad_department || 'N/A'}</td>
                  <td className="p-4">{profile.post_grad_year || 'N/A'}</td>
                  <td className="p-4 text-[#86c240] font-bold">{profile.post_grad_gpa || 'N/A'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================== PERSONAL INFORMATION =================== */}
      <div className="animate-fade-in-up stagger-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 mb-6 card-lift">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          Personal Information
          <span className="flex-1 h-px bg-slate-100 ml-3"></span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
          <div>
            <InfoRow label="Gender" value={profile.gender} />
            <InfoRow label="Date of Birth" value={formatDate(profile.dob)} />
            <InfoRow label="Blood Group" value={profile.blood_group} />
            <InfoRow label="Religion" value={profile.religion} />
            <InfoRow label="Father's Name" value={profile.fathers_name} />
            <InfoRow label="Mother's Name" value={profile.mothers_name} />
          </div>
          <div>
            <InfoRow 
              label="Emergency Contact" 
              value={profile.emergency_contact 
                ? `${profile.emergency_contact.substring(0, 5)}*****` 
                : 'N/A'} 
            />
            <InfoRow 
              label="National ID (NID)" 
              value={profile.nid 
                ? `${profile.nid.substring(0, 4)}*****` 
                : 'N/A'} 
            />
            <InfoRow label="Full Address" value={profile.address} isLast />
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
