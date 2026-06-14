import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Download, Calendar, Phone, User, Droplet, Moon, MapPin, GraduationCap, BookOpen, Award, CheckCircle, ArrowLeft } from 'lucide-react';
import CustomAlert from '../../components/layout/CustomAlert';

const PublicTutorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tutorData, setTutorData] = useState(null);
  const [loading, setLoading] = useState(true);

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
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] text-slate-400 font-bold text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#86c240] mr-3"></div>
        Loading profile...
      </div>
    );
  }

  if (!tutorData) return null;

  const profile = tutorData.tutor_profiles?.[0] || {};
  const userInitial = tutorData.full_name ? tutorData.full_name.charAt(0).toUpperCase() : 'T';
  const shortId = tutorData.id ? tutorData.id.substring(0, 6).toUpperCase() : '------';

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Top Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-[#eaf4df] bg-slate-900 flex items-center justify-center text-white text-3xl font-black shadow-sm">
                {userInitial}
              </div>
              {profile.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-100 text-[#86c240]">
                  <CheckCircle className="w-5 h-5 fill-current text-white text-[#86c240]" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-800">{tutorData.full_name}</h2>
                {profile.is_verified && (
                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Tutor ID : T{shortId}</p>
              <div className="flex gap-1 mt-2 text-slate-200">
                ★ ★ ★ ★ ★
              </div>
            </div>
          </div>
          
          {profile.cv_url && (
            <a 
              href={profile.cv_url} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-[#86c240] hover:bg-[#6a9c31] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#86c240]/10"
            >
              <Download className="w-4 h-4" /> Download CV
            </a>
          )}
        </div>

        {profile.bio && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">About Me</h4>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">{profile.bio}</p>
          </div>
        )}
      </div>

      {/* Tuitions Preferences & Details */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Tuition Info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 relative overflow-hidden">
          <div className="absolute left-0 top-12 bottom-12 w-1.5 bg-[#86c240] rounded-r-full"></div>
          <h3 className="text-lg font-bold text-slate-800 mb-6 pl-2 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#86c240]" /> Tuition Details
          </h3>
          
          <div className="space-y-4 pl-2 text-sm font-medium text-slate-600">
            <div>
              <span className="text-xs text-slate-400 font-bold block mb-1">PREFERRED SUBJECTS</span>
              <p className="text-slate-800">{profile.preferred_subjects?.join(', ') || 'N/A'}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold block mb-1">PREFERRED CLASSES</span>
              <p className="text-slate-800">{profile.preferred_courses?.join(', ') || 'N/A'}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold block mb-1">PREFERRED LOCATIONS</span>
              <p className="text-slate-800">{profile.preferred_locations?.join(', ') || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400 font-bold block mb-1">EXPECTED SALARY</span>
                <p className="text-slate-800 font-bold">{profile.expected_salary || 'Negotiable'}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold block mb-1">TEACHING METHOD</span>
                <p className="text-slate-800">{profile.teaching_method || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Educational Background */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 relative overflow-hidden">
          <div className="absolute left-0 top-12 bottom-12 w-1.5 bg-[#86c240] rounded-r-full"></div>
          <h3 className="text-lg font-bold text-slate-800 mb-6 pl-2 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#86c240]" /> Education Info
          </h3>
          
          <div className="space-y-4 pl-2 text-sm font-medium text-slate-600">
            {profile.university && (
              <div>
                <span className="text-xs text-slate-400 font-bold block mb-1">UNIVERSITY (GRADUATION)</span>
                <p className="text-slate-800 font-bold">{profile.university}</p>
                <p className="text-xs text-slate-500">{profile.department} {profile.grad_gpa && `• CGPA: ${profile.grad_gpa}`} {profile.grad_year && `• Year: ${profile.grad_year}`}</p>
              </div>
            )}
            
            {profile.post_grad_university && (
              <div>
                <span className="text-xs text-slate-400 font-bold block mb-1">POST GRADUATION</span>
                <p className="text-slate-800 font-bold">{profile.post_grad_university}</p>
                <p className="text-xs text-slate-500">{profile.post_grad_department} {profile.post_grad_gpa && `• CGPA: ${profile.post_grad_gpa}`} {profile.post_grad_year && `• Year: ${profile.post_grad_year}`}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {profile.college_name && (
                <div>
                  <span className="text-xs text-slate-400 font-bold block mb-1">COLLEGE / HSC</span>
                  <p className="text-slate-800 font-bold">{profile.college_name}</p>
                  <p className="text-xs text-slate-500">{profile.college_group} • GPA: {profile.college_gpa}</p>
                </div>
              )}
              {profile.school_name && (
                <div>
                  <span className="text-xs text-slate-400 font-bold block mb-1">SCHOOL / SSC</span>
                  <p className="text-slate-800 font-bold">{profile.school_name}</p>
                  <p className="text-xs text-slate-500">{profile.school_group} • GPA: {profile.school_gpa}</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 relative overflow-hidden">
        <div className="absolute left-0 top-12 bottom-12 w-1.5 bg-[#86c240] rounded-r-full"></div>
        <h3 className="text-lg font-bold text-slate-800 mb-6 pl-2">General Info</h3>
        
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6 pl-2">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">{profile.gender || 'N/A'}</div>
              <div className="text-[10px] font-semibold text-slate-400">Gender</div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">{profile.current_city || 'N/A'}</div>
              <div className="text-[10px] font-semibold text-slate-400">Current City</div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">{profile.experience || 'N/A'}</div>
              <div className="text-[10px] font-semibold text-slate-400">Experience</div>
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
