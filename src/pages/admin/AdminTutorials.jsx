import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Video, Check, Play, Info } from 'lucide-react';
import CustomAlert from '../../components/layout/CustomAlert';

const AdminTutorials = () => {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [showOnJobBoard, setShowOnJobBoard] = useState(false);
  const [saving, setSaving] = useState(false);

  // Custom Alert
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'success',
    title: '',
    message: '',
    actionText: 'OK',
    onAction: null
  });

  const showAlert = (type, title, message, onAction = null) => {
    setAlertConfig({ type, title, message, actionText: 'OK', onAction });
    setAlertOpen(true);
  };

  const fetchTutorials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tutorials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTutorials(data || []);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Fetch Failed', 'Failed to retrieve tutorials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorials();
  }, []);

  const openCreateForm = () => {
    setEditingId(null);
    setTitle('');
    setVideoUrl('');
    setDescription('');
    setTargetRole('all');
    setShowOnJobBoard(false);
    setIsFormOpen(true);
  };

  const openEditForm = (tuto) => {
    setEditingId(tuto.id);
    setTitle(tuto.title);
    setVideoUrl(tuto.video_url);
    setDescription(tuto.description || '');
    setTargetRole(tuto.target_role || 'all');
    setShowOnJobBoard(tuto.show_on_job_board || false);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !videoUrl) {
      showAlert('error', 'Validation Error', 'Title and Video URL are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        video_url: videoUrl,
        description,
        target_role: targetRole,
        show_on_job_board: showOnJobBoard
      };

      if (editingId) {
        // Update other tutorials if this one is set to show on job board
        if (showOnJobBoard) {
          await supabase
            .from('tutorials')
            .update({ show_on_job_board: false })
            .neq('id', editingId);
        }

        const { error } = await supabase
          .from('tutorials')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        showAlert('success', 'Updated Successfully', 'Tutorial updated successfully.');
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('tutorials')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;

        // If newly inserted is checked, set others to false
        if (showOnJobBoard && data?.id) {
          await supabase
            .from('tutorials')
            .update({ show_on_job_board: false })
            .neq('id', data.id);
        }

        showAlert('success', 'Created Successfully', 'Tutorial created successfully.');
      }

      setIsFormOpen(false);
      fetchTutorials();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Operation Failed', err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this tutorial?')) return;

    try {
      const { error } = await supabase
        .from('tutorials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showAlert('success', 'Deleted Successfully', 'Tutorial deleted successfully.');
      fetchTutorials();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Delete Failed', 'Could not delete the tutorial.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Tutorial Management</h2>
          <p className="text-sm font-medium text-slate-400 mt-1">
            Manage videos shown to tutors and guardians on their dashboard or public job boards.
          </p>
        </div>
        <button 
          onClick={openCreateForm}
          className="flex items-center gap-2 bg-[#86c240] hover:bg-[#6a9c31] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-md shadow-[#86c240]/10"
        >
          <Plus className="w-4 h-4" /> Add Video
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-400 font-bold text-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#86c240] mr-3"></div>
          Loading tutorials...
        </div>
      ) : tutorials.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl text-center border border-slate-100 shadow-sm">
          <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-slate-600">No tutorials found. Add one to get started.</h3>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {tutorials.map(tuto => (
            <div key={tuto.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
              
              {/* Top Banner / Details */}
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    tuto.target_role === 'tutor' 
                      ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                      : tuto.target_role === 'guardian'
                        ? 'bg-purple-50 text-purple-600 border border-purple-100'
                        : 'bg-slate-50 text-slate-600 border border-slate-100'
                  }`}>
                    For: {tuto.target_role.toUpperCase()}
                  </span>
                  
                  {tuto.show_on_job_board && (
                    <span className="bg-green-50 text-[#86c240] border border-green-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Job Board Active
                    </span>
                  )}
                </div>

                <h4 className="font-extrabold text-slate-800 text-base line-clamp-2" title={tuto.title}>
                  {tuto.title}
                </h4>

                <p className="text-xs text-slate-400 font-medium line-clamp-3">
                  {tuto.description || 'No description provided.'}
                </p>

                <div className="bg-slate-50 rounded-xl p-2.5 flex items-center gap-2.5 overflow-hidden">
                  <Play className="w-4 h-4 text-[#86c240] fill-current flex-shrink-0" />
                  <a 
                    href={tuto.video_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[11px] font-bold text-[#86c240] hover:underline truncate"
                  >
                    {tuto.video_url}
                  </a>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="bg-slate-50 border-t border-slate-100 px-5 py-3.5 flex justify-end gap-3">
                <button
                  onClick={() => openEditForm(tuto)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-[#86c240] text-slate-600 hover:text-[#86c240] rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(tuto.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-red-500 text-slate-600 hover:text-red-500 rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Form Dialog Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5">
              {editingId ? 'Edit Tutorial' : 'Add Tutorial'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Title</label>
                <input 
                  type="text"
                  placeholder="e.g. How to apply for tuition"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Video URL (YouTube or similar)</label>
                <input 
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Description</label>
                <textarea 
                  rows="3"
                  placeholder="Provide a brief summary of the video content..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Target Audience</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#86c240]"
                  >
                    <option value="all">Everyone</option>
                    <option value="tutor">Tutors Only</option>
                    <option value="guardian">Guardians Only</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={showOnJobBoard}
                      onChange={(e) => setShowOnJobBoard(e.target.checked)}
                      className="rounded border-slate-300 text-[#86c240] focus:ring-[#86c240] w-4.5 h-4.5"
                    />
                    <span className="text-xs font-bold text-slate-600">Show on Job Board</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
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

export default AdminTutorials;
