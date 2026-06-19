import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { 
  HelpCircle, Book, ShieldCheck, Mail, MessageSquare, 
  ChevronRight, ArrowRight, CheckCircle, Search, AlertTriangle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HelpSupport = () => {
  const { profile } = useAuthStore();
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketCategory, setTicketCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);

  const isVerified = profile?.tutor_profile?.is_verified || 
                     profile?.tutor_profile?.tutor_status === 'Verified Tutor' ||
                     profile?.tutor_profile?.tutor_status === 'Premium Tutor';

  const isPremium = profile?.tutor_profile?.tutor_status === 'Premium Tutor';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim() || !ticketCategory) {
      alert("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert([{
          user_id: profile.id,
          category: ticketCategory,
          subject: ticketSubject.trim(),
          message: ticketMessage.trim(),
          status: 'open'
        }]);

      if (error) throw error;
      
      showToast("Support ticket submitted successfully. We will get back to you soon!");
      setTicketSubject('');
      setTicketMessage('');
      setTicketCategory('');
    } catch (err) {
      console.error("Error submitting ticket:", err);
      alert(err.message.includes('relation "public.support_tickets" does not exist') 
        ? "The support tickets database table is not created yet. Please ask the admin to run the SQL script."
        : "Failed to submit ticket: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const helpTopics = [
    { 
      title: "Getting Started", 
      icon: Book, 
      desc: "Learn how to optimize your profile and find students.",
      content: "Welcome to Tutor Core! Getting started is the most exciting part of your journey. To begin, ensure your profile is fully complete. A human touch goes a long way—upload a clear, friendly profile picture and write a bio that showcases your passion for teaching. Remember, parents and students connect with people, not just qualifications. Next, specify your availability accurately and start browsing the job board. Don't hesitate to apply to your first few jobs with a personalized message!"
    },
    { 
      title: "Payments & Fees", 
      icon: ShieldCheck, 
      desc: "Information about membership, fees, and transactions.",
      content: "We believe in transparent and fair transactions. When you secure a tuition job through our platform, we deduct a standard matching fee from the first month's payment. After that, you keep 100% of your earnings directly from the guardian. If you upgrade to our Premium Membership, you enjoy zero matching fees and priority job access! If a payment ever fails or a dispute arises, reach out to us immediately through the contact form below—we are here to protect your hard-earned money."
    },
    { 
      title: "Account & Security", 
      icon: HelpCircle, 
      desc: "Manage your password, email, and privacy settings.",
      content: "Your security is our top priority. We use industry-standard encryption to keep your data safe. If you ever suspect that someone else has accessed your account, please change your password immediately from the Settings page. For your privacy, your phone number and email are hidden from the public and are only shared with a guardian when you are successfully matched. It is always a good idea to update your password every few months and ensure you never share your login details."
    },
    { 
      title: "Job Applications", 
      icon: MessageSquare, 
      desc: "How to apply, interview, and negotiate rates.",
      content: "Landing the perfect tuition job requires a mix of professionalism and empathy. When applying for a job, don't just use a generic template. Read the parent's requirements carefully and explain exactly how your teaching style aligns with their child's needs. If you are invited for an interview, dress neatly, be punctual, and listen actively to the parents' concerns. When negotiating rates, be confident in your worth but remain polite and open to discussion. A strong first impression often seals the deal!"
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans relative px-4">
      
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 bg-slate-900 text-white rounded-2xl shadow-xl px-6 py-4 z-[99] flex items-center gap-3 border border-slate-800"
          >
            <CheckCircle className="w-5 h-5 text-[#86c240] shrink-0" />
            <span className="text-sm font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meta-Style Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-10 shadow-lg text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#86c240]/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-4xl font-black text-white tracking-tight mb-4">How can we help you?</h1>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Describe your issue or search for a topic..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:bg-white focus:text-slate-800 focus:placeholder-slate-500 transition-all text-lg font-medium shadow-inner"
            />
            <Search className={`w-6 h-6 absolute left-5 top-4 transition-colors ${searchQuery ? 'text-[#86c240]' : 'text-slate-400'}`} />
          </div>
        </div>
      </div>

      {/* Topic Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {helpTopics.map((topic, idx) => {
          const Icon = topic.icon;
          return (
            <button 
              key={idx} 
              onClick={() => setSelectedTopic(topic)}
              className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all text-left group"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#86c240]/10 transition-colors">
                <Icon className="w-6 h-6 text-slate-500 group-hover:text-[#86c240] transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{topic.title}</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">{topic.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Support Contact Form Section */}
      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Contact Support</h2>
          <p className="text-slate-500 text-base font-medium mt-1">Need direct assistance? Submit a ticket to our administration team.</p>
        </div>

        {!isVerified ? (
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold text-amber-900">Direct support requires verification</h3>
              <p className="text-sm font-medium text-amber-700 mt-1 leading-relaxed">
                Direct ticketing support is exclusively available to Verified and Premium members. Please verify your account through the Verification Center to unlock this feature.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitTicket} className="space-y-6 max-w-3xl">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Category</label>
                <select 
                  required
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#86c240]/30 focus:border-[#86c240] font-medium text-slate-700 transition-all bg-white"
                >
                  <option value="" disabled>Select a category</option>
                  <option value={isPremium ? "Premium Tutors/Guardians" : "Verified Tutors/Guardians"}>
                    {isPremium ? "Premium Support" : "Verified Member Support"}
                  </option>
                  <option value="Others">General Issue</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Subject</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Issue with my recent payment"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#86c240]/30 focus:border-[#86c240] font-medium text-slate-700 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Message</label>
              <textarea 
                required
                rows="5"
                placeholder="Describe your issue in detail..."
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#86c240]/30 focus:border-[#86c240] font-medium text-slate-700 transition-all resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Ticket <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Topic Detail Modal */}
      <AnimatePresence>
        {selectedTopic && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTopic(null)}
              className="fixed inset-0 bg-slate-900 z-[100]"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#86c240]/10 text-[#86c240] rounded-xl flex items-center justify-center shrink-0">
                      {selectedTopic.icon && <selectedTopic.icon className="w-6 h-6" />}
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{selectedTopic.title}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedTopic(null)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors outline-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="text-slate-600 font-medium leading-relaxed text-[15px] space-y-4">
                  {selectedTopic.content}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={() => setSelectedTopic(null)}
                    className="px-6 py-2.5 bg-[#86c240] text-white font-bold rounded-xl shadow-sm hover:bg-[#72a635] transition-colors"
                  >
                    Got it, thanks!
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default HelpSupport;
