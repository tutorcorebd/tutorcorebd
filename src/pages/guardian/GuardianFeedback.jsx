import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { Star, MessageSquare, Send, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const GuardianFeedback = () => {
  const { profile } = useAuthStore();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [authorName, setAuthorName] = useState(profile?.full_name || '');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const fetchMyFeedbacks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (err) {
      console.error("Error loading feedbacks history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchMyFeedbacks();
    }
  }, [profile]);

  // Client-side rate-limit checker
  const getTodaySubmissionCount = () => {
    const today = new Date().toDateString();
    return feedbacks.filter(f => new Date(f.created_at).toDateString() === today).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!comment.trim()) {
      setError("Please write some feedback comment.");
      return;
    }

    const todayCount = getTodaySubmissionCount();
    if (todayCount >= 5) {
      setError("You have reached the maximum limit of 5 feedback submissions for today to prevent spam.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase
        .from('feedbacks')
        .insert([{
          user_id: profile.id,
          name: authorName.trim() || profile.full_name,
          rating: rating,
          comment: comment.trim(),
          status: 'pending',
          is_published: false
        }]);

      if (insertError) throw insertError;

      alert("Thank you for your feedback! It has been submitted for admin approval.");
      setComment('');
      setRating(5);
      fetchMyFeedbacks();
    } catch (err) {
      console.error("Feedback Submission Error:", err);
      setError(err.message || "An unexpected error occurred while saving feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const todayCount = getTodaySubmissionCount();

  return (
    <div className="space-y-8 font-sans max-w-4xl mx-auto mt-4">
      
      {/* Header */}
      <div className="border-b border-slate-100 pb-5">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Parent Feedback System</h1>
        <p className="text-slate-500 text-sm mt-1">Submit your reviews, suggestions, and feedback. Approved items will be displayed on our homepage.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Submission Form Column */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#86c240]" /> Give Feedback
            </h3>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-650 rounded-xl text-xs font-semibold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Daily limit gauge */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-xs font-bold text-slate-500 flex justify-between items-center">
              <span>Today's Submissions:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${todayCount >= 5 ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {todayCount} / 5
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-655 mb-1">Your Name</label>
                <input 
                  type="text"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 focus:border-[#86c240] rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-655 mb-1">Star Rating</label>
                <div className="flex gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none transform hover:scale-110 transition-transform"
                    >
                      <Star 
                        className={`w-6 h-6 ${
                          star <= rating 
                            ? 'fill-amber-400 text-amber-400' 
                            : 'text-slate-250 hover:text-amber-300'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-655 mb-1">Your Feedback / Comment</label>
                <textarea
                  rows="4"
                  placeholder="Share your experience working with Tutor Core..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="w-full p-3 border border-slate-200 focus:border-[#86c240] rounded-xl text-xs font-medium text-slate-850 focus:outline-none resize-none"
                  maxLength="400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting || todayCount >= 5}
                className="w-full bg-[#86c240] hover:bg-[#6a9c31] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-xs"
              >
                <Send className="w-3.5 h-3.5" /> Submit Review
              </button>
            </form>
          </div>
        </div>

        {/* History List Column */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-black text-slate-800 mb-5 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" /> Submission History
            </h3>

            {loading ? (
              <div className="text-center py-12 text-slate-400 font-bold text-sm">
                Loading history...
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="font-bold text-sm">No feedbacks submitted yet.</p>
                <p className="text-xs text-slate-400 mt-1">Use the form on the left to send your first feedback suggestion.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map(f => (
                  <div key={f.id} className="border border-slate-100 rounded-2xl p-4.5 bg-slate-50/30 hover:border-slate-200 transition-colors space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-extrabold text-slate-800 text-sm">{f.name}</span>
                        <div className="flex gap-0.5 mt-1 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < f.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                          ))}
                        </div>
                      </div>
                      
                      {/* Status Badges */}
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
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[9px] font-black uppercase">
                            Published
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-600 font-medium text-xs leading-relaxed italic">
                      "{f.comment}"
                    </p>

                    <div className="text-[10px] text-slate-400 font-bold flex justify-between">
                      <span>Submitted on {new Date(f.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default GuardianFeedback;
