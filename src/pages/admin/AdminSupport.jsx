import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { 
  HelpCircle, CheckCircle, Clock, AlertTriangle, 
  MessageSquare, User, Calendar, Filter, X, Send, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminSupport = () => {
  const { profile } = useAuthStore();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Verified', 'Premium', 'Others'
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending' (open/in-progress), 'resolved', 'All'
  const [actionMessage, setActionMessage] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Chat messaging states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          id,
          ticket_no,
          category,
          subject,
          message,
          status,
          created_at,
          updated_at,
          user_id,
          users:user_id ( full_name, role, email, phone_number )
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          console.warn("support_tickets table not found yet.");
          setTickets([]);
        } else {
          throw error;
        }
      } else {
        setTickets(data || []);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  };

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
      console.error("Error fetching messages for ticket:", err);
    }
  };

  useEffect(() => {
    fetchTickets();

    // Subscribe to ticket changes
    const channel = supabase
      .channel('admin-support-tickets-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, (payload) => {
        fetchTickets();
        if (selectedTicket && payload.new && payload.new.id === selectedTicket.id) {
          setSelectedTicket(payload.new);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket?.id]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);

      const channel = supabase
        .channel(`admin-messages-${selectedTicket.id}`)
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
        supabase.removeChannel(channel);
      };
    }
  }, [selectedTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showToast = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 4000);
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;

      showToast(`Ticket successfully marked as ${capitalizeWord(newStatus)}.`);
      fetchTickets();
    } catch (err) {
      console.error("Error updating ticket status:", err);
      alert("Failed to update status: " + err.message);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;

    setSendingMessage(true);
    try {
      // 1. Insert support reply log
      const { error: msgErr } = await supabase
        .from('support_messages')
        .insert([{
          ticket_id: selectedTicket.id,
          sender_id: profile.id,
          sender_name: 'TutorCore Admin',
          sender_role: 'admin',
          message: newMessage.trim()
        }]);

      if (msgErr) throw msgErr;

      // 2. Set ticket status to in-progress and update timestamp
      const { error: ticketErr } = await supabase
        .from('support_tickets')
        .update({ 
          status: 'in-progress', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', selectedTicket.id);

      if (ticketErr) throw ticketErr;

      setNewMessage('');
      fetchMessages(selectedTicket.id);
      fetchTickets();
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("Failed to send reply: " + err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const tabMatch = activeTab === 'All' 
      ? true 
      : activeTab === 'Premium' 
        ? t.category === 'Premium Tutors/Guardians' 
        : activeTab === 'Verified' 
          ? t.category === 'Verified Tutors/Guardians' 
          : t.category === 'Others';
    
    let statusMatch = true;
    if (statusFilter === 'pending') {
      statusMatch = t.status === 'open' || t.status === 'in-progress';
    } else if (statusFilter === 'resolved') {
      statusMatch = t.status === 'resolved' || t.status === 'closed';
    }
    
    return tabMatch && statusMatch;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'in-progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'resolved': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const capitalizeWord = (word) => {
    if (!word) return '';
    if (word === 'in-progress') return 'In Progress';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans relative px-4 py-4 text-slate-700">
      <AnimatePresence>
        {actionMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 bg-slate-900 text-white rounded-2xl shadow-xl px-6 py-4 z-[99] flex items-center gap-3 border border-slate-800"
          >
            <CheckCircle className="w-5 h-5 text-[#86c240] shrink-0" />
            <span className="text-sm font-bold">{actionMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-[#86c240]" />
            Help & Support Ticket Manager
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Read and reply to support ticket inboxes submitted by Tutors and Guardians.</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto overflow-x-auto">
          {['All', 'Premium', 'Verified', 'Others'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Inbox Filters Bar */}
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-150">
        <span className="text-xs font-bold text-slate-500">Inbox Log Type</span>
        <div className="flex gap-2">
          <button 
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${statusFilter === 'pending' ? 'bg-amber-500 border-amber-600 text-white shadow-sm shadow-amber-500/10' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'}`}
          >
            Pending ({tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length})
          </button>
          <button 
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${statusFilter === 'resolved' ? 'bg-green-600 border-green-700 text-white shadow-sm shadow-green-600/10' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'}`}
          >
            Resolved Logs ({tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length})
          </button>
          <button 
            onClick={() => setStatusFilter('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${statusFilter === 'All' ? 'bg-slate-700 border-slate-850 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'}`}
          >
            All Tickets
          </button>
        </div>
      </div>

      {/* Support Ticketing Core Layout */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-slate-400 font-bold text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#86c240] mr-3"></div>
            Loading support tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
            <p className="font-bold text-sm">No tickets found in this inbox.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTickets.map(ticket => (
              <div 
                key={ticket.id} 
                onClick={() => setSelectedTicket(ticket)}
                className="p-5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    ticket.status === 'open' 
                      ? 'bg-amber-100 text-amber-600' 
                      : ticket.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-green-150 text-green-700'
                  }`}>
                    {ticket.status === 'open' ? <AlertTriangle className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="text-xs font-black text-slate-800 font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        {ticket.ticket_no || 'TC-----'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusColor(ticket.status)}`}>
                        {capitalizeWord(ticket.status)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {ticket.category.split(' ')[0]} Member
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-[#86c240] transition-colors">{ticket.subject}</h3>
                    <p className="text-sm font-medium text-slate-500 line-clamp-1 mt-0.5 max-w-2xl">{ticket.message}</p>
                  </div>
                </div>
                
                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {ticket.users?.full_name || 'Unknown User'}
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                      {ticket.users?.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-300" />
                    {formatTime(ticket.updated_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Details & Real-Time Chat Drawer */}
      <AnimatePresence>
        {selectedTicket && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="fixed inset-0 bg-slate-900 z-40"
            ></motion.div>
            
            <motion.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 sm:bottom-auto sm:top-12 right-0 sm:right-6 w-full sm:w-[600px] bg-white sm:rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col h-[90vh]"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-800 font-mono bg-white border border-slate-200 px-2 py-0.5 rounded">
                    {selectedTicket.ticket_no || 'TC-----'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(selectedTicket.status)}`}>
                    {capitalizeWord(selectedTicket.status)}
                  </span>
                  <span className="text-xs font-bold text-slate-400">Support Chat</span>
                </div>
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat room display */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* User Context & Info Card */}
                <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-800">{selectedTicket.subject}</h3>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
                  
                  <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-bold text-slate-550">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> {selectedTicket.users?.full_name} ({capitalizeWord(selectedTicket.users?.role)})</span>
                    {selectedTicket.users?.phone_number && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-300" /> Ph: {selectedTicket.users.phone_number}</span>}
                    {selectedTicket.users?.email && <span className="flex items-center gap-1">@ {selectedTicket.users.email}</span>}
                  </div>
                </div>

                {/* Conversation messages */}
                <div className="space-y-4 pt-2">
                  <div className="text-center text-[10px] text-slate-400 font-black uppercase tracking-wider">Conversation Log</div>
                  
                  {messages.map(msg => {
                    const isMe = msg.sender_role === 'admin';
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
                            <span>{isMe ? 'You (Admin)' : msg.sender_name}</span>
                            <span>{formatTime(msg.created_at)}</span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Reply Box and resolution controls */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
                {selectedTicket.status === 'resolved' ? (
                  <div className="flex flex-col gap-3">
                    <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" /> This support ticket is resolved and logged.
                    </div>
                    <button 
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'open')}
                      className="w-full py-2.5 bg-white border border-slate-200 hover:border-slate-350 text-slate-700 rounded-xl text-xs font-extrabold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Clock className="w-4 h-4" /> Reopen Ticket
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <form onSubmit={handleSendReply} className="flex gap-2">
                      <textarea 
                        required
                        rows="1"
                        placeholder="Type reply to user..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply(e);
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

                    <button 
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                      className="w-full py-2.5 bg-[#86c240] hover:bg-[#72a635] text-white rounded-xl text-xs font-extrabold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Mark as Resolved & Log
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSupport;
