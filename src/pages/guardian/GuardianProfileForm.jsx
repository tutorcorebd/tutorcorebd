import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  MapPin, 
  User, 
  Briefcase,
  Users,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Phone,
  Home
} from 'lucide-react';

const CITIES = ['Barishal', 'Chattogram', 'Dhaka', 'Khulna', 'Mymensingh', 'Rajshahi', 'Rangpur', 'Sylhet'];

const GuardianProfileForm = () => {
  const { user, profile, fetchProfile } = useAuthStore();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(1);

  // Step 1: Personal Details
  const [alternativePhone, setAlternativePhone] = useState('');
  const [profession, setProfession] = useState('');
  const [numberOfChildren, setNumberOfChildren] = useState('');

  // Step 2: Address
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  // Step 3: Photo
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', completeness: 0 });
  const [errorMsg, setErrorMsg] = useState('');

  const calculateCompleteness = () => {
    let score = 20; // Base score for signing up
    if (alternativePhone && profession) score += 30;
    if (city && address) score += 30;
    if (numberOfChildren) score += 10;
    if (photoUrl || photoFile) score += 10;
    return Math.min(100, score);
  };

  const completeness = calculateCompleteness();

  useEffect(() => {
    if (profile?.guardian_profile) {
      const gp = profile.guardian_profile;
      setAlternativePhone(gp.alternative_phone || '');
      setProfession(gp.profession || '');
      setNumberOfChildren(gp.number_of_children || '');
      setCity(gp.city || '');
      setAddress(gp.address || '');
      setPhotoUrl(gp.profile_photo_url || '');
    }
  }, [profile]);

  const handleSaveData = async (e, customMessage = 'Profile information saved successfully.') => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      let finalPhotoUrl = photoUrl;

      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}-guardian-photo-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('cvs') // using existing bucket for simplicity, could be 'avatars'
          .upload(fileName, photoFile, { upsert: true });
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('cvs').getPublicUrl(fileName);
        finalPhotoUrl = publicUrl;
        setPhotoUrl(publicUrl);
        setPhotoFile(null);
      }

      const nextCompleteness = calculateCompleteness();

      // Upsert logic (checking if exists first)
      const { data: existing } = await supabase
        .from('guardian_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      let dbError;
      if (existing) {
        const { error } = await supabase
          .from('guardian_profiles')
          .update({
            alternative_phone: alternativePhone,
            profession,
            number_of_children: numberOfChildren,
            city,
            address,
            profile_photo_url: finalPhotoUrl,
            profile_completeness: nextCompleteness
          })
          .eq('user_id', user.id);
        dbError = error;
      } else {
        const { error } = await supabase
          .from('guardian_profiles')
          .insert([{
            user_id: user.id,
            alternative_phone: alternativePhone,
            profession,
            number_of_children: numberOfChildren,
            city,
            address,
            profile_photo_url: finalPhotoUrl,
            profile_completeness: nextCompleteness
          }]);
        dbError = error;
      }

      if (dbError) throw dbError;

      await fetchProfile(user);

      setToast({
        visible: true,
        message: customMessage,
        completeness: nextCompleteness
      });

      setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
      }, 4000);

    } catch (err) {
      console.error(err);
      setErrorMsg(`Failed to save: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    await handleSaveData(null, `Step ${activeStep} saved successfully.`);
    if (activeStep < 3) {
      setActiveStep(activeStep + 1);
    } else {
      navigate('/guardian/dashboard');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative font-sans">
      
      {toast.visible && (
        <div className="fixed top-6 right-6 bg-white border border-slate-100 rounded-2xl shadow-xl p-4 pr-10 z-50 flex items-start gap-3 animate-in slide-in-from-top-10 duration-300 max-w-sm">
          <CheckCircle2 className="w-5 h-5 text-[#86c240] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-slate-800 leading-normal">{toast.message}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Now your profile is {toast.completeness}% done.</p>
          </div>
          <button 
            onClick={() => setToast(prev => ({ ...prev, visible: false }))}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 focus:outline-none"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-auto">
          <h3 className="font-extrabold text-slate-800 text-sm">Profile Completeness</h3>
          <p className="text-slate-450 text-[11px] font-semibold">Complete your profile to build trust with tutors.</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-2/3">
          <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#86c240] h-full rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${completeness}%` }}
            ></div>
          </div>
          <span className="text-xl font-black text-[#86c240]">{completeness}%</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden min-h-[400px]">
        <div className="flex flex-col lg:flex-row">
          
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-64 bg-slate-50/50 border-r border-slate-100 p-6 flex flex-col gap-2">
            {[
              { num: 1, title: 'Personal Details', icon: User },
              { num: 2, title: 'Address & City', icon: MapPin },
              { num: 3, title: 'Profile Photo', icon: ImageIcon }
            ].map(step => (
              <button 
                key={step.num}
                onClick={() => setActiveStep(step.num)}
                className={`w-full flex items-center gap-4 text-left relative py-3 px-4 rounded-xl outline-none transition-all ${
                  activeStep === step.num ? 'bg-white shadow-sm border border-slate-200' : 'hover:bg-slate-100/50 text-slate-500'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-colors ${
                  activeStep === step.num ? 'bg-[#86c240] text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {step.num}
                </div>
                <div className="flex-1">
                  <h4 className={`text-xs font-bold ${activeStep === step.num ? 'text-slate-800' : 'text-slate-600'}`}>{step.title}</h4>
                </div>
              </button>
            ))}
          </div>

          {/* Form Area */}
          <div className="flex-1 p-8 lg:p-10">
            {errorMsg && (
              <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-bold mb-6 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errorMsg}
              </div>
            )}

            {/* Step 1 */}
            {activeStep === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#86c240]" />
                  Personal Information
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-2 block">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                      value={profile?.full_name || ''} 
                      disabled
                    />
                    <p className="text-[10px] text-slate-400 font-bold mt-1">To change your name, go to Settings.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                        <Phone className="w-4 h-4 text-[#86c240]" />
                        Primary Phone
                      </label>
                      <input 
                        type="text" 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                        value={profile?.phone_number || ''} 
                        disabled
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        Alternative Phone
                      </label>
                      <input 
                        type="text" 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium"
                        value={alternativePhone} 
                        onChange={e => setAlternativePhone(e.target.value)} 
                        placeholder="e.g. 017XXXXXXXX"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                        <Briefcase className="w-4 h-4 text-[#86c240]" />
                        Profession
                      </label>
                      <input 
                        type="text" 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium"
                        value={profession} 
                        onChange={e => setProfession(e.target.value)} 
                        placeholder="e.g. Engineer, Business, Service"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                        <Users className="w-4 h-4 text-[#86c240]" />
                        Number of Children
                      </label>
                      <select 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium"
                        value={numberOfChildren}
                        onChange={(e) => setNumberOfChildren(e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4+">4+</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {activeStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#86c240]" />
                  Address Details
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                      <MapPin className="w-4 h-4 text-[#86c240]" />
                      City
                    </label>
                    <select 
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    >
                      <option value="">Select City</option>
                      {CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                      <Home className="w-4 h-4 text-[#86c240]" />
                      Full Address
                    </label>
                    <textarea 
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium min-h-[120px]"
                      value={address} 
                      onChange={e => setAddress(e.target.value)} 
                      placeholder="e.g. House 12, Road 4, Dhanmondi"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {activeStep === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#86c240]" />
                  Profile Photo
                </h3>
                
                <div className="space-y-6">
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                    {(photoUrl || photoFile) ? (
                      <div className="flex flex-col items-center">
                        <img 
                          src={photoFile ? URL.createObjectURL(photoFile) : photoUrl} 
                          alt="Profile Preview" 
                          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg mb-4"
                        />
                        <button 
                          onClick={() => { setPhotoFile(null); setPhotoUrl(''); }}
                          className="text-red-500 text-xs font-bold hover:underline"
                        >
                          Remove Photo
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="w-16 h-16 bg-white border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                          <User className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-600 mb-1">Upload a professional photo</p>
                        <p className="text-xs text-slate-400 mb-4">PNG, JPG up to 2MB</p>
                        <input 
                          type="file" 
                          id="photo-upload" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => setPhotoFile(e.target.files[0])}
                        />
                        <label 
                          htmlFor="photo-upload" 
                          className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer hover:border-[#86c240] hover:text-[#86c240] transition-colors inline-block"
                        >
                          Choose File
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer Navigation */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100">
              <button 
                onClick={() => activeStep > 1 && setActiveStep(activeStep - 1)}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${activeStep > 1 ? 'text-slate-500 bg-slate-50 hover:bg-slate-100' : 'opacity-0 cursor-default'}`}
                disabled={activeStep === 1}
              >
                Back
              </button>
              
              <button 
                onClick={handleNextStep}
                disabled={loading}
                className="bg-[#86c240] hover:bg-[#6a9c31] text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center gap-2"
              >
                {loading ? 'Saving...' : activeStep === 3 ? 'Finish & Save' : 'Save & Continue'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default GuardianProfileForm;
