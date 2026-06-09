import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, MessageCircle, Mail, PhoneCall } from 'lucide-react';

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(0); // Default expand first item

  const faqData = [
    {
      question: "What is TutorCore?",
      answer: "TutorCore is a premium online edutech matching platform that connects students and parents with top-tier, private home and online tutors. We help match educational requirements with experienced educators to optimize learning outcomes."
    },
    {
      question: "Why choose TutorCore?",
      answer: "Unlike standard listings, TutorCore acts as a trusted facilitator. We manually verify the credentials, academic history, and background of all tutors. We also offer group batch tutoring, performance monitoring, and secure payment handling."
    },
    {
      question: "How does the matching process work?",
      answer: "Parents/Guardians post a tuition request specifying the subject, class, location, and budget. Our platform matches these requirements with qualified tutors. Tutors can apply, and our administrators review applications before proposing the best matches."
    },
    {
      question: "Is there any fee to use TutorCore?",
      answer: "For parents and guardians, posting a tuition request is completely free. Tutors may be subject to a platform matching fee or commission from their first month's salary upon successfully securing a tuition, which is disclosed upfront."
    },
    {
      question: "How does TutorCore verify tutors?",
      answer: "Tutors are required to submit their educational certificates, institutional IDs, and background checks. Our verification team personally reviews these documents before granting verified badges on our platform."
    },
    {
      question: "How are tuition salaries handled?",
      answer: "Tuition fees/salaries are finalized between the guardian and the tutor during the matching stage. We recommend transparent monthly payments, but tutors and guardians can choose weekly or custom options based on mutual agreement."
    },
    {
      question: "What subjects are available on TutorCore?",
      answer: "We support a wide array of categories including primary/secondary school subjects (Math, Science, English, physics), test preparations (SAT, IELTS, HSC/SSC board exams), language learning, computer coding, and skill development."
    }
  ];

  // Filter FAQs based on query
  const filteredFaqs = faqData.filter(
    faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Header section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">
          Frequently <span className="text-[#86c240]">A</span>sked <span className="text-[#86c240]">Q</span>uestions
        </h1>
        <div className="w-24 h-1 bg-[#86c240] mx-auto rounded-full"></div>
        <p className="text-slate-500 font-medium max-w-xl mx-auto">
          Find answers to common questions about how TutorCore works for students, parents, and tutors.
        </p>
      </div>

      {/* Dynamic Search Bar */}
      <div className="relative max-w-xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input 
          type="text" 
          placeholder="Search questions or keywords..."
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#86c240] focus:border-[#86c240] sm:text-sm transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Accordions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium">
            No matching questions found for "{searchQuery}".
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <div 
                key={idx} 
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-[#86c240]/30 bg-[#eaf4df]/10' : 'border-slate-100 bg-white hover:border-slate-200'}`}
              >
                <button
                  onClick={() => toggleExpand(idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-800 focus:outline-none"
                >
                  <span className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${isExpanded ? 'bg-[#86c240]' : 'bg-slate-300'}`}></span>
                    {faq.question}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-[#86c240] transition-transform" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 transition-transform" />
                  )}
                </button>
                
                {/* Accordion Content */}
                <div 
                  className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 border-t border-slate-100/50' : 'max-h-0'}`}
                  style={{ overflow: 'hidden' }}
                >
                  <p className="p-5 text-sm text-slate-650 leading-relaxed font-medium bg-white/50">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Support CTA Section */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden border border-slate-850 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#86c240]/10 rounded-full blur-3xl -mr-6 -mt-6"></div>
        <div>
          <h3 className="text-xl font-extrabold mb-1">Still have questions?</h3>
          <p className="text-slate-450 text-sm font-medium">If you couldn't find an answer here, our team is happy to assist you.</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <a href="mailto:support@tutorcore.com" className="flex items-center gap-2 px-4 py-2.5 bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-[#86c240]/10">
            <Mail className="w-4 h-4" /> Email Us
          </a>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition-colors border border-slate-700">
            <PhoneCall className="w-4 h-4" /> Live Call
          </button>
        </div>
      </div>

    </div>
  );
};

export default FAQ;
