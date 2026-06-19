import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Check, 
  MapPin, 
  BookOpen, 
  User, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  AlertCircle,
  Clock,
  Briefcase,
  DollarSign,
  GraduationCap,
  Calendar,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';

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

const PRESET_SUBJECTS = ['Math', 'Physics', 'Chemistry', 'Biology', 'English', 'Bangla', 'ICT', 'General Science', 'Accounting', 'Finance', 'General Math', 'Higher Math', 'Management', 'Economics', 'Sociology', 'Civics', 'History', 'Geography', 'Religion', 'Agriculture', 'Statistics'];
const PRESET_COURSES = ['Play', 'Nursery', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'SSC', 'HSC', 'O Level', 'A Level', 'Admission Test'];
const PRESET_CATEGORIES = ['Bangla Medium', 'English Medium', 'English Version', 'Madrasah Medium', 'Cambridge Curriculum', 'Edexcel Curriculum'];
const PRESET_EXPERIENCE = ['1 Year', '2 Year(s)', '3 Year(s)', '4 Year(s)', '5 Year(s)', '5+ Year(s)'];
const PRESET_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PRESET_METHODS = ['Home Tutoring', 'Online Tutoring', 'Group Tutoring'];
const PRESET_GROUPS = ['Science', 'Commerce', 'Humanities', 'General'];
const PRESET_CURRICULUMS = ['National Curriculum (Bangla)', 'National Curriculum (English)', 'Cambridge', 'Edexcel'];
const PRESET_BOARDS = ['Dhaka', 'Chattogram', 'Rajshahi', 'Sylhet', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh', 'Comilla', 'Jessore', 'Dinajpur', 'Madrasah', 'Technical'];

const UNIVERSITIES = [
  'Dhaka University (DU)',
  'Bangladesh University of Engineering and Technology (BUET)',
  'Jahangirnagar University (JU)',
  'Chittagong University (CU)',
  'Rajshahi University (RU)',
  'North South University (NSU)',
  'BRAC University',
  'East West University (EWU)',
  'American International University-Bangladesh (AIUB)',
  'Independent University, Bangladesh (IUB)',
  'Ahsanullah University of Science and Technology (AUST)',
  'Shahjalal University of Science and Technology (SUST)',
  'Khulna University of Engineering & Technology (KUET)',
  'Chittagong University of Engineering & Technology (CUET)',
  'Rajshahi University of Engineering & Technology (RUET)',
  'Mymensingh Engineering College',
  'Jagannath University',
  'National University'
];

const DEPARTMENTS = [
  'Computer Science and Engineering (CSE)',
  'Electrical and Electronic Engineering (EEE)',
  'Civil Engineering (CE)',
  'Mechanical Engineering (ME)',
  'Industrial and Production Engineering (IPE)',
  'Chemical Engineering',
  'Textile Engineering',
  'Architecture',
  'Business Administration (BBA)',
  'Accounting & Information Systems (AIS)',
  'Finance',
  'Marketing',
  'Management',
  'English',
  'Bangla',
  'Physics',
  'Chemistry',
  'Mathematics',
  'Statistics',
  'Economics',
  'Pharmacy',
  'Biochemistry and Molecular Biology',
  'Microbiology',
  'Biotechnology and Genetic Engineering',
  'MBBS / BDS (Medical)',
  'Law',
  'Sociology',
  'Political Science',
  'Public Administration',
  'International Relations (IR)',
  'History',
  'Journalism and Media Studies'
];

const TutorProfileForm = () => {
  const { user, profile, fetchProfile } = useAuthStore();
  const navigate = useNavigate();

  // Active step coordinates
  const [activeMainStep, setActiveMainStep] = useState(1);
  const [activeSubStep, setActiveSubStep] = useState(1);

  // --- FORM FIELD STATES ---
  // Step 1: Tutoring Info -> Location
  const [city, setCity] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [livingLocation, setLivingLocation] = useState('');
  const [preferredLocations, setPreferredLocations] = useState([]);
  const [locationInput, setLocationInput] = useState('');
  const [showLocSuggestions, setShowLocSuggestions] = useState(false);

  // Step 1: Tutoring Info -> Tutoring Category
  const [preferredCategory, setPreferredCategory] = useState('');
  const [preferredCourses, setPreferredCourses] = useState([]);
  const [preferredSubjects, setPreferredSubjects] = useState([]);
  const [experience, setExperience] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCoursesDropdown, setShowCoursesDropdown] = useState(false);
  const [showSubjectsDropdown, setShowSubjectsDropdown] = useState(false);

  // Step 1: Tutoring Info -> Availability
  const [availableDays, setAvailableDays] = useState([]);
  const [teachingMethods, setTeachingMethods] = useState([]);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableTo, setAvailableTo] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [showDaysDropdown, setShowDaysDropdown] = useState(false);
  const [showMethodsDropdown, setShowMethodsDropdown] = useState(false);

  // Step 2: Education Info -> School
  const [schoolName, setSchoolName] = useState('');
  const [schoolGroup, setSchoolGroup] = useState('');
  const [schoolCurriculum, setSchoolCurriculum] = useState('');
  const [schoolBoard, setSchoolBoard] = useState('');
  const [schoolGpa, setSchoolGpa] = useState('');
  const [schoolYear, setSchoolYear] = useState('');

  // Step 2: Education Info -> College
  const [collegeName, setCollegeName] = useState('');
  const [collegeGroup, setCollegeGroup] = useState('');
  const [collegeCurriculum, setCollegeCurriculum] = useState('');
  const [collegeBoard, setCollegeBoard] = useState('');
  const [collegeGpa, setCollegeGpa] = useState('');
  const [collegeYear, setCollegeYear] = useState('');

  // Step 2: Education Info -> Graduation
  const [isHscStudent, setIsHscStudent] = useState(false);
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [gradGpa, setGradGpa] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [showUnivDropdown, setShowUnivDropdown] = useState(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  // Step 2: Education Info -> Post Graduation
  const [postGradUniversity, setPostGradUniversity] = useState('');
  const [postGradDepartment, setPostGradDepartment] = useState('');
  const [postGradGpa, setPostGradGpa] = useState('');
  const [postGradYear, setPostGradYear] = useState('');
  const [showPgUnivDropdown, setShowPgUnivDropdown] = useState(false);
  const [showPgDeptDropdown, setShowPgDeptDropdown] = useState(false);

  // Step 3: Personal Information
  const [gender, setGender] = useState('');
  const [fathersName, setFathersName] = useState('');
  const [mothersName, setMothersName] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRel, setEmergencyContactRel] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactAdditional, setEmergencyContactAdditional] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [nid, setNid] = useState('');
  const [dob, setDob] = useState('');

  // Step 4: Credential
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [existingCvUrl, setExistingCvUrl] = useState('');
  const [cvOption, setCvOption] = useState('upload'); // 'upload' or 'link'
  const [cvLinkInput, setCvLinkInput] = useState('');
  const [aboutYourself, setAboutYourself] = useState('');
  const [reasonsForHiring, setReasonsForHiring] = useState('');
  const [tuitionExperienceDetails, setTuitionExperienceDetails] = useState('');
  const [personalMotivation, setPersonalMotivation] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', completeness: 0 });
  const [errorMsg, setErrorMsg] = useState('');

  // Refs for click outside
  const cityRef = useRef(null);
  const locRef = useRef(null);
  const categoryRef = useRef(null);
  const coursesRef = useRef(null);
  const subjectsRef = useRef(null);
  const daysRef = useRef(null);
  const univRef = useRef(null);
  const deptRef = useRef(null);
  const pgUnivRef = useRef(null);
  const pgDeptRef = useRef(null);
  const methodsRef = useRef(null);

  // --- DYNAMIC PROGRESS CALCULATION ---
  const calculateCompleteness = () => {
    let score = 20; // Base registration complete (Name, Phone, Email, Role)

    // 1. Location (5%): city, livingLocation, and preferredLocations (at least 1)
    const hasLocation = city && livingLocation && preferredLocations && preferredLocations.length > 0;
    if (hasLocation) score += 5;

    // 2. Tutoring Category (5%): category, courses (at least 1), subjects (at least 1), experience
    const hasCategory = preferredCategory && preferredCourses && preferredCourses.length > 0 && preferredSubjects && preferredSubjects.length > 0 && experience;
    if (hasCategory) score += 5;

    // 3. School (5%)
    const hasSchool = schoolName && schoolGroup && schoolCurriculum && schoolBoard && schoolGpa && schoolYear;
    if (hasSchool) score += 5;

    // 4. College (5%)
    const hasCollege = collegeName && collegeGroup && collegeCurriculum && collegeBoard && collegeGpa && collegeYear;
    if (hasCollege) score += 5;

    // 5. Graduation (5%)
    const hasGrad = isHscStudent || (university && department && gradGpa && gradYear);
    if (hasGrad) score += 5;

    // 6. Post Graduation (5%)
    const hasPostGrad = isHscStudent || (postGradUniversity && postGradDepartment && postGradGpa && postGradYear);
    if (hasPostGrad) score += 5;

    // 7. Personal Information (40%)
    const hasPersonalInfo = gender && fathersName && mothersName && emergencyContactName && emergencyContactRel && emergencyContactPhone && address && nid && dob && facebookLink;
    if (hasPersonalInfo) score += 40;

    // 8. Credential (10%)
    // Profile picture is completely optional, so CV alone completes Step 4.
    const hasCv = cvFile || existingCvUrl || (cvOption === 'link' && cvLinkInput.trim() !== '');
    const hasAboutMe = aboutYourself.length >= 50 && reasonsForHiring && tuitionExperienceDetails && personalMotivation;
    if (hasCv && hasAboutMe) score += 10;

    return Math.min(100, score);
  };

  const completeness = calculateCompleteness();

  // Load existing profile values on mount/profile update
  useEffect(() => {
    if (profile) {
      const tp = profile.tutor_profile;
      if (tp) {
        setCity(tp.current_city || '');
        setCityInput(tp.current_city || '');
        setPreferredLocations(tp.preferred_locations || []);
        setLivingLocation(tp.living_location || '');

        setPreferredCategory(tp.preferred_category || '');
        setPreferredCourses(tp.preferred_courses || []);
        setPreferredSubjects(tp.preferred_subjects || []);
        setExperience(tp.experience || '');

        setAvailableDays(tp.available_days || []);
        setTeachingMethods(tp.teaching_method ? tp.teaching_method.split(', ') : []);
        setAvailableFrom(tp.available_from || '');
        setAvailableTo(tp.available_to || '');
        setExpectedSalary(tp.expected_salary || '');

        setSchoolName(tp.school_name || '');
        setSchoolGroup(tp.school_group || '');
        setSchoolCurriculum(tp.school_curriculum || '');
        setSchoolBoard(tp.school_board || '');
        setSchoolGpa(tp.school_gpa || '');
        setSchoolYear(tp.school_year || '');

        setCollegeName(tp.college_name || '');
        setCollegeGroup(tp.college_group || '');
        setCollegeCurriculum(tp.college_curriculum || '');
        setCollegeBoard(tp.college_board || '');
        setCollegeGpa(tp.college_gpa || '');
        setCollegeYear(tp.college_year || '');

        setIsHscStudent(!!tp.is_hsc_student);
        setUniversity(tp.university || '');
        setDepartment(tp.department || '');
        setGradGpa(tp.grad_gpa || '');
        setGradYear(tp.grad_year || '');

        setPostGradUniversity(tp.post_grad_university || '');
        setPostGradDepartment(tp.post_grad_department || '');
        setPostGradGpa(tp.post_grad_gpa || '');
        setPostGradYear(tp.post_grad_year || '');

        setGender(tp.gender || '');
        setFathersName(tp.fathers_name || '');
        setMothersName(tp.mothers_name || '');
        setEmergencyContactName(tp.emergency_contact_name || '');
        setEmergencyContactRel(tp.emergency_contact_relationship || '');
        setEmergencyContactPhone(tp.emergency_contact_phone || '');
        setEmergencyContactAdditional(tp.emergency_contact_additional || '');
        setFacebookLink(tp.facebook_link || '');
        setLinkedinLink(tp.linkedin_link || '');
        setWhatsappNumber(tp.whatsapp_number || '');
        setAddress(tp.address || '');
        setNid(tp.nid || '');
        setDob(tp.dob || '');
        setAboutYourself(tp.about_yourself || '');
        setReasonsForHiring(tp.reasons_for_hiring || '');
        setTuitionExperienceDetails(tp.tuition_experience_details || '');
        setPersonalMotivation(tp.personal_motivation || '');

        setPhotoUrl(tp.photo_url || '');

        if (tp.cv_url) {
          const isGoogleDrive = tp.cv_url.includes('drive.google.com') || tp.cv_url.includes('docs.google.com');
          if (isGoogleDrive) {
            setCvOption('link');
            setCvLinkInput(tp.cv_url);
            setExistingCvUrl('');
          } else {
            setCvOption('upload');
            setExistingCvUrl(tp.cv_url);
            setCvLinkInput('');
          }
        }
      }
    }
  }, [profile]);

  // Click outside detection for dropdown containers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityRef.current && !cityRef.current.contains(event.target)) setShowCitySuggestions(false);
      if (locRef.current && !locRef.current.contains(event.target)) setShowLocSuggestions(false);
      if (categoryRef.current && !categoryRef.current.contains(event.target)) setShowCategoryDropdown(false);
      if (coursesRef.current && !coursesRef.current.contains(event.target)) setShowCoursesDropdown(false);
      if (subjectsRef.current && !subjectsRef.current.contains(event.target)) setShowSubjectsDropdown(false);
      if (daysRef.current && !daysRef.current.contains(event.target)) setShowDaysDropdown(false);
      if (univRef.current && !univRef.current.contains(event.target)) setShowUnivDropdown(false);
      if (deptRef.current && !deptRef.current.contains(event.target)) setShowDeptDropdown(false);
      if (pgUnivRef.current && !pgUnivRef.current.contains(event.target)) setShowPgUnivDropdown(false);
      if (pgDeptRef.current && !pgDeptRef.current.contains(event.target)) setShowPgDeptDropdown(false);
      if (methodsRef.current && !methodsRef.current.contains(event.target)) setShowMethodsDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- HANDLERS ---
  const handleSelectCity = (selectedCity) => {
    setCity(selectedCity);
    setCityInput(selectedCity);
    setShowCitySuggestions(false);
    setPreferredLocations([]);
    setLocationInput('');
  };

  const handleSelectLocation = (loc) => {
    if (!preferredLocations.includes(loc)) {
      setPreferredLocations([...preferredLocations, loc]);
    }
    setLocationInput('');
    setShowLocSuggestions(false);
  };

  const handleRemoveLocation = (loc) => {
    setPreferredLocations(preferredLocations.filter(item => item !== loc));
  };

  const handleCustomLocationAdd = (e) => {
    if (e.key === 'Enter' && locationInput.trim()) {
      e.preventDefault();
      const loc = locationInput.trim();
      if (!preferredLocations.includes(loc)) {
        setPreferredLocations([...preferredLocations, loc]);
      }
      setLocationInput('');
      setShowLocSuggestions(false);
    }
  };

  const toggleCourseSelection = (course) => {
    if (preferredCourses.includes(course)) {
      setPreferredCourses(preferredCourses.filter(c => c !== course));
    } else {
      setPreferredCourses([...preferredCourses, course]);
    }
  };

  const toggleSubjectSelection = (subject) => {
    if (preferredSubjects.includes(subject)) {
      setPreferredSubjects(preferredSubjects.filter(s => s !== subject));
    } else {
      setPreferredSubjects([...preferredSubjects, subject]);
    }
  };

  const toggleDaySelection = (day) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter(d => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const toggleMethodSelection = (method) => {
    if (teachingMethods.includes(method)) {
      setTeachingMethods(teachingMethods.filter(m => m !== method));
    } else {
      setTeachingMethods([...teachingMethods, method]);
    }
  };

  // Save changes to Supabase
  const handleSaveData = async (e, customMessage = 'Tutoring information saved successfully.') => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      let finalCvUrl = cvOption === 'link' ? cvLinkInput.trim() : existingCvUrl;
      let finalPhotoUrl = photoUrl;

      // Handle PDF CV file upload
      if (cvOption === 'upload' && cvFile) {
        const fileExt = cvFile.name.split('.').pop();
        const fileName = `${user.id}-cv-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('cvs')
          .upload(fileName, cvFile, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('cvs').getPublicUrl(fileName);
        finalCvUrl = publicUrl;
        setExistingCvUrl(publicUrl);
        setCvFile(null);
      }

      // Handle profile photo upload
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}-photo-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('cvs')
          .upload(fileName, photoFile, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('cvs').getPublicUrl(fileName);
        finalPhotoUrl = publicUrl;
        setPhotoUrl(publicUrl);
        setPhotoFile(null);
      }

      // Format education status preview string
      let formattedEduStatus = '';
      if (isHscStudent) {
        formattedEduStatus = 'Running HSC Student';
      } else if (university && department) {
        formattedEduStatus = `${department} at ${university}`;
      } else if (collegeName) {
        formattedEduStatus = `College: ${collegeName}`;
      } else if (schoolName) {
        formattedEduStatus = `School: ${schoolName}`;
      }

      // Calculate new completeness
      const nextCompleteness = calculateCompleteness();

      // Perform upsert query
      const { error } = await supabase
        .from('tutor_profiles')
        .upsert({
          user_id: user.id,
          current_city: city,
          preferred_locations: preferredLocations,
          living_location: livingLocation,
          preferred_category: preferredCategory,
          preferred_courses: preferredCourses,
          preferred_subjects: preferredSubjects,
          experience,
          available_days: availableDays,
          teaching_method: teachingMethods.join(', '),
          available_from: availableFrom,
          available_to: availableTo,
          expected_salary: expectedSalary,
          school_name: schoolName,
          school_group: schoolGroup,
          school_curriculum: schoolCurriculum,
          school_board: schoolBoard,
          school_gpa: schoolGpa,
          school_year: schoolYear,
          college_name: collegeName,
          college_group: collegeGroup,
          college_curriculum: collegeCurriculum,
          college_board: collegeBoard,
          college_gpa: collegeGpa,
          college_year: collegeYear,
          is_hsc_student: isHscStudent,
          university,
          department,
          grad_gpa: gradGpa,
          grad_year: gradYear,
          post_grad_university: postGradUniversity,
          post_grad_department: postGradDepartment,
          post_grad_gpa: postGradGpa,
          post_grad_year: postGradYear,
          gender,
          fathers_name: fathersName,
          mothers_name: mothersName,
          emergency_contact_name: emergencyContactName,
          emergency_contact_relationship: emergencyContactRel,
          emergency_contact_phone: emergencyContactPhone,
          emergency_contact_additional: emergencyContactAdditional,
          facebook_link: facebookLink,
          linkedin_link: linkedinLink,
          whatsapp_number: whatsappNumber,
          address,
          nid,
          dob,
          about_yourself: aboutYourself,
          reasons_for_hiring: reasonsForHiring,
          tuition_experience_details: tuitionExperienceDetails,
          personal_motivation: personalMotivation,
          cv_url: finalCvUrl,
          photo_url: finalPhotoUrl,
          profile_completeness: nextCompleteness,
          education_status: formattedEduStatus
        });

      if (error) throw error;

      await fetchProfile(user);

      // Trigger toast alert popup
      setToast({
        visible: true,
        message: customMessage,
        completeness: nextCompleteness
      });

      // Hide toast automatically
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
    // Save current main step data before advancing
    let sectionName = 'Tutoring details';
    if (activeMainStep === 1) sectionName = 'Tutoring information';
    if (activeMainStep === 2) sectionName = 'Education details';
    if (activeMainStep === 3) sectionName = 'Personal details';
    if (activeMainStep === 4) sectionName = 'Credentials';

    await handleSaveData(null, `${sectionName} saved successfully.`);

    // If there are more sub-steps inside the active main step
    const subStepsCount = activeMainStep === 1 ? 3 : activeMainStep === 2 ? 4 : activeMainStep === 3 ? 3 : activeMainStep === 4 ? 2 : 1;
    if (activeSubStep < subStepsCount) {
      setActiveSubStep(activeSubStep + 1);
    } else {
      // Advance to the next main step
      if (activeMainStep < 4) {
        setActiveMainStep(activeMainStep + 1);
        setActiveSubStep(1);
      } else {
        // Wizard fully completed! Redirect back to dashboard
        navigate('/tutor/dashboard');
      }
    }
  };

  const handlePrevStep = () => {
    if (activeSubStep > 1) {
      setActiveSubStep(activeSubStep - 1);
    } else {
      if (activeMainStep > 1) {
        const prevStep = activeMainStep - 1;
        const prevSubStepsCount = prevStep === 1 ? 3 : prevStep === 2 ? 4 : prevStep === 3 ? 3 : prevStep === 4 ? 2 : 1;
        setActiveMainStep(prevStep);
        setActiveSubStep(prevSubStepsCount);
      }
    }
  };

  // Helper selectors
  const filteredCities = CITIES.filter(c => c.toLowerCase().includes(cityInput.toLowerCase()));
  const cityLocations = LOCATIONS_BY_CITY[city] || [];
  const filteredLocations = cityLocations.filter(loc =>
    loc.toLowerCase().includes(locationInput.toLowerCase()) && !preferredLocations.includes(loc)
  );

  const getSubStepName = (mainStep, subStep) => {
    if (mainStep === 1) {
      if (subStep === 1) return 'Location 5%';
      if (subStep === 2) return 'Tutoring Category 5%';
      return 'Availability';
    }
    if (mainStep === 2) {
      if (subStep === 1) return 'School 5%';
      if (subStep === 2) return 'College 5%';
      if (subStep === 3) return 'Graduation 5%';
      return 'Post Graduation 5%';
    }
    if (mainStep === 3) {
      if (subStep === 1) return 'Personal Info 20%';
      if (subStep === 2) return 'Emergency Contact 10%';
      return 'Social Media 10%';
    }
    return 'Credentials 10%';
  };

  return (
    <div className="max-w-6xl mx-auto px-2 py-4 relative font-sans">
      
      {/* Toast Alert overlay matching screenshot 5 */}
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

      {/* Main Container Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 mb-6 shadow-sm flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs font-semibold">
          <span className="font-extrabold text-amber-900">Notice:</span> After completing your profile to at least <span className="font-black text-[#86c240]">80%</span>, you can apply for the tuition jobs.
        </div>
      </div>

      {/* Top Wizard Steps (1-4 Main Indicators) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          
          {/* Main Step 1 */}
          <button 
            onClick={() => { setActiveMainStep(1); setActiveSubStep(1); }}
            className="flex items-center gap-3 flex-1 z-10 text-left hover:opacity-80 transition-opacity focus:outline-none cursor-pointer"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-colors duration-300 ${activeMainStep >= 1 ? 'bg-[#86c240] text-white' : 'bg-slate-100 text-slate-450'}`}>
              {activeMainStep > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Tutoring Information</div>
              <div className="text-[10px] text-slate-450 font-bold">10% Completed</div>
            </div>
          </button>
          
          <div className={`hidden md:block h-[3px] flex-1 -mx-2 rounded-full transition-colors duration-300 ${activeMainStep > 1 ? 'bg-[#86c240]' : 'bg-slate-100'}`}></div>

          {/* Main Step 2 */}
          <button 
            onClick={() => { setActiveMainStep(2); setActiveSubStep(1); }}
            className="flex items-center gap-3 flex-1 z-10 text-left hover:opacity-80 transition-opacity focus:outline-none cursor-pointer"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-colors duration-300 ${activeMainStep >= 2 ? 'bg-[#86c240] text-white' : 'bg-slate-100 text-slate-450'}`}>
              {activeMainStep > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Education Information</div>
              <div className="text-[10px] text-slate-450 font-bold">20% Completed</div>
            </div>
          </button>

          <div className={`hidden md:block h-[3px] flex-1 -mx-2 rounded-full transition-colors duration-300 ${activeMainStep > 2 ? 'bg-[#86c240]' : 'bg-slate-100'}`}></div>

          {/* Main Step 3 */}
          <button 
            onClick={() => { setActiveMainStep(3); setActiveSubStep(1); }}
            className="flex items-center gap-3 flex-1 z-10 text-left hover:opacity-80 transition-opacity focus:outline-none cursor-pointer"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-colors duration-300 ${activeMainStep >= 3 ? 'bg-[#86c240] text-white' : 'bg-slate-100 text-slate-450'}`}>
              {activeMainStep > 3 ? <Check className="w-4 h-4" /> : '3'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Personal Information</div>
              <div className="text-[10px] text-slate-450 font-bold">40% Completed</div>
            </div>
          </button>

          <div className={`hidden md:block h-[3px] flex-1 -mx-2 rounded-full transition-colors duration-300 ${activeMainStep > 3 ? 'bg-[#86c240]' : 'bg-slate-100'}`}></div>

          {/* Main Step 4 */}
          <button 
            onClick={() => { setActiveMainStep(4); setActiveSubStep(1); }}
            className="flex items-center gap-3 flex-1 z-10 text-left hover:opacity-80 transition-opacity focus:outline-none cursor-pointer"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-colors duration-300 ${activeMainStep >= 4 ? 'bg-[#86c240] text-white' : 'bg-slate-100 text-slate-450'}`}>
              {activeMainStep > 4 ? <Check className="w-4 h-4" /> : '4'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Credential</div>
              <div className="text-[10px] text-slate-450 font-bold">10% Completed</div>
            </div>
          </button>

        </div>
      </div>

      {/* Real-time completeness header bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-auto">
          <h3 className="font-extrabold text-slate-800 text-sm">Real-time Profile Progress</h3>
          <p className="text-slate-450 text-[11px] font-semibold">Fill profile fields to increase completeness. Fields marked with <span className="text-red-500 font-black ml-0.5">*</span> are required.</p>
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

      {/* Main card grid layout: Left Sidebar steps + Right Form Area */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden min-h-[500px]">
        <div className="flex flex-col lg:flex-row">
          
          {/* LEFT COLUMN: Vertical Sub-Step Navigation */}
          <div className="w-full lg:w-72 bg-slate-50/50 border-r border-slate-100 p-6 flex flex-col justify-between">
            <div className="space-y-4 relative">
              <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-slate-100"></div>

              {/* Render sub-steps matching the active main step */}
              {activeMainStep === 1 && (
                <>
                  {/* Step 1 - Location */}
                  <button 
                    onClick={() => setActiveSubStep(1)}
                    className="w-full flex items-start gap-4 text-left relative py-2 outline-none group"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs z-10 transition-colors ${activeSubStep === 1 ? 'bg-[#86c240] text-white' : city && livingLocation && preferredLocations.length > 0 ? 'bg-[#eaf4df] text-[#86c240]' : 'bg-white border border-slate-200 text-slate-500'}`}>
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition-colors">Location 5%</h4>
                      <p className="text-[10px] text-slate-455 mt-0.5">Living & Preferred places</p>
                    </div>
                    {activeSubStep === 1 && (
                      <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 border-y-[10px] border-y-transparent border-r-[10px] border-r-white z-20"></div>
                    )}
                  </button>

                  {/* Step 2 - Category */}
                  <button 
                    onClick={() => setActiveSubStep(2)}
                    className="w-full flex items-start gap-4 text-left relative py-2 outline-none group"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs z-10 transition-colors ${activeSubStep === 2 ? 'bg-[#86c240] text-white' : preferredCategory && preferredCourses.length > 0 && preferredSubjects.length > 0 && experience ? 'bg-[#eaf4df] text-[#86c240]' : 'bg-white border border-slate-200 text-slate-500'}`}>
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition-colors">Tutoring Category 5%</h4>
                      <p className="text-[10px] text-slate-455 mt-0.5">Category & subjects</p>
                    </div>
                    {activeSubStep === 2 && (
                      <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 border-y-[10px] border-y-transparent border-r-[10px] border-r-white z-20"></div>
                    )}
                  </button>

                  {/* Step 3 - Availability */}
                  <button 
                    onClick={() => setActiveSubStep(3)}
                    className="w-full flex items-start gap-4 text-left relative py-2 outline-none group"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs z-10 transition-colors ${activeSubStep === 3 ? 'bg-[#86c240] text-white' : availableDays.length > 0 && teachingMethods.length > 0 && expectedSalary ? 'bg-[#eaf4df] text-[#86c240]' : 'bg-white border border-slate-200 text-slate-500'}`}>
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition-colors">Availability</h4>
                      <p className="text-[10px] text-slate-455 mt-0.5">Teaching time & salary</p>
                    </div>
                    {activeSubStep === 3 && (
                      <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 border-y-[10px] border-y-transparent border-r-[10px] border-r-white z-20"></div>
                    )}
                  </button>
                </>
              )}

              {activeMainStep === 2 && (
                <>
                  {/* School */}
                  <button 
                    onClick={() => setActiveSubStep(1)}
                    className="w-full flex items-start gap-4 text-left relative py-2 outline-none group"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs z-10 transition-colors ${activeSubStep === 1 ? 'bg-[#86c240] text-white' : schoolName && schoolGroup && schoolCurriculum && schoolBoard && schoolGpa && schoolYear ? 'bg-[#eaf4df] text-[#86c240]' : 'bg-white border border-slate-200 text-slate-500'}`}>
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition-colors">School 5%</h4>
                      <p className="text-[10px] text-slate-455 mt-0.5">School background</p>
                    </div>
                    {activeSubStep === 1 && (
                      <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 border-y-[10px] border-y-transparent border-r-[10px] border-r-white z-20"></div>
                    )}
                  </button>

                  {/* College */}
                  <button 
                    onClick={() => setActiveSubStep(2)}
                    className="w-full flex items-start gap-4 text-left relative py-2 outline-none group"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs z-10 transition-colors ${activeSubStep === 2 ? 'bg-[#86c240] text-white' : collegeName && collegeGroup && collegeCurriculum && collegeBoard && collegeGpa && collegeYear ? 'bg-[#eaf4df] text-[#86c240]' : 'bg-white border border-slate-200 text-slate-500'}`}>
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition-colors">College 5%</h4>
                      <p className="text-[10px] text-slate-455 mt-0.5">College background</p>
                    </div>
                    {activeSubStep === 2 && (
                      <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 border-y-[10px] border-y-transparent border-r-[10px] border-r-white z-20"></div>
                    )}
                  </button>

                  {/* Graduation */}
                  <button 
                    onClick={() => setActiveSubStep(3)}
                    className="w-full flex items-start gap-4 text-left relative py-2 outline-none group"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs z-10 transition-colors ${activeSubStep === 3 ? 'bg-[#86c240] text-white' : isHscStudent || (university && department && gradGpa && gradYear) ? 'bg-[#eaf4df] text-[#86c240]' : 'bg-white border border-slate-200 text-slate-500'}`}>
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition-colors">Graduation 5%</h4>
                      <p className="text-[10px] text-slate-455 mt-0.5">University details</p>
                    </div>
                    {activeSubStep === 3 && (
                      <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 border-y-[10px] border-y-transparent border-r-[10px] border-r-white z-20"></div>
                    )}
                  </button>

                  {/* Post Graduation */}
                  <button 
                    onClick={() => setActiveSubStep(4)}
                    className="w-full flex items-start gap-4 text-left relative py-2 outline-none group"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs z-10 transition-colors ${activeSubStep === 4 ? 'bg-[#86c240] text-white' : isHscStudent || (postGradUniversity && postGradDepartment && postGradGpa && postGradYear) ? 'bg-[#eaf4df] text-[#86c240]' : 'bg-white border border-slate-200 text-slate-500'}`}>
                      4
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition-colors">Post Graduation 5%</h4>
                      <p className="text-[10px] text-slate-455 mt-0.5">Master's or other degrees</p>
                    </div>
                    {activeSubStep === 4 && (
                      <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 border-y-[10px] border-y-transparent border-r-[10px] border-r-white z-20"></div>
                    )}
                  </button>
                </>
              )}

              {activeMainStep === 3 && (
                <>
                  <button 
                    onClick={() => setActiveSubStep(1)}
                    className="w-full flex items-start gap-4 text-left relative py-2 outline-none group"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs z-10 transition-colors ${activeSubStep === 1 ? 'bg-[#86c240] text-white' : gender && fathersName && mothersName && address && nid && dob ? 'bg-[#eaf4df] text-[#86c240]' : 'bg-white border border-slate-200 text-slate-500'}`}>
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition-colors">Personal Info 20%</h4>
                      <p className="text-[10px] text-slate-455 mt-0.5">Identity details</p>
                    </div>
                    {activeSubStep === 1 && (
                      <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 border-y-[10px] border-y-transparent border-r-[10px] border-r-white z-20"></div>
                    )}
                  </button>

                  <button 
                    onClick={() => setActiveSubStep(2)}
                    className="w-full flex items-start gap-4 text-left relative py-2 outline-none group"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs z-10 transition-colors ${activeSubStep === 2 ? 'bg-[#86c240] text-white' : emergencyContactName && emergencyContactRel && emergencyContactPhone ? 'bg-[#eaf4df] text-[#86c240]' : 'bg-white border border-slate-200 text-slate-500'}`}>
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition-colors">Emergency Contact 10%</h4>
                      <p className="text-[10px] text-slate-455 mt-0.5">Emergency info</p>
                    </div>
                    {activeSubStep === 2 && (
                      <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 border-y-[10px] border-y-transparent border-r-[10px] border-r-white z-20"></div>
                    )}
                  </button>

                  <button 
                    onClick={() => setActiveSubStep(3)}
                    className="w-full flex items-start gap-4 text-left relative py-2 outline-none group"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs z-10 transition-colors ${activeSubStep === 3 ? 'bg-[#86c240] text-white' : facebookLink ? 'bg-[#eaf4df] text-[#86c240]' : 'bg-white border border-slate-200 text-slate-500'}`}>
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition-colors">Social Media 10%</h4>
                      <p className="text-[10px] text-slate-455 mt-0.5">Links & messaging</p>
                    </div>
                    {activeSubStep === 3 && (
                      <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 border-y-[10px] border-y-transparent border-r-[10px] border-r-white z-20"></div>
                    )}
                  </button>
                </>
              )}

              {activeMainStep === 4 && (
                <>
                  <button 
                    onClick={() => setActiveSubStep(1)}
                    className="w-full flex items-start gap-4 text-left relative py-2 outline-none group"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs z-10 transition-colors ${activeSubStep === 1 ? 'bg-[#86c240] text-white' : cvFile || existingCvUrl || (cvOption === 'link' && cvLinkInput) ? 'bg-[#eaf4df] text-[#86c240]' : 'bg-white border border-slate-200 text-slate-500'}`}>
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition-colors">Documents 10%</h4>
                      <p className="text-[10px] text-slate-455 mt-0.5">Profile Photo & CV Resume</p>
                    </div>
                    {activeSubStep === 1 && (
                      <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 border-y-[10px] border-y-transparent border-r-[10px] border-r-white z-20"></div>
                    )}
                  </button>

                  <button 
                    onClick={() => setActiveSubStep(2)}
                    className="w-full flex items-start gap-4 text-left relative py-2 outline-none group"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs z-10 transition-colors ${activeSubStep === 2 ? 'bg-[#86c240] text-white' : aboutYourself.length >= 50 && reasonsForHiring && tuitionExperienceDetails && personalMotivation ? 'bg-[#eaf4df] text-[#86c240]' : 'bg-white border border-slate-200 text-slate-500'}`}>
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition-colors">About Me</h4>
                      <p className="text-[10px] text-slate-455 mt-0.5">Introduction & Motivation</p>
                    </div>
                    {activeSubStep === 2 && (
                      <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 border-y-[10px] border-y-transparent border-r-[10px] border-r-white z-20"></div>
                    )}
                  </button>
                </>
              )}

            </div>

            {/* Read-only brief profile info */}
            <div className="mt-8 pt-6 border-t border-slate-100 hidden lg:block text-slate-400">
              <span className="text-[9px] tracking-wider font-extrabold block mb-2">My ID Card</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#86c240] font-black text-xs">
                  {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'T'}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-700 font-bold truncate leading-tight">{profile?.full_name || 'Tutor'}</p>
                  <p className="text-[9px] text-slate-400 font-semibold truncate leading-none mt-0.5">Tutor ID: {profile?.id ? profile.id.substring(0, 6).toUpperCase() : '------'}</p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Active Form Segment */}
          <div className="flex-1 p-6 sm:p-8">
            {errorMsg && <div className="p-4 rounded-2xl bg-red-50 text-red-700 border border-red-100 text-xs font-bold mb-6">{errorMsg}</div>}
            
            {/* STEP 1: TUTORING INFORMATION */}
            {activeMainStep === 1 && (
              <div>
                
                {/* SUB-STEP 1: LOCATION DETAILS */}
                {activeSubStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Tutoring Location</h3>
                      <p className="text-slate-450 text-[11px] font-semibold">Tell us where you stay and your preferred work places.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5 pt-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Your Country*</label>
                        <select disabled className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold outline-none cursor-not-allowed">
                          <option>Bangladesh</option>
                        </select>
                      </div>

                      <div className="relative" ref={cityRef}>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Your Current City *</label>
                        <input 
                          type="text" 
                          placeholder="Select current city..."
                          value={cityInput}
                          onChange={(e) => {
                            setCityInput(e.target.value);
                            setShowCitySuggestions(true);
                          }}
                          onFocus={() => setShowCitySuggestions(true)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-700"
                        />
                        {showCitySuggestions && (
                          <div className="absolute z-30 w-full bg-white border border-slate-100 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                            {filteredCities.length > 0 ? (
                              filteredCities.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => handleSelectCity(c)}
                                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors font-bold border-b border-slate-50 last:border-b-0"
                                >
                                  {c}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-2.5 text-xs text-slate-400">No matching city found</div>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Your Living Location*</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Uttara" 
                          value={livingLocation} 
                          onChange={(e) => setLivingLocation(e.target.value)} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-700"
                        />
                      </div>

                      <div className="relative" ref={locRef}>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Your Preferable Tutoring Locations*</label>
                        <input 
                          type="text" 
                          placeholder={city ? "Add preferred areas..." : "Select current city first"}
                          disabled={!city}
                          value={locationInput}
                          onChange={(e) => {
                            setLocationInput(e.target.value);
                            setShowLocSuggestions(true);
                          }}
                          onKeyDown={handleCustomLocationAdd}
                          onFocus={() => setShowLocSuggestions(true)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-700 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        />
                        <p className="text-[9px] text-slate-400 font-semibold mt-1">Opt more locations to get tuition jobs fast.</p>
                        
                        {showLocSuggestions && locationInput !== '' && city && (
                          <div className="absolute z-30 w-full bg-white border border-slate-100 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                            {filteredLocations.length > 0 ? (
                              filteredLocations.map((loc) => (
                                <button
                                  key={loc}
                                  type="button"
                                  onClick={() => handleSelectLocation(loc)}
                                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors font-bold border-b border-slate-50 last:border-b-0"
                                >
                                  {loc}
                                </button>
                              ))
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSelectLocation(locationInput.trim())}
                                className="w-full text-left px-4 py-2.5 text-xs text-[#86c240] font-black hover:bg-slate-50 transition-colors"
                              >
                                + Add "{locationInput}" as custom location
                              </button>
                            )}
                          </div>
                        )}

                        {preferredLocations.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                            {preferredLocations.map((loc) => (
                              <span key={loc} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-[10px]">
                                {loc}
                                <button type="button" onClick={() => handleRemoveLocation(loc)} className="p-0.5 rounded-full hover:bg-slate-150 text-slate-400 hover:text-slate-600">
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-STEP 2: TUTORING CATEGORY */}
                {activeSubStep === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Tutoring Category</h3>
                      <p className="text-slate-455 text-[11px] font-semibold">Select your teaching options and subject preferences.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5 pt-3">
                      
                      {/* Preferred Category Select */}
                      <div className="relative" ref={categoryRef}>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Your Preferred Tutoring Category*</label>
                        <div 
                          onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-700 bg-white flex justify-between items-center cursor-pointer select-none"
                        >
                          <span className={preferredCategory ? 'text-slate-800 font-bold' : 'text-slate-400'}>
                            {preferredCategory || 'Choose Category'}
                          </span>
                          <span className="text-slate-400 text-xs">▼</span>
                        </div>
                        {showCategoryDropdown && (
                          <div className="absolute z-30 w-full bg-white border border-slate-100 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                            {PRESET_CATEGORIES.map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  setPreferredCategory(cat);
                                  setShowCategoryDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors font-bold border-b border-slate-50 last:border-b-0"
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Favorite Subjects */}
                      <div className="relative" ref={subjectsRef}>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Select Your Favorite Subjects For Tutoring*</label>
                        <div 
                          onClick={() => setShowSubjectsDropdown(!showSubjectsDropdown)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-700 bg-white flex justify-between items-center cursor-pointer select-none"
                        >
                          <span className="text-slate-400 truncate max-w-[90%]">
                            {preferredSubjects.length > 0 ? `${preferredSubjects.length} selected` : 'Choose Subjects'}
                          </span>
                          <span className="text-slate-400 text-xs">▼</span>
                        </div>
                        {showSubjectsDropdown && (
                          <div className="absolute z-30 w-full bg-white border border-slate-100 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto p-2 space-y-1">
                            {PRESET_SUBJECTS.map((subj) => {
                              const checked = preferredSubjects.includes(subj);
                              return (
                                <button
                                  key={subj}
                                  type="button"
                                  onClick={() => toggleSubjectSelection(subj)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex justify-between items-center ${checked ? 'bg-[#eaf4df] text-[#86c240]' : 'hover:bg-slate-50 text-slate-600'}`}
                                >
                                  {subj}
                                  {checked && <Check className="w-3.5 h-3.5" />}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {preferredSubjects.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                            {preferredSubjects.map((s) => (
                              <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-[10px]">
                                {s}
                                <button type="button" onClick={() => toggleSubjectSelection(s)} className="p-0.5 rounded-full hover:bg-slate-150 text-slate-400 hover:text-slate-600">
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Preferred Courses */}
                      <div className="relative" ref={coursesRef}>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Your Preferred Tutoring Courses/Classes*</label>
                        <div 
                          onClick={() => setShowCoursesDropdown(!showCoursesDropdown)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-700 bg-white flex justify-between items-center cursor-pointer select-none"
                        >
                          <span className="text-slate-400 truncate max-w-[90%]">
                            {preferredCourses.length > 0 ? `${preferredCourses.length} selected` : 'Choose Courses'}
                          </span>
                          <span className="text-slate-400 text-xs">▼</span>
                        </div>
                        {showCoursesDropdown && (
                          <div className="absolute z-30 w-full bg-white border border-slate-100 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto p-2 space-y-1">
                            {PRESET_COURSES.map((course) => {
                              const checked = preferredCourses.includes(course);
                              return (
                                <button
                                  key={course}
                                  type="button"
                                  onClick={() => toggleCourseSelection(course)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex justify-between items-center ${checked ? 'bg-[#eaf4df] text-[#86c240]' : 'hover:bg-slate-50 text-slate-600'}`}
                                >
                                  {course}
                                  {checked && <Check className="w-3.5 h-3.5" />}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {preferredCourses.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                            {preferredCourses.map((c) => (
                              <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-[10px]">
                                {c}
                                <button type="button" onClick={() => toggleCourseSelection(c)} className="p-0.5 rounded-full hover:bg-slate-150 text-slate-400 hover:text-slate-600">
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Tutoring Experience */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Tutoring Experience*</label>
                        <select 
                          value={experience} 
                          onChange={(e) => setExperience(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-[#86c240]"
                        >
                          <option value="">Year of Experience</option>
                          {PRESET_EXPERIENCE.map((exp) => (
                            <option key={exp} value={exp}>{exp}</option>
                          ))}
                        </select>
                      </div>

                    </div>
                  </div>
                )}

                {/* SUB-STEP 3: AVAILABILITY DETAILS */}
                {activeSubStep === 3 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Tutoring Availability</h3>
                      <p className="text-slate-455 text-[11px] font-semibold">List the days and times you can teach along with your fee expectation.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5 pt-3">
                      
                      {/* Available Days */}
                      <div className="relative" ref={daysRef}>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Available Day*</label>
                        <div 
                          onClick={() => setShowDaysDropdown(!showDaysDropdown)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-700 bg-white flex justify-between items-center cursor-pointer select-none"
                        >
                          <span className="text-slate-400 truncate max-w-[90%]">
                            {availableDays.length > 0 ? `${availableDays.length} selected` : 'Choose Days'}
                          </span>
                          <span className="text-slate-400 text-xs">▼</span>
                        </div>
                        {showDaysDropdown && (
                          <div className="absolute z-30 w-full bg-white border border-slate-100 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto p-2 space-y-1">
                            {PRESET_DAYS.map((day) => {
                              const checked = availableDays.includes(day);
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => toggleDaySelection(day)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex justify-between items-center ${checked ? 'bg-[#eaf4df] text-[#86c240]' : 'hover:bg-slate-50 text-slate-600'}`}
                                >
                                  {day}
                                  {checked && <Check className="w-3.5 h-3.5" />}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {availableDays.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                            {availableDays.map((d) => (
                              <span key={d} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-[10px]">
                                {d}
                                <button type="button" onClick={() => toggleDaySelection(d)} className="p-0.5 rounded-full hover:bg-slate-150 text-slate-400 hover:text-slate-600">
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Teaching Method */}
                      <div className="relative" ref={methodsRef}>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Preferred Teaching Method*</label>
                        <div 
                          onClick={() => setShowMethodsDropdown(!showMethodsDropdown)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-700 bg-white flex justify-between items-center cursor-pointer select-none"
                        >
                          <span className="text-slate-400 truncate max-w-[90%]">
                            {teachingMethods.length > 0 ? `${teachingMethods.length} selected` : 'Select your teaching method'}
                          </span>
                          <span className="text-slate-400 text-xs">▼</span>
                        </div>
                        {showMethodsDropdown && (
                          <div className="absolute z-30 w-full bg-white border border-slate-100 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto p-2 space-y-1">
                            {PRESET_METHODS.map((m) => {
                              const checked = teachingMethods.includes(m);
                              return (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => toggleMethodSelection(m)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex justify-between items-center ${checked ? 'bg-[#eaf4df] text-[#86c240]' : 'hover:bg-slate-50 text-slate-600'}`}
                                >
                                  {m}
                                  {checked && <Check className="w-3.5 h-3.5" />}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {teachingMethods.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                            {teachingMethods.map((m) => (
                              <span key={m} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-[10px]">
                                {m}
                                <button type="button" onClick={() => toggleMethodSelection(m)} className="p-0.5 rounded-full hover:bg-slate-150 text-slate-400 hover:text-slate-600">
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Available From */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Available From*</label>
                        <input 
                          type="time" 
                          value={availableFrom} 
                          onChange={(e) => setAvailableFrom(e.target.value)} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750"
                        />
                      </div>

                      {/* Expected Salary */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Expected Salary*</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 2500" 
                          value={expectedSalary} 
                          onChange={(e) => setExpectedSalary(e.target.value)} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750"
                        />
                      </div>

                      {/* Available To */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Available To*</label>
                        <input 
                          type="time" 
                          value={availableTo} 
                          onChange={(e) => setAvailableTo(e.target.value)} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750"
                        />
                      </div>

                    </div>
                  </div>
                )}

              </div>
            )}

            {/* STEP 2: EDUCATION INFORMATION */}
            {activeMainStep === 2 && (
              <div>
                
                {/* SUB-STEP 1: SCHOOL DETAILS */}
                {activeSubStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">School Information</h3>
                      <p className="text-slate-455 text-[11px] font-semibold">Provide your high school / secondary level educational background.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5 pt-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">School Name*</label>
                        <input 
                          type="text" 
                          placeholder="Select/type school name..." 
                          value={schoolName} 
                          onChange={(e) => setSchoolName(e.target.value)} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Group*</label>
                        <select 
                          value={schoolGroup} 
                          onChange={(e) => setSchoolGroup(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-[#86c240]"
                        >
                          <option value="">Select your group</option>
                          {PRESET_GROUPS.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Curriculum*</label>
                        <select 
                          value={schoolCurriculum} 
                          onChange={(e) => setSchoolCurriculum(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-[#86c240]"
                        >
                          <option value="">Select your curriculum</option>
                          {PRESET_CURRICULUMS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Board*</label>
                        <select 
                          value={schoolBoard} 
                          onChange={(e) => setSchoolBoard(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-[#86c240]"
                        >
                          <option value="">Select your board</option>
                          {PRESET_BOARDS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">GPA*</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 5.00" 
                          value={schoolGpa} 
                          onChange={(e) => setSchoolGpa(e.target.value)} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Passing Year*</label>
                        <select 
                          value={schoolYear} 
                          onChange={(e) => setSchoolYear(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-[#86c240]"
                        >
                          <option value="">Year</option>
                          {Array.from({ length: 17 }, (_, i) => 2010 + i).map((yr) => (
                            <option key={yr} value={yr}>{yr}</option>
                          ))}
                        </select>
                      </div>

                    </div>
                  </div>
                )}

                {/* SUB-STEP 2: COLLEGE DETAILS */}
                {activeSubStep === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">College Information</h3>
                      <p className="text-slate-455 text-[11px] font-semibold">Provide your college / higher secondary level educational background.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5 pt-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">College Name*</label>
                        <input 
                          type="text" 
                          placeholder="Select/type college name..." 
                          value={collegeName} 
                          onChange={(e) => setCollegeName(e.target.value)} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Group*</label>
                        <select 
                          value={collegeGroup} 
                          onChange={(e) => setCollegeGroup(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-[#86c240]"
                        >
                          <option value="">Select your group</option>
                          {PRESET_GROUPS.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Curriculum*</label>
                        <select 
                          value={collegeCurriculum} 
                          onChange={(e) => setCollegeCurriculum(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-[#86c240]"
                        >
                          <option value="">Select your curriculum</option>
                          {PRESET_CURRICULUMS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Board*</label>
                        <select 
                          value={collegeBoard} 
                          onChange={(e) => setCollegeBoard(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-[#86c240]"
                        >
                          <option value="">Select your board</option>
                          {PRESET_BOARDS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">GPA*</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 5.00" 
                          value={collegeGpa} 
                          onChange={(e) => setCollegeGpa(e.target.value)} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Passing Year*</label>
                        <select 
                          value={collegeYear} 
                          onChange={(e) => setCollegeYear(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-[#86c240]"
                        >
                          <option value="">Year</option>
                          {Array.from({ length: 17 }, (_, i) => 2010 + i).map((yr) => (
                            <option key={yr} value={yr}>{yr}</option>
                          ))}
                        </select>
                      </div>

                    </div>
                  </div>
                )}

                {/* SUB-STEP 3: GRADUATION DETAILS */}
                {activeSubStep === 3 && (
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Graduation Information</h3>
                        <p className="text-slate-455 text-[11px] font-semibold">Provide details about your Bachelor's / Undergraduate degree.</p>
                      </div>
                      
                      {/* Running HSC student toggle */}
                      <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 self-start select-none">
                        <button
                          type="button"
                          onClick={() => {
                            setIsHscStudent(!isHscStudent);
                            if (!isHscStudent) {
                              setUniversity('');
                              setDepartment('');
                              setGradGpa('');
                              setGradYear('');
                              setPostGradUniversity('');
                              setPostGradDepartment('');
                              setPostGradGpa('');
                              setPostGradYear('');
                            }
                          }}
                          className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors duration-250 flex items-center ${isHscStudent ? 'bg-[#86c240]' : 'bg-slate-350'}`}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-250 ${isHscStudent ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </button>
                        <span className="text-[10px] font-extrabold text-slate-600">I am a running HSC student</span>
                      </div>
                    </div>

                    <div className={`grid md:grid-cols-2 gap-5 pt-3 transition-opacity duration-300 ${isHscStudent ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                      
                      {/* University Selection Dropdown */}
                      <div className="relative" ref={univRef}>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">University Name*</label>
                        <div 
                          onClick={() => !isHscStudent && setShowUnivDropdown(!showUnivDropdown)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white flex justify-between items-center cursor-pointer select-none"
                        >
                          <span className={university ? 'text-slate-800 font-bold' : 'text-slate-400'}>
                            {university || 'Select your university'}
                          </span>
                          <span className="text-slate-400 text-xs">▼</span>
                        </div>
                        {showUnivDropdown && (
                          <div className="absolute z-30 w-full bg-white border border-slate-100 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                            {UNIVERSITIES.map((univ) => (
                              <button
                                key={univ}
                                type="button"
                                onClick={() => {
                                  setUniversity(univ);
                                  setShowUnivDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors font-bold border-b border-slate-50 last:border-b-0"
                              >
                                {univ}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Department Select Dropdown */}
                      <div className="relative" ref={deptRef}>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Department*</label>
                        <div 
                          onClick={() => !isHscStudent && setShowDeptDropdown(!showDeptDropdown)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white flex justify-between items-center cursor-pointer select-none"
                        >
                          <span className={department ? 'text-slate-800 font-bold' : 'text-slate-400'}>
                            {department || 'Select your department'}
                          </span>
                          <span className="text-slate-400 text-xs">▼</span>
                        </div>
                        {showDeptDropdown && (
                          <div className="absolute z-30 w-full bg-white border border-slate-100 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                            {DEPARTMENTS.map((dept) => (
                              <button
                                key={dept}
                                type="button"
                                onClick={() => {
                                  setDepartment(dept);
                                  setShowDeptDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors font-bold border-b border-slate-50 last:border-b-0"
                              >
                                {dept}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">GPA*</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 3.80" 
                          value={university ? gradGpa : ''} 
                          disabled={isHscStudent}
                          onChange={(e) => setGradGpa(e.target.value)} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Passing Year*</label>
                        <select 
                          value={gradYear} 
                          disabled={isHscStudent}
                          onChange={(e) => setGradYear(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-755 rounded-xl text-xs font-bold focus:outline-none focus:border-[#86c240] disabled:bg-slate-50 disabled:cursor-not-allowed"
                        >
                          <option value="">Year</option>
                          {Array.from({ length: 21 }, (_, i) => 2010 + i).map((yr) => (
                            <option key={yr} value={yr}>{yr}</option>
                          ))}
                        </select>
                      </div>

                    </div>
                  </div>
                )}

                {/* SUB-STEP 4: POST GRADUATION DETAILS */}
                {activeSubStep === 4 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Post Graduation Information</h3>
                      <p className="text-slate-455 text-[11px] font-semibold">Provide details about your Master's or other postgraduate degrees (Optional).</p>
                    </div>

                    <div className={`grid md:grid-cols-2 gap-5 pt-3 transition-opacity duration-300 ${isHscStudent ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                      
                      {/* PG University */}
                      <div className="relative" ref={pgUnivRef}>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">University Name</label>
                        <div 
                          onClick={() => !isHscStudent && setShowPgUnivDropdown(!showPgUnivDropdown)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white flex justify-between items-center cursor-pointer select-none"
                        >
                          <span className={postGradUniversity ? 'text-slate-800 font-bold' : 'text-slate-400'}>
                            {postGradUniversity || 'Select your university'}
                          </span>
                          <span className="text-slate-400 text-xs">▼</span>
                        </div>
                        {showPgUnivDropdown && (
                          <div className="absolute z-30 w-full bg-white border border-slate-100 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                            {UNIVERSITIES.map((univ) => (
                              <button
                                key={univ}
                                type="button"
                                onClick={() => {
                                  setPostGradUniversity(univ);
                                  setShowPgUnivDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors font-bold border-b border-slate-50 last:border-b-0"
                              >
                                {univ}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* PG Dept */}
                      <div className="relative" ref={pgDeptRef}>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Department</label>
                        <div 
                          onClick={() => !isHscStudent && setShowPgDeptDropdown(!showPgDeptDropdown)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white flex justify-between items-center cursor-pointer select-none"
                        >
                          <span className={postGradDepartment ? 'text-slate-800 font-bold' : 'text-slate-400'}>
                            {postGradDepartment || 'Select your department'}
                          </span>
                          <span className="text-slate-400 text-xs">▼</span>
                        </div>
                        {showPgDeptDropdown && (
                          <div className="absolute z-30 w-full bg-white border border-slate-100 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                            {DEPARTMENTS.map((dept) => (
                              <button
                                key={dept}
                                type="button"
                                onClick={() => {
                                  setPostGradDepartment(dept);
                                  setShowPgDeptDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors font-bold border-b border-slate-50 last:border-b-0"
                              >
                                {dept}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">GPA</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 3.80" 
                          value={postGradUniversity ? postGradGpa : ''} 
                          disabled={isHscStudent}
                          onChange={(e) => setPostGradGpa(e.target.value)} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Passing Year</label>
                        <select 
                          value={postGradYear} 
                          disabled={isHscStudent}
                          onChange={(e) => setPostGradYear(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-755 rounded-xl text-xs font-bold focus:outline-none focus:border-[#86c240] disabled:bg-slate-50 disabled:cursor-not-allowed"
                        >
                          <option value="">Year</option>
                          {Array.from({ length: 21 }, (_, i) => 2010 + i).map((yr) => (
                            <option key={yr} value={yr}>{yr}</option>
                          ))}
                        </select>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            )}

            {/* STEP 3: PERSONAL INFORMATION */}
            {activeMainStep === 3 && (
              <div className="space-y-5">
                
                {/* SUB-STEP 1: PERSONAL DETAILS */}
                {activeSubStep === 1 && (
                  <>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Personal Information</h3>
                      <p className="text-slate-455 text-[11px] font-semibold">Enter your private details and emergency contact settings.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5 pt-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Gender*</label>
                    <select 
                      value={gender} 
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-[#86c240]"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Father's Name*</label>
                    <input 
                      type="text" 
                      placeholder="Father's full name" 
                      value={fathersName} 
                      onChange={(e) => setFathersName(e.target.value)} 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Mother's Name*</label>
                    <input 
                      type="text" 
                      placeholder="Mother's full name" 
                      value={mothersName} 
                      onChange={(e) => setMothersName(e.target.value)} 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">NID Number*</label>
                    <input 
                      type="text" 
                      placeholder="National ID Card Number" 
                      value={nid} 
                      onChange={(e) => setNid(e.target.value)} 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Date of Birth*</label>
                    <input 
                      type="date" 
                      value={dob} 
                      onChange={(e) => setDob(e.target.value)} 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Address*</label>
                    <textarea 
                      placeholder="Your complete mailing address..." 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750 min-h-[90px]"
                    />
                              </div>
                    </div>
                  </>
                )}


                {/* SUB-STEP 2: EMERGENCY CONTACT */}
                {activeSubStep === 2 && (
                  <>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Emergency Contact</h3>
                      <p className="text-slate-455 text-[11px] font-semibold">Provide details of someone we can contact in an emergency.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5 pt-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Emergency Contact Name*</label>
                        <input 
                          type="text" 
                          placeholder="Contact person's name" 
                          value={emergencyContactName} 
                          onChange={(e) => setEmergencyContactName(e.target.value)} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Relationship*</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Father, Mother, Brother" 
                          value={emergencyContactRel} 
                          onChange={(e) => setEmergencyContactRel(e.target.value)} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Emergency Contact No.*</label>
                        <input 
                          type="text" 
                          placeholder="e.g. +8801700000000" 
                          value={emergencyContactPhone} 
                          onChange={(e) => setEmergencyContactPhone(e.target.value)} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Additional Contact No. (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="Alternative phone number" 
                          value={emergencyContactAdditional} 
                          onChange={(e) => setEmergencyContactAdditional(e.target.value)} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* SUB-STEP 3: SOCIAL MEDIA & MESSAGING */}
                {activeSubStep === 3 && (
                  <>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Social Media & Messaging</h3>
                      <p className="text-slate-455 text-[11px] font-semibold">Add your social profiles and WhatsApp details.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5 pt-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Facebook Link<span className="text-red-500 ml-0.5">*</span></label>
                        <input 
                          type="url" 
                          placeholder="https://facebook.com/yourprofile" 
                          value={facebookLink} 
                          onChange={(e) => setFacebookLink(e.target.value)} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">LinkedIn Link (Optional)</label>
                        <input 
                          type="url" 
                          placeholder="https://linkedin.com/in/yourprofile" 
                          value={linkedinLink} 
                          onChange={(e) => setLinkedinLink(e.target.value)} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">WhatsApp Number</label>
                        <div className="flex gap-2 items-center">
                          <input 
                            type="text" 
                            placeholder="e.g. 8801700000000 (with country code, no +)" 
                            value={whatsappNumber} 
                            onChange={(e) => setWhatsappNumber(e.target.value)} 
                            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750"
                          />
                          {whatsappNumber && (
                            <a 
                              href={`https://wa.me/${whatsappNumber}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-4 py-3 bg-[#eaf4df] text-[#86c240] font-bold rounded-xl text-xs flex-shrink-0 hover:bg-[#86c240] hover:text-white transition-colors"
                            >
                              Test Link
                            </a>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">Enter your number with country code (e.g., 88017...). We'll generate your WhatsApp link automatically.</p>
                      </div>
                    </div>
                  </>
                )}

              </div>
            )}

            {/* STEP 4: CREDENTIALS */}
            {activeMainStep === 4 && (
              <div className="space-y-5">
                
                {/* SUB-STEP 1: DOCUMENTS */}
                {activeSubStep === 1 && (
                  <>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Upload Credentials</h3>
                      <p className="text-slate-455 text-[11px] font-semibold">CV/Resume is required to complete profile credentials step. Profile photo is optional.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 pt-3">
                  
                  {/* Profile Photo Upload Segment (COMPLETELY OPTIONAL) */}
                  <div className="space-y-3 bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                    <label className="block text-[11px] font-extrabold text-slate-600 tracking-wide flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#86c240]" />
                      Profile Photo (Optional)
                    </label>
                    
                    <div className="flex items-center gap-4 mt-2">
                      <div className="w-16 h-16 rounded-full border-2 border-white shadow-md bg-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
                        {photoFile ? (
                          <img src={URL.createObjectURL(photoFile)} alt="Preview" className="w-full h-full object-cover" />
                        ) : photoUrl ? (
                          <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8" />
                        )}
                      </div>
                      <label className="px-4 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-100 transition-colors bg-white rounded-xl text-xs font-bold text-slate-600 cursor-pointer select-none">
                        Choose Photo
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setPhotoFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* CV/Resume Upload Segment */}
                  <div className="space-y-3 bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                    <label className="block text-[11px] font-extrabold text-slate-600 tracking-wide flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#86c240]" />
                      CV / Resume *
                    </label>

                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setCvOption('upload')}
                        className={`flex-1 py-1.5 rounded-lg border font-bold text-[10px] transition-all ${cvOption === 'upload' ? 'bg-[#86c240]/10 border-[#86c240] text-[#86c240]' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-350'}`}
                      >
                        Upload PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setCvOption('link')}
                        className={`flex-1 py-1.5 rounded-lg border font-bold text-[10px] transition-all ${cvOption === 'link' ? 'bg-[#86c240]/10 border-[#86c240] text-[#86c240]' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-350'}`}
                      >
                        Google Drive Link
                      </button>
                    </div>

                    {cvOption === 'upload' ? (
                      <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                        <label className="cursor-pointer flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 py-2 px-3 rounded-lg text-[10px] font-bold text-slate-655 select-none flex-shrink-0">
                          <Upload className="w-3.5 h-3.5 text-[#86c240]" /> Select PDF
                          <input 
                            type="file" 
                            accept=".pdf" 
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setCvFile(e.target.files[0]);
                              }
                            }} 
                          />
                        </label>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-slate-800 font-bold truncate leading-tight">
                            {cvFile ? cvFile.name : existingCvUrl ? 'CV file uploaded' : 'No file chosen'}
                          </p>
                          {existingCvUrl && !cvFile && (
                            <a href={existingCvUrl} target="_blank" rel="noreferrer" className="text-[9px] text-[#86c240] hover:underline font-bold">
                              View Uploaded CV
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <input 
                          type="url" 
                          placeholder="Paste Google Drive shared link..." 
                          value={cvLinkInput}
                          onChange={(e) => setCvLinkInput(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-800 bg-white"
                        />
                        <p className="text-[8px] text-slate-400 font-semibold leading-normal">Make sure Google Drive link access is set to "Anyone with the link can view".</p>
                      </div>
                    )}

                    </div>
                    </div>
                  </>
                )}

                {/* SUB-STEP 2: ABOUT ME */}
                {activeSubStep === 2 && (
                  <>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">About Me</h3>
                      <p className="text-slate-455 text-[11px] font-semibold">Tell us more about yourself and your tutoring methodology.</p>
                    </div>

                    <div className="grid gap-5 pt-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">About Yourself* <span className="font-normal text-[9px] text-slate-400">(minimum 50, maximum 250 characters)</span></label>
                        <textarea 
                          placeholder="Write a brief introduction about yourself..." 
                          value={aboutYourself} 
                          onChange={(e) => setAboutYourself(e.target.value)}
                          maxLength={250}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750 min-h-[90px]"
                        />
                        <div className="text-right mt-1 text-[9px] font-bold text-slate-400">
                          {aboutYourself.length}/250
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Reasons for Getting Hired*</label>
                        <textarea 
                          placeholder="Why should students hire you? What makes you stand out?" 
                          value={reasonsForHiring} 
                          onChange={(e) => setReasonsForHiring(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750 min-h-[90px]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Tuition Experiences*</label>
                        <textarea 
                          placeholder="Describe your previous tutoring experiences..." 
                          value={tuitionExperienceDetails} 
                          onChange={(e) => setTuitionExperienceDetails(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750 min-h-[90px]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">Personal Motivation*</label>
                        <textarea 
                          placeholder="What motivates you to teach?" 
                          value={personalMotivation} 
                          onChange={(e) => setPersonalMotivation(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-750 min-h-[90px]"
                        />
                      </div>
                    </div>
                  </>
                )}

              </div>
            )}

            {/* BUTTON CONTROLS */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-8">
              
              {/* Skip / Back Alignment */}
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => navigate('/tutor/dashboard')} 
                  className="px-5 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-650 font-bold rounded-xl text-xs transition-colors"
                >
                  Skip For Later
                </button>
                
                {(activeMainStep > 1 || activeSubStep > 1) && (
                  <button 
                    type="button" 
                    onClick={handlePrevStep} 
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                  </button>
                )}
              </div>

              {/* Update & Next buttons */}
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => handleSaveData(null, 'Profile progress saved successfully.')}
                  disabled={loading}
                  className="px-5 py-2.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  {loading ? 'Saving...' : 'Update'}
                </button>

                <button 
                  type="button" 
                  onClick={handleNextStep} 
                  disabled={loading}
                  className="px-5 py-2.5 bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-[#86c240]/15 transition-all"
                >
                  {activeMainStep === 4 ? 'Finish' : 'Next'} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>

        </div>
      </div>

    </div>
  );
};

export default TutorProfileForm;
