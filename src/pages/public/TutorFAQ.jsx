import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Mail, PhoneCall } from 'lucide-react';

const TutorFAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(0); // Default expand first item
  const [language, setLanguage] = useState('en'); // 'en' or 'bn'

  const faqData = {
    en: [
      {
        question: "How do I become a tutor on TutorCore?",
        answer: "Register an account as a Tutor on the Sign Up page. After registration, verify your email/phone number and complete your profile details (education history, preference options, NID/certificates) to at least 80% to be eligible to apply for jobs."
      },
      {
        question: "Is there any registration fee?",
        answer: "No, registration and profile creation on TutorCore is completely free. We do not charge upfront fees to create your tutoring profile."
      },
      {
        question: "What is the matching commission / platform fee?",
        answer: "Upon successfully securing a tuition match through our platform, we charge a one-time matching commission fee from your first month's salary (usually 50%). All fee details are transparently displayed before you apply for a job."
      },
      {
        question: "How do I apply for tuition jobs?",
        answer: "Once your profile is at least 80% complete and verified by admins, browse the Job Board, review the tuition requirements, select one that matches your subject expertise, and click 'Apply Now'."
      },
      {
        question: "What is the Premium Request feature?",
        answer: "Tutors can request a premium status upgrade through their dashboard. Premium tutors are featured at the top of candidate list proposals, get higher visibility from guardians, and are manually recommended by matching coordinators."
      },
      {
        question: "How do I receive my tutoring salary?",
        answer: "Your salary is paid directly to you by the guardian at the end of each tutoring month. You are free to negotiate the payment mode (Cash, Bank, Mobile Finance like bKash) directly with the parent/guardian."
      }
    ],
    bn: [
      {
        question: "টিউটরকোর-এ কীভাবে টিউটর হিসেবে যুক্ত হব?",
        answer: "টিউটর হিসেবে রেজিস্ট্রেশন করতে আমাদের প্ল্যাটফর্মের 'Sign Up' পেজে গিয়ে অ্যাকাউন্ট তৈরি করুন। এরপর আপনার মোবাইল নাম্বার ভেরিফাই করে আপনার প্রোফাইলের বিস্তারিত তথ্য (শিক্ষাগত যোগ্যতা, টিউশন লোকেশন, বিষয় এবং জাতীয় পরিচয়পত্র) অন্তত ৮০% সম্পন্ন করুন। এডমিন প্যানেল থেকে প্রোফাইলটি ভেরিফাই করার পর আপনি টিউশন জবের জন্য আবেদন করতে পারবেন।"
      },
      {
        question: "রেজিস্ট্রেশন করতে কোনো ফি লাগবে কি?",
        answer: "না, টিউটরকোর বিডি-তে রেজিস্ট্রেশন করা এবং টিউটর প্রোফাইল তৈরি করা সম্পূর্ণ ফ্রি। অ্যাকাউন্ট তৈরি বা প্রোফাইল খোলার জন্য কোনো অগ্রিম ফি দিতে হয় না।"
      },
      {
        question: "ম্যাচিং কমিশন বা প্ল্যাটফর্ম সার্ভিস চার্জ কত?",
        answer: "সফলভাবে টিউশন ম্যাচিং সম্পন্ন হওয়ার পর প্রথম মাসের বেতন থেকে এককালীন একটি সার্ভিস চার্জ প্রযোজ্য হয় (সাধারণত ৫০%)। প্রতিটি টিউশন জবে আবেদনের পূর্বেই চার্জের বিস্তারিত তথ্য পরিষ্কারভাবে প্রদর্শন করা থাকে।"
      },
      {
        question: "টিউশন জবের জন্য কীভাবে আবেদন করব?",
        answer: "যখন আপনার প্রোফাইল অন্তত ৮০% সম্পন্ন হবে এবং অ্যাডমিন টিম দ্বারা ভেরিফাই হবে, তখন আপনি জব বোর্ড ব্রাউজ করে আপনার পছন্দের লোকেশন ও বিষয়ের টিউশন রিকোয়েস্টগুলোতে 'Apply Now' বাটনে ক্লিক করে আবেদন করতে পারবেন।"
      },
      {
        question: "প্রিমিয়াম রিকোয়েস্ট (Premium Request) ফিচারটি কী?",
        answer: "টিউটররা তাদের ড্যাশবোর্ড থেকে প্রিমিয়াম ফিচারের জন্য রিকোয়েস্ট করতে পারেন। প্রিমিয়াম টিউটরদের প্রোফাইলগুলো অভিভাবকদের ক্যান্ডিডেট লিস্টে সবার উপরে প্রদর্শিত হয়, বেশি ভিজিবিলিটি পায় এবং আমাদের টিউটর ম্যাচিং টিম তাদের ম্যানুয়ালি অভিভাবকদের কাছে বেশি রিকমেন্ড করে।"
      },
      {
        question: "আমার টিউশনের বেতন কীভাবে পাব?",
        answer: "টিউশনের বেতন সরাসরি অভিভাবক আপনাকে প্রদান করবেন। প্রতি মাসের শেষে বেতন পাওয়ার মাধ্যম (নগদ টাকা, ব্যাংক ট্রান্সফার, বা বিকাশ/রকেট/নগদ এর মতো মোবাইল ব্যাংকিং) আপনি সরাসরি অভিভাবকের সাথে কথা বলে ঠিক করে নেবেন।"
      }
    ]
  };

  const currentFaqData = faqData[language];

  // Filter FAQs based on query
  const filteredFaqs = currentFaqData.filter(
    faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Language Toggle Switch */}
      <div className="flex justify-end animate-in fade-in duration-300">
        <div className="inline-flex bg-slate-100 rounded-xl p-1 shadow-inner border border-slate-200/50">
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 rounded-lg text-sm font-extrabold transition-all duration-300 ${language === 'en' ? 'bg-[#86c240] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('bn')}
            className={`px-4 py-2 rounded-lg text-sm font-extrabold transition-all duration-300 ${language === 'bn' ? 'bg-[#86c240] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            বাংলা
          </button>
        </div>
      </div>

      {/* Header section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">
          {language === 'en' ? (
            <>Tutor <span className="text-[#86c240]">FAQ</span></>
          ) : (
            <>টিউটরদের জন্য <span className="text-[#86c240]">জিজ্ঞাসাবলী</span></>
          )}
        </h1>
        <div className="w-24 h-1 bg-[#86c240] mx-auto rounded-full"></div>
        <p className="text-slate-500 font-medium max-w-xl mx-auto">
          {language === 'en'
            ? "Find answers to common questions about tutor registration, profile completeness, job applications, and matching commissions."
            : "টিউটর রেজিস্ট্রেশন, প্রোফাইল সম্পূর্ণকরণ, জবের আবেদন প্রক্রিয়া এবং ম্যাচিং কমিশন সংক্রান্ত বিভিন্ন জিজ্ঞাসার উত্তর জেনে নিন।"
          }
        </p>
      </div>

      {/* Dynamic Search Bar */}
      <div className="relative max-w-xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input 
          type="text" 
          placeholder={language === 'en' ? "Search tutor questions..." : "প্রশ্ন দিয়ে খুঁজুন..."}
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#86c240] focus:border-[#86c240] sm:text-sm transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Accordions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium">
            {language === 'en' 
              ? `No matching questions found for "${searchQuery}".`
              : `"${searchQuery}" এর জন্য কোনো মিল থাকা প্রশ্ন পাওয়া যায়নি।`
            }
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
                  <p className="p-5 text-sm text-slate-600 leading-relaxed font-medium bg-white/50">
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
          <h3 className="text-xl font-extrabold mb-1">
            {language === 'en' ? "Need additional support?" : "বাড়তি কোনো তথ্যের প্রয়োজন?"}
          </h3>
          <p className="text-slate-450 text-sm font-medium">
            {language === 'en' 
              ? "If you couldn't find an answer here, our team is happy to assist you."
              : "আপনি যদি এখানে আপনার প্রয়োজনীয় উত্তরটি খুঁজে না পান, আমাদের সাপোর্ট টিম সাহায্য করতে সদা প্রস্তুত।"
            }
          </p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <a href="mailto:support@tutorcore.com" className="flex items-center gap-2 px-4 py-2.5 bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-[#86c240]/10">
            <Mail className="w-4 h-4" /> {language === 'en' ? "Email Us" : "আমাদের ইমেইল করুন"}
          </a>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition-colors border border-slate-700">
            <PhoneCall className="w-4 h-4" /> {language === 'en' ? "Live Call" : "সরাসরি কল"}
          </button>
        </div>
      </div>

    </div>
  );
};

export default TutorFAQ;
