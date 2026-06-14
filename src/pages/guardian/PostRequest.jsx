import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Check, MapPin, BookOpen, Clock, DollarSign, Phone, GraduationCap, Users, X, Plus } from 'lucide-react';

const CITIES = ['Dhaka', 'Chattogram', 'Rajshahi', 'Sylhet', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh'];

const LOCATIONS_BY_CITY = {
  Dhaka: ['Uttara', 'Mirpur', 'Gulshan', 'Banani', 'Dhanmondi', 'Mohammadpur', 'Badda', 'Khilgaon', 'Motijheel', 'Shahbagh', 'Farmgate', 'Wari', 'Lalbagh', 'Old Dhaka', 'Bashundhara', 'Rampura', 'Malibagh', 'Mogbazar'],
  Chattogram: ['GEC Circle', 'Halishahar', 'Nasirabad', 'Agrabad', 'Khulshi', 'Chawkbazar', 'Chandgaon', 'Patenga', 'Lalkhan Bazar', 'Double Mooring'],
  Rajshahi: ['Motihar', 'Boalia', 'Kazihata', 'Shaheb Bazar', 'Sopura', 'Talaimari', 'Rajshahi University'],
  Sylhet: ['Zindabazar', 'Shibgonj', 'Amberkhana', 'Uposahar', 'Kumarpara', 'Pathantula', 'Sylhet Sadar'],
  Khulna: ['Boyra', 'Khalishpur', 'Daulatpur', 'Sonadanga', 'Gollamari', 'Rupsha'],
  Barishal: ['Sadar Road', 'Natullabad', 'Rupatali', 'BM College', 'C&B Road'],
  Rangpur: ['Lalbagh', 'Modern Mor', 'Medical Mor', 'Jahaz Mor', 'Dhap'],
  Mymensingh: ['Ganginar Par', 'Charpara', 'Kewatkhali', 'Valuka', 'Sadar']
};

const PRESET_COURSES = ['Play', 'Nursery', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'SSC', 'HSC', 'Class 11', 'Class 12', 'O Level', 'A Level', 'Admission Test'];
const SALARY_RANGES = ['Negotiable', '2000 - 4000 BDT', '4000 - 6000 BDT', '6000 - 8000 BDT', '8000 - 10000 BDT', '10000 - 15000 BDT', '15000+ BDT'];

const GROUPS = ['Science', 'Business Studies', 'Humanities'];

const SUBJECTS_BY_GROUP = {
  'Class 9-10': {
    'Science': ['Bangla', 'English', 'Math', 'Higher Math', 'Physics', 'Chemistry', 'Biology', 'BGS', 'Islam', 'ICT'],
    'Business Studies': ['Bangla', 'English', 'Math', 'ICT', 'Accounting', 'Finance', 'Business Entrepreneurship', 'Science', 'Agriculture'],
    'Humanities': ['Bangla', 'English', 'Math', 'ICT', 'Civics', 'History', 'Geography', 'Science', 'Agriculture']
  },
  'Class 11-12': {
    'Science': ['Bangla', 'English', 'Higher Math', 'ICT', 'Physics', 'Chemistry', 'Biology'],
    'Business Studies': ['Bangla', 'English', 'ICT', 'Accounting', 'Finance', 'Business Organization and Management', 'Statistics', 'Geography', 'Marketing', 'Economics'],
    'Humanities': ['Bangla', 'English', 'ICT', 'Social Work', 'Social Welfare', 'History', 'Statistics', 'Geography', 'Marketing', 'Economics']
  }
};
const DEFAULT_SUBJECTS = ['Math', 'English', 'Bangla', 'Science', 'Religion', 'BGS', 'ICT', 'Drawing', 'General Knowledge'];

const ALL_SUBJECTS_SET = new Set([
  ...DEFAULT_SUBJECTS,
  ...Object.values(SUBJECTS_BY_GROUP['Class 9-10']).flat(),
  ...Object.values(SUBJECTS_BY_GROUP['Class 11-12']).flat()
]);
const ALL_SUBJECTS = Array.from(ALL_SUBJECTS_SET).sort();

const PostRequest = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const suggestionsRef = useRef(null);
  
  const [studentClass, setStudentClass] = useState('');
  const [studentGroup, setStudentGroup] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjectInput, setSubjectInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [guardianWhatsapp, setGuardianWhatsapp] = useState(profile?.phone_number || '');
  const [salaryRange, setSalaryRange] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState('3');
  
  // Requirements matching fields
  const [preferredGender, setPreferredGender] = useState('Any');
  const [preferredUniversity, setPreferredUniversity] = useState('Any');
  const [tutoringMode, setTutoringMode] = useState('Home Tutoring');
  const [tutoringTime, setTutoringTime] = useState('Negotiable');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const requiresGroup = ['Class 9', 'Class 10', 'SSC', 'Class 11', 'Class 12', 'HSC'].includes(studentClass);
  const groupLevel = ['Class 9', 'Class 10', 'SSC'].includes(studentClass) ? 'Class 9-10' : 
                     ['Class 11', 'Class 12', 'HSC'].includes(studentClass) ? 'Class 11-12' : null;

  // Clear group and subjects when class changes fundamentally
  const handleClassChange = (e) => {
    const newClass = e.target.value;
    setStudentClass(newClass);
    if (!['Class 9', 'Class 10', 'SSC', 'Class 11', 'Class 12', 'HSC'].includes(newClass)) {
      setStudentGroup('');
    }
    setSelectedSubjects([]);
  };

  const handleGroupChange = (e) => {
    setStudentGroup(e.target.value);
    setSelectedSubjects([]); // Reset subjects when group changes
  };

  let suggestedSubjects = [];
  if (requiresGroup && studentGroup && groupLevel) {
    suggestedSubjects = SUBJECTS_BY_GROUP[groupLevel][studentGroup] || [];
  } else if (!requiresGroup && studentClass) {
    suggestedSubjects = DEFAULT_SUBJECTS;
  }

  const unselectedSuggested = suggestedSubjects.filter(s => !selectedSubjects.includes(s));
  
  const autocompleteSuggestions = subjectInput.trim() === '' 
    ? [] 
    : ALL_SUBJECTS.filter(s => s.toLowerCase().includes(subjectInput.toLowerCase()) && !selectedSubjects.includes(s));

  const addSubject = (subject) => {
    const trimmed = subject.trim();
    if (trimmed && !selectedSubjects.includes(trimmed)) {
      setSelectedSubjects([...selectedSubjects, trimmed]);
    }
    setSubjectInput('');
    setShowSuggestions(false);
  };

  const removeSubject = (subject) => {
    setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (subjectInput.trim()) {
        addSubject(subjectInput);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!studentClass || selectedSubjects.length === 0 || !selectedCity || !selectedArea || !guardianWhatsapp) {
      setError('Please fill out all required fields and select at least one subject.');
      return;
    }
    
    if (requiresGroup && !studentGroup) {
      setError('Please select a group for the selected class.');
      return;
    }

    setLoading(true);
    const locationStr = `${selectedArea}, ${selectedCity}`;
    
    // Optional: Append group to class string so tutors know the group
    const classStr = requiresGroup ? `${studentClass} (${studentGroup})` : studentClass;

    try {
      const { error: insertError } = await supabase.from('tuition_requests').insert([{
        guardian_id: profile.id,
        student_class: classStr,
        subject: selectedSubjects,
        location: locationStr,
        guardian_whatsapp: guardianWhatsapp,
        salary_range: salaryRange,
        days_per_week: parseInt(daysPerWeek) || 3,
        preferred_gender: preferredGender,
        preferred_university: preferredUniversity,
        tutoring_mode: tutoringMode,
        tutoring_time: tutoringTime
      }]);

      if (insertError) {
        throw insertError;
      }

      setShowSuccessModal(true);
    } catch (err) {
      console.error("Supabase Insert Error:", err);
      setError(err.message || 'An unexpected error occurred while posting.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-8 mt-8 font-sans">
      
      <div className="mb-8 border-b border-slate-100 pb-6">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Post a Tuition Requirement</h2>
        <p className="text-slate-500 text-sm mt-1">Provide clear details to attract the best tutors for your child.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-bold mb-6 border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Class & Group Grid */}
        <div className={`grid gap-6 ${requiresGroup ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Student Class */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <GraduationCap className="w-4 h-4 text-[#86c240]" />
              Student Class <span className="text-red-500">*</span>
            </label>
            <select 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium"
              value={studentClass}
              onChange={handleClassChange}
              required
            >
              <option value="">Select a Class / Level</option>
              {PRESET_COURSES.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>

          {/* Student Group (Conditional) */}
          {requiresGroup && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Users className="w-4 h-4 text-[#86c240]" />
                Group / Background <span className="text-red-500">*</span>
              </label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium"
                value={studentGroup}
                onChange={handleGroupChange}
                required
              >
                <option value="">Select Group</option>
                {GROUPS.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Subjects Dynamic Section */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
          <label className="flex items-center justify-between text-sm font-bold text-slate-700 mb-3">
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#86c240]" />
              Subjects Needed <span className="text-red-500">*</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">
              {selectedSubjects.length} selected
            </span>
          </label>

          {/* Pre-defined Class/Group Suggestions Grid */}
          {studentClass && (!requiresGroup || (requiresGroup && studentGroup)) && unselectedSuggested.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-slate-400 font-bold mb-2 uppercase tracking-wider">Suggested for {requiresGroup ? `${studentClass} - ${studentGroup}` : studentClass}</p>
              <div className="flex flex-wrap gap-2">
                {unselectedSuggested.map(subject => (
                  <button
                    type="button"
                    key={subject}
                    onClick={() => addSubject(subject)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:border-[#86c240] hover:text-[#86c240] transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3 h-3" /> {subject}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Typeable Input with Selected Pills */}
          <div className="relative" ref={suggestionsRef}>
            <div className="min-h-[52px] p-2 bg-white border border-slate-200 focus-within:border-[#86c240] focus-within:ring-4 focus-within:ring-[#86c240]/10 rounded-xl transition-all flex flex-wrap gap-2 items-center cursor-text"
                 onClick={() => document.getElementById('subject-input')?.focus()}
            >
              {selectedSubjects.map(subject => (
                <span key={subject} className="px-3 py-1.5 bg-[#86c240] text-white text-sm font-bold rounded-lg flex items-center gap-2 shadow-sm animate-in zoom-in-95 duration-200">
                  {subject}
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeSubject(subject); }} className="hover:bg-white/20 rounded-full p-0.5 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              <input
                id="subject-input"
                type="text"
                className="flex-1 min-w-[150px] bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-medium text-slate-800 p-1 placeholder:text-slate-400"
                placeholder={selectedSubjects.length === 0 ? "Type and press enter, or select from above..." : "Add another subject..."}
                value={subjectInput}
                onChange={(e) => {
                  setSubjectInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={handleInputKeyDown}
                onFocus={() => setShowSuggestions(true)}
              />
            </div>

            {/* Autocomplete Dropdown */}
            {showSuggestions && autocompleteSuggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 shadow-xl rounded-xl max-h-48 overflow-y-auto z-50 py-2 animate-in slide-in-from-top-2 duration-200">
                {autocompleteSuggestions.map(subject => (
                  <button
                    type="button"
                    key={subject}
                    onClick={() => addSubject(subject)}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#86c240]/10 hover:text-[#86c240] transition-colors"
                  >
                    {subject}
                  </button>
                ))}
              </div>
            )}
            
            {showSuggestions && subjectInput.trim() !== '' && autocompleteSuggestions.length === 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 shadow-xl rounded-xl p-3 z-50 text-center animate-in slide-in-from-top-2 duration-200">
                <p className="text-sm font-medium text-slate-600 mb-2">"{subjectInput}" not found.</p>
                <button
                  type="button"
                  onClick={() => addSubject(subjectInput)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 mx-auto"
                >
                  <Plus className="w-3 h-3" /> Add Custom Subject
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Location Dropdowns */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <MapPin className="w-4 h-4 text-[#86c240]" />
              City <span className="text-red-500">*</span>
            </label>
            <select 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium"
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setSelectedArea(''); // Reset area when city changes
              }}
              required
            >
              <option value="">Select City</option>
              {CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <MapPin className="w-4 h-4 text-[#86c240]" />
              Area <span className="text-red-500">*</span>
            </label>
            <select 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              disabled={!selectedCity}
              required
            >
              <option value="">Select Area</option>
              {selectedCity && LOCATIONS_BY_CITY[selectedCity]?.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>

        {/* WhatsApp & Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <Phone className="w-4 h-4 text-[#86c240]" />
              WhatsApp Number <span className="text-red-500">*</span>
            </label>
            <input 
              type="tel" 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium"
              value={guardianWhatsapp} 
              required 
              onChange={e => setGuardianWhatsapp(e.target.value)} 
              placeholder="e.g. 018XXXXXXXX"
            />
            <p className="text-[11px] text-slate-400 font-bold mt-1 ml-1">Hidden from tutors until assigned.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <DollarSign className="w-4 h-4 text-[#86c240]" />
                Salary Range
              </label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
              >
                <option value="">Select Range</option>
                {SALARY_RANGES.map(range => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Clock className="w-4 h-4 text-[#86c240]" />
                Days / Week
              </label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium text-center"
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                  <option key={num} value={num}>{num} Days</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tutor Preferences Section */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tutor Preferences & Mode</h4>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Users className="w-4 h-4 text-[#86c240]" />
                Preferred Tutor Gender
              </label>
              <select 
                value={preferredGender}
                onChange={e => setPreferredGender(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium"
              >
                <option value="Any">Any</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <GraduationCap className="w-4 h-4 text-[#86c240]" />
                Preferred University
              </label>
              <input 
                type="text"
                placeholder="e.g. BUET, DU, Any"
                value={preferredUniversity}
                onChange={e => setPreferredUniversity(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Clock className="w-4 h-4 text-[#86c240]" />
                Tutoring Time
              </label>
              <input 
                type="text"
                placeholder="e.g. 4:00 PM, Negotiable"
                value={tutoringTime}
                onChange={e => setTutoringTime(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium"
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Users className="w-4 h-4 text-[#86c240]" />
                Tutoring Mode
              </label>
              <select 
                value={tutoringMode}
                onChange={e => setTutoringMode(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium"
              >
                <option value="Home Tutoring">Home Tutoring</option>
                <option value="Online Tutoring">Online Tutoring</option>
                <option value="Group Tutoring">Group Tutoring</option>
              </select>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold py-4 rounded-xl shadow-md transition-colors mt-4 flex items-center justify-center gap-2"
        >
          {loading ? 'Posting...' : 'Post Tuition Requirement'}
        </button>
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-[#86c240]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-[#86c240]" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Success!</h3>
            <p className="text-slate-500 font-medium mb-8">Your tuition requirement has been posted successfully.</p>
            <button 
              onClick={() => navigate('/guardian/dashboard')}
              className="w-full bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold py-3.5 rounded-xl shadow-md transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostRequest;
