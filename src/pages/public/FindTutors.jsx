import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Filter, MapPin, Users, User, CheckCircle, Award, Compass, Sparkles, Clock, ChevronRight, ChevronLeft, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VerifiedBadge from '../../components/common/VerifiedBadge';

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

const getTutorProfile = (tutor) => {
  if (!tutor) return {};
  const tp = tutor.tutor_profiles;
  if (!tp) return {};
  return Array.isArray(tp) ? (tp[0] || {}) : tp;
};

const FindTutors = () => {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]);
  const [filteredTutors, setFilteredTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter Modal & Search results states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [showAllTutors, setShowAllTutors] = useState(false);

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
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          role,
          created_at,
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

  const hasActiveFilters = 
    showAllTutors ||
    searchTerm.trim() !== '' ||
    selectedCity !== '' ||
    selectedArea !== '' ||
    selectedGender !== '' ||
    selectedUni.trim() !== '' ||
    selectedSubject.trim() !== '';

  const activeFiltersCount = [
    selectedCity,
    selectedArea,
    selectedGender,
    selectedUni,
    selectedSubject
  ].filter(val => val && val.trim() !== '').length;

  useEffect(() => {
    let result = [...tutors];

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => {
        const nameMatches = t.full_name?.toLowerCase().includes(term);
        const tp = getTutorProfile(t);
        const uniMatches = tp.university?.toLowerCase().includes(term);
        const bioMatches = tp.bio?.toLowerCase().includes(term);
        return nameMatches || uniMatches || bioMatches;
      });
    }

    if (selectedCity) {
      result = result.filter(t => {
        const tp = getTutorProfile(t);
        return tp.current_city?.toLowerCase() === selectedCity.toLowerCase();
      });
    }

    if (selectedArea) {
      result = result.filter(t => {
        const tp = getTutorProfile(t);
        return tp.preferred_locations?.some(loc => loc.toLowerCase().includes(selectedArea.toLowerCase()));
      });
    }

    if (selectedGender) {
      result = result.filter(t => {
        const tp = getTutorProfile(t);
        return tp.gender?.toLowerCase() === selectedGender.toLowerCase();
      });
    }

    if (selectedUni.trim() !== '') {
      const uni = selectedUni.toLowerCase();
      result = result.filter(t => {
        const tp = getTutorProfile(t);
        return tp.university?.toLowerCase().includes(uni);
      });
    }

    if (selectedSubject.trim() !== '') {
      const sub = selectedSubject.toLowerCase();
      result = result.filter(t => {
        const tp = getTutorProfile(t);
        return tp.preferred_subjects?.some(s => s.toLowerCase().includes(sub));
      });
    }

    setFilteredTutors(result);
  }, [tutors, searchTerm, selectedCity, selectedArea, selectedGender, selectedUni, selectedSubject]);

  const getTutorCategory = (tutor) => {
    const tp = getTutorProfile(tutor);
    if (tp.tutor_category && tp.tutor_category !== 'New Tutors' && tp.tutor_category !== 'None') {
      return tp.tutor_category;
    }
    
    const createdAt = new Date(tutor.created_at || Date.now());
    const diffTime = Math.abs(Date.now() - createdAt);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 10) {
      return 'New Tutors';
    }
    
    return tp.tutor_category || 'None';
  };

  const exclusiveTutors = tutors.filter(t => getTutorCategory(t) === 'Exclusive Tutors');
  const premiumTutors = tutors.filter(t => getTutorCategory(t) === 'Premium Tutors');
  const verifiedTutors = tutors.filter(t => getTutorCategory(t) === 'Verified Tutors' || getTutorProfile(t).is_verified);
  const newTutors = tutors.filter(t => getTutorCategory(t) === 'New Tutors');

  const stats = {
    total: tutors.length,
    male: tutors.filter(t => getTutorProfile(t).gender?.toLowerCase() === 'male').length,
    female: tutors.filter(t => getTutorProfile(t).gender?.toLowerCase() === 'female').length
  };

  const cityItems = cities
    .filter(c => c !== 'All')
    .map(city => {
      const count = tutors.filter(t => {
        const tp = getTutorProfile(t);
        return tp.current_city?.toLowerCase() === city.toLowerCase();
      }).length;
      return { city, count };
    });


  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCity('');
    setSelectedArea('');
    setSelectedGender('');
    setSelectedUni('');
    setSelectedSubject('');
    setShowAllTutors(false);
    setIsFilterModalOpen(false);
  };

  const VerticalTutorCard = ({ tutor, isGrid = false }) => {
    const tp = getTutorProfile(tutor);
    const userInitial = tutor.full_name ? tutor.full_name.charAt(0).toUpperCase() : 'T';
    const isVerified = tp.is_verified || tp.tutor_category === 'Verified Tutors';
    const isPremium = tp.tutor_category === 'Premium Tutors';
    
    return (
      <div 
        className={`group/card bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-visible flex flex-col items-center pt-8 pb-5 cursor-pointer relative ${isGrid ? 'w-full' : 'flex-shrink-0 w-[240px]'}`}
        onClick={() => navigate(`/tutor/${tutor.id}`)}
      >
        
        {/* Profile Image with Organic/Stylized Border or Ring */}
        <div className="relative mb-5">
          <div className="relative">
            {tp.photo_url ? (
              <img 
                src={tp.photo_url} 
                alt={tutor.full_name} 
                className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-md group-hover/card:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-3xl font-black shadow-md border-4 border-slate-50 group-hover/card:scale-105 transition-transform duration-300">
                {userInitial}
              </div>
            )}
            
            {/* Organic curved shape wrapper / outline around avatar */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#86c240]/40 -m-1.5 animate-[spin_20s_linear_infinite] group-hover/card:border-solid group-hover/card:border-[#86c240]/70 transition-all duration-300"></div>
          </div>

          {/* Badge under profile image */}
          {isPremium && (
            <div className="absolute -bottom-3 right-1/2 translate-x-1/2 bg-amber-500 text-white rounded-full p-1 shadow-md border border-white flex items-center justify-center">
              <Award className="w-4 h-4 fill-current" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-center px-4 mb-5 w-full flex-grow flex flex-col justify-center">
          {/* Category Tag */}
          <div className="mb-2">
            {isPremium ? (
              <span className="inline-block text-[10px] font-black tracking-wider uppercase text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">Premium Tutor</span>
            ) : isVerified ? (
              <span className="inline-block text-[10px] font-black tracking-wider uppercase text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">Verified Tutor</span>
            ) : (
              <span className="inline-block text-[10px] font-black tracking-wider uppercase text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-full">Tutor</span>
            )}
          </div>

          <h4 className="font-extrabold text-slate-800 text-base md:text-lg tracking-tight truncate flex items-center justify-center gap-0.5">
            {tutor.full_name}
            {isVerified && <VerifiedBadge size={16} />}
          </h4>
          {tp.rating > 0 && (
            <div className="flex gap-0.5 mt-1.5 justify-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < tp.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
          )}
          
          <p className="text-xs font-bold text-slate-500 truncate mt-1">
            {tp.university || 'No education info'}
          </p>
          
          <div className="flex items-center justify-center gap-1 mt-2 text-xs font-bold text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-[#86c240]" />
            <span className="truncate">{tp.current_city || 'N/A'}</span>
          </div>
        </div>

        {/* Bottom Button */}
        <div className="w-full px-4">
          <button className="w-full bg-[#1e293b] hover:bg-[#86c240] group-hover/card:bg-[#86c240] text-white font-extrabold py-3 text-sm transition-all duration-300 rounded-xl shadow-md">
            View Profile
          </button>
        </div>
      </div>
    );
  };

  const TutorRowCarousel = ({ title, list }) => {
    const internalRef = useRef(null);
    if (list.length === 0) return null;
    
    const scroll = (direction) => {
      if (internalRef.current) {
        const { scrollLeft, clientWidth } = internalRef.current;
        const scrollAmount = clientWidth * 0.75;
        internalRef.current.scrollTo({
          left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
          behavior: 'smooth'
        });
      }
    };

    return (
      <div className="space-y-6 relative group/carousel">
        <div className="flex items-center justify-between">
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{title}</h3>
          <button 
            onClick={() => setShowAllTutors(true)}
            className="flex items-center gap-1.5 bg-[#86c240] hover:bg-[#6a9c31] text-white text-sm font-bold px-4 py-2 rounded-full transition-colors shadow-sm"
          >
            See all <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative flex items-center w-full">
          {/* Left Arrow Button */}
          <button 
            onClick={() => scroll('left')}
            className="absolute -left-4 sm:-left-6 z-20 w-12 h-12 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-700 hover:text-[#86c240] hover:scale-105 transition-all opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Carousel container */}
          <div 
            ref={internalRef}
            className="flex gap-6 overflow-x-auto w-full pb-4 scroll-smooth no-scrollbar scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {list.map(tutor => (
              <VerticalTutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>

          {/* Right Arrow Button */}
          <button 
            onClick={() => scroll('right')}
            className="absolute -right-4 sm:-right-6 z-20 w-12 h-12 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-700 hover:text-[#86c240] hover:scale-105 transition-all opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 py-12 md:py-16 space-y-16">
        
        {/* Top Hero Section */}
        <div className="space-y-10 max-w-4xl mx-auto">
          {/* Header Title Section */}
          <div className="text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-[#86c240] text-sm font-bold tracking-wider shadow-sm">
              <Sparkles className="w-4 h-4 fill-[#86c240]/20" /> Direct matching system
            </span>
            <h1 className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight leading-tight">
              Hire the <span className="bg-gradient-to-r from-[#86c240] to-emerald-600 bg-clip-text text-transparent">best qualified tutors</span> with a few clicks!
            </h1>
            <p className="text-slate-500 text-base md:text-lg max-w-xl mx-auto font-medium">
              Connect with verified professional educators in your area. Real-time statistics fetched directly from our database.
            </p>
          </div>

          {/* Location Carousel Pills */}
          <div className="relative w-full max-w-3xl mx-auto overflow-hidden bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-full px-2 py-2 shadow-sm">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10" />

            <style dangerouslySetInnerHTML={{__html: `
              @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee-loop {
                display: flex;
                width: max-content;
                animation: marquee 35s linear infinite;
              }
              .animate-marquee-loop:hover {
                animation-play-state: paused;
              }
              .no-scrollbar::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}} />

            <div className="animate-marquee-loop flex items-center gap-8 pr-8">
              {/* First copy */}
              {cityItems.map((item, idx) => (
                <button
                  key={`c1-${idx}`}
                  onClick={() => {
                    setSelectedCity(item.city);
                  }}
                  className="text-sm font-bold text-slate-600 hover:text-[#86c240] transition-colors flex items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-100"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#86c240] animate-pulse"></span>
                  <span className="font-bold tracking-wider">{item.city}</span>
                  <span className="bg-slate-100 text-slate-500 text-xs px-1.5 py-0.5 rounded font-black">
                    {item.count}
                  </span>
                </button>
              ))}
              {/* Second copy for seamless looping */}
              {cityItems.map((item, idx) => (
                <button
                  key={`c2-${idx}`}
                  onClick={() => {
                    setSelectedCity(item.city);
                  }}
                  className="text-sm font-bold text-slate-600 hover:text-[#86c240] transition-colors flex items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-100"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#86c240] animate-pulse"></span>
                  <span className="font-bold tracking-wider">{item.city}</span>
                  <span className="bg-slate-100 text-slate-500 text-xs px-1.5 py-0.5 rounded font-black">
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 pt-2">
            {/* Total Tutors */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-5 hover:-translate-y-1 hover:shadow-md hover:border-[#86c240]/40 transition-all duration-300 group">
              <div className="bg-gradient-to-br from-[#86c240] to-[#75ab35] w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-[#86c240]/10 group-hover:scale-105 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-800 leading-none mb-1.5 tracking-tight">
                  {stats.total.toLocaleString()}
                </h2>
                <p className="text-xs md:text-sm text-slate-400 font-extrabold tracking-widest">Total tutors</p>
              </div>
            </div>

            {/* Male Tutors */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-5 hover:-translate-y-1 hover:shadow-md hover:border-[#86c240]/40 transition-all duration-300 group">
              <div className="bg-gradient-to-br from-[#86c240] to-[#75ab35] w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-[#86c240]/10 group-hover:scale-105 transition-transform duration-300">
                <User className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-800 leading-none mb-1.5 tracking-tight">
                  {stats.male.toLocaleString()}
                </h2>
                <p className="text-xs md:text-sm text-slate-400 font-extrabold tracking-widest">Male tutors</p>
              </div>
            </div>

            {/* Female Tutors */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-5 hover:-translate-y-1 hover:shadow-md hover:border-[#86c240]/40 transition-all duration-300 group">
              <div className="bg-gradient-to-br from-[#86c240] to-[#75ab35] w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-[#86c240]/10 group-hover:scale-105 transition-transform duration-300">
                <User className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-800 leading-none mb-1.5 tracking-tight">
                  {stats.female.toLocaleString()}
                </h2>
                <p className="text-xs md:text-sm text-slate-400 font-extrabold tracking-widest">Female tutors</p>
              </div>
            </div>
          </div>

          {/* Interactive Large Search Bar & Filter Modal Toggle */}
          <div className="relative pt-4">
            <div className="relative flex items-center gap-4">
              <div className="relative flex-1 flex items-center">
                <input 
                  type="text"
                  placeholder="Search by tutor name, university, or background..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-full bg-white shadow-md hover:shadow-lg focus:shadow-lg focus:ring-2 focus:ring-[#86c240] focus:border-transparent transition-all duration-300 border border-slate-200/60 text-slate-700 text-lg focus:outline-none"
                />
                <Search className="w-6 h-6 text-slate-400 absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              
              {/* Filter button */}
              <button 
                onClick={() => setIsFilterModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-6 py-5 rounded-full font-bold text-base transition-all duration-300 shadow-md hover:shadow-lg border border-slate-200/60 shrink-0"
              >
                <Filter className="w-5 h-5 text-[#86c240]" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-[#86c240] text-white text-xs font-black px-2 py-0.5 rounded-full ml-1">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Loading / Results Content Section */}
        {loading ? (
          <div className="flex justify-center items-center py-32 text-slate-400 font-bold text-lg">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#86c240] mr-4"></div>
            Loading tutors...
          </div>
        ) : hasActiveFilters ? (
          
          /* ACTIVE FILTER SEARCH RESULTS */
          <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Search results</h2>
                <p className="text-slate-500 font-medium text-base mt-1">
                  Found {filteredTutors.length} {filteredTutors.length === 1 ? 'tutor' : 'tutors'} matching your criteria.
                </p>
              </div>
              <button
                onClick={handleClearFilters}
                className="text-base font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100/60 px-4 py-2 rounded-full border border-rose-100"
              >
                Clear all filters
              </button>
            </div>

            {/* Active Filter Chips */}
            <div className="flex flex-wrap gap-2.5">
              {selectedCity && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold border border-slate-200">
                  City: {selectedCity}
                  <button onClick={() => setSelectedCity('')} className="hover:text-rose-500 font-bold ml-1 text-base">×</button>
                </span>
              )}
              {selectedArea && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold border border-slate-200">
                  Area: {selectedArea}
                  <button onClick={() => setSelectedArea('')} className="hover:text-rose-500 font-bold ml-1 text-base">×</button>
                </span>
              )}
              {selectedGender && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold border border-slate-200">
                  Gender: {selectedGender}
                  <button onClick={() => setSelectedGender('')} className="hover:text-rose-500 font-bold ml-1 text-base">×</button>
                </span>
              )}
              {selectedUni && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold border border-slate-200">
                  University: {selectedUni}
                  <button onClick={() => setSelectedUni('')} className="hover:text-rose-500 font-bold ml-1 text-base">×</button>
                </span>
              )}
              {selectedSubject && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold border border-slate-200">
                  Subject: {selectedSubject}
                  <button onClick={() => setSelectedSubject('')} className="hover:text-rose-500 font-bold ml-1 text-base">×</button>
                </span>
              )}
            </div>

            {filteredTutors.length === 0 ? (
              <div className="bg-white p-20 rounded-2xl text-center border border-slate-150 shadow-sm max-w-2xl mx-auto space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-700">No matching tutors found</h3>
                <p className="text-slate-500 text-base max-w-sm mx-auto">
                  We couldn't find any tutors matching those criteria. Try expanding your search or clearing some filters.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="mt-2 bg-[#86c240] hover:bg-[#75ab35] text-white font-bold px-6 py-2.5 rounded-full text-base transition-colors"
                >
                  Reset all search criteria
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredTutors.map(tutor => (
                  <VerticalTutorCard key={tutor.id} tutor={tutor} isGrid={true} />
                ))}
              </div>
            )}
          </div>

        ) : (
          
          /* HUB CATEGORIES VIEW */
          <div className="space-y-16 pb-16 max-w-6xl mx-auto">
            <TutorRowCarousel title="Premium Tutors" list={premiumTutors} />
            <TutorRowCarousel title="Verified Tutors" list={verifiedTutors} />
            <TutorRowCarousel title="New Tutors" list={newTutors} />
            <TutorRowCarousel title="All Tutors" list={tutors} />
            {exclusiveTutors.length > 0 && <TutorRowCarousel title="Exclusive Tutors" list={exclusiveTutors} />}
          </div>
        )}
      </div>

      {/* Advanced Filter Modal Component */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {/* Modal Background click to close */}
          <div className="absolute inset-0 cursor-default" onClick={() => setIsFilterModalOpen(false)} />
          
          {/* Modal Card */}
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center bg-slate-50 px-8 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#86c240]" /> Advanced filters
                </h3>
                <p className="text-slate-500 text-sm mt-0.5">Narrow down tutor profiles by criteria</p>
              </div>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold bg-slate-100 hover:bg-slate-200/80 w-9 h-9 rounded-full flex items-center justify-center transition-colors focus:outline-none"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-5">
                {/* City */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">City</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                      setSelectedArea('');
                    }}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-700 focus:outline-none focus:border-[#86c240] focus:ring-2 focus:ring-[#86c240]/25 transition-all"
                  >
                    <option value="">All cities</option>
                    {cities.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Area */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Area</label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    disabled={!selectedCity}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-700 focus:outline-none focus:border-[#86c240] focus:ring-2 focus:ring-[#86c240]/25 transition-all disabled:opacity-50"
                  >
                    <option value="">All areas</option>
                    {selectedCity && LOCATIONS_BY_CITY[selectedCity]?.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Gender</label>
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-700 focus:outline-none focus:border-[#86c240] focus:ring-2 focus:ring-[#86c240]/25 transition-all"
                  >
                    <option value="">Any gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* University */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">University / Institution</label>
                  <input 
                    type="text"
                    placeholder="e.g. BUET, SUST"
                    value={selectedUni}
                    onChange={(e) => setSelectedUni(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-700 focus:outline-none focus:border-[#86c240] focus:ring-2 focus:ring-[#86c240]/25 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Subject */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-700 focus:outline-none focus:border-[#86c240] focus:ring-2 focus:ring-[#86c240]/25 transition-all"
                  >
                    <option value="">All subjects</option>
                    {[
                      'Math', 'Physics', 'Chemistry', 'Biology', 'English', 'Bangla', 'ICT', 'General Science', 
                      'Accounting', 'Finance', 'General Math', 'Higher Math', 'Management', 'Economics', 
                      'Sociology', 'Civics', 'History', 'Geography', 'Religion', 'Agriculture', 'Statistics'
                    ].sort().map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center px-8 py-5 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => {
                  handleClearFilters();
                  setIsFilterModalOpen(false);
                }}
                className="text-base font-bold text-rose-500 hover:text-rose-600 transition-colors"
              >
                Reset filters
              </button>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="bg-[#86c240] hover:bg-[#75ab35] text-white font-bold px-8 py-3 rounded-full text-base shadow-md shadow-[#86c240]/25 transition-all"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindTutors;

