import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, MapPin, BookOpen, Clock, DollarSign, Phone, GraduationCap, Users, X, Plus, AlertTriangle, Layers } from 'lucide-react';

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

const TUTORING_TIMES = [
  'Negotiable',
  'Morning (8:00 AM - 12:00 PM)',
  'Afternoon (12:00 PM - 4:00 PM)',
  'Evening (4:00 PM - 8:00 PM)',
  'Night (8:00 PM - 11:00 PM)'
];

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

const EditRequest = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const suggestionsRef = useRef(null);
  const univRef = useRef(null);
  
  // Single child states (legacy)
  const [studentClass, setStudentClass] = useState('');
  const [studentGroup, setStudentGroup] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjectInput, setSubjectInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Multi-children states
  const [isMultiChild, setIsMultiChild] = useState(false);
  const [childrenList, setChildrenList] = useState([
    { id: 1, studentClass: '', studentGroup: '', selectedSubjects: [], subjectInput: '', showSuggestions: false },
    { id: 2, studentClass: '', studentGroup: '', selectedSubjects: [], subjectInput: '', showSuggestions: false }
  ]);

  // Location details
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [guardianWhatsapp, setGuardianWhatsapp] = useState('');
  
  // Salary details
  const [salaryType, setSalaryType] = useState('range'); // 'range' | 'fixed'
  const [salaryRange, setSalaryRange] = useState(''); // for standard range
  const [salaryAmount, setSalaryAmount] = useState(''); // for fixed custom number
  const [salaryFrequency, setSalaryFrequency] = useState('Month'); // 'Month' | 'Week' | 'Day'
  const [daysCount, setDaysCount] = useState('3'); // days for frequency
  const [daysPerWeek, setDaysPerWeek] = useState('3'); // legacy days per week
  
  // Requirements matching fields
  const [preferredGender, setPreferredGender] = useState('Any');
  const [preferredUniversity, setPreferredUniversity] = useState('Any');
  const [univSearch, setUnivSearch] = useState('Any');
  const [showUnivSuggestions, setShowUnivSuggestions] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  
  const [tutoringMode, setTutoringMode] = useState('Home Tutoring');
  const [tutoringTimeType, setTutoringTimeType] = useState('standard'); // 'standard' | 'custom'
  const [tutoringTime, setTutoringTime] = useState('Negotiable'); // standard time selection
  const [customTutoringTime, setCustomTutoringTime] = useState(''); // custom text input
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (univRef.current && !univRef.current.contains(event.target)) {
        setShowUnivSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch institutions on load
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const { data, error } = await supabase
          .from('institutions')
          .select('*')
          .order('name', { ascending: true });
        if (error) throw error;
        setInstitutions(data || []);
      } catch (err) {
        console.error("Error fetching institutions:", err);
      }
    };
    fetchInstitutions();
  }, []);

  // Load existing tuition request details
  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error: fetchErr } = await supabase
          .from('tuition_requests')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchErr) throw fetchErr;

        // Populate location
        if (data.location) {
          const locParts = data.location.split(', ');
          setSelectedArea(locParts[0] || '');
          setSelectedCity(locParts[1] || '');
        }
        setFullAddress(data.full_address || '');
        setGuardianWhatsapp(data.guardian_whatsapp || '');

        // Populate salary details
        setSalaryType(data.salary_type || 'range');
        if (data.salary_type === 'fixed') {
          setSalaryAmount(data.salary_amount?.toString() || '');
          setSalaryFrequency(data.salary_frequency || 'Month');
          setDaysCount(data.days_count?.toString() || '3');
        } else {
          setSalaryRange(data.salary_range || '');
          setDaysPerWeek(data.days_per_week?.toString() || '3');
        }

        // Populate requirements
        setPreferredGender(data.preferred_gender || 'Any');
        setPreferredUniversity(data.preferred_university || 'Any');
        setUnivSearch(data.preferred_university || 'Any');
        setTutoringMode(data.tutoring_mode || 'Home Tutoring');

        // Tutoring time
        if (TUTORING_TIMES.includes(data.tutoring_time)) {
          setTutoringTimeType('standard');
          setTutoringTime(data.tutoring_time || 'Negotiable');
        } else {
          setTutoringTimeType('custom');
          setCustomTutoringTime(data.tutoring_time || '');
        }

        // Check if multiple children exists
        if (data.children && Array.isArray(data.children) && data.children.length > 0) {
          setIsMultiChild(true);
          setChildrenList(data.children.map((c, i) => ({
            id: i + 1,
            studentClass: c.student_class || '',
            studentGroup: c.student_group || '',
            selectedSubjects: c.subject || [],
            subjectInput: '',
            showSuggestions: false
          })));
        } else {
          setIsMultiChild(false);
          // Parse Class and Group e.g. "Class 9 (Science)"
          const classMatch = data.student_class.match(/^(.*?)(?: \((.*?)\))?$/);
          setStudentClass(classMatch ? classMatch[1] : data.student_class);
          setStudentGroup(classMatch && classMatch[2] ? classMatch[2] : '');
          setSelectedSubjects(data.subject || []);
        }
      } catch (err) {
        console.error("Error loading tuition request:", err);
        setError("Failed to load tuition request details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRequest();
  }, [id]);

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

  // Helper methods to update specific child state
  const updateChild = (id, fields) => {
    setChildrenList(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c));
  };

  const handleChildClassChange = (child, newClass) => {
    const reqGroup = ['Class 9', 'Class 10', 'SSC', 'Class 11', 'Class 12', 'HSC'].includes(newClass);
    updateChild(child.id, {
      studentClass: newClass,
      studentGroup: reqGroup ? child.studentGroup : '',
      selectedSubjects: []
    });
  };

  const addChild = () => {
    setChildrenList(prev => [...prev, {
      id: Date.now(),
      studentClass: '',
      studentGroup: '',
      selectedSubjects: [],
      subjectInput: '',
      showSuggestions: false
    }]);
  };

  const removeChild = (id) => {
    if (childrenList.length > 1) {
      setChildrenList(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleMultiChildToggle = (checked) => {
    setIsMultiChild(checked);
    if (checked) {
      // populate first child from single states, keep second one empty
      setChildrenList([
        {
          id: Date.now(),
          studentClass: studentClass,
          studentGroup: studentGroup,
          selectedSubjects: [...selectedSubjects],
          subjectInput: '',
          showSuggestions: false
        },
        {
          id: Date.now() + 1,
          studentClass: '',
          studentGroup: '',
          selectedSubjects: [],
          subjectInput: '',
          showSuggestions: false
        }
      ]);
    } else {
      // restore single child states from first child
      if (childrenList.length > 0) {
        setStudentClass(childrenList[0].studentClass);
        setStudentGroup(childrenList[0].studentGroup);
        setSelectedSubjects(childrenList[0].selectedSubjects);
      }
    }
  };

  // Autocomplete suggestions for University
  const filteredUnivs = univSearch.trim().toLowerCase() === 'any' || univSearch.trim() === ''
    ? institutions
    : institutions.filter(univ => univ.name.toLowerCase().includes(univSearch.toLowerCase()));

  const handleSelectUniv = (name) => {
    setPreferredUniversity(name);
    setUnivSearch(name);
    setShowUnivSuggestions(false);
  };

  const handleAddCustomUniv = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const existing = institutions.find(i => i.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      handleSelectUniv(existing.name);
      return;
    }

    try {
      const { data, error: insertErr } = await supabase
        .from('institutions')
        .insert([{ name: trimmed, status: 'pending' }])
        .select();

      if (insertErr) {
        handleSelectUniv(trimmed);
        return;
      }

      if (data && data[0]) {
        setInstitutions(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
        handleSelectUniv(data[0].name);
      } else {
        handleSelectUniv(trimmed);
      }
    } catch (err) {
      console.error("Error inserting custom university:", err);
      handleSelectUniv(trimmed);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedCity || !selectedArea || !guardianWhatsapp) {
      setError('Please fill out all location fields and WhatsApp number.');
      return;
    }

    if (isMultiChild) {
      for (let i = 0; i < childrenList.length; i++) {
        const c = childrenList[i];
        if (!c.studentClass || c.selectedSubjects.length === 0) {
          setError(`Please fill class and subjects for Child #${i + 1}.`);
          return;
        }
        const childRequiresGroup = ['Class 9', 'Class 10', 'SSC', 'Class 11', 'Class 12', 'HSC'].includes(c.studentClass);
        if (childRequiresGroup && !c.studentGroup) {
          setError(`Please select group for Child #${i + 1}.`);
          return;
        }
      }
    } else {
      if (!studentClass || selectedSubjects.length === 0) {
        setError('Please select a class and at least one subject.');
        return;
      }
      if (requiresGroup && !studentGroup) {
        setError('Please select a group for the class.');
        return;
      }
    }

    if (salaryType === 'fixed') {
      if (!salaryAmount || parseFloat(salaryAmount) <= 0) {
        setError('Please enter a valid salary amount.');
        return;
      }
      if (!daysCount || parseInt(daysCount) <= 0) {
        setError('Please enter number of tutoring days.');
        return;
      }
    } else {
      if (!salaryRange) {
        setError('Please select a salary range.');
        return;
      }
    }

    setSaving(true);
    const locationStr = `${selectedArea}, ${selectedCity}`;

    // University auditing / custom flag verification
    let finalUniv = preferredUniversity;
    let hasCustomInstitution = false;

    if (univSearch.trim() !== '' && univSearch.trim().toLowerCase() !== 'any') {
      const existing = institutions.find(i => i.name.toLowerCase() === univSearch.trim().toLowerCase());
      if (existing) {
        finalUniv = existing.name;
        if (existing.status === 'pending') {
          hasCustomInstitution = true;
        }
      } else {
        // Insert custom
        try {
          const { data, error: insertErr } = await supabase
            .from('institutions')
            .insert([{ name: univSearch.trim(), status: 'pending' }])
            .select();
          if (!insertErr && data && data[0]) {
            finalUniv = data[0].name;
            setInstitutions(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
          } else {
            finalUniv = univSearch.trim();
          }
          hasCustomInstitution = true;
        } catch (err) {
          console.error("Error saving custom university:", err);
          finalUniv = univSearch.trim();
          hasCustomInstitution = true;
        }
      }
    } else {
      finalUniv = 'Any';
    }

    // Salary formatting
    let salaryRangeStr = '';
    if (salaryType === 'fixed') {
      salaryRangeStr = `${salaryAmount} BDT / ${salaryFrequency} (${daysCount} Days)`;
    } else {
      salaryRangeStr = salaryRange;
    }

    // Tutoring time
    const finalTutoringTime = tutoringTimeType === 'custom' ? customTutoringTime : tutoringTime;
    if (tutoringTimeType === 'custom' && !customTutoringTime.trim()) {
      setError('Please write custom tutoring time details.');
      setSaving(false);
      return;
    }

    // Class string construction & Subject combination mapping (legacy)
    let classStr = '';
    let combinedSubjects = [];
    if (isMultiChild) {
      classStr = childrenList.map(c => {
        const reqGroup = ['Class 9', 'Class 10', 'SSC', 'Class 11', 'Class 12', 'HSC'].includes(c.studentClass);
        return reqGroup && c.studentGroup ? `${c.studentClass} (${c.studentGroup})` : c.studentClass;
      }).join(', ');
      combinedSubjects = Array.from(new Set(childrenList.flatMap(c => c.selectedSubjects)));
    } else {
      classStr = requiresGroup ? `${studentClass} (${studentGroup})` : studentClass;
      combinedSubjects = selectedSubjects;
    }

    try {
      let query = supabase
        .from('tuition_requests')
        .update({
          student_class: classStr,
          subject: combinedSubjects,
          location: locationStr,
          full_address: fullAddress || null,
          guardian_whatsapp: guardianWhatsapp,
          salary_range: salaryRangeStr,
          salary_type: salaryType,
          salary_amount: salaryType === 'fixed' ? parseFloat(salaryAmount) : null,
          salary_frequency: salaryType === 'fixed' ? salaryFrequency : null,
          days_count: salaryType === 'fixed' ? parseInt(daysCount) : null,
          days_per_week: salaryType === 'fixed' ? (parseInt(daysCount) || 3) : (parseInt(daysPerWeek) || 3),
          preferred_gender: preferredGender,
          preferred_university: finalUniv,
          has_custom_institution: hasCustomInstitution,
          tutoring_mode: tutoringMode,
          tutoring_time: finalTutoringTime,
          children: isMultiChild ? childrenList.map(c => ({
            student_class: c.studentClass,
            student_group: c.studentGroup || null,
            subject: c.selectedSubjects
          })) : null
        })
        .eq('id', id);

      if (profile.role !== 'admin') {
        query = query.eq('guardian_id', profile.id); // Ensure ownership
      }

      const { error: updateError } = await query;

      if (updateError) throw updateError;

      setShowSuccessModal(true);
    } catch (err) {
      console.error("Supabase Update Error:", err);
      setError(err.message || 'An unexpected error occurred while updating.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-20 font-bold text-slate-500">Loading request details...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-8 mt-8 font-sans">
      
      <div className="mb-8 border-b border-slate-100 pb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Modify Tuition Requirement</h2>
          <p className="text-slate-500 text-sm mt-1">Update details for your previously posted requirement.</p>
        </div>
        <button onClick={() => navigate('/guardian/dashboard')} className="text-sm font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl transition-colors">
          Cancel
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-bold mb-6 border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Toggle option for multiple children */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#86c240]/10 flex items-center justify-center text-[#86c240]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Tutor for multiple children</h4>
              <p className="text-xs text-slate-500">Need tutor for more than one class or subject configuration?</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={isMultiChild} 
              onChange={e => handleMultiChildToggle(e.target.checked)} 
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#86c240]"></div>
          </label>
        </div>

        {/* Dynamic multiple children lists vs single child details */}
        {isMultiChild ? (
          <div className="space-y-6">
            {childrenList.map((child, index) => {
              const childRequiresGroup = ['Class 9', 'Class 10', 'SSC', 'Class 11', 'Class 12', 'HSC'].includes(child.studentClass);
              const childGroupLevel = ['Class 9', 'Class 10', 'SSC'].includes(child.studentClass) ? 'Class 9-10' : 
                                      ['Class 11', 'Class 12', 'HSC'].includes(child.studentClass) ? 'Class 11-12' : null;

              let childSuggested = [];
              if (childRequiresGroup && child.studentGroup && childGroupLevel) {
                childSuggested = SUBJECTS_BY_GROUP[childGroupLevel][child.studentGroup] || [];
              } else if (!childRequiresGroup && child.studentClass) {
                childSuggested = DEFAULT_SUBJECTS;
              }
              const childUnselectedSuggested = childSuggested.filter(s => !child.selectedSubjects.includes(s));
              const childAutocomplete = child.subjectInput.trim() === ''
                ? []
                : ALL_SUBJECTS.filter(s => s.toLowerCase().includes(child.subjectInput.toLowerCase()) && !child.selectedSubjects.includes(s));

              return (
                <div key={child.id} className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 relative shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-sm text-[#86c240] flex items-center gap-1.5">
                      <span>👶</span> Child #{index + 1} details
                    </h3>
                    {childrenList.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeChild(child.id)}
                        className="text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors font-bold"
                      >
                        Remove Child
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-655 mb-1.5">Student Class *</label>
                      <select
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] text-xs font-medium"
                        value={child.studentClass}
                        onChange={(e) => handleChildClassChange(child, e.target.value)}
                        required
                      >
                        <option value="">Select Class</option>
                        {PRESET_COURSES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {childRequiresGroup && (
                      <div>
                        <label className="block text-xs font-bold text-slate-655 mb-1.5">Group *</label>
                        <select
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] text-xs font-medium"
                          value={child.studentGroup}
                          onChange={(e) => updateChild(child.id, { studentGroup: e.target.value, selectedSubjects: [] })}
                          required
                        >
                          <option value="">Select Group</option>
                          {GROUPS.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Child Subjects Autocomplete */}
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
                    <label className="flex items-center justify-between text-xs font-bold text-slate-655">
                      <span>Subjects Needed *</span>
                      <span className="text-[10px] text-slate-400 bg-white border px-2 py-0.5 rounded-full">{child.selectedSubjects.length} selected</span>
                    </label>

                    {child.studentClass && (!childRequiresGroup || (childRequiresGroup && child.studentGroup)) && childUnselectedSuggested.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold">Suggested Subjects:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {childUnselectedSuggested.map(s => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => {
                                updateChild(child.id, {
                                  selectedSubjects: [...child.selectedSubjects, s],
                                  subjectInput: '',
                                  showSuggestions: false
                                });
                              }}
                              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-600 hover:border-[#86c240] hover:text-[#86c240] font-bold flex items-center gap-1"
                            >
                              <Plus className="w-2.5 h-2.5" /> {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      <div className="min-h-[44px] p-1.5 bg-white border border-slate-200 focus-within:border-[#86c240] rounded-xl flex flex-wrap gap-1.5 items-center cursor-text"
                           onClick={() => document.getElementById(`child-subject-${child.id}`)?.focus()}
                      >
                        {child.selectedSubjects.map(s => (
                          <span key={s} className="px-2.5 py-1 bg-[#86c240] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 animate-in zoom-in-95">
                            {s}
                            <button 
                              type="button" 
                              onClick={(e) => {
                                e.stopPropagation();
                                updateChild(child.id, { selectedSubjects: child.selectedSubjects.filter(item => item !== s) });
                              }} 
                              className="hover:bg-white/20 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <input
                          id={`child-subject-${child.id}`}
                          type="text"
                          className="flex-1 min-w-[120px] bg-transparent border-none focus:outline-none focus:ring-0 text-xs font-semibold text-slate-800 p-1 placeholder:text-slate-400"
                          placeholder={child.selectedSubjects.length === 0 ? "Type and press Enter or select..." : "Add subject..."}
                          value={child.subjectInput}
                          onChange={(e) => updateChild(child.id, { subjectInput: e.target.value, showSuggestions: true })}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter') {
                              ev.preventDefault();
                              if (child.subjectInput.trim() && !child.selectedSubjects.includes(child.subjectInput.trim())) {
                                updateChild(child.id, {
                                  selectedSubjects: [...child.selectedSubjects, child.subjectInput.trim()],
                                  subjectInput: '',
                                  showSuggestions: false
                                });
                              }
                            }
                          }}
                          onFocus={() => updateChild(child.id, { showSuggestions: true })}
                        />
                      </div>

                      {child.showSuggestions && childAutocomplete.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-100 shadow-xl rounded-xl max-h-36 overflow-y-auto z-40 py-1">
                          {childAutocomplete.map(s => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => {
                                updateChild(child.id, {
                                  selectedSubjects: [...child.selectedSubjects, s],
                                  subjectInput: '',
                                  showSuggestions: false
                                });
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-[#86c240]/10 hover:text-[#86c240] transition-colors"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}

                      {child.showSuggestions && child.subjectInput.trim() !== '' && childAutocomplete.length === 0 && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-100 shadow-xl rounded-xl p-2 z-40 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              updateChild(child.id, {
                                  selectedSubjects: [...child.selectedSubjects, child.subjectInput.trim()],
                                  subjectInput: '',
                                  showSuggestions: false
                                });
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <Plus className="w-2.5 h-2.5" /> Add "{child.subjectInput.trim()}"
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={addChild}
              className="w-full py-3 border-2 border-dashed border-[#86c240]/40 hover:border-[#86c240] text-[#86c240] rounded-2xl flex items-center justify-center gap-2 font-bold text-sm bg-[#86c240]/5 hover:bg-[#86c240]/10 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Another Child
            </button>
          </div>
        ) : (
          /* Single Child Layout */
          <div className="space-y-6">
            <div className={`grid gap-6 ${requiresGroup ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
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

              {studentClass && (!requiresGroup || (requiresGroup && studentGroup)) && unselectedSuggested.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-400 font-bold mb-2">Suggested for {requiresGroup ? `${studentClass} - ${studentGroup}` : studentClass}</p>
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
                    placeholder={selectedSubjects.length === 0 ? "Type and press enter..." : "Add another subject..."}
                    value={subjectInput}
                    onChange={(e) => {
                      setSubjectInput(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onKeyDown={handleInputKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                  />
                </div>

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
          </div>
        )}

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
                setSelectedArea(''); // Reset area
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

        {/* Detailed Address Textbox */}
        {selectedCity && selectedArea && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <MapPin className="w-4 h-4 text-[#86c240]" />
              Detailed Location / Address
            </label>
            <input 
              type="text" 
              placeholder="e.g. House 45, Road 12, Sector 3, Near Mosque"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium text-sm"
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
            />
          </div>
        )}

        {/* WhatsApp & Salary */}
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

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <DollarSign className="w-4 h-4 text-[#86c240]" />
                Salary Type
              </label>
              <select
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium"
                value={salaryType}
                onChange={(e) => setSalaryType(e.target.value)}
              >
                <option value="range">Salary Range</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            {salaryType === 'range' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-655 mb-2">
                    Salary Range
                  </label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium text-xs"
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
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-655 mb-2">
                    Days / Week
                  </label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium text-center text-xs"
                    value={daysPerWeek}
                    onChange={(e) => setDaysPerWeek(e.target.value)}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                      <option key={num} value={num}>{num} Days</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50 space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 mb-1">Amount (BDT)</label>
                    <input 
                      type="number"
                      placeholder="e.g. 7000"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-[#86c240]"
                      value={salaryAmount}
                      onChange={e => setSalaryAmount(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 mb-1">Frequency</label>
                    <select
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-[#86c240]"
                      value={salaryFrequency}
                      onChange={e => setSalaryFrequency(e.target.value)}
                    >
                      <option value="Month">per Month</option>
                      <option value="Week">per Week</option>
                      <option value="Day">per Day</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 mb-1">Days</label>
                    <input 
                      type="number"
                      placeholder="3"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center focus:outline-[#86c240]"
                      value={daysCount}
                      onChange={e => setDaysCount(e.target.value)}
                    />
                  </div>
                </div>

                {salaryFrequency === 'Month' && daysCount && parseInt(daysCount) < 8 && (
                  <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl text-amber-700 text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>💡 Recommend at least 8 days for monthly tutoring.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tutor Preferences Section */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-6">
          <h4 className="text-xs font-bold text-slate-400">Tutor Preferences & Mode</h4>
          
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
            
            {/* Preferred University Database Autocomplete */}
            <div className="relative" ref={univRef}>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <GraduationCap className="w-4 h-4 text-[#86c240]" />
                Preferred University
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium text-sm"
                  placeholder="Search university or type custom..."
                  value={univSearch}
                  onChange={(e) => {
                    setUnivSearch(e.target.value);
                    setShowUnivSuggestions(true);
                  }}
                  onFocus={() => setShowUnivSuggestions(true)}
                />
                
                {showUnivSuggestions && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-150 shadow-2xl rounded-2xl max-h-56 overflow-y-auto z-50 py-2">
                    <button
                      type="button"
                      onClick={() => handleSelectUniv('Any')}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-750 font-bold hover:bg-slate-50"
                    >
                      Any
                    </button>
                    {filteredUnivs.map(univ => (
                      <button
                        type="button"
                        key={univ.id}
                        onClick={() => handleSelectUniv(univ.name)}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors font-semibold flex justify-between items-center"
                      >
                        <span>{univ.name}</span>
                        {univ.status === 'pending' && (
                          <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100 font-bold">Pending Review</span>
                        )}
                      </button>
                    ))}
                    
                    {univSearch.trim() !== '' && univSearch.trim().toLowerCase() !== 'any' && !institutions.some(i => i.name.toLowerCase() === univSearch.trim().toLowerCase()) && (
                      <div className="p-2 border-t border-slate-50 text-center">
                        <button
                          type="button"
                          onClick={() => handleAddCustomUniv(univSearch)}
                          className="bg-[#86c240]/10 hover:bg-[#86c240]/20 text-[#86c240] text-[11px] font-black px-4 py-2 rounded-xl transition-all"
                        >
                          + Add "{univSearch}" as custom institution
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Clock className="w-4 h-4 text-[#86c240]" />
                Tutoring Time
              </label>
              
              <div className="space-y-3">
                <select
                  value={tutoringTimeType}
                  onChange={e => setTutoringTimeType(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium"
                >
                  <option value="standard">Select Shift (Standard)</option>
                  <option value="custom">Enter Custom Time</option>
                </select>

                {tutoringTimeType === 'standard' ? (
                  <select 
                    value={tutoringTime}
                    onChange={e => setTutoringTime(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-850 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium"
                  >
                    {TUTORING_TIMES.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text"
                    placeholder="e.g. 5:30 PM - 7:00 PM"
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-semibold text-sm animate-in fade-in duration-200"
                    value={customTutoringTime}
                    onChange={e => setCustomTutoringTime(e.target.value)}
                    required
                  />
                )}
              </div>
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
          disabled={saving}
          className="w-full bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold py-4 rounded-xl shadow-md transition-colors mt-4 flex items-center justify-center gap-2"
        >
          {saving ? 'Saving Updates...' : 'Update Tuition Requirement'}
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
            <p className="text-slate-500 font-medium mb-8">Your tuition requirement has been updated successfully.</p>
            <button 
              onClick={() => navigate(profile?.role === 'admin' ? '/admin/requests' : '/guardian/dashboard')}
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

export default EditRequest;
