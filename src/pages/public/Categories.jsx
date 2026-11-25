import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, Globe, Target, Heart, Award, 
  PlayCircle, Briefcase, Quote, ChevronRight, Star,
  GraduationCap, Code, Stethoscope, Languages, Sparkles, Compass
} from 'lucide-react';
import { motion } from 'framer-motion';

const iconList = [
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Globe', icon: Globe },
  { name: 'Target', icon: Target },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Heart', icon: Heart },
  { name: 'PlayCircle', icon: PlayCircle },
  { name: 'Quote', icon: Quote },
  { name: 'Award', icon: Award }
];

const getIconComponent = (iconName) => {
  const matched = iconList.find(i => i.name === iconName);
  return matched ? matched.icon : BookOpen;
};

const getCourseIcon = (courseName = '', parentCategory = null) => {
  const name = courseName.toLowerCase();
  if (name.includes('program') || name.includes('web') || name.includes('coding') || name.includes('software')) return Code;
  if (name.includes('medical')) return Stethoscope;
  if (name.includes('buet') || name.includes('engineering')) return Compass;
  if (name.includes('ielts') || name.includes('english') || name.includes('spoken')) return Languages;
  if (name.includes('quran') || name.includes('arabic') || name.includes('islamic')) return Heart;
  if (name.includes('bcs') || name.includes('job')) return Briefcase;
  if (name.includes('pre-school') || name.includes('nursery') || name.includes('play')) return Sparkles;
  if (name.includes('admission') || name.includes('level') || name.includes('ssc') || name.includes('hsc') || name.includes('ba') || name.includes('university')) return GraduationCap;
  return parentCategory ? getIconComponent(parentCategory.icon_name) : BookOpen;
};

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoriesData = async () => {
      setLoading(true);
      try {
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (catError) throw catError;
        setCategories(catData || []);

        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .order('name');

        if (courseError) throw courseError;
        setCourses(courseData || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesData();
  }, []);

  const handleCategoryClick = (catName) => {
    navigate(`/job-board?category=${encodeURIComponent(catName)}`);
  };

  const handleCourseClick = (courseName) => {
    navigate(`/job-board?class=${encodeURIComponent(courseName)}`);
  };

  const popularCourses = courses.filter(c => c.is_popular);

  return (
    <div className="bg-slate-50 min-h-screen pb-24 font-sans">
      
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-white via-primary/5 to-primary/15 py-16 text-center relative overflow-hidden rounded-b-[40px] border-b border-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-slate-800">
            Browse Tuition Categories
          </h1>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
          <p className="text-base text-slate-600 font-medium max-w-xl mx-auto leading-relaxed">
            Find the perfect learning pathway. Select a category or specific class level to find available tuition requests.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-12">
        
        {loading ? (
          <div className="flex flex-col justify-center items-center py-32 text-slate-400 font-bold text-sm">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-3"></div>
            Loading category catalog...
          </div>
        ) : (
          <>
            {/* Popular Classes Section */}
            {popularCourses.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 leading-tight">Popular Tuition Classes</h2>
                      <p className="text-slate-400 text-xs font-medium mt-0.5">Most in-demand class levels currently active across Bangladesh.</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 self-start sm:self-center px-3 py-1.5 rounded-full bg-[#86c240]/10 text-[#6a9c31] text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    {popularCourses.length} Trending
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {popularCourses.map(course => {
                    const parentCat = categories.find(c => c.id === course.category_id);
                    const CourseIcon = getCourseIcon(course.name, parentCat);
                    return (
                      <button
                        key={course.id}
                        onClick={() => handleCourseClick(course.name)}
                        className="group bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-[#86c240]/50 p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-between gap-3 text-left hover:shadow-md hover:-translate-y-0.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/70 group-hover:bg-[#86c240]/10 group-hover:border-[#86c240]/30 flex items-center justify-center text-slate-600 group-hover:text-[#6a9c31] transition-colors shrink-0 shadow-xs">
                            <CourseIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-800 group-hover:text-[#5c8a28] truncate transition-colors">
                              {course.name}
                            </div>
                            {parentCat && (
                              <div className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                                {parentCat.name}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-white border border-slate-200/70 group-hover:bg-[#86c240] group-hover:border-[#86c240] flex items-center justify-center text-slate-400 group-hover:text-white transition-all shrink-0">
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {/* Main Categories Grid */}
            <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.map((cat, index) => {
                const Icon = getIconComponent(cat.icon_name);
                const catCourses = courses.filter(c => c.category_id === cat.id);
                
                return (
                  <motion.div 
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow group relative overflow-hidden h-full"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center gap-4 border-b border-slate-50 pb-5 mb-5">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors border border-primary/10">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 
                            onClick={() => handleCategoryClick(cat.name)}
                            className="font-semibold text-lg text-slate-800 hover:text-primary transition-colors cursor-pointer"
                          >
                            {cat.name}
                          </h3>
                          <p className="text-slate-400 text-xs font-semibold">
                            {catCourses.length} classes available
                          </p>
                        </div>
                      </div>

                      {/* Course lists */}
                      <div className="flex flex-wrap gap-2 mb-8">
                        {catCourses.length === 0 ? (
                          <span className="text-xs font-semibold text-slate-400 italic">No classes listed.</span>
                        ) : (
                          catCourses.map(course => (
                            <button
                              key={course.id}
                              onClick={() => handleCourseClick(course.name)}
                              className="px-3 py-1.5 bg-slate-50 hover:bg-primary/5 border border-slate-200/80 hover:border-primary/20 rounded-xl text-xs font-semibold text-slate-600 hover:text-primary-dark transition-all"
                            >
                              {course.name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Footer link */}
                    <button
                      onClick={() => handleCategoryClick(cat.name)}
                      className="w-full py-3 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-600 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                    >
                      View All {cat.name} Tuitions <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Categories;
