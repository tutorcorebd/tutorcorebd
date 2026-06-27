import useAuthStore from '../../store/useAuthStore';
import { Link } from 'react-router-dom';
import { Download, Eye, Calendar, Phone, User, Droplet, Moon, CreditCard, MapPin, Edit, Star } from 'lucide-react';
import VerifiedBadge from '../../components/common/VerifiedBadge';

const TutorProfileView = () => {
  const { profile } = useAuthStore();
  
  const userInitial = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U';
  const shortId = profile?.id ? profile.id.substring(0, 6).toUpperCase() : '------';
  const tp = profile?.tutor_profile || {};
  const completeness = tp.profile_completeness || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-[#eaf4df] bg-blue-500 flex items-center justify-center text-white text-4xl font-black shadow-sm overflow-hidden">
                {tp.photo_url ? (
                  <img src={tp.photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  userInitial
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-sm border border-slate-100 text-xs font-bold text-slate-600 flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span> {completeness}%
              </div>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-1.5">
                {profile?.full_name || 'Tushar'}
                {profile?.tutor_profile?.is_verified && <VerifiedBadge size={22} />}
              </h2>
              <p className="text-sm font-semibold text-slate-400 mt-1">User ID : A{shortId}</p>
              <div className="flex gap-0.5 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < (tp.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <Link 
              to={`/tutor/${profile?.id}`}
              className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Eye className="w-4 h-4" /> View As Parent
            </Link>
            {profile?.tutor_profile?.cv_url && (
              <a 
                href={profile.tutor_profile.cv_url} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-[#86c240] hover:bg-[#6a9c31] text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Download CV
              </a>
            )}
          </div>
        </div>

        {/* Progress Bar & Update Profile Link */}
        <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#86c240] rounded-full transition-all duration-1000" style={{ width: `${completeness}%` }}></div>
          </div>
          <span className="text-sm font-bold text-slate-400">{completeness}%</span>
          <Link to="/tutor/profile/update" className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-[#86c240] ml-0 sm:ml-4 transition-colors">
            <Edit className="w-4 h-4" /> Update profile
          </Link>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 relative overflow-hidden">
        <div className="absolute left-0 top-12 bottom-12 w-1.5 bg-[#86c240] rounded-r-full"></div>
        <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 pl-3">Personal Information</h3>
        
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6 pl-3">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-800">{tp.dob || 'N/A'}</div>
              <div className="text-xs font-semibold text-slate-400">Date Of Birth</div>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-800">{profile?.phone_number || 'N/A'}</div>
              <div className="text-xs font-semibold text-slate-400">Phone</div>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-800">{tp.gender || 'N/A'}</div>
              <div className="text-xs font-semibold text-slate-400">Gender</div>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-800">{tp.blood_group || 'N/A'}</div>
              <div className="text-xs font-semibold text-slate-400">Blood Group</div>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-800">{tp.religion || 'N/A'}</div>
              <div className="text-xs font-semibold text-slate-400">Religion</div>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-800">{tp.nid || 'N/A'}</div>
              <div className="text-xs font-semibold text-slate-400">NID NO</div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 relative overflow-hidden">
        <div className="absolute left-0 top-12 bottom-12 w-1.5 bg-[#86c240] rounded-r-full"></div>
        <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 pl-3">Location Information</h3>
        
        <div className="grid sm:grid-cols-2 gap-y-8 gap-x-6 pl-3">
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2">Present Location</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-base font-bold text-slate-800">{tp.living_location || tp.address || 'N/A'}</div>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2">Permanent Location</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-base font-bold text-slate-800">{tp.address || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TutorProfileView;
