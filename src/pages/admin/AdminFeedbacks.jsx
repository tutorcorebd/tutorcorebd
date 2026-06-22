import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Star, Check, X, MessageSquare, Edit, Trash2, Plus, Filter, RefreshCw, Globe, AlertCircle } from 'lucide-react';

const AdminFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newPublish, setNewPublish] = useState(true);

  const [editingFeedback, setEditingFeedback] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingRating, setEditingRating] = useState(5);
  const [editingComment, setEditingComment] = useState('');

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      let query = supabase.from('feedbacks').select('*');

      if (activeTab === 'pending') {
        query = query.eq('status', 'pending');
      } else if (activeTab === 'approved') {
        query = query.eq('status', 'approved');
      } else if (activeTab === 'rejected') {
        query = query.eq('status', 'rejected');
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setFeedbacks(data || []);
    } catch (err) {
      console.error("Error loading feedbacks:", err);
      alert("Failed to load feedbacks queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [activeTab]);

  const handleApprove = async (id) => {
    try {
      const { error } = await supabase
        .from('feedbacks')
        .update({ status: 'approved', is_published: true })
        .eq('id', id);

      if (error) throw error;
      alert("Feedback approved and published to homepage!");
      fetchFeedbacks();
    } catch (err) {
      console.error("Error approving feedback:", err);
      alert(err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      const { error } = await supabase
        .from('feedbacks')
        .update({ status: 'rejected', is_published: false })
        .eq('id', id);

      if (error) throw error;
      alert("Feedback rejected.");
      fetchFeedbacks();
    } catch (err) {
      console.error("Error rejecting feedback:", err);
      alert(err.message);
    }
  };

  const handleTogglePublish = async (id, currentPublishState) => {
    try {
      const { error } = await supabase
        .from('feedbacks')
        .update({ is_published: !currentPublishState })
        .eq('id', id);

      if (error) throw error;
      alert(currentPublishState ? "Feedback unpublished from homepage." : "Feedback published to homepage!");
      fetchFeedbacks();
    } catch (err) {
      console.error("Error toggling publish:", err);
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this feedback permanently?")) return;
    try {
      const { error } = await supabase
        .from('feedbacks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert("Feedback deleted.");
      fetchFeedbacks();
    } catch (err) {
      console.error("Error deleting feedback:", err);
      alert(err.message);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('feedbacks')
        .insert([{
          name: newName.trim(),
          rating: newRating,
          comment: newComment.trim(),
          status: 'approved',
          is_published: newPublish
        }]);

      if (error) throw error;
      alert("Custom feedback added successfully!");
      setNewName('');
      setNewComment('');
      setNewRating(5);
      setNewPublish(true);
      setShowAddModal(false);
      fetchFeedbacks();
    } catch (err) {
      console.error("Error adding feedback:", err);
      alert(err.message);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingName.trim() || !editingComment.trim() || !editingFeedback) return;

    try {
      const { error } = await supabase
        .from('feedbacks')
        .update({
          name: editingName.trim(),
          rating: editingRating,
          comment: editingComment.trim()
        })
        .eq('id', editingFeedback.id);

      if (error) throw error;
      alert("Feedback updated successfully!");
      setEditingFeedback(null);
      setShowEditModal(false);
      fetchFeedbacks();
    } catch (err) {
      console.error("Error updating feedback:", err);
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto mt-4">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Parent Feedbacks Manager</h1>
          <p className="text-slate-500 text-sm mt-1">Review, edit, and moderate parent reviews and select which to display on the homepage.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAddModal(true)}
            className="p-2.5 bg-[#86c240] hover:bg-[#6a9c31] text-white rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Feedback
          </button>
          <button 
            onClick={fetchFeedbacks} 
            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 border border-slate-200 transition-all flex items-center gap-1.5 font-bold text-xs"
          >
            <RefreshCw className="w-4 h-4" /> Reload Queue
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-3">
        {['pending', 'approved', 'rejected', 'all'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === tab
                ? 'bg-[#86c240] border-[#86c240] text-white'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span className="capitalize">{tab} Reviews</span>
          </button>
        ))}
      </div>

      {/* Main List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6">
        {loading ? (
          <div className="text-center py-16 text-slate-400 font-bold text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#86c240]" /> Loading feedbacks queue...
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <AlertCircle className="w-8 h-8 text-slate-350 mx-auto mb-3" />
            <p className="font-bold text-sm">No feedbacks found in this category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase">
                  <th className="py-4 px-4">Author</th>
                  <th className="py-4 px-4">Rating</th>
                  <th className="py-4 px-4">Comment</th>
                  <th className="py-4 px-4">Status & Home</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                {feedbacks.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4.5 px-4 font-extrabold text-slate-800 text-sm">
                      {f.name}
                      {f.user_id ? (
                        <span className="block text-[10px] text-[#86c240] font-bold">Registered User</span>
                      ) : (
                        <span className="block text-[10px] text-slate-400 font-bold">Admin Entry</span>
                      )}
                    </td>
                    <td className="py-4.5 px-4">
                      <div className="flex gap-0.5 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < f.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="py-4.5 px-4 max-w-xs truncate text-slate-650" title={f.comment}>
                      "{f.comment}"
                    </td>
                    <td className="py-4.5 px-4 space-y-1">
                      <div className="flex gap-1.5 items-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          f.status === 'approved'
                            ? 'bg-green-50 text-green-600 border border-green-100'
                            : f.status === 'rejected'
                              ? 'bg-red-50 text-red-600 border border-red-100'
                              : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {f.status}
                        </span>

                        {f.is_published && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[9px] font-black uppercase flex items-center gap-0.5">
                            <Globe className="w-2.5 h-2.5" /> Homepage
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {f.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(f.id)}
                            className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg border border-green-100 transition-colors font-bold inline-flex items-center gap-0.5"
                            title="Approve & Publish"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleReject(f.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-100 transition-colors font-bold inline-flex items-center gap-0.5"
                            title="Reject Review"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {f.status === 'approved' && (
                        <button
                          onClick={() => handleTogglePublish(f.id, f.is_published)}
                          className={`p-1.5 rounded-lg border transition-colors font-bold inline-flex items-center gap-0.5 ${
                            f.is_published 
                              ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-100'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                          title={f.is_published ? "Remove from Homepage" : "Publish to Homepage"}
                        >
                          <Globe className="w-3.5 h-3.5" /> {f.is_published ? "Unpublish" : "Publish"}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setEditingFeedback(f);
                          setEditingName(f.name);
                          setEditingRating(f.rating);
                          setEditingComment(f.comment);
                          setShowEditModal(true);
                        }}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg border border-blue-100 transition-colors font-bold inline-flex items-center gap-0.5"
                        title="Edit Feedback"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-100 transition-colors font-bold inline-flex items-center gap-0.5"
                        title="Delete Feedback"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Custom Feedback Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-800">Add Custom Feedback</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Author Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Nusrat Jahan"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#86c240]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Star Rating</label>
                <div className="flex gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className="focus:outline-none"
                    >
                      <Star 
                        className={`w-5 h-5 ${
                          star <= newRating 
                            ? 'fill-amber-400 text-amber-400' 
                            : 'text-slate-250 hover:text-amber-300'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Comment</label>
                <textarea
                  rows="3"
                  placeholder="Write the feedback comment here..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#86c240] resize-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newPublish"
                  checked={newPublish}
                  onChange={e => setNewPublish(e.target.checked)}
                  className="rounded border-slate-250 text-primary focus:ring-[#86c240] h-4 w-4"
                />
                <label htmlFor="newPublish" className="text-xs font-bold text-slate-500">Publish immediately to Homepage</label>
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-[#86c240] hover:bg-[#6a9c31] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Create Feedback
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Feedback Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-800">Edit Feedback</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Author Name</label>
                <input 
                  type="text"
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#86c240]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Star Rating</label>
                <div className="flex gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setEditingRating(star)}
                      className="focus:outline-none"
                    >
                      <Star 
                        className={`w-5 h-5 ${
                          star <= editingRating 
                            ? 'fill-amber-400 text-amber-400' 
                            : 'text-slate-250 hover:text-amber-300'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Comment</label>
                <textarea
                  rows="3"
                  value={editingComment}
                  onChange={e => setEditingComment(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#86c240] resize-none"
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

export default AdminFeedbacks;
