import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { 
  HelpCircle, Book, ShieldCheck, Mail, MessageSquare, 
  ChevronRight, ArrowRight, CheckCircle, Search, AlertTriangle, X,
  PlusCircle, Calendar, Send, Clock, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HelpSupport = () => {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('faq'); // 'faq' | 'inbox'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Ticketing states
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // New ticket form states
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketCategory, setTicketCategory] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  
  const [toastMessage, setToastMessage] = useState('');
  const messagesEndRef = useRef(null);

  const isVerified = profile?.tutor_profile?.is_verified || 
                     profile?.tutor_profile?.tutor_status === 'Verified Tutor' ||
                     profile?.tutor_profile?.tutor_status === 'Premium Tutor' ||
                     profile?.role === 'guardian'; // Guardians get support natively

  const isPremium = profile?.tutor_profile?.tutor_status === 'Premium Tutor';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Fetch tickets for user
  const fetchUserTickets = async () => {
    if (!profile) return;
    setLoadingTickets(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', profile.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error("Error fetching support tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Fetch messages for active ticket
  const fetchMessages = async (ticketId) => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Error fetching support messages:", err);
    }
  };

  // Real-time listener for current user tickets and active ticket messages
  useEffect(() => {
    if (!profile) return;

    if (activeTab === 'inbox') {
      fetchUserTickets();
    }

    const ticketsChannel = supabase
      .channel('user-support-tickets-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'support_tickets',
        filter: `user_id=eq.${profile.id}`
      }, (payload) => {
        fetchUserTickets();
        if (selectedTicket && payload.new && payload.new.id === selectedTicket.id) {
          setSelectedTicket(payload.new);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
    };
  }, [profile, activeTab, selectedTicket?.id]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);

      const messagesChannel = supabase
        .channel(`messages-${selectedTicket.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`
        }, () => {
          fetchMessages(selectedTicket.id);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [selectedTicket]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle support ticket creation
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim() || !ticketCategory) {
      alert("Please fill in all fields.");
      return;
    }

    setSubmittingTicket(true);
    try {
      // Generate TC prefix ticket number
      const ticketNo = 'TC' + Math.floor(10000 + Math.random() * 90000);

      // Insert support ticket
      const { data: newTicket, error: ticketErr } = await supabase
        .from('support_tickets')
        .insert([{
          user_id: profile.id,
          category: ticketCategory,
          subject: ticketSubject.trim(),
          message: ticketMessage.trim(),
          status: 'open',
          ticket_no: ticketNo
        }])
        .select()
        .single();

      if (ticketErr) throw ticketErr;

      // Insert first message log
      if (newTicket) {
        const { error: msgErr } = await supabase
          .from('support_messages')
          .insert([{
            ticket_id: newTicket.id,
            sender_id: profile.id,
            sender_name: profile.full_name,
            sender_role: profile.role,
            message: ticketMessage.trim()
          }]);
        if (msgErr) throw msgErr;
      }

      showToast(`Support Ticket ${ticketNo} created successfully!`);
      setTicketSubject('');
      setTicketMessage('');
      setTicketCategory('');
      fetchUserTickets();
    } catch (err) {
      console.error("Error creating support ticket:", err);
      alert("Failed to submit support ticket: " + err.message);
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Handle sending reply message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;

    setSendingMessage(true);
    try {
      // 1. Insert chat reply log
      const { error: msgErr } = await supabase
        .from('support_messages')
        .insert([{
          ticket_id: selectedTicket.id,
          sender_id: profile.id,
          sender_name: profile.full_name,
          sender_role: profile.role,
          message: newMessage.trim()
        }]);

      if (msgErr) throw msgErr;

      // 2. Set ticket back to open if it was resolved/closed, and update timestamp
      const { error: ticketErr } = await supabase
        .from('support_tickets')
        .update({ 
          status: 'open', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', selectedTicket.id);

      if (ticketErr) throw ticketErr;

      setNewMessage('');
      fetchMessages(selectedTicket.id);
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message: " + err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  // Update status (mark resolved or reopen)
  const handleUpdateTicketStatus = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;
      showToast(`Ticket marked as ${newStatus}.`);
    } catch (err) {
      console.error("Error updating ticket status:", err);
      alert("Failed to update status: " + err.message);
    }
  };

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'open':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'in-progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'resolved':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-slate-50 text-slate-750 border-slate-200';
    }
  };

  const capitalizeWord = (word) => {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString();
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

  const filteredTopics = helpTopics.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans relative px-4 py-4 text-slate-700">
      
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

      {/* Page Title & Tabs Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-2 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-7 h-7 text-[#86c240]" />
            Help & Support Center
          </h1>
          <p className="text-slate-500 text-xs font-semibold mt-1">Browse search topics or contact direct admin ticketing support.</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit shrink-0">
          <button 
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2 font-bold text-xs rounded-lg transition-all ${activeTab === 'faq' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            FAQ Guide
          </button>
          <button 
            onClick={() => { setActiveTab('inbox'); fetchUserTickets(); }}
            className={`px-4 py-2 font-bold text-xs rounded-lg transition-all ${activeTab === 'inbox' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Support Inbox ({tickets.length})
          </button>
        </div>
      </div>

      {activeTab === 'faq' && (
        <>
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-10 shadow-lg text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#86c240]/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl font-black text-white tracking-tight mb-4">How can we help you?</h2>
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
            {filteredTopics.map((topic, idx) => {
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
        </>
      )}

      {activeTab === 'inbox' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm min-h-[500px] flex flex-col">
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
            <>
              {!selectedTicket ? (
                // inbox list view & create ticket form
                <div className="grid lg:grid-cols-5 gap-8">
                  {/* Tickets list */}
                  <div className="lg:col-span-3 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-base font-bold text-slate-800">Support Ticket Inboxes</h3>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tickets.length} total</span>
                    </div>

                    {loadingTickets ? (
                      <div className="flex items-center justify-center py-12 text-slate-400 text-xs font-semibold">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-[#86c240] mr-2"></div>
                        Loading tickets...
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-200 text-center text-slate-400">
                        <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold">No support tickets found.</p>
                        <p className="text-[10px] mt-0.5">Use the form on the right to submit your first ticket.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                        {tickets.map(ticket => (
                          <div 
                            key={ticket.id}
                            onClick={() => setSelectedTicket(ticket)}
                            className="bg-white border border-slate-150 hover:border-slate-300 p-4 rounded-2xl transition-all cursor-pointer flex justify-between items-start gap-4 hover:shadow-sm"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800 font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                                  {ticket.ticket_no || 'TC-----'}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusBadgeStyles(ticket.status)}`}>
                                  {capitalizeWord(ticket.status === 'in-progress' ? 'In Progress' : ticket.status)}
                                </span>
                              </div>
                              <h4 className="text-xs font-extrabold text-slate-850 leading-tight pt-1">{ticket.subject}</h4>
                              <p className="text-[10px] text-slate-450 truncate max-w-sm">{ticket.message}</p>
                            </div>
                            <div className="text-right text-[9px] text-slate-400 font-bold flex flex-col justify-between h-full shrink-0">
                              <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{ticket.category}</span>
                              <span className="mt-4 flex items-center gap-1"><Clock className="w-3 h-3 text-slate-300" /> {new Date(ticket.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Create Ticket Form */}
                  <div className="lg:col-span-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
                    <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                      <PlusCircle className="w-4 h-4 text-[#86c240]" /> Create Support Ticket
                    </h3>

                    <form onSubmit={handleCreateTicket} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Category</label>
                        <select 
                          required
                          value={ticketCategory}
                          onChange={(e) => setTicketCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#86c240] text-xs font-bold text-slate-700 bg-white"
                        >
                          <option value="" disabled>Select category</option>
                          <option value={isPremium ? "Premium Tutors/Guardians" : "Verified Tutors/Guardians"}>
                            {isPremium ? "Premium Support" : "Verified Member Support"}
                          </option>
                          <option value="Others">General Issue</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Subject</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Brief title of the problem"
                          value={ticketSubject}
                          onChange={(e) => setTicketSubject(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#86c240] text-xs font-bold text-slate-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Message</label>
                        <textarea 
                          required
                          rows="4"
                          placeholder="Explain your problem in details..."
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#86c240] text-xs font-bold text-slate-700 resize-none"
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingTicket}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
                      >
                        {submittingTicket ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            Submit Ticket <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                // active chat room thread view
                <div className="flex flex-col flex-1 min-h-[480px]">
                  {/* Chat Room Header */}
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-3 bg-slate-50/50 p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSelectedTicket(null)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 font-mono bg-white border border-slate-200 px-2 py-0.5 rounded">
                            {selectedTicket.ticket_no || 'TC-----'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusBadgeStyles(selectedTicket.status)}`}>
                            {capitalizeWord(selectedTicket.status === 'in-progress' ? 'In Progress' : selectedTicket.status)}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-800 mt-1 leading-tight">{selectedTicket.subject}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedTicket.status !== 'resolved' ? (
                        <button 
                          onClick={() => handleUpdateTicketStatus('resolved')}
                          className="px-3.5 py-1.5 bg-[#86c240] hover:bg-[#72a635] text-white rounded-lg text-[10px] font-black transition-all flex items-center gap-1 border border-[#86c240]"
                        >
                          <CheckCircle className="w-3 h-3" /> Mark Resolved
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateTicketStatus('open')}
                          className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-350 text-slate-700 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 border border-slate-300"
                        >
                          <Clock className="w-3 h-3" /> Reopen Ticket
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chat messages log scroll area */}
                  <div className="flex-1 bg-slate-50 border border-slate-150 rounded-2xl p-4 overflow-y-auto space-y-4 max-h-[350px] min-h-[250px]">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs font-medium">No messages found.</div>
                    ) : (
                      messages.map(msg => {
                        const isMe = msg.sender_id === profile.id;
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}
                          >
                            <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm text-xs font-semibold leading-relaxed ${
                              isMe 
                                ? 'bg-[#86c240] text-white rounded-tr-none' 
                                : 'bg-white text-slate-750 border border-slate-200 rounded-tl-none'
                            }`}>
                              <div className="flex justify-between items-center gap-4 text-[9px] mb-1 font-bold opacity-80">
                                <span>{isMe ? 'You' : msg.sender_name}</span>
                                <span>{formatTime(msg.created_at)}</span>
                              </div>
                              <p className="whitespace-pre-wrap">{msg.message}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input box */}
                  <div className="mt-4">
                    {selectedTicket.status === 'resolved' ? (
                      <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" /> This support ticket is resolved. You can reopen it if you still need assistance.
                      </div>
                    ) : (
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <textarea 
                          required
                          rows="1"
                          placeholder="Type your message here..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage(e);
                            }
                          }}
                          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#86c240] text-xs font-semibold text-slate-800 resize-none h-11 min-h-[44px]"
                        ></textarea>
                        <button 
                          type="submit"
                          disabled={sendingMessage || !newMessage.trim()}
                          className="px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center shadow-sm disabled:opacity-40 transition-colors h-11 shrink-0"
                        >
                          {sendingMessage ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* FAQ topic detail modal */}
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
