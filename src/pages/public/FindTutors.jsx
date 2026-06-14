import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Filter, MapPin, BookOpen, User, GraduationCap, DollarSign, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const FindTutors = () => {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]);
  const [filteredTutors, setFilteredTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedUni, setSelectedUni] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const fetchTutors = async () => {
    setLoading(true);
    try {
      // Fetch users who have role 'tutor' and join their tutor profiles
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          role,
          tutor_profiles (*)
        `)
        .eq('role', 'tutor');

      if (error) throw error;
      setTutors(data || []);
    } catch (err) {
      console.error('Error fetching tutors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutors();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = [...tutors];

    // Search term (searches name, university, bio)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => {
        const nameMatches = t.full_name?.toLowerCase().includes(term);
        const tp = t.tutor_profiles?.[0] || {};
        const uniMatches = tp.university?.toLowerCase().includes(term);
        const bioMatches = tp.bio?.toLowerCase().includes(term);
        return nameMatches || uniMatches || bioMatches;
      });
    }

    // City Filter
    if (selectedCity) {
      result = result.filter(t => {
        const tp = t.tutor_profiles?.[0] || {};
        return tp.current_city?.toLowerCase() === selectedCity.toLowerCase();
      });
    }

    // Area/Location Filter
    if (selectedArea) {
      result = result.filter(t => {
        const tp = t.tutor_profiles?.[0] || {};
        return tp.preferred_locations?.some(loc => loc.toLowerCase().includes(selectedArea.toLowerCase()));
      });
    }

    // Gender Filter
    if (selectedGender) {
      result = result.filter(t => {
        const tp = t.tutor_profiles?.[0] || {};
        return tp.gender?.toLowerCase() === selectedGender.toLowerCase();
      });
    }

    // University Filter
    if (selectedUni.trim() !== '') {
      const uni = selectedUni.toLowerCase();
      result = result.filter(t => {
        const tp = t.tutor_profiles?.[0] || {};
        return tp.university?.toLowerCase().includes(uni);
      });
    }

    // Subject Filter
    if (selectedSubject.trim() !== '') {
      const sub = selectedSubject.toLowerCase();
      result = result.filter(t => {
        const tp = t.tutor_profiles?.[0] || {};
        return tp.preferred_subjects?.some(s => s.toLowerCase().includes(sub));
      });
    }

    setFilteredTutors(result);
  }, [tutors, searchTerm, selectedCity, selectedArea, selectedGender, selectedUni, selectedSubject]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Find Tutors</h2>
        <p className="text-sm font-medium text-slate-400 mt-1">
          Search and filter verified professional tutors for your needs.
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        
        {/* Left Side: Advanced Filters */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 h-fit lg:sticky lg:top-24">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-3">
            <Filter className="w-4 h-4 text-[#86c240]" /> Advanced Filters
          </h3>

          {/* City Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Select City</label>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setSelectedArea('');
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
            >
              <option value="">All Cities</option>
              {cities.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Area Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Preferred Area</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              disabled={!selectedCity}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#86c240] disabled:opacity-50"
            >
              <option value="">All Areas</option>
              {selectedCity && LOCATIONS_BY_CITY[selectedCity]?.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Tutor Gender</label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
            >
              <option value="">Any Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* University Search */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">University</label>
            <input 
              type="text"
              placeholder="e.g. BUET, SUST"
              value={selectedUni}
              onChange={(e) => setSelectedUni(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
            />
          </div>

          {/* Subject Search */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Subject</label>
            <input 
              type="text"
              placeholder="e.g. Math, Physics"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
            />
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCity('');
              setSelectedArea('');
              setSelectedGender('');
              setSelectedUni('');
              setSelectedSubject('');
            }}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Clear Filters
          </button>
        </div>

        {/* Right Side: Search and Tutors Grid */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Top Search Input */}
          <div className="relative">
            <input 
              type="text"
              placeholder="Search tutor name, university, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#86c240] focus:border-transparent shadow-sm"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          </div>

          {/* Tutors Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20 text-slate-400 font-bold text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#86c240] mr-3"></div>
              Loading tutors...
            </div>
          ) : filteredTutors.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl text-center border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-600">No tutors found matching your criteria.</h3>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredTutors.map(tutor => {
                const tp = tutor.tutor_profiles?.[0] || {};
                const userInitial = tutor.full_name ? tutor.full_name.charAt(0).toUpperCase() : 'T';

                return (
                  <div key={tutor.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                    <div>
                      {/* Header (Avatar + Name) */}
                      <div className="flex items-center gap-4 mb-5 pb-4 border-b border-slate-50">
                        <div className="w-12 h-12 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center text-[#86c240] font-black text-xl shadow-inner relative flex-shrink-0">
                          {userInitial}
                          {tp.is_verified && (
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-slate-50">
                              <CheckCircle className="w-4 h-4 text-[#86c240] fill-current text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-800 truncate text-base">{tutor.full_name}</h4>
                          <p className="text-xs text-slate-400 font-bold mt-0.5">{tp.university || 'No education info'}</p>
                        </div>
                      </div>

                      {/* Detail Stats */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                          <GraduationCap className="w-4 h-4 text-[#86c240] flex-shrink-0" />
                          <span className="text-slate-400 font-bold">Dept:</span>
                          <span className="text-slate-800 truncate">{tp.department || 'N/A'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                          <BookOpen className="w-4 h-4 text-[#86c240] flex-shrink-0" />
                          <span className="text-slate-400 font-bold">Subjects:</span>
                          <span className="text-slate-800 truncate" title={tp.preferred_subjects?.join(', ')}>
                            {tp.preferred_subjects?.join(', ') || 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                          <MapPin className="w-4 h-4 text-[#86c240] flex-shrink-0" />
                          <span className="text-slate-400 font-bold">Locations:</span>
                          <span className="text-slate-800 truncate" title={tp.preferred_locations?.join(', ')}>
                            {tp.preferred_locations?.join(', ') || 'N/A'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-3">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                            <User className="w-3.5 h-3.5 text-pink-500" />
                            <span className="text-slate-400">Gender:</span>
                            <span className="text-slate-800">{tp.gender || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                            <DollarSign className="w-3.5 h-3.5 text-[#86c240]" />
                            <span className="text-slate-400">Salary:</span>
                            <span className="text-slate-800 font-black">{tp.expected_salary || 'Negotiable'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* View Profile Action */}
                    <button
                      onClick={() => navigate(`/tutor/${tutor.id}`)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md mt-auto"
                    >
                      View Profile
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindTutors;
