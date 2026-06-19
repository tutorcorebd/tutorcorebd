import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, MapPin, BookOpen, Users, CheckCircle, Star, GraduationCap, 
  ArrowRight, Target, Heart, Shield, Clock, Award, 
  Globe, Briefcase, Quote, ChevronRight, PlayCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
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

  useEffect(() => {
    const fetchSearchOptions = async () => {
      try {
        const { data } = await supabase
          .from('tuition_requests')
          .select('student_class, location')
          .eq('status', 'open');
        
        if (data) {
          const classes = Array.from(new Set(data.map(item => item.student_class).filter(Boolean))).sort();
          setDbClasses(classes);

          const locations = Array.from(new Set(data.map(item => item.location).filter(Boolean))).sort();
          setDbLocations(locations);
        }
      } catch (err) {
        console.error("Error fetching search options:", err);
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
      if (setShowRoleMismatchModal) setShowRoleMismatchModal(true);
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
      
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-black pt-28 pb-40 overflow-hidden md:rounded-b-[60px]">
        {/* Abstract shapes for professional feel */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[80%] rounded-full bg-white/10 blur-[100px]"></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[60%] rounded-full bg-black/30 blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Hero Text */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex-1 text-center lg:text-left text-white"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-md rounded-full text-sm font-bold tracking-wide mb-8 text-white border border-white/20">
                <Award className="w-4 h-4 text-primary" /> Country's #1 Tutor Matching Platform
              </motion.div>
              <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-6 text-white drop-shadow-md">
                Find Your <br className="hidden md:block" /> 
                <span className="text-black bg-white px-4 py-1 mt-2 inline-block rounded-xl shadow-2xl transform -rotate-2">Perfect Tutor</span>
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
                Connect with thousands of verified experts across the country for home, online, or group tuition. Experience learning that guarantees results.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <Link to="/find-tutors" className="bg-black text-white py-4 px-8 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-2xl hover:bg-neutral-800 hover:-translate-y-1 transform transition-all border border-black">
                  Hire a Tutor <ArrowRight className="w-5 h-5" />
                </Link>
                <button 
                  onClick={handleBecomeTutorClick}
                  className="bg-white/10 backdrop-blur-md text-white py-4 px-8 rounded-xl font-bold text-lg hover:bg-white/20 transition-all shadow-2xl flex items-center justify-center border border-white/30"
                >
                  Join as Tutor
                </button>
              </motion.div>
            </motion.div>

            {/* Hero Search Box */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
              className="w-full lg:w-[480px]"
            >
              <div className="bg-white p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 border-black">
                <h3 className="text-2xl font-black text-black mb-6 text-center tracking-tight flex items-center justify-center gap-2">
                  <Search className="w-6 h-6 text-primary" /> Start Your Search
                </h3>
                <form onSubmit={handleSearch} className="space-y-5">
                  <div className="relative group">
                    <label className="block text-sm font-bold text-neutral-600 mb-1">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 text-primary w-5 h-5 transition-colors group-focus-within:text-black" />
                      <select 
                        className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border-2 border-neutral-200 rounded-xl focus:ring-0 focus:border-black outline-none transition-all appearance-none font-semibold text-black cursor-pointer"
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                      >
                        <option value="">Anywhere in Bangladesh</option>
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

                  <div className="relative group">
                    <label className="block text-sm font-bold text-neutral-600 mb-1">Class or Subject</label>
                    <div className="relative">
                      <BookOpen className="absolute left-4 top-4 text-primary w-5 h-5 transition-colors group-focus-within:text-black" />
                      <select 
                        className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border-2 border-neutral-200 rounded-xl focus:ring-0 focus:border-black outline-none transition-all appearance-none font-semibold text-black cursor-pointer"
                        value={searchClass}
                        onChange={(e) => setSearchClass(e.target.value)}
                      >
                        <option value="">Any Class / Subject</option>
                        {dbClasses.length > 0 ? (
                          dbClasses.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))
                        ) : (
                          <>
                            <option value="Class 10">Class 10</option>
                            <option value="HSC">HSC</option>
                            <option value="O Level">O Level</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-primary hover:bg-[#75ad36] text-black py-4 rounded-xl font-black text-lg mt-4 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2">
                    Find Tutors Now
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-16 mb-24">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="bg-black rounded-2xl shadow-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-neutral-800 border border-neutral-800"
        >
          {[
            { value: "15k+", label: "Verified Tutors" },
            { value: "50k+", label: "Happy Students" },
            { value: "4.9", label: "Average Rating", icon: <Star className="inline w-5 h-5 mb-1 text-primary fill-primary" /> },
            { value: "64", label: "Districts Covered" }
          ].map((stat, idx) => (
            <div key={idx} className="text-center px-4 group">
              <div className="text-4xl font-black text-primary mb-2 group-hover:scale-105 transition-transform flex items-center justify-center gap-1">
                {stat.value} {stat.icon}
              </div>
              <div className="text-sm font-bold text-neutral-400 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* 3. SERVICE CATEGORIES */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-black mb-4">Explore Categories</h2>
            <div className="w-24 h-1.5 bg-primary mx-auto mb-6 rounded-full"></div>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto font-medium">Find expert tutors across all academic levels and specialized skills.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { title: "Bangla Medium", icon: <BookOpen />, desc: "Class 1 to 12" },
              { title: "English Medium", icon: <Globe />, desc: "O/A Level, Edexcel" },
              { title: "Admission Test", icon: <Target />, desc: "University Prep" },
              { title: "Skill Dev", icon: <Briefcase />, desc: "Coding, Design" },
              { title: "Religious Studies", icon: <Heart />, desc: "Quran, Arabic" },
              { title: "Arts & Crafts", icon: <PlayCircle />, desc: "Drawing, Music" },
              { title: "Language", icon: <Quote />, desc: "IELTS, Spoken" },
              { title: "Test Prep", icon: <Award />, desc: "GRE, SAT, GMAT" }
            ].map((cat, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200 cursor-pointer transition-all flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-colors border border-neutral-100">
                  {cat.icon}
                </div>
                <h3 className="font-bold text-lg text-black mb-1">{cat.title}</h3>
                <p className="text-sm text-neutral-500 font-medium">{cat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW PARENTS CONNECT */}
      <section className="py-24 bg-neutral-50 border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-black mb-4">How It Works For Students/Parents</h2>
            <div className="w-24 h-1.5 bg-primary mx-auto mb-6 rounded-full"></div>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto font-medium">Get the best tutor for your needs in four simple steps.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Desktop Horizontal Connecting Arrows */}
            <div className="hidden md:flex absolute top-[72px] left-[25%] -translate-x-1/2 -translate-y-1/2 text-primary items-center justify-center pointer-events-none">
              <ArrowRight className="w-8 h-8 stroke-[3]" />
            </div>
            <div className="hidden md:flex absolute top-[72px] left-[50%] -translate-x-1/2 -translate-y-1/2 text-primary items-center justify-center pointer-events-none">
              <ArrowRight className="w-8 h-8 stroke-[3]" />
            </div>
            <div className="hidden md:flex absolute top-[72px] left-[75%] -translate-x-1/2 -translate-y-1/2 text-primary items-center justify-center pointer-events-none">
              <ArrowRight className="w-8 h-8 stroke-[3]" />
            </div>
            
            {[
              { step: "01", title: "Post Requirement", desc: "Detail your needs, class, budget, and location.", icon: <Search /> },
              { step: "02", title: "Get CVs", desc: "We handpick and send you the best matching tutor profiles.", icon: <Users /> },
              { step: "03", title: "Select Tutor", desc: "Review profiles and select the one that fits perfectly.", icon: <CheckCircle /> },
              { step: "04", title: "Start Learning", desc: "Take a trial class and begin your learning journey.", icon: <GraduationCap /> }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-8 rounded-3xl shadow-lg border border-neutral-100 text-center relative"
              >
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-black text-white rounded-xl font-black flex items-center justify-center text-xl shadow-lg border-2 border-primary">
                  {item.step}
                </div>
                <div className="w-20 h-20 mx-auto bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                  {item.icon}
                </div>
                <h3 className="text-xl font-black text-black mb-3">{item.title}</h3>
                <p className="text-neutral-600 font-medium leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/register?role=guardian" className="inline-flex items-center gap-2 bg-black text-white py-4 px-8 rounded-xl font-bold hover:bg-neutral-800 transition-colors">
              Post a Tutor Request <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. PARENT TESTIMONIALS */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-black text-black mb-4">What Parents Say</h2>
              <div className="w-24 h-1.5 bg-primary rounded-full"></div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Rafiqul Islam", role: "Parent", comment: "Tutor Core found the perfect math tutor for my son. His grades improved significantly within a month. Highly professional service!" },
              { name: "Nusrat Jahan", role: "Parent", comment: "The process was so smooth. I posted my requirement and got verified CVs the same day. The tutor is excellent and very punctual." },
              { name: "Ahmed Chowdhury", role: "Parent", comment: "I appreciate how they verify every tutor. It gave me peace of mind knowing my daughter is learning from a safe, qualified professional." }
            ].map((testimonial, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-neutral-50 p-8 rounded-3xl border border-neutral-200 relative"
              >
                <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/20" />
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-black font-black text-xl">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-black">{testimonial.name}</h4>
                    <p className="text-sm text-neutral-500 font-medium">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4 text-primary">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-primary" />)}
                </div>
                <p className="text-neutral-700 font-medium leading-relaxed">"{testimonial.comment}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. BECOME A TUTOR BANNER */}
      <section className="py-16 bg-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Are You a Qualified Teacher?</h2>
          <p className="text-xl text-neutral-300 font-medium mb-10 max-w-2xl mx-auto">Join our network of 15,000+ expert tutors and start earning by teaching students near you or online.</p>
          <button onClick={handleBecomeTutorClick} className="bg-primary text-black py-4 px-10 rounded-xl font-black text-lg hover:bg-[#75ad36] transition-colors shadow-[0_0_30px_rgba(134,194,64,0.3)] flex items-center gap-2 mx-auto">
            Create Tutor Profile <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* 7. HOW TUTORS CONNECT */}
      <section className="py-24 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-black mb-4">How It Works For Tutors</h2>
            <div className="w-24 h-1.5 bg-primary mx-auto mb-6 rounded-full"></div>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto font-medium">Start your tutoring career with us in a few easy steps.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Desktop Horizontal Connecting Arrows */}
            <div className="hidden md:flex absolute top-[72px] left-[25%] -translate-x-1/2 -translate-y-1/2 text-primary items-center justify-center pointer-events-none">
              <ArrowRight className="w-8 h-8 stroke-[3]" />
            </div>
            <div className="hidden md:flex absolute top-[72px] left-[50%] -translate-x-1/2 -translate-y-1/2 text-primary items-center justify-center pointer-events-none">
              <ArrowRight className="w-8 h-8 stroke-[3]" />
            </div>
            <div className="hidden md:flex absolute top-[72px] left-[75%] -translate-x-1/2 -translate-y-1/2 text-primary items-center justify-center pointer-events-none">
              <ArrowRight className="w-8 h-8 stroke-[3]" />
            </div>
            {[
              { step: "1", title: "Create Profile", desc: "Sign up and build a strong, detailed tutor profile.", icon: <Users /> },
              { step: "2", title: "Apply to Jobs", desc: "Browse our job board and apply to relevant tuitions.", icon: <Briefcase /> },
              { step: "3", title: "Get Selected", desc: "Impress parents and get selected for trial classes.", icon: <Star /> },
              { step: "4", title: "Start Earning", desc: "Confirm the tuition and start getting paid.", icon: <Award /> }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center text-center p-6"
              >
                <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center text-primary mb-6 relative shadow-xl border-4 border-white ring-2 ring-neutral-100">
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-black rounded-full font-black flex items-center justify-center text-sm">
                    {item.step}
                  </div>
                  {item.icon}
                </div>
                <h3 className="text-xl font-black text-black mb-2">{item.title}</h3>
                <p className="text-neutral-600 font-medium text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. WHY CHOOSE US */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 space-y-8"
            >
              <div className="inline-block px-4 py-1.5 bg-primary/20 text-primary-dark font-black rounded-full text-sm tracking-widest border border-primary/30">
                WHY TUTOR CORE
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-black leading-tight">
                Trusted by Thousands for <span className="text-primary underline decoration-4 underline-offset-4 decoration-black">Quality Education</span>
              </h2>
              <p className="text-lg text-neutral-600 leading-relaxed font-medium">
                We are committed to maintaining the highest standards in education by bridging the gap between passionate educators and eager learners.
              </p>
              
              <ul className="grid sm:grid-cols-2 gap-6 mt-8">
                {[
                  { title: "Verified Tutors", icon: <Shield className="w-6 h-6" />, desc: "Rigorous background checks." },
                  { title: "Perfect Matching", icon: <Target className="w-6 h-6" />, desc: "AI & Human assisted matching." },
                  { title: "24/7 Support", icon: <Clock className="w-6 h-6" />, desc: "Always here to help you." },
                  { title: "Secure Process", icon: <CheckCircle className="w-6 h-6" />, desc: "Safe and transparent." }
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-neutral-100">
                    <div className="bg-primary/10 text-primary p-3 rounded-xl">{feature.icon}</div>
                    <div>
                      <h4 className="font-bold text-black">{feature.title}</h4>
                      <p className="text-sm text-neutral-500 font-medium mt-1">{feature.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex-1 relative w-full"
            >
               {/* Abstract placeholder for trust imagery */}
              <div className="aspect-square bg-gradient-to-br from-primary to-black rounded-[40px] p-8 shadow-2xl relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-10 rounded-3xl text-center z-10">
                  <Shield className="w-24 h-24 text-primary mx-auto mb-6" />
                  <h3 className="text-3xl font-black text-white mb-2">100% Safe</h3>
                  <p className="text-white/80 font-medium">Guaranteed Satisfaction</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 9. APP DOWNLOAD SECTION */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-black/5 transform skew-x-12 translate-x-32"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-4xl md:text-5xl font-black text-black mb-6">Learning in your pocket.</h2>
              <p className="text-xl text-black/80 font-medium mb-8 max-w-lg">
                Download the Tutor Core app to manage your tuitions, apply for jobs, and connect on the go.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button className="bg-black text-white px-6 py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-neutral-800 transition-colors">
                  <PlayCircle className="w-8 h-8" />
                  <div className="text-left">
                    <div className="text-xs">GET IT ON</div>
                    <div className="text-lg font-bold">Google Play</div>
                  </div>
                </button>
                <button className="bg-black text-white px-6 py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-neutral-800 transition-colors">
                  <Globe className="w-8 h-8" />
                  <div className="text-left">
                    <div className="text-xs">Download on the</div>
                    <div className="text-lg font-bold">App Store</div>
                  </div>
                </button>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              {/* Mockup visualization using Icons/Shapes */}
              <div className="w-64 h-[500px] bg-black rounded-[40px] border-[8px] border-neutral-800 shadow-2xl relative overflow-hidden flex items-center justify-center">
                <div className="absolute top-0 w-32 h-6 bg-neutral-800 rounded-b-xl left-1/2 -translate-x-1/2"></div>
                <div className="text-center p-6 text-white w-full h-full bg-neutral-900 flex flex-col justify-center">
                  <Target className="w-16 h-16 text-primary mx-auto mb-6" />
                  <h4 className="text-2xl font-black mb-2">Tutor Core</h4>
                  <p className="text-neutral-400 text-sm font-medium">App coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
