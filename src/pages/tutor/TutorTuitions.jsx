import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { 
  Play, 
  Filter, 
  Grid, 
  Search, 
  ChevronUp, 
  MapPin, 
  BookOpen, 
  Calendar, 
  Box, 
  Banknote, 
  User, 
  Clock 
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import CustomAlert from '../../components/layout/CustomAlert';

const cities = [
  'All', 'Dhaka', 'Chittagong', 'Khulna', 'Gazipur', 'Narayanganj',
  'Sylhet', 'Cumilla', 'Barishal', 'Rajshahi', 'Rangpur', 'Mymensingh'
];

const TutorTuitions = () => {
  const [tuitions, setTuitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCities, setSelectedCities] = useState(['All']);
  const [showCityFilter, setShowCityFilter] = useState(true);
  const [jobIdSearch, setJobIdSearch] = useState('');
  
  const { profile } = useAuthStore();
  const navigate = useNavigate();

  // Alert State
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: 'success', title: '', message: '', actionText: 'OK', onAction: null });

  const showAlert = (type, title, message, onAction = null) => {
    setAlertConfig({ type, title, message, actionText: 'OK', onAction });
    setAlertOpen(true);
  };

  const fetchTuitions = async () => {
    if (!profile?.id) return;
    setLoading(true);

    let query = supabase
      .from('tuition_requests')
      .select(`
        *,
        guardian:guardian_id(full_name)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    // Filter by Job ID if provided
    if (jobIdSearch) {
      // Assuming short Job IDs are stored or we match against the UUID start
      query = query.ilike('id', `${jobIdSearch}%`);
    }

    const { data, error } = await query;
    
    if (!error && data) {
      let filteredData = data;
      
      // Filter by City
      if (!selectedCities.includes('All') && selectedCities.length > 0) {
        filteredData = filteredData.filter(job => 
          selectedCities.some(city => job.location.toLowerCase().includes(city.toLowerCase()))
        );
      }

      setTuitions(filteredData);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    // Initialize cities from tutor profile if not already set
    if (profile?.tutor_profile?.preferred_locations?.length > 0) {
      const prefs = profile.tutor_profile.preferred_locations.map(loc => 
        cities.find(c => loc.toLowerCase().includes(c.toLowerCase())) || loc
      );
      // Remove undefined and duplicates, map to standard cities if possible
      const validPrefs = [...new Set(prefs.filter(Boolean))];
      if (validPrefs.length > 0) {
        // setSelectedCities(validPrefs);
      }
    }
    fetchTuitions();
  }, [profile, selectedCities, jobIdSearch]);

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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <button 
          onClick={() => navigate('/tutor/tutorials')}
          className="flex items-center gap-2 bg-[#86c240] hover:bg-[#6a9c31] text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm w-fit"
        >
          <Play className="w-4 h-4 fill-current" /> Watch Tutorial
        </button>
        
        <button className="flex items-center gap-2 bg-[#86c240] hover:bg-[#6a9c31] text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm w-fit md:ml-auto">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Search and Counts */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 shadow-sm">
          <Grid className="w-4 h-4" />
          {tuitions.length} Tuitions found
        </div>
        
        <div className="relative w-full md:w-64">
          <input 
            type="text" 
            placeholder="Enter Job Id" 
            value={jobIdSearch}
            onChange={(e) => setJobIdSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#86c240] focus:border-transparent shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
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
      ) : tuitions.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl text-center border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-600">No tuitions found matching your criteria.</h3>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {tuitions.map(job => {
            const shortId = job.id.substring(0, 5).toUpperCase();
            // We use static fallbacks if fields are missing to match the design
            const postDate = format(new Date(job.created_at), 'dd MMM yyyy');
            const relativeTime = formatDistanceToNow(new Date(job.created_at), { addSuffix: true });
            
            return (
              <div key={job.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-extrabold text-slate-800">
                    {job.student_class}
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
                    <p className="text-[10px] font-bold text-[#86c240] flex items-center gap-1.5 mb-1">
                      <BookOpen className="w-3.5 h-3.5" /> Subjects
                    </p>
                    <p className="text-xs font-medium text-slate-400 truncate pr-2" title={job.subject.join(', ')}>
                      {job.subject.join(', ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#86c240] flex items-center gap-1.5 mb-1">
                      <Calendar className="w-3.5 h-3.5" /> Per Week
                    </p>
                    <p className="text-xs font-medium text-slate-400">
                      {job.days_per_week || 'N/A'} days
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#86c240] flex items-center gap-1.5 mb-1">
                      <Box className="w-3.5 h-3.5" /> Tutoring Mode
                    </p>
                    <p className="text-xs font-medium text-slate-400">
                      Home Tutoring
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#86c240] flex items-center gap-1.5 mb-1">
                      <Banknote className="w-3.5 h-3.5" /> Salary
                    </p>
                    <p className="text-xs font-medium text-slate-400">
                      {job.salary_range || 'Negotiable'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-pink-500 flex items-center gap-1.5 mb-1">
                      <User className="w-3.5 h-3.5" /> Tutor Gender
                    </p>
                    <p className="text-xs font-medium text-pink-500">
                      Any
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#86c240] flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5" /> Tutoring Time
                    </p>
                    <p className="text-xs font-medium text-slate-400">
                      Negotiable
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end mt-auto pt-2">
                  <button 
                    onClick={() => navigate(`/job-board`)} 
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-colors shadow-md"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
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

export default TutorTuitions;
