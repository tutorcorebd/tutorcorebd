import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, GraduationCap, AlertCircle, RefreshCw, Edit, Plus, Trash2 } from 'lucide-react';

const AdminInstitutions = () => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'all'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingInst, setEditingInst] = useState(null);
  const [editingName, setEditingName] = useState('');

  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      let query = supabase.from('institutions').select('*');
      
      if (activeTab === 'pending') {
        query = query.eq('status', 'pending');
      } else if (activeTab === 'approved') {
        query = query.eq('status', 'approved');
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setInstitutions(data || []);
    } catch (err) {
      console.error("Error loading institutions queue:", err);
      alert("Failed to load suggested institutions list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, [activeTab]);

  const handleApprove = async (id, name) => {
    if (!confirm(`Are you sure you want to approve "${name}"?`)) return;

    try {
      // 1. Update status to approved
      const { error: appError } = await supabase
        .from('institutions')
        .update({ status: 'approved' })
        .eq('id', id);

      if (appError) throw appError;

      // 2. Clear has_custom_institution warnings on tuition_requests
      const { error: reqError } = await supabase
        .from('tuition_requests')
        .update({ has_custom_institution: false })
        .eq('preferred_university', name);

      if (reqError) {
        console.error("Failed to update linked tuition requests:", reqError);
      }

      alert(`"${name}" approved successfully! Warnings cleared.`);
      fetchInstitutions();
    } catch (err) {
      console.error("Error approving institution:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleReject = async (id, name) => {
    if (!confirm(`Are you sure you want to reject/delete "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from('institutions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert(`"${name}" suggestions rejected and deleted.`);
      fetchInstitutions();
    } catch (err) {
      console.error("Error rejecting institution:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddInstitution = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const { error } = await supabase
        .from('institutions')
        .insert([{ name: newName.trim(), status: 'approved' }]);
      if (error) throw error;
      alert(`"${newName}" added successfully!`);
      setNewName('');
      setShowAddModal(false);
      fetchInstitutions();
    } catch (err) {
      console.error("Error adding institution:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleEditInstitution = async (e) => {
    e.preventDefault();
    if (!editingName.trim() || !editingInst) return;
    try {
      const { error } = await supabase
        .from('institutions')
        .update({ name: editingName.trim() })
        .eq('id', editingInst.id);
      if (error) throw error;
      alert(`University name updated to "${editingName}"`);
      setEditingInst(null);
      setEditingName('');
      setShowEditModal(false);
      fetchInstitutions();
    } catch (err) {
      console.error("Error editing institution:", err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto mt-4">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">University Management</h1>
          <p className="text-slate-500 text-sm mt-1">Review suggestions or directly add, edit, and delete universities in the database.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAddModal(true)} 
            className="p-2.5 bg-[#86c240] hover:bg-[#6a9c31] text-white rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs shadow-sm animate-in fade-in duration-200"
          >
            <Plus className="w-4 h-4" /> Add University
          </button>
          <button 
            onClick={fetchInstitutions} 
            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 border border-slate-200 transition-all flex items-center gap-1.5 font-bold text-xs"
          >
            <RefreshCw className="w-4 h-4" /> Reload Queue
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-3">
        {['pending', 'approved', 'all'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === tab
                ? 'bg-[#86c240] border-[#86c240] text-white'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span className="capitalize">{tab} Suggestions</span>
          </button>
        ))}
      </div>

      {/* Main List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6">
        {loading ? (
          <div className="text-center py-16 text-slate-400 font-bold text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#86c240]" /> Loading suggestions queue...
          </div>
        ) : institutions.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <AlertCircle className="w-8 h-8 text-slate-350 mx-auto mb-3" />
            <p className="font-bold text-sm">No institutions found in this category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase">
                  <th className="py-4 px-4">University Name</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Submitted At</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                {institutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4.5 px-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#86c240]/10 text-[#86c240] flex items-center justify-center">
                        <GraduationCap className="w-4.5 h-4.5" />
                      </div>
                      <span className="font-extrabold text-slate-800 text-sm">{inst.name}</span>
                    </td>
                    <td className="py-4.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${
                        inst.status === 'approved'
                          ? 'bg-green-50 text-green-600 border border-green-100'
                          : inst.status === 'pending'
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : 'bg-red-50 text-red-650 border border-red-100'
                      }`}>
                        {inst.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4.5 px-4 text-slate-400">
                      {inst.created_at ? new Date(inst.created_at).toLocaleString() : 'System Seed'}
                    </td>
                    <td className="py-4.5 px-4 text-right space-x-2">
                      {inst.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(inst.id, inst.name)}
                          className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg border border-green-100 transition-colors font-bold inline-flex items-center gap-1"
                          title="Approve Institution"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingInst(inst);
                          setEditingName(inst.name);
                          setShowEditModal(true);
                        }}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg border border-blue-100 transition-colors font-bold inline-flex items-center gap-1"
                        title="Edit University"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleReject(inst.id, inst.name)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg border border-red-100 transition-colors font-bold inline-flex items-center gap-1"
                        title="Delete University"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add University Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-800">Add New University</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddInstitution} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">University Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Dhaka College"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#86c240]"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full py-2.5 bg-[#86c240] hover:bg-[#6a9c31] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Create University
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit University Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-800">Edit University Name</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditInstitution} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">University Name</label>
                <input 
                  type="text"
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#86c240]"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full py-2.5 bg-[#86c240] hover:bg-[#6a9c31] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminInstitutions;
