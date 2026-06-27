import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Filter, MapPin, Users, User, CheckCircle, Award, Compass, Sparkles, Clock, ChevronRight, ChevronLeft, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VerifiedBadge from '../../components/common/VerifiedBadge';
import PremiumBadge from '../../components/common/PremiumBadge';

const cities = [
  'All', 'Barishal', 'Chittagong', 'Cumilla', 'Dhaka', 'Gazipur', 'Khulna', 'Mymensingh', 'Narayanganj', 'Rajshahi', 'Rangpur', 'Sylhet'
];

const LOCATIONS_BY_CITY = {
  Barishal: ['BM College', 'C&B Road', 'Natullabad', 'Rupatali', 'Sadar Road'],
  Chittagong: ['Agrabad', 'Chandgaon', 'Chawkbazar', 'Double Mooring', 'GEC Circle', 'Halishahar', 'Khulshi', 'Lalkhan Bazar', 'Nasirabad', 'Patenga'],
  Dhaka: ['Aftabnagar', 'Ati Bazar', 'Badda', 'Banasree', 'Banani', 'Basabo', 'Bashundhara', 'Demra', 'Dhanmondi', 'Farmgate', 'Gulshan', 'Hazaribagh', 'Jatrabari', 'Jigatola', 'Kalyanpur', 'Keraniganj', 'Khilgaon', 'Lalbagh', 'Malibagh', 'Mirpur', 'Mogbazar', 'Mohakhali', 'Mohammadpur', 'Motijheel', 'Old Dhaka', 'Paltan', 'Rampura', 'Savar', 'Shahbagh', 'Tejgaon', 'Uttara', 'Wari'],
  Khulna: ['Boyra', 'Daulatpur', 'Gollamari', 'Khalishpur', 'Rupsha', 'Sonadanga'],
  Mymensingh: ['Charpara', 'Ganginar Par', 'Kewatkhali', 'Sadar', 'Valuka'],
  Rajshahi: ['Boalia', 'Kazihata', 'Motihar', 'Rajshahi University', 'Shaheb Bazar', 'Sopura', 'Talaimari'],
  Rangpur: ['Dhap', 'Jahaz Mor', 'Lalbagh', 'Medical Mor', 'Modern Mor'],
  Sylhet: ['Amberkhana', 'Kumarpara', 'Pathantula', 'Shibgonj', 'Sylhet Sadar', 'Uposahar', 'Zindabazar']
};

const PRESET_COURSES = ['Play', 'Nursery', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'SSC', 'HSC', 'O Level', 'A Level', 'Admission Test'];
const PRESET_CATEGORIES = ['Bangla Medium', 'English Medium', 'English Version', 'Madrasah Medium', 'Cambridge Curriculum', 'Edexcel Curriculum'];

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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

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
    selectedSubject.trim() !== '' ||
    selectedCategory !== '' ||
    selectedCourse !== '';

  const activeFiltersCount = [
    selectedCity,
    selectedArea,
    selectedGender,
    selectedUni,
    selectedSubject,
    selectedCategory,
    selectedCourse
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
        const expMatches = tp.experience?.toLowerCase().includes(term);
        return nameMatches || uniMatches || bioMatches || expMatches;
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

    if (selectedCategory) {
      result = result.filter(t => {
        const tp = getTutorProfile(t);
        return tp.preferred_category?.toLowerCase().includes(selectedCategory.toLowerCase());
      });
    }

    if (selectedCourse) {
      result = result.filter(t => {
        const tp = getTutorProfile(t);
        return tp.preferred_courses?.some(c => c.toLowerCase() === selectedCourse.toLowerCase());
      });
    }

    setFilteredTutors(result);
  }, [tutors, searchTerm, selectedCity, selectedArea, selectedGender, selectedUni, selectedSubject, selectedCategory, selectedCourse]);

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
  const premiumTutors = tutors.filter(t => getTutorProfile(t).is_premium);
  const verifiedTutors = tutors.filter(t => getTutorProfile(t).is_verified);
  const newTutors = tutors.filter(t => getTutorCategory(t) === 'New Tutors');

  const stats = {
    total: tutors.length,
    verified: verifiedTutors.length,
    premium: premiumTutors.length,
    new: newTutors.length
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
    setSelectedCategory('');
    setSelectedCourse('');
    setShowAllTutors(false);
    setIsFilterModalOpen(false);
  };

  const VerticalTutorCard = ({ tutor, isGrid = false }) => {
    const tp = getTutorProfile(tutor);
    const userInitial = tutor.full_name ? tutor.full_name.charAt(0).toUpperCase() : 'T';
    const isVerified = tp.is_verified;
    const isPremium = tp.is_premium;
    
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

          <h4 className="font-extrabold text-slate-800 text-base md:text-lg tracking-tight truncate flex items-center justify-center gap-0.5 relative z-20">
            {tutor.full_name}
            {isVerified && <VerifiedBadge size={16} position="top" />}
            {isPremium && <PremiumBadge size={16} position="top" />}
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
            className="flex gap-6 overflow-x-auto w-full pb-12 pt-24 -my-20 mt-4 scroll-smooth no-scrollbar scrollbar-hide px-2 relative z-10"
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
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Header Title Section */}
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 text-[#86c240] text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 fill-[#86c240]/10" /> Direct Matching System
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight">
              Hire Qualified Tutors with Ease
            </h1>
            <p className="text-slate-500 text-xs md:text-sm max-w-md mx-auto font-medium leading-relaxed">
              Connect with verified professional educators in your area. Real-time statistics fetched directly from our database.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2 bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.015)] max-w-xl mx-auto">
            <div className="text-center space-y-1">
              <p className="text-[10px] font-bold text-slate-400 font-semibold">Total tutors</p>
              <p className="text-xl font-extrabold text-slate-800 leading-none">{stats.total.toLocaleString()}</p>
            </div>
            <div className="text-center space-y-1 border-l border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 font-semibold">Verified tutors</p>
              <p className="text-xl font-extrabold text-[#86c240] leading-none">{stats.verified.toLocaleString()}</p>
            </div>
            <div className="text-center space-y-1 border-l border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 font-semibold">Premium tutors</p>
              <p className="text-xl font-extrabold text-blue-500 leading-none">{stats.premium.toLocaleString()}</p>
            </div>
            <div className="text-center space-y-1 border-l border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 font-semibold">New tutors</p>
              <p className="text-xl font-extrabold text-amber-500 leading-none">{stats.new.toLocaleString()}</p>
            </div>
          </div>

          {/* Location Carousel Pills */}
          <div className="relative w-full max-w-3xl mx-auto overflow-hidden bg-white/60 backdrop-blur-sm border border-slate-100 rounded-full px-2 py-2 shadow-sm">
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
            `}} />

            <div className="animate-marquee-loop flex items-center gap-4 pr-4">
              {/* First copy */}
              {cityItems.map((item, idx) => (
                <button
                  key={`c1-${idx}`}
                  onClick={() => {
                    if (selectedCity === item.city) {
                      setSelectedCity('');
                    } else {
                      setSelectedCity(item.city);
                    }
                  }}
                  className={`text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap px-3.5 py-1.5 rounded-full border ${
                    selectedCity === item.city
                      ? 'bg-[#86c240] border-[#86c240] text-white shadow-sm'
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedCity === item.city ? 'bg-white' : 'bg-[#86c240]'} animate-pulse`}></span>
                  <span className="font-bold tracking-wider">{item.city}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                    selectedCity === item.city ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.count}
                  </span>
                </button>
              ))}
              {/* Second copy for seamless looping */}
              {cityItems.map((item, idx) => (
                <button
                  key={`c2-${idx}`}
                  onClick={() => {
                    if (selectedCity === item.city) {
                      setSelectedCity('');
                    } else {
                      setSelectedCity(item.city);
                    }
                  }}
                  className={`text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap px-3.5 py-1.5 rounded-full border ${
                    selectedCity === item.city
                      ? 'bg-[#86c240] border-[#86c240] text-white shadow-sm'
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedCity === item.city ? 'bg-white' : 'bg-[#86c240]'} animate-pulse`}></span>
                  <span className="font-bold tracking-wider">{item.city}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                    selectedCity === item.city ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar & Filter Toggle */}
          <div className="flex gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <input 
                type="text"
                placeholder="Search tutor name, university, background..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#86c240] focus:border-transparent shadow-sm font-semibold text-slate-800 bg-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
            
            {/* Filter button */}
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center gap-1.5 bg-[#86c240] hover:bg-[#6a9c31] text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm shrink-0"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-white text-[#86c240] text-[9px] font-black px-1.5 py-0.5 rounded-full ml-1 animate-pulse">
                  {activeFiltersCount}
                </span>
              )}
            </button>
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
              {selectedCategory && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold border border-slate-200">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory('')} className="hover:text-rose-500 font-bold ml-1 text-base">×</button>
                </span>
              )}
              {selectedCourse && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold border border-slate-200">
                  Class: {selectedCourse}
                  <button onClick={() => setSelectedCourse('')} className="hover:text-rose-500 font-bold ml-1 text-base">×</button>
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Modal Card */}
          <div className="relative bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsFilterModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5">Tutor Filter</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* City */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Select City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setSelectedArea('');
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
                >
                  <option value="">Select City</option>
                  {cities.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Area */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Area</label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  disabled={!selectedCity}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#86c240] disabled:opacity-50"
                >
                  <option value="">Select Area</option>
                  {selectedCity && LOCATIONS_BY_CITY[selectedCity]?.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
                >
                  <option value="">Select Category</option>
                  {PRESET_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Class */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Class</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
                >
                  <option value="">Select Class</option>
                  {PRESET_COURSES.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Gender</label>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
                >
                  <option value="">Any Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* University */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">University / Institution</label>
                <input 
                  type="text"
                  placeholder="e.g. BUET, Dhaka University"
                  value={selectedUni}
                  onChange={(e) => setSelectedUni(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#86c240] placeholder:text-slate-400"
                />
              </div>

              {/* Subject */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
                >
                  <option value="">Select Subject</option>
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

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button 
                onClick={() => {
                  handleClearFilters();
                  setIsFilterModalOpen(false);
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindTutors;

