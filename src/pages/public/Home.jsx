import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, BookOpen, Users, CheckCircle, Star, GraduationCap, ArrowRight, Video, Target, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const Home = () => {
  const navigate = useNavigate();
  const { setShowRoleMismatchModal } = useOutletContext() || {};
  const { session, profile } = useAuthStore();

  const [searchLocation, setSearchLocation] = useState('');
  const [searchClass, setSearchClass] = useState('');
  const [dbLocations, setDbLocations] = useState([]);
  const [dbClasses, setDbClasses] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    const fetchSearchOptions = async () => {
      try {
        const { data, error } = await supabase
          .from('tuition_requests')
          .select('student_class, location')
          .eq('status', 'open');
        
        if (data) {
          // Unique Classes
          const classes = Array.from(new Set(data.map(item => item.student_class).filter(Boolean))).sort();
          setDbClasses(classes);

          // Unique Locations
          const locations = Array.from(new Set(data.map(item => item.location).filter(Boolean))).sort();
          setDbLocations(locations);
        }
      } catch (err) {
        console.error("Error fetching search options from database:", err);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchSearchOptions();
  }, []);

  const handleBecomeTutorClick = (e) => {
    if (!session) {
      navigate('/register?role=tutor');
    } else if (profile?.role === 'tutor') {
      navigate('/tutor/dashboard');
    } else if (profile?.role === 'guardian') {
      e.preventDefault();
      if (setShowRoleMismatchModal) {
        setShowRoleMismatchModal(true);
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchLocation) params.append('location', searchLocation);
    if (searchClass) params.append('class', searchClass);
    navigate(`/job-board?${params.toString()}`);
  };

  return (
    <div className="bg-white text-black font-sans overflow-hidden">
      
      {/* 
        HERO SECTION - Strict Light Green (#86c240), White, Black
      */}
      <section className="relative bg-primary pt-20 pb-32 overflow-hidden rounded-b-[40px] md:rounded-b-[80px]">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white blur-3xl"
          ></motion.div>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            className="absolute top-40 -left-24 w-72 h-72 rounded-full bg-black blur-3xl"
          ></motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            
            {/* Hero Text */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex-1 text-center lg:text-left text-white"
            >
              <motion.div variants={fadeInUp} className="inline-block px-4 py-1.5 bg-black/20 backdrop-blur-sm rounded-full text-sm font-semibold tracking-wide mb-6 text-white border border-white/30">
                🎓 Country's #1 Tutor Matching Platform
              </motion.div>
              <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 text-white drop-shadow-sm">
                LEARN. GROW. ACHIEVE. <br className="hidden md:block" /> 
                <span className="text-black bg-white px-2 mt-2 inline-block rounded-md shadow-lg transform -rotate-1">With TutorCore</span>
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto lg:mx-0 font-medium">
                Connect with verified, expert tutors across the country for home, online, or group tuition. Making your children's learning fun and comprehensive.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <Link to="/find-tutors" className="bg-black text-white py-4 px-8 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-2xl hover:bg-neutral-800 hover:-translate-y-1 transform transition-all border border-black">
                  Hire a Tutor <ArrowRight className="w-5 h-5" />
                </Link>
                <button 
                  onClick={handleBecomeTutorClick}
                  className="bg-white text-black py-4 px-8 rounded-xl font-bold text-lg hover:bg-neutral-100 transition-colors shadow-2xl flex items-center justify-center border border-white animate-in"
                >
                  Become a Tutor
                </button>
              </motion.div>
            </motion.div>

            {/* Hero Search Box (similar to tutorcorebd) */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
              className="w-full lg:w-[450px]"
            >
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl border-4 border-black/5">
                <h3 className="text-2xl font-black text-black mb-6 text-center tracking-tight">Find Your Tutor</h3>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-bold text-black mb-1">Select Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 text-neutral-400 w-5 h-5" />
                      <select 
                        className="w-full pl-10 pr-4 py-3 bg-neutral-50 border-2 border-neutral-200 rounded-xl focus:ring-0 focus:border-primary outline-none transition-all appearance-none font-medium text-black cursor-pointer"
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                      >
                        <option value="">All Locations</option>
                        {dbLocations.length > 0 ? (
                          dbLocations.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))
                        ) : (
                          <>
                            <option value="Dhaka">Dhaka</option>
                            <option value="Chattogram">Chattogram</option>
                            <option value="Sylhet">Sylhet</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-bold text-black mb-1">Select Class/Subject</label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-3.5 text-neutral-400 w-5 h-5" />
                      <select 
                        className="w-full pl-10 pr-4 py-3 bg-neutral-50 border-2 border-neutral-200 rounded-xl focus:ring-0 focus:border-primary outline-none transition-all appearance-none font-medium text-black cursor-pointer"
                        value={searchClass}
                        onChange={(e) => setSearchClass(e.target.value)}
                      >
                        <option value="">All Classes</option>
                        {dbClasses.length > 0 ? (
                          dbClasses.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))
                        ) : (
                          <>
                            <option value="Class 10">Class 10</option>
                            <option value="HSC">HSC</option>
                            <option value="SSC">SSC</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-bold text-lg mt-2 transition-colors flex items-center justify-center gap-2 shadow-lg">
                    <Search className="w-5 h-5" /> Search Tuitions
                  </button>
                </form>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* STATS SECTION - Overlapping the hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-16 mb-20">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="bg-black rounded-3xl shadow-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-neutral-800"
        >
          <div className="text-center px-4 group">
            <div className="text-4xl font-black text-primary mb-2 group-hover:scale-110 transition-transform">15k+</div>
            <div className="text-sm font-bold text-white uppercase tracking-wider">Expert Tutors</div>
          </div>
          <div className="text-center px-4 group">
            <div className="text-4xl font-black text-primary mb-2 group-hover:scale-110 transition-transform">50k+</div>
            <div className="text-sm font-bold text-white uppercase tracking-wider">Happy Students</div>
          </div>
          <div className="text-center px-4 group">
            <div className="text-4xl font-black text-primary mb-2 group-hover:scale-110 transition-transform">4.9</div>
            <div className="text-sm font-bold text-white uppercase tracking-wider">Average Rating</div>
          </div>
          <div className="text-center px-4 group">
            <div className="text-4xl font-black text-primary mb-2 group-hover:scale-110 transition-transform">64</div>
            <div className="text-sm font-bold text-white uppercase tracking-wider">Districts Covered</div>
          </div>
        </motion.div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-20 bg-neutral-50 border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-black text-black mb-4">How TutorCore Works</h2>
            <div className="w-24 h-1.5 bg-primary mx-auto mb-6 rounded-full"></div>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto font-medium">Get your desired tutor in three simple steps.</p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-12 relative"
          >
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-neutral-300 border-t border-dashed border-neutral-400 -z-10"></div>

            <motion.div variants={fadeInUp} className="bg-white p-8 rounded-3xl shadow-xl border border-neutral-100 text-center relative group">
              <div className="w-20 h-20 mx-auto bg-black text-primary rounded-2xl flex items-center justify-center mb-6 shadow-2xl rotate-3 group-hover:rotate-12 transition-transform duration-300 border border-neutral-800">
                <Target className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-black mb-3">1. Post Request</h3>
              <p className="text-neutral-600 font-medium leading-relaxed">Tell us what you need. Specify the subject, class, location, and your budget.</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-white p-8 rounded-3xl shadow-xl border border-neutral-100 text-center relative group">
              <div className="w-20 h-20 mx-auto bg-primary text-black rounded-2xl flex items-center justify-center mb-6 shadow-2xl -rotate-3 group-hover:-rotate-12 transition-transform duration-300">
                <Search className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-black mb-3">2. Get Profiles</h3>
              <p className="text-neutral-600 font-medium leading-relaxed">Our admins match your requirements with the best verified tutors in your area.</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-white p-8 rounded-3xl shadow-xl border border-neutral-100 text-center relative group">
              <div className="w-20 h-20 mx-auto bg-black text-primary rounded-2xl flex items-center justify-center mb-6 shadow-2xl rotate-3 group-hover:rotate-12 transition-transform duration-300 border border-neutral-800">
                <GraduationCap className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-black mb-3">3. Start Learning</h3>
              <p className="text-neutral-600 font-medium leading-relaxed">Select your preferred tutor, finalize the schedule, and start achieving your goals.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* WHY CHOOSE US SECTION */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex-1 space-y-8"
            >
              <div className="inline-block px-4 py-1.5 bg-neutral-100 text-black font-black rounded-full text-sm tracking-widest border border-neutral-200">
                WHY CHOOSE TUTORCORE
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-black leading-tight">
                We Ensure <span className="text-primary underline decoration-4 underline-offset-4 decoration-black">Quality Education</span> For Everyone
              </h2>
              <p className="text-lg text-neutral-600 leading-relaxed font-medium">
                TutorCore is not just a platform; it's a commitment to your academic success. We act as a reliable middleman to ensure safety, quality, and guaranteed results.
              </p>
              
              <ul className="space-y-6">
                <motion.li whileHover={{ x: 10 }} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-100 cursor-default">
                  <div className="mt-1 bg-primary text-black p-2 rounded-full shadow-md"><CheckCircle className="w-6 h-6" /></div>
                  <div>
                    <h4 className="font-black text-xl text-black">100% Verified Tutors</h4>
                    <p className="text-neutral-600 font-medium mt-1">We personally verify the educational background and identity of every tutor.</p>
                  </div>
                </motion.li>
                <motion.li whileHover={{ x: 10 }} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-100 cursor-default">
                  <div className="mt-1 bg-black text-primary p-2 rounded-full shadow-md"><Heart className="w-6 h-6" /></div>
                  <div>
                    <h4 className="font-black text-xl text-black">Perfect Matching</h4>
                    <p className="text-neutral-600 font-medium mt-1">Our admins handpick tutors based on your specific requirements and student psychology.</p>
                  </div>
                </motion.li>
                <motion.li whileHover={{ x: 10 }} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-100 cursor-default">
                  <div className="mt-1 bg-primary text-black p-2 rounded-full shadow-md"><Video className="w-6 h-6" /></div>
                  <div>
                    <h4 className="font-black text-xl text-black">Flexible Learning Modes</h4>
                    <p className="text-neutral-600 font-medium mt-1">Choose between home tutoring, online sessions, or group batches.</p>
                  </div>
                </motion.li>
              </ul>
            </motion.div>
            
            {/* Visual Graphic Representation */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex-1 relative w-full"
            >
              <div className="w-full aspect-square bg-primary rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -z-10 blur-3xl opacity-20"></div>
              <div className="grid grid-cols-2 gap-6 relative z-10">
                <div className="space-y-6 mt-12">
                  <motion.div whileHover={{ y: -10 }} className="bg-white p-8 rounded-[2rem] shadow-2xl border-2 border-black flex flex-col items-center text-center">
                    <BookOpen className="w-14 h-14 text-black mb-4" />
                    <h4 className="font-black text-xl text-black">Academic</h4>
                  </motion.div>
                  <motion.div whileHover={{ y: -10 }} className="bg-black p-8 rounded-[2rem] shadow-2xl border-2 border-black flex flex-col items-center text-center text-white">
                    <Users className="w-14 h-14 text-primary mb-4" />
                    <h4 className="font-black text-xl">Group Batch</h4>
                  </motion.div>
                </div>
                <div className="space-y-6">
                  <motion.div whileHover={{ y: -10 }} className="bg-primary p-8 rounded-[2rem] shadow-2xl border-2 border-black flex flex-col items-center text-center text-black">
                    <Star className="w-14 h-14 mb-4" />
                    <h4 className="font-black text-xl">Test Prep</h4>
                  </motion.div>
                  <motion.div whileHover={{ y: -10 }} className="bg-white p-8 rounded-[2rem] shadow-2xl border-2 border-black flex flex-col items-center text-center">
                    <Video className="w-14 h-14 text-black mb-4" />
                    <h4 className="font-black text-xl text-black">Online Tuition</h4>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA SECTION - High Contrast Black & Primary */}
      <section className="bg-black py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#86c240 2px, transparent 2px)", backgroundSize: "30px 30px" }}></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto px-4 relative z-10"
        >
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Ready to Start Learning?</h2>
          <div className="w-32 h-2 bg-primary mx-auto mb-8 rounded-full"></div>
          <p className="text-xl text-white/80 mb-12 font-medium max-w-2xl mx-auto">Join thousands of students who have already boosted their grades with TutorCore.</p>
          <Link to="/register" className="inline-block bg-primary text-black py-5 px-12 rounded-2xl font-black text-xl hover:bg-primary-dark transition-colors shadow-[0_0_40px_rgba(134,194,64,0.5)] hover:shadow-[0_0_60px_rgba(134,194,64,0.7)] hover:-translate-y-2 transform border-2 border-black">
            GET STARTED NOW
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
