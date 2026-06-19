import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  HelpCircle, CheckCircle, Clock, AlertTriangle, 
  MessageSquare, User, Calendar, Filter, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Verified', 'Premium', 'Others'
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'open', 'resolved'
  const [actionMessage, setActionMessage] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          id,
          category,
          subject,
          message,
          status,
          created_at,
          user_id,
          users:user_id ( full_name, role, email, phone_number )
        `)
        .order('created_at', { ascending: false });

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

  useEffect(() => {
    fetchTickets();
  }, []);

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

      setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
      showToast(`Ticket marked as ${newStatus}.`);
    } catch (err) {
      console.error("Error updating ticket:", err);
      alert("Failed to update ticket: " + err.message);
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
    
    const statusMatch = statusFilter === 'All' ? true : t.status === statusFilter;
    
    return tabMatch && statusMatch;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'in-progress': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'resolved': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
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
            <CheckCircle className="w-5 h-5 text-[#86c240] shrink-0" />
            <span className="text-sm font-bold">{actionMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-[#86c240]" />
            Help & Support Tickets
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage and resolve issues submitted by verified and premium users.</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full sm:w-auto">
          {['All', 'Premium', 'Verified', 'Others'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-slate-400 font-bold text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#86c240] mr-3"></div>
            Loading support tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
            <p className="font-bold text-sm">No tickets found for this category.</p>
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
                    ticket.status === 'open' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {ticket.status === 'open' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        {ticket.category.split(' ')[0]}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-[#86c240] transition-colors">{ticket.subject}</h3>
                    <p className="text-sm font-medium text-slate-500 line-clamp-1 mt-0.5 max-w-2xl">{ticket.message}</p>
                  </div>
                </div>
                
                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {ticket.users?.full_name || 'Unknown User'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 sm:bottom-auto sm:top-1/2 left-0 sm:left-1/2 transform sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[600px] bg-white sm:rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                  <span className="text-xs font-bold text-slate-400">TICKET DETAILS</span>
                </div>
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 leading-tight">{selectedTicket.subject}</h2>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm font-medium text-slate-500">
                    <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg">
                      <User className="w-4 h-4" /> {selectedTicket.users?.full_name} ({selectedTicket.users?.role})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> {new Date(selectedTicket.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedTicket.message}
                </div>

                {selectedTicket.users?.phone_number && (
                  <div className="border border-slate-100 rounded-xl p-4 bg-white flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <span className="text-slate-400">Contact Number:</span> 
                    {selectedTicket.users.phone_number}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                {selectedTicket.status !== 'resolved' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                    className="flex-1 py-3 bg-[#86c240] hover:bg-[#72a635] text-white rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark as Resolved
                  </button>
                )}
                {selectedTicket.status === 'resolved' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'open')}
                    className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" /> Reopen Ticket
                  </button>
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
