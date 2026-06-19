import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  LayoutGrid, Plus, Trash2, Edit2, Check, X, 
  Home, Globe, BookOpen, Target, Heart, Award, 
  PlayCircle, Briefcase, Quote, Eye, EyeOff, Settings, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomAlert from '../../components/layout/CustomAlert';

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

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [settings, setSettings] = useState({ homepage_category_mode: 'default' });
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  
  // Modals / Editing States
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', icon_name: 'BookOpen', show_on_homepage: true });
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatData, setEditingCatData] = useState({ name: '', icon_name: 'BookOpen', show_on_homepage: true });
  
  const [selectedCatForCourses, setSelectedCatForCourses] = useState(null);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseIsPopular, setNewCourseIsPopular] = useState(false);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'success',
    title: '',
    message: '',
    actionText: 'Got It',
    onAction: null
  });

  const showAlert = (type, title, message, onAction = null, actionText = 'Got It') => {
    setAlertConfig({ type, title, message, actionText, onAction });
    setAlertOpen(true);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch settings
      const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .maybeSingle();
      if (settingsData) {
        setSettings(settingsData);
      }

      // 2. Fetch Categories
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (catError) throw catError;
      setCategories(catData || []);

      // 3. Fetch Courses
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .order('name');
      if (courseError) throw courseError;
      setCourses(courseData || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      showAlert("error", "Database Sync Required", "It looks like your categories or settings tables aren't set up yet. Make sure to copy the SQL queries from the 'supabase_schema_update.sql' file and run them in your Supabase SQL editor first!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const showToast = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 4000);
  };

  const handleUpdateMode = async (mode) => {
    try {
      const { error } = await supabase
        .from('platform_settings')
        .update({ homepage_category_mode: mode })
        .eq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      setSettings(prev => ({ ...prev, homepage_category_mode: mode }));
      showToast(`Homepage mode set to: ${mode}`);
    } catch (err) {
      console.error(err);
      showAlert("error", "Database Sync Required", "We couldn't save your settings update. This typically happens if the 'platform_settings' table does not exist in your database. Please make sure to execute the SQL updates from the 'supabase_schema_update.sql' file first!");
    }
  };

  const generateSlug = (text) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;

    try {
      const slug = generateSlug(newCat.name);
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: newCat.name.trim(),
          slug,
          icon_name: newCat.icon_name,
          show_on_homepage: newCat.show_on_homepage
        }])
        .select()
        .single();

      if (error) throw error;
      
      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCat({ name: '', icon_name: 'BookOpen', show_on_homepage: true });
      setShowAddCategory(false);
      showToast("Category added successfully!");
    } catch (err) {
      console.error(err);
      showAlert("error", "Database Connection Issue", "We couldn't create the new category. Please confirm that the 'categories' table has been created using the provided SQL update script in your Supabase dashboard.");
    }
  };

  const handleStartEdit = (cat) => {
    setEditingCatId(cat.id);
    setEditingCatData({
      name: cat.name,
      icon_name: cat.icon_name,
      show_on_homepage: cat.show_on_homepage
    });
  };

  const handleSaveEdit = async (catId) => {
    if (!editingCatData.name.trim()) return;

    try {
      const slug = generateSlug(editingCatData.name);
      const { error } = await supabase
        .from('categories')
        .update({
          name: editingCatData.name.trim(),
          slug,
          icon_name: editingCatData.icon_name,
          show_on_homepage: editingCatData.show_on_homepage
        })
        .eq('id', catId);

      if (error) throw error;

      setCategories(prev => prev.map(c => c.id === catId ? { 
        ...c, 
        name: editingCatData.name.trim(), 
        slug, 
        icon_name: editingCatData.icon_name, 
        show_on_homepage: editingCatData.show_on_homepage 
      } : c).sort((a, b) => a.name.localeCompare(b.name)));

      setEditingCatId(null);
      showToast("Category updated!");
    } catch (err) {
      console.error(err);
      showAlert("error", "Failed to Update Category", "We were unable to save your modifications. Please double-check your internet connection or verify that the 'categories' table is set up correctly in the database.");
    }
  };

  const handleToggleHomepageShow = async (catId, currentVal) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ show_on_homepage: !currentVal })
        .eq('id', catId);
      if (error) throw error;
      setCategories(prev => prev.map(c => c.id === catId ? { ...c, show_on_homepage: !currentVal } : c));
      showToast("Visibility updated!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!confirm("Are you sure you want to delete this category? All associated classes/courses will be deleted as well!")) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', catId);
      if (error) throw error;
      setCategories(prev => prev.filter(c => c.id !== catId));
      setCourses(prev => prev.filter(c => c.category_id !== catId));
      if (selectedCatForCourses?.id === catId) {
        setSelectedCatForCourses(null);
      }
      showToast("Category deleted.");
    } catch (err) {
      console.error(err);
      showAlert("error", "Deletion Failed", "We couldn't delete the category. This is usually due to database tables being missing or connection drops. Ensure your SQL tables are active in Supabase.");
    }
  };

  // Courses (Classes) Management
  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourseName.trim() || !selectedCatForCourses) return;

    try {
      const slug = generateSlug(newCourseName);
      const { data, error } = await supabase
        .from('courses')
        .insert([{
          category_id: selectedCatForCourses.id,
          name: newCourseName.trim(),
          slug,
          is_popular: newCourseIsPopular
        }])
        .select()
        .single();

      if (error) throw error;

      setCourses(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCourseName('');
      setNewCourseIsPopular(false);
      showToast("Class/Course added!");
    } catch (err) {
      console.error(err);
      showAlert("error", "Class Setup Failed", "We couldn't append this class to the category. Please verify that the 'courses' table exists and is active in your database.");
    }
  };

  const handleToggleCoursePopular = async (courseId, currentVal) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_popular: !currentVal })
        .eq('id', courseId);
      if (error) throw error;
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_popular: !currentVal } : c));
      showToast("Popular status updated!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm("Delete this class?")) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
      if (error) throw error;
      setCourses(prev => prev.filter(c => c.id !== courseId));
      showToast("Class deleted.");
    } catch (err) {
      console.error(err);
    }
  };

  const getIconComponent = (iconName) => {
    const matched = iconList.find(i => i.name === iconName);
    return matched ? matched.icon : BookOpen;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans relative px-4">
      <AnimatePresence>
        {actionMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 bg-slate-900 text-white rounded-2xl shadow-xl px-6 py-4 z-[99] flex items-center gap-3 border border-slate-800"
          >
            <Check className="w-5 h-5 text-primary shrink-0" />
            <span className="text-sm font-semibold">{actionMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2.5">
            <LayoutGrid className="w-6 h-6 text-primary" />
            Category Management
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-0.5">Manage categories, subcategories, and homepage explore configurations.</p>
        </div>

        <button 
          onClick={() => setShowAddCategory(true)}
          className="flex items-center gap-1.5 bg-primary hover:bg-[#75ad36] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Settings Panel */}
      <div className="bg-white rounded-3xl border border-slate-150 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-400" /> Homepage Categories Strategy
        </h2>
        <p className="text-sm text-slate-500 font-medium">Select how categories will be displayed on the homepage explore categories section:</p>
        
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { mode: 'default', label: 'Default Mode', desc: 'Displays standard, pre-seeded explore categories.' },
            { mode: 'custom', label: 'Custom Mode', desc: 'Only show categories manually checked as "Show on Homepage".' },
            { mode: 'active_tuitions', label: 'Active Tuitions Only', desc: 'Automatically show only categories which have open tuition requests.' }
          ].map(opt => (
            <button
              key={opt.mode}
              onClick={() => handleUpdateMode(opt.mode)}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between text-left ${
                settings.homepage_category_mode === opt.mode 
                  ? 'border-primary bg-primary/5 shadow-[0_1px_3px_rgba(134,194,64,0.05)]' 
                  : 'border-slate-200 bg-white hover:border-slate-350'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="font-semibold text-sm text-slate-800">{opt.label}</span>
                {settings.homepage_category_mode === opt.mode && (
                  <span className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white"><Check className="w-3 h-3 stroke-[2.5]" /></span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Categories List (Left) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-semibold text-base text-slate-850">Categories</h3>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64 text-slate-400 font-semibold text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-3"></div>
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-semibold text-sm">No categories created yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {categories.map(cat => {
                const Icon = getIconComponent(cat.icon_name);
                const isEditing = editingCatId === cat.id;
                
                return (
                  <div 
                    key={cat.id} 
                    className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      selectedCatForCourses?.id === cat.id ? 'bg-green-50/10' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex-1 flex flex-col sm:flex-row gap-3 items-center">
                        <input 
                          type="text" 
                          value={editingCatData.name}
                          onChange={(e) => setEditingCatData({ ...editingCatData, name: e.target.value })}
                          className="w-full sm:w-auto flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#86c240]"
                        />
                        <select
                          value={editingCatData.icon_name}
                          onChange={(e) => setEditingCatData({ ...editingCatData, icon_name: e.target.value })}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#86c240]"
                        >
                          {iconList.map(i => (
                            <option key={i.name} value={i.name}>{i.name}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveEdit(cat.id)} className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingCatId(null)} className="p-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300"><X className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary-dark border border-primary/10">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-800">{cat.name}</h4>
                          <p className="text-[11px] text-slate-400 font-medium">/{cat.slug?.toLowerCase()}</p>
                        </div>
                      </div>
                    )}

                    {!isEditing && (
                      <div className="flex items-center gap-4 justify-between sm:justify-end">
                        <button 
                          onClick={() => handleToggleHomepageShow(cat.id, cat.show_on_homepage)}
                          className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-[11px] font-semibold transition-all ${
                            cat.show_on_homepage 
                              ? 'bg-primary/5 border-primary/20 text-primary-dark' 
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                          }`}
                          title="Show on Homepage"
                        >
                          {cat.show_on_homepage ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">Homepage</span>
                        </button>

                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => setSelectedCatForCourses(cat)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border ${
                              selectedCatForCourses?.id === cat.id
                                ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-655 hover:bg-slate-50'
                            }`}
                          >
                            Classes ({courses.filter(c => c.category_id === cat.id).length})
                          </button>
                          
                          <button onClick={() => handleStartEdit(cat)} className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-500 rounded-xl"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100/70 border border-rose-100 text-rose-600 rounded-xl"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Classes / Courses List (Right) */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between min-h-[400px]">
          {selectedCatForCourses ? (
            <>
              <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Category Classes</span>
                  <h3 className="font-semibold text-lg text-slate-800 leading-tight">{selectedCatForCourses.name}</h3>
                </div>
                <button onClick={() => setSelectedCatForCourses(null)} className="p-1 hover:bg-slate-200 rounded-full text-slate-400"><X className="w-4 h-4" /></button>
              </div>

              {/* Class listings */}
              <div className="flex-1 divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
                {courses.filter(c => c.category_id === selectedCatForCourses.id).length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm font-semibold">No classes added to this category yet.</div>
                ) : (
                  courses.filter(c => c.category_id === selectedCatForCourses.id).map(course => (
                    <div key={course.id} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm">{course.name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">/{course.slug?.toLowerCase()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleCoursePopular(course.id, course.is_popular)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                            course.is_popular
                              ? 'bg-amber-50 border-amber-200 text-amber-600'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                          title="Toggle Popular status"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCourse(course.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add class form */}
              <form onSubmit={handleAddCourse} className="p-6 border-t border-slate-50 bg-slate-50/50 space-y-3">
                <input 
                  type="text" 
                  placeholder="Enter Class Name (e.g. O Level)"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#86c240] shadow-sm"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={newCourseIsPopular}
                      onChange={(e) => setNewCourseIsPopular(e.target.checked)}
                      className="rounded text-primary focus:ring-primary w-4 h-4 border-slate-200"
                    />
                    Mark as Popular Class
                  </label>
                  <button 
                    type="submit" 
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                  >
                    Add Class
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/40">
              <LayoutGrid className="w-12 h-12 text-slate-200 mb-3" />
              <p className="font-semibold text-sm">Select a category on the left to manage its classes.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Category Dialog Modal */}
      {showAddCategory && (
        <>
          <div onClick={() => setShowAddCategory(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90]"></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 z-[95] border border-slate-100"
          >
            <div className="flex justify-between items-center border-b pb-3 mb-5">
              <h3 className="text-base font-semibold text-slate-800">Add New Category</h3>
              <button onClick={() => setShowAddCategory(false)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Bangla Medium"
                  value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category Icon</label>
                <div className="grid grid-cols-4 gap-3">
                  {iconList.map(item => {
                     const Icon = item.icon;
                     return (
                      <button
                        type="button"
                        key={item.name}
                        onClick={() => setNewCat({ ...newCat, icon_name: item.name })}
                        className={`p-3 rounded-xl border flex items-center justify-center transition-all ${
                          newCat.icon_name === item.name 
                            ? 'border-primary bg-primary/10 text-primary' 
                            : 'border-slate-100 hover:border-slate-200 text-slate-500'
                        }`}
                        title={item.name}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                     );
                  })}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer py-2">
                  <input 
                    type="checkbox"
                    checked={newCat.show_on_homepage}
                    onChange={(e) => setNewCat({ ...newCat, show_on_homepage: e.target.checked })}
                    className="rounded text-primary focus:ring-primary w-4 h-4 border-slate-200"
                  />
                  Show on Homepage Explore Categories list
                </label>
              </div>

              <div className="flex gap-3 border-t pt-4 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddCategory(false)}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-550 rounded-xl text-sm font-medium transition-colors border border-slate-200/50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-primary hover:bg-[#75ad36] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  Create Category
                </button>
              </div>
            </form>
          </motion.div>
        </>
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

export default AdminCategories;
