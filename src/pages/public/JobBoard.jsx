import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { MapPin, BookOpen, Clock, Banknote, Search, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import CustomAlert from '../../components/layout/CustomAlert';

const JobBoard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const navigate = useNavigate();
  
  // Filters
  const [city, setCity] = useState('all');
  const [subject, setSubject] = useState('');
  
  const { profile } = useAuthStore();

  // Custom alert state
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
    
    // 1. Location (5%)
    if (tp.current_city && tp.living_location && tp.preferred_locations && tp.preferred_locations.length > 0) {
      score += 5;
    }
    // 2. Category (5%)
    if (tp.preferred_category && tp.preferred_subjects && tp.preferred_subjects.length > 0 && tp.preferred_courses && tp.preferred_courses.length > 0 && tp.experience) {
      score += 5;
    }
    // 3. School (5%)
    if (tp.school_name && tp.school_group && tp.school_curriculum && tp.school_board && tp.school_gpa && tp.school_year) {
      score += 5;
    }
    // 4. College (5%)
    if (tp.college_name && tp.college_group && tp.college_curriculum && tp.college_board && tp.college_gpa && tp.college_year) {
      score += 5;
    }
    // 5. Graduation (5%)
    if (tp.is_hsc_student || (tp.university && tp.department && tp.grad_gpa && tp.grad_year)) {
      score += 5;
    }
    // 6. Post Graduation (5%)
    if (tp.is_hsc_student || (tp.post_grad_university && tp.post_grad_department && tp.post_grad_gpa && tp.post_grad_year)) {
      score += 5;
    }
    // 7. Personal Information (40%)
    if (tp.gender && tp.fathers_name && tp.mothers_name && tp.emergency_contact && tp.address && tp.nid && tp.dob) {
      score += 40;
    }
    // 8. Credential (10%)
    if (tp.cv_url) {
      score += 10;
    }
    
    return score;
  };

  const completeness = profile?.role === 'tutor' ? calculateCompleteness() : 0;

  const fetchJobs = async () => {
    setLoading(true);
    let query = supabase
      .from('tuition_requests')
      .select(`
        *,
        guardian:guardian_id(full_name)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });
      
    if (city !== 'all') {
      query = query.ilike('location', `%${city}%`);
    }
    
    const { data, error } = await query;
    if (!error && data) {
      // Filter by subject if provided
      const filtered = subject 
        ? data.filter(job => job.subject.some(s => s.toLowerCase().includes(subject.toLowerCase())))
        : data;
      setJobs(filtered);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, [city]);

  const handleApply = async (jobId) => {
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

    setApplyingId(jobId);
    try {
      const { error } = await supabase.from('job_applications').insert([
        { tutor_id: profile.id, tuition_request_id: jobId }
      ]);
      
      if (error) {
        if (error.code === '23505') {
          showAlert('info', 'Already Applied', 'You have already applied for this job.');
        } else {
          showAlert('error', 'Application Failed', `Failed to apply: ${error.message}`);
        }
      } else {
        showAlert('success', 'Applied Successfully', 'Your application has been submitted successfully.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', 'Unexpected Error', 'An unexpected error occurred.');
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar Filters */}
      <div className="w-full md:w-1/4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-24">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4 border-b pb-3">
            <Filter className="w-5 h-5 text-primary" /> Advance Filter
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select City</label>
              <select className="input-field" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="all">All Cities</option>
                <option value="Dhaka">Dhaka</option>
                <option value="Chattogram">Chattogram</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Rajshahi">Rajshahi</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="e.g. Math, Physics" 
                  className="input-field pl-9"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchJobs()}
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>
            
            <button onClick={fetchJobs} className="btn-primary w-full mt-2">Filter Jobs</button>
          </div>
        </div>
      </div>

      {/* Job List */}
      <div className="w-full md:w-3/4">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Available Tuitions ({jobs.length})</h1>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="bg-white p-10 rounded-xl text-center border border-slate-200">
            <h3 className="text-lg font-medium text-slate-600">No jobs found matching your criteria.</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-primary transition-colors flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium">Job ID: {job.id.substring(0,8).toUpperCase()}</span>
                    <span>• {formatDistanceToNow(new Date(job.created_at), {addSuffix: true})}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Need Tutor for {job.student_class}</h3>
                  
                  <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span className="font-medium">Subjects:</span> {job.subject.join(', ')}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-medium">Location:</span> {job.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-medium">Days:</span> {job.days_per_week || 'Negotiable'} days/week
                    </div>
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-primary" />
                      <span className="font-medium">Salary:</span> {job.salary_range || 'Negotiable'}
                    </div>
                  </div>
                </div>
                
                <div className="flex md:flex-col items-center justify-center md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0">
                  <button 
                    onClick={() => handleApply(job.id)}
                    disabled={applyingId === job.id}
                    className="btn-primary w-full md:w-32 py-3"
                  >
                    {applyingId === job.id ? 'Applying...' : 'Apply Now'}
                  </button>
                  <p className="text-xs text-slate-500 text-center mt-2 hidden md:block">
                    Applied tutors get updates directly from admin.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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

export default JobBoard;
