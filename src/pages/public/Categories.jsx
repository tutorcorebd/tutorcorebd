import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, Globe, Target, Heart, Award, 
  PlayCircle, Briefcase, Quote, ChevronRight, Star, Grid
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
                className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800 leading-tight">Popular Tuition Classes</h2>
                    <p className="text-slate-400 text-xs font-semibold mt-0.5">Most in-demand class levels currently active.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {popularCourses.map(course => {
                    const parentCat = categories.find(c => c.id === course.category_id);
                    return (
                      <button
                        key={course.id}
                        onClick={() => handleCourseClick(course.name)}
                        className="bg-slate-50 hover:bg-primary/10 hover:text-primary-dark border border-slate-200 hover:border-primary/30 px-5 py-3 rounded-2xl text-sm font-semibold text-slate-700 transition-all flex items-center gap-2"
                      >
                        <span>{course.name}</span>
                        {parentCat && (
                          <span className="text-[10px] bg-slate-200/60 text-slate-500 font-semibold px-2 py-0.5 rounded-md">
                            {parentCat.name}
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5" />
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
