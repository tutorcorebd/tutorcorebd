import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { 
  Play, Filter, Grid, Search, ChevronUp, MapPin, 
  BookOpen, Calendar, Box, Banknote, User, Clock,
  X, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useNavigate, Link } from 'react-router-dom';
import CustomAlert from '../../components/layout/CustomAlert';

const cities = [
  'All', 'Dhaka', 'Chittagong', 'Khulna', 'Gazipur', 'Narayanganj',
  'Sylhet', 'Cumilla', 'Barishal', 'Rajshahi', 'Rangpur', 'Mymensingh'
];

const LOCATIONS_BY_CITY = {
  Dhaka: ['Uttara', 'Mirpur', 'Gulshan', 'Banani', 'Dhanmondi', 'Mohammadpur', 'Badda', 'Khilgaon', 'Motijheel', 'Shahbagh', 'Farmgate', 'Wari', 'Lalbagh', 'Old Dhaka', 'Bashundhara', 'Rampura', 'Malibagh', 'Mogbazar'],
  Chittagong: ['GEC Circle', 'Halishahar', 'Nasirabad', 'Agrabad', 'Khulshi', 'Chawkbazar', 'Chandgaon', 'Patenga', 'Lalkhan Bazar', 'Double Mooring'],
  Rajshahi: ['Motihar', 'Boalia', 'Kazihata', 'Shaheb Bazar', 'Sopura', 'Talaimari', 'Rajshahi University'],
  Sylhet: ['Zindabazar', 'Shibgonj', 'Amberkhana', 'Uposahar', 'Kumarpara', 'Pathantula', 'Sylhet Sadar'],
  Khulna: ['Boyra', 'Khalishpur', 'Daulatpur', 'Sonadanga', 'Gollamari', 'Rupsha'],
  Barishal: ['Sadar Road', 'Natullabad', 'Rupatali', 'BM College', 'C&B Road'],
  Rangpur: ['Lalbagh', 'Modern Mor', 'Medical Mor', 'Jahaz Mor', 'Dhap'],
  Mymensingh: ['Ganginar Par', 'Charpara', 'Kewatkhali', 'Valuka', 'Sadar']
};

const PRESET_COURSES = ['Play', 'Nursery', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'SSC', 'HSC', 'Class 11', 'Class 12', 'O Level', 'A Level', 'Admission Test'];

const TuitionJobsBoard = ({ isPublic }) => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();

  const [allTuitions, setAllTuitions] = useState([]);
  const [filteredTuitions, setFilteredTuitions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Quick City Filter
  const [selectedCities, setSelectedCities] = useState(['All']);
  const [showCityFilter, setShowCityFilter] = useState(true);

  // Advanced Filter Modal
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [advFilters, setAdvFilters] = useState({
    dateFrom: '',
    dateTo: '',
    country: 'Bangladesh',
    city: '',
    location: '',
    category: '',
    courseClass: '',
    subject: ''
  });

  // Active/Applied Filters (used for filtering logic)
  const [activeFilters, setActiveFilters] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Watch Tutorial
  const [tutorialVideo, setTutorialVideo] = useState(null);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);

  // Apply Modal state (Terms of Service)
  const [applyingJob, setApplyingJob] = useState(null);
  const [showTOSModal, setShowTOSModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Custom Alert
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

  // Compute profile completeness dynamically for tutor
  const calculateCompleteness = () => {
    const tp = profile?.tutor_profile;
    if (!tp) return 20; // base profile setup complete
    
    if (tp.profile_completeness !== undefined && tp.profile_completeness !== null && tp.profile_completeness > 0) {
      return tp.profile_completeness;
    }
    
    let score = 20;
    if (tp.current_city && tp.living_location && tp.preferred_locations && tp.preferred_locations.length > 0) score += 5;
    if (tp.preferred_category && tp.preferred_subjects && tp.preferred_subjects.length > 0 && tp.preferred_courses && tp.preferred_courses.length > 0 && tp.experience) score += 5;
    if (tp.school_name && tp.school_group && tp.school_curriculum && tp.school_board && tp.school_gpa && tp.school_year) score += 5;
    if (tp.college_name && tp.college_group && tp.college_curriculum && tp.college_board && tp.college_gpa && tp.college_year) score += 5;
    if (tp.is_hsc_student || (tp.university && tp.department && tp.grad_gpa && tp.grad_year)) score += 5;
    if (tp.is_hsc_student || (tp.post_grad_university && tp.post_grad_department && tp.post_grad_gpa && tp.post_grad_year)) score += 5;
    if (tp.gender && tp.fathers_name && tp.mothers_name && tp.emergency_contact && tp.address && tp.nid && tp.dob) score += 40;
    if (tp.cv_url) score += 10;
    
    return score;
  };

  const completeness = profile?.role === 'tutor' ? calculateCompleteness() : 0;

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch open tuitions with guardian's details
      const { data: tuitions, error: tuitionsError } = await supabase
        .from('tuition_requests')
        .select(`
          *,
          guardian:guardian_id(full_name, role)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (tuitionsError) throw tuitionsError;

      // Filter only posted by guardians or admins (not dummy)
      const validTuitions = tuitions.filter(
        job => job.guardian?.role === 'guardian' || job.guardian?.role === 'admin'
      );

      setAllTuitions(validTuitions);

      // Fetch watch tutorial video
      const { data: video } = await supabase
        .from('tutorials')
        .select('*')
        .eq('show_on_job_board', true)
        .limit(1)
        .maybeSingle();

      if (video) {
        setTutorialVideo(video);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      showAlert('error', 'Fetch Failed', 'Failed to retrieve tuition requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter & Search Logic
  useEffect(() => {
    let result = [...allTuitions];

    // 1. Search filter (ID, Subject, Location, Class)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(job => {
        const idMatches = job.id.substring(0, 8).toLowerCase().includes(term);
        const classMatches = job.student_class && job.student_class.toLowerCase().includes(term);
        const subjectsMatches = job.subject && job.subject.some(sub => sub.toLowerCase().includes(term));
        const locationMatches = job.location && job.location.toLowerCase().includes(term);
        return idMatches || classMatches || subjectsMatches || locationMatches;
      });
    }

    // 2. City Quick Filter
    if (!selectedCities.includes('All') && selectedCities.length > 0) {
      result = result.filter(job => 
        selectedCities.some(city => job.location && job.location.toLowerCase().includes(city.toLowerCase()))
      );
    }

    // 3. Advanced Filters
    if (activeFilters) {
      const { dateFrom, dateTo, city, location, category, courseClass, subject } = activeFilters;

      if (dateFrom) {
        result = result.filter(job => new Date(job.created_at) >= new Date(dateFrom));
      }
      if (dateTo) {
        // Set dateTo to end of that day
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        result = result.filter(job => new Date(job.created_at) <= endOfDay);
      }
      if (city) {
        result = result.filter(job => job.location && job.location.toLowerCase().includes(city.toLowerCase()));
      }
      if (location) {
        result = result.filter(job => job.location && job.location.toLowerCase().includes(location.toLowerCase()));
      }
      if (category) {
        // preferred_category mapping
        result = result.filter(job => job.preferred_category && job.preferred_category.toLowerCase() === category.toLowerCase());
      }
      if (courseClass) {
        result = result.filter(job => job.student_class && job.student_class.toLowerCase().includes(courseClass.toLowerCase()));
      }
      if (subject) {
        result = result.filter(job => job.subject && job.subject.some(sub => sub.toLowerCase().includes(subject.toLowerCase())));
      }
    }

    setFilteredTuitions(result);
    setCurrentPage(1); // Reset to first page on search/filter changes
  }, [allTuitions, searchTerm, selectedCities, activeFilters]);

  // Handle City Quick Toggle
  const handleCityToggle = (city) => {
    if (city === 'All') {
      setSelectedCities(['All']);
      return;
    }
    
    setSelectedCities(prev => {
      const newSelection = prev.filter(c => c !== 'All');
      if (newSelection.includes(city)) {
        const removed = newSelection.filter(c => c !== city);
        return removed.length === 0 ? ['All'] : removed;
      } else {
        return [...newSelection, city];
      }
    });
  };

  // Advanced Filter Modal Actions
  const handleApplyAdvancedFilters = () => {
    setActiveFilters(advFilters);
    setIsFilterModalOpen(false);
  };

  const handleClearAdvancedFilters = () => {
    const cleared = {
      dateFrom: '',
      dateTo: '',
      country: 'Bangladesh',
      city: '',
      location: '',
      category: '',
      courseClass: '',
      subject: ''
    };
    setAdvFilters(cleared);
    setActiveFilters(null);
    setIsFilterModalOpen(false);
  };

  // Requirement Matching Check
  const checkRequirements = (job) => {
    if (!profile) {
      return { match: false, reason: 'Please log in to check match status.' };
    }
    const tp = profile.tutor_profile;
    if (!tp) {
      return { match: false, reason: 'Tutor profile not created. Update your profile.' };
    }

    // 1. Gender Match
    if (job.preferred_gender && job.preferred_gender !== 'Any' && job.preferred_gender !== 'Both') {
      if (!tp.gender || tp.gender.toLowerCase() !== job.preferred_gender.toLowerCase()) {
        return { match: false, reason: `Requires ${job.preferred_gender} tutor, you are ${tp.gender || 'N/A'}.` };
      }
    }

    // 2. University Match
    if (job.preferred_university && job.preferred_university !== 'Any') {
      if (!tp.university || !tp.university.toLowerCase().includes(job.preferred_university.toLowerCase())) {
        return { match: false, reason: `Requires ${job.preferred_university} student/alumni, you are from ${tp.university || 'N/A'}.` };
      }
    }

    return { match: true };
  };

  // Apply Now trigger
  const handleApplyClick = (job) => {
    if (!profile) {
      showAlert('error', 'Login Required', 'Please log in as a tutor to apply.', () => navigate('/login'));
      return;
    }
    if (profile.role !== 'tutor') {
      showAlert('error', 'Unauthorized', 'Only registered tutors can apply for tuition requests.');
      return;
    }
    if (completeness < 80) {
      showAlert(
        'error',
        'Profile Completeness Required',
        `Complete your profile to at least 80% to be eligible to apply for tuition. Current completion: ${completeness}%`,
        () => navigate('/tutor/profile'),
        'Complete Profile'
      );
      return;
    }

    // Check Requirements Matching
    const reqCheck = checkRequirements(job);
    if (!reqCheck.match) {
      showAlert('error', 'Requirements Mismatch', reqCheck.reason);
      return;
    }

    setApplyingJob(job);
    setShowTOSModal(true);
  };

  // Submit Application
  const handleAgreeTOS = async () => {
    if (!applyingJob || !profile) return;
    setIsApplying(true);

    try {
      const { error } = await supabase.from('job_applications').insert([
        { tutor_id: profile.id, tuition_request_id: applyingJob.id }
      ]);
      
      if (error) {
        if (error.code === '23505') {
          showAlert('info', 'Already Applied', 'You have already applied for this tuition request.');
        } else {
          showAlert('error', 'Application Failed', `Failed to apply: ${error.message}`);
        }
        setShowTOSModal(false);
      } else {
        setShowTOSModal(false);
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error(err);
      showAlert('error', 'Unexpected Error', 'An unexpected error occurred.');
    } finally {
      setIsApplying(false);
      setApplyingJob(null);
    }
  };

  // Extract YouTube ID helper
  const getEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredTuitions.length / itemsPerPage);
  const paginatedTuitions = filteredTuitions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        {tutorialVideo && (
          <button 
            onClick={() => setIsWatchModalOpen(true)}
            className="flex items-center gap-2 bg-[#86c240] hover:bg-[#6a9c31] text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm w-fit"
          >
            <Play className="w-4 h-4 fill-current" /> Watch Tutorial
          </button>
        )}
        
        <button 
          onClick={() => setIsFilterModalOpen(true)}
          className="flex items-center gap-2 bg-[#86c240] hover:bg-[#6a9c31] text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm w-fit md:ml-auto"
        >
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Search and Counts */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 shadow-sm">
          <Grid className="w-4 h-4" />
          {filteredTuitions.length} Jobs found
        </div>
        
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Search Subject, Location, Class..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#86c240] focus:border-transparent shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
        </div>
      </div>

      {/* City Filter Toggle */}
      <div className="flex justify-end">
        <button 
          onClick={() => setShowCityFilter(!showCityFilter)}
          className="flex items-center gap-1 text-xs font-bold text-slate-800 hover:text-[#86c240] transition-colors"
        >
          {showCityFilter ? 'Hide City Filter' : 'Show City Filter'}
          <ChevronUp className={`w-4 h-4 transition-transform ${!showCityFilter ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* City Checkboxes */}
      {showCityFilter && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {cities.map(city => (
            <label 
              key={city}
              className={`flex items-center justify-center gap-2 border rounded-lg px-3 py-2 cursor-pointer transition-all text-xs font-bold ${
                selectedCities.includes(city) 
                  ? 'border-[#86c240] bg-[#f7fee7] text-slate-800' 
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              <input 
                type="checkbox" 
                className="hidden"
                checked={selectedCities.includes(city)}
                onChange={() => handleCityToggle(city)}
              />
              <div className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center ${
                selectedCities.includes(city) ? 'bg-[#86c240] border-[#86c240]' : 'border-slate-300'
              }`}>
                {selectedCities.includes(city) && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
              </div>
              {city}
            </label>
          ))}
        </div>
      )}

      {/* Tuition Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-400 text-sm font-semibold">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#86c240] mr-3"></div>
          Loading Tuitions...
        </div>
      ) : paginatedTuitions.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl text-center border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-600">No tuitions found matching your criteria.</h3>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {paginatedTuitions.map(job => {
            const shortId = job.id.substring(0, 5).toUpperCase();
            const postDate = format(new Date(job.created_at), 'dd MMM yyyy');
            const relativeTime = formatDistanceToNow(new Date(job.created_at), { addSuffix: true });
            const reqCheck = checkRequirements(job);
            
            return (
              <div key={job.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-extrabold text-slate-800">
                    <Link to={`/tuition/${job.id}`} className="hover:text-[#86c240] transition-colors">
                      {job.student_class}
                    </Link>
                  </h3>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-500 mb-0.5">Job Id: {shortId}</p>
                    <p className="text-xs font-semibold text-slate-400 flex items-center gap-1 justify-end">
                      <Clock className="w-3.5 h-3.5 fill-slate-400 text-white" /> {relativeTime}
                    </p>
                  </div>
                </div>

                {/* Location and Date */}
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
                  <MapPin className="w-4 h-4 text-slate-700" />
                  <span>{job.location}</span>
                  <span className="text-slate-300 px-1">|</span>
                  <span className="text-slate-600">{postDate}</span>
                </div>

                 {/* Grid Details */}
                <div className="grid grid-cols-3 gap-y-5 gap-x-2 mb-6">
                  <div>
                    <p className="text-xs font-bold text-[#86c240] flex items-center gap-1.5 mb-1">
                      <BookOpen className="w-3.5 h-3.5" /> Subjects
                    </p>
                    <p className="text-sm font-medium text-slate-500 truncate pr-2" title={job.subject ? job.subject.join(', ') : 'N/A'}>
                      {job.subject ? job.subject.join(', ') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#86c240] flex items-center gap-1.5 mb-1">
                      <Calendar className="w-3.5 h-3.5" /> Per Week
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                      {job.days_per_week || 'N/A'} days
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#86c240] flex items-center gap-1.5 mb-1">
                      <Box className="w-3.5 h-3.5" /> Tutoring Mode
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                      {job.tutoring_mode || 'Home Tutoring'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#86c240] flex items-center gap-1.5 mb-1">
                      <Banknote className="w-3.5 h-3.5" /> Salary
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                      {job.salary_range || 'Negotiable'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-pink-500 flex items-center gap-1.5 mb-1">
                      <User className="w-3.5 h-3.5" /> Tutor Gender
                    </p>
                    <p className="text-sm font-medium text-pink-500">
                      {job.preferred_gender || 'Any'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#86c240] flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5" /> Tutoring Time
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                      {job.tutoring_time || 'Negotiable'}
                    </p>
                  </div>
                </div>

                {/* Requirements check warning if logged in as tutor */}
                {profile?.role === 'tutor' && !reqCheck.match && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-[11px] text-red-500 font-bold mb-4">
                    ⚠️ {reqCheck.reason}
                  </div>
                )}

                {/* Action Button */}
                {profile?.role !== 'guardian' && (
                  <div className="flex justify-end mt-auto pt-2">
                    <button 
                      onClick={() => handleApplyClick(job)}
                      className={`text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-colors shadow-md ${
                        profile?.role === 'tutor' && !reqCheck.match
                          ? 'bg-slate-300 cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                      disabled={profile?.role === 'tutor' && !reqCheck.match}
                    >
                      Apply Now
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-4 py-2 border rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm font-bold text-slate-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-4 py-2 border rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Advanced Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsFilterModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5">Job Filter</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Posted Date From</label>
                <input 
                  type="date"
                  value={advFilters.dateFrom}
                  onChange={(e) => setAdvFilters({ ...advFilters, dateFrom: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Country</label>
                <select
                  value={advFilters.country}
                  onChange={(e) => setAdvFilters({ ...advFilters, country: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
                >
                  <option value="Bangladesh">Bangladesh</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Select City</label>
                <select
                  value={advFilters.city}
                  onChange={(e) => setAdvFilters({ ...advFilters, city: e.target.value, location: '' })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
                >
                  <option value="">Select City</option>
                  {cities.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Posted Date To</label>
                <input 
                  type="date"
                  value={advFilters.dateTo}
                  onChange={(e) => setAdvFilters({ ...advFilters, dateTo: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Category</label>
                <select
                  value={advFilters.category}
                  onChange={(e) => setAdvFilters({ ...advFilters, category: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
                >
                  <option value="">Select Category</option>
                  <option value="Bangla Medium">Bangla Medium</option>
                  <option value="English Medium">English Medium</option>
                  <option value="Admission Test">Admission Test</option>
                  <option value="Religious Studies">Religious Studies</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Course/Class</label>
                <select
                  value={advFilters.courseClass}
                  onChange={(e) => setAdvFilters({ ...advFilters, courseClass: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
                >
                  <option value="">Select Class</option>
                  {PRESET_COURSES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Location</label>
                <select
                  value={advFilters.location}
                  onChange={(e) => setAdvFilters({ ...advFilters, location: e.target.value })}
                  disabled={!advFilters.city}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#86c240] disabled:opacity-50"
                >
                  <option value="">Select Location</option>
                  {advFilters.city && LOCATIONS_BY_CITY[advFilters.city]?.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Subject</label>
                <input 
                  type="text"
                  placeholder="Enter Subject (e.g. Math, Chemistry)"
                  value={advFilters.subject}
                  onChange={(e) => setAdvFilters({ ...advFilters, subject: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button 
                onClick={handleClearAdvancedFilters}
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button 
                onClick={handleApplyAdvancedFilters}
                className="bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* YouTube Watch Modal */}
      {isWatchModalOpen && tutorialVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 max-w-3xl w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsWatchModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-800 mb-4 pr-10 truncate">{tutorialVideo.title}</h3>
            
            <div className="relative pt-[56.25%] rounded-2xl overflow-hidden bg-black shadow-inner">
              <iframe 
                src={getEmbedUrl(tutorialVideo.video_url)} 
                title={tutorialVideo.title}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-800 mb-4 border-b pb-3">Terms of Service</h3>
            <div className="text-sm text-slate-600 font-medium space-y-3 max-h-60 overflow-y-auto mb-6 pr-2 leading-relaxed">
              <p>Please read out the terms of service carefully before applying for this tuition request:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>You must provide accurate qualification details in your profile.</li>
                <li>Applications once submitted cannot be withdrawn immediately.</li>
                <li>Admins will review your profile completeness and match with guardian expectations.</li>
                <li>Commission rates or service charges are applicable as per platform rules.</li>
                <li>Direct contact with guardians without admin authorization is strictly prohibited.</li>
              </ol>
            </div>
            <div className="flex gap-4 border-t border-slate-100 pt-4">
              <button
                onClick={() => {
                  setShowTOSModal(false);
                  setApplyingJob(null);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors text-sm"
              >
                I Disagree
              </button>
              <button
                onClick={handleAgreeTOS}
                disabled={isApplying}
                className="flex-1 bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold py-3 rounded-xl transition-colors text-sm disabled:opacity-50"
              >
                {isApplying ? 'Applying...' : 'I Agree'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-[#86c240]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-[#86c240]" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Success!</h3>
            <p className="text-slate-500 font-semibold mb-8">
              Successfully applied for the job. The admins will contact you.
            </p>
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold py-3.5 rounded-xl shadow-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <CustomAlert 
        isOpen={alertOpen} 
        onClose={() => setAlertOpen(false)} 
        type={alertConfig.type} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        actionText={alertConfig.actionText}
        onAction={alertConfig.onAction} 
      />
    </div>
  );
};

export default TuitionJobsBoard;
