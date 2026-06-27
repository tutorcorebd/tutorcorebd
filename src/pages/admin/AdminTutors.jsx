import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Shield, Award, Users, CheckCircle, Clock } from 'lucide-react';
import VerifiedBadge from '../../components/common/VerifiedBadge';

const AdminTutors = () => {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchTutors = async () => {
    setLoading(true);
    try {
      // Ensure session is fresh before running query
      await supabase.auth.getSession();

      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          phone_number,
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

  const handleToggle = async (tutorId, field, currentValue) => {
    setUpdatingId(tutorId);
    try {
      const { error } = await supabase
        .from('tutor_profiles')
        .update({ [field]: !currentValue })
        .eq('user_id', tutorId);

      if (error) throw error;

      setTutors(tutors.map(t => {
        if (t.id === tutorId) {
          const tp = Array.isArray(t.tutor_profiles) ? t.tutor_profiles[0] : t.tutor_profiles;
          const updatedTp = { ...tp, [field]: !currentValue };
          return {
            ...t,
            tutor_profiles: Array.isArray(t.tutor_profiles) ? [updatedTp] : updatedTp
          };
        }
        return t;
      }));
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCategoryChange = async (tutorId, newCategory) => {
    setUpdatingId(tutorId);
    try {
      const { error } = await supabase
        .from('tutor_profiles')
        .update({ tutor_category: newCategory })
        .eq('user_id', tutorId);

      if (error) throw error;

      setTutors(tutors.map(t => {
        if (t.id === tutorId) {
          const tp = Array.isArray(t.tutor_profiles) ? t.tutor_profiles[0] : t.tutor_profiles;
          const updatedTp = { ...tp, tutor_category: newCategory };
          return {
            ...t,
            tutor_profiles: Array.isArray(t.tutor_profiles) ? [updatedTp] : updatedTp
          };
        }
        return t;
      }));
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Failed to update tutor category');
    } finally {
      setUpdatingId(null);
    }
  };

  const getTutorProfile = (tutor) => {
    if (!tutor) return {};
    const tp = tutor.tutor_profiles;
    if (!tp) return {};
    return Array.isArray(tp) ? (tp[0] || {}) : tp;
  };

  const filteredTutors = tutors.filter(t => {
    const nameMatches = t.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const tp = getTutorProfile(t);
    const category = tp.tutor_category || 'None';
    
    if (filterCategory === 'All') return nameMatches;
    return nameMatches && category === filterCategory;
  });

  return (
    <div className="space-y-6 font-sans max-w-6xl mx-auto mt-4">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Tutor Management</h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">Assign statuses and categories to tutors on the platform.</p>
      </div>

      {/* Stats Counter Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.01)]">
          <div className="text-slate-400 font-bold text-xs">Total Tutors</div>
          <div className="text-2xl font-black text-slate-850 mt-1">{tutors.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.01)]">
          <div className="text-blue-500 font-bold text-xs">Premium Tutors</div>
          <div className="text-2xl font-black text-slate-850 mt-1">
            {tutors.filter(t => getTutorProfile(t).is_premium).length}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.01)]">
          <div className="text-emerald-500 font-bold text-xs">Verified Tutors</div>
          <div className="text-2xl font-black text-slate-850 mt-1">
            {tutors.filter(t => getTutorProfile(t).is_verified).length}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.01)]">
          <div className="text-amber-500 font-bold text-xs">Active Tutors</div>
          <div className="text-2xl font-black text-slate-850 mt-1">
            {tutors.length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm justify-between">
        <div className="relative flex-1">
          <input 
            type="text"
            placeholder="Search by tutor name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#86c240] focus:border-transparent"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3" />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#86c240]"
        >
          <option value="All">All Categories</option>
          <option value="New Tutors">New Tutors</option>
          <option value="Premium Tutors">Premium Tutors</option>
          <option value="Verified Tutors">Verified Tutors</option>
          <option value="Exclusive Tutors">Exclusive Tutors</option>
          <option value="None">None</option>
        </select>
      </div>

      {/* Tutors List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20 text-slate-400 font-bold text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#86c240] mr-3"></div>
            Loading tutors...
          </div>
        ) : filteredTutors.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-medium">
            No tutors found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-55/40 border-b border-slate-100 text-slate-500 font-bold text-xs">
                  <th className="p-4">Tutor Name</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4">Verified Status</th>
                  <th className="p-4">Premium Status</th>
                  <th className="p-4">Set Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
                {filteredTutors.map(tutor => {
                  const tp = getTutorProfile(tutor);
                  const category = tp.tutor_category || 'None';
                  
                  return (
                    <tr key={tutor.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          {tutor.full_name}
                          {tp.is_verified && (
                            <VerifiedBadge size={16} />
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">{tp.university || 'N/A'}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-semibold text-slate-700">{tutor.phone_number || 'N/A'}</div>
                      </td>
                      <td className="p-4 text-xs font-bold text-slate-400">
                        {new Date(tutor.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggle(tutor.id, 'is_verified', tp.is_verified)}
                          disabled={updatingId === tutor.id}
                          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                            tp.is_verified 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          } disabled:opacity-50`}
                        >
                          {tp.is_verified ? 'Verified' : 'Unverified'}
                        </button>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggle(tutor.id, 'is_premium', tp.is_premium)}
                          disabled={updatingId === tutor.id}
                          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                            tp.is_premium 
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          } disabled:opacity-50`}
                        >
                          {tp.is_premium ? 'Premium' : 'Standard'}
                        </button>
                      </td>
                      <td className="p-4">
                        <select
                          value={category}
                          disabled={updatingId === tutor.id}
                          onChange={(e) => handleCategoryChange(tutor.id, e.target.value)}
                          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none disabled:opacity-50"
                        >
                          <option value="None">None</option>
                          <option value="New Tutors">New Tutors</option>
                          <option value="Exclusive Tutors">Exclusive Tutors</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminTutors;
