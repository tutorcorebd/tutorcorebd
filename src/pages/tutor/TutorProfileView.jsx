import { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { Link } from 'react-router-dom';
import { Download, Eye, Calendar, Phone, User, Droplet, Moon, CreditCard, MapPin, Edit } from 'lucide-react';

const VerifiedBadge = ({ size = 16, position = 'top' }) => (
  <span className="group relative inline-block cursor-help select-none">
    <svg 
      className="inline-block text-[#86c240] fill-current shrink-0 ml-1.5 align-middle" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
    </svg>
    
    <span className={`pointer-events-none absolute ${
      position === 'bottom' 
        ? 'top-full mt-2' 
        : 'bottom-full mb-2'
    } left-1/2 -translate-x-1/2 w-60 bg-slate-900 text-white text-[11px] font-medium leading-relaxed p-3 rounded-xl shadow-xl border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[99] text-center normal-case tracking-normal`}>
      Accounts with a verified badge have been authenticated and can be Tutor Core Verified subscribers or notable persons or brands.
      <span className={`absolute ${
        position === 'bottom'
          ? 'bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-900'
          : 'top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900'
      }`}></span>
    </span>
  </span>
);

const TutorProfileView = () => {
  const { profile } = useAuthStore();
  
  const userInitial = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U';
  const shortId = profile?.id ? profile.id.substring(0, 6).toUpperCase() : '------';
  const tp = profile?.tutor_profile || {};
  const completeness = tp.profile_completeness || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-[#eaf4df] bg-blue-500 flex items-center justify-center text-white text-3xl font-black shadow-sm overflow-hidden">
                {tp.photo_url ? (
                  <img src={tp.photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  userInitial
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-slate-100 text-[10px] font-bold text-slate-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span> {completeness}%
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-1.5">
                {profile?.full_name || 'Tushar'}
                {profile?.tutor_profile?.is_verified && <VerifiedBadge size={20} />}
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">User ID : A{shortId}</p>
              <div className="flex gap-1 mt-2 text-slate-200">
                ★ ★ ★ ★ ★
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Link 
              to={`/tutor/${profile?.id}`}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Eye className="w-4 h-4" /> View As Parent
            </Link>
            {profile?.tutor_profile?.cv_url && (
              <a 
                href={profile.tutor_profile.cv_url} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-[#86c240] hover:bg-[#6a9c31] text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Download CV
              </a>
            )}
          </div>
        </div>

        {/* Progress Bar & Update Profile Link */}
        <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-4">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#86c240] rounded-full transition-all duration-1000" style={{ width: `${completeness}%` }}></div>
          </div>
          <span className="text-xs font-bold text-slate-400">{completeness}%</span>
          <Link to="/tutor/profile/update" className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-[#86c240] ml-4 transition-colors">
            <Edit className="w-4 h-4" /> Update profile
          </Link>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 relative overflow-hidden">
        <div className="absolute left-0 top-12 bottom-12 w-1.5 bg-[#86c240] rounded-r-full"></div>
        <h3 className="text-lg font-bold text-slate-800 mb-6 pl-2">Personal Information</h3>
        
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6 pl-2">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">{tp.dob || 'N/A'}</div>
              <div className="text-[10px] font-semibold text-slate-400">Date Of Birth</div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">{profile?.phone_number || 'N/A'}</div>
              <div className="text-[10px] font-semibold text-slate-400">Phone</div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">{tp.gender || 'N/A'}</div>
              <div className="text-[10px] font-semibold text-slate-400">Gender</div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">{tp.blood_group || 'N/A'}</div>
              <div className="text-[10px] font-semibold text-slate-400">Blood Group</div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">{tp.religion || 'N/A'}</div>
              <div className="text-[10px] font-semibold text-slate-400">Religion</div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">{tp.nid || 'N/A'}</div>
              <div className="text-[10px] font-semibold text-slate-400">NID NO</div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 relative overflow-hidden">
        <div className="absolute left-0 top-12 bottom-12 w-1.5 bg-[#86c240] rounded-r-full"></div>
        <h3 className="text-lg font-bold text-slate-800 mb-6 pl-2">Location Information</h3>
        
        <div className="grid sm:grid-cols-2 gap-y-8 gap-x-6 pl-2">
          <div>
            <div className="text-[10px] font-semibold text-slate-400 mb-2">Present Location</div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-sm font-bold text-slate-800">{tp.living_location || tp.address || 'N/A'}</div>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-400 mb-2">Permanent Location</div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-sm font-bold text-slate-800">{tp.address || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TutorProfileView;
