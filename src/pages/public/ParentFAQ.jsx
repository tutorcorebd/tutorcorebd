import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Mail, PhoneCall } from 'lucide-react';

const ParentFAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(0); // Default expand first item
  const [language, setLanguage] = useState('en'); // 'en' or 'bn'

  const faqData = {
    en: [
      {
        question: "How do I post a tuition requirement?",
        answer: "You can easily post a requirement by logging in, going to your dashboard, and clicking 'Post A Tuition'. Provide details such as the student's class, subjects, tutoring location, preferred tutor gender, and your budget range."
      },
      {
        question: "Is there any fee to hire or match with a tutor?",
        answer: "No, posting tuition requests and matching with qualified tutors is completely free for parents and guardians. You only pay the tutor's agreed monthly salary directly to the tutor."
      },
      {
        question: "How does Tutor Core verify tutors?",
        answer: "Tutors are required to submit their academic certificates, university/institutional IDs, and background verification documents. Our verification team reviews these credentials before giving tutors a verified badge."
      },
      {
        question: "Can I get a demo class before finalizing a tutor?",
        answer: "Yes, parents/guardians are entitled to a trial/demo class. This helps you and the student evaluate the tutor's teaching style and chemistry before committing to a monthly tuition contract."
      },
      {
        question: "What if the matched tutor is not a good fit?",
        answer: "If the matched tutor does not meet your expectations during the demo or first few sessions, contact our support team. We will immediately review your request and match you with a replacement candidate at no extra cost."
      },
      {
        question: "How do I pay the tutor's monthly salary?",
        answer: "Tuition salaries are paid directly to the tutor at the end of each tutoring month. The payment mode (cash, bank transfer, mobile financial service like bKash) is decided by mutual agreement between you and the tutor."
      }
    ],
    bn: [
      {
        question: "টিউটর খোঁজার জন্য কীভাবে রিকোয়েস্ট পোস্ট করব?",
        answer: "আপনি সহজে আপনার অ্যাকাউন্টে লগইন করে ড্যাশবোর্ড থেকে 'Post A Tuition' বাটনে ক্লিক করার মাধ্যমে রিকোয়েস্ট পোস্ট করতে পারবেন। এখানে শিক্ষার্থীর ক্লাস, বিষয়, স্থান, কাঙ্ক্ষিত টিউটরের জেন্ডার এবং আপনার বাজেট রেঞ্জ সিলেক্ট করে দিন।"
      },
      {
        question: "টিউটর খোঁজার জন্য কোনো ফি দিতে হয় কি?",
        answer: "না, টিউটর কোর-এ অভিভাবক ও শিক্ষার্থীদের জন্য টিউশন রিকোয়েস্ট পোস্ট করা এবং শিক্ষক নির্বাচন করা সম্পূর্ণ ফ্রি। আপনার শুধুমাত্র পারস্পরিক আলোচনার ভিত্তিতে শিক্ষকের নির্ধারিত মাসিক বেতন সরাসরি শিক্ষককে পরিশোধ করতে হবে।"
      },
      {
        question: "টিউটর কোর কীভাবে টিউটরদের ভেরিফাই করে?",
        answer: "টিউটরদের তাদের শিক্ষাগত যোগ্যতার প্রশংসাপত্র, বিশ্ববিদ্যালয়/প্রাতিষ্ঠানিক আইডি কার্ড এবং জাতীয় পরিচয়পত্র সাবমিট করতে হয়। আমাদের ভেরিফিকেশন টিম তথ্যগুলো ব্যক্তিগতভাবে যাচাই করার পরই কেবল প্রোফাইলে ভেরিভাইড ব্যাজ প্রদান করে।"
      },
      {
        question: "টিউটর ফাইনাল করার পূর্বে ট্রায়াল বা ডেমো ক্লাস পাব কি?",
        answer: "হ্যাঁ, অভিভাবক ও শিক্ষার্থীরা একটি ফ্রি ডেমো/ট্রায়াল ক্লাস নেওয়ার সুযোগ পাবেন। এর মাধ্যমে আপনি ও শিক্ষার্থী শিক্ষকের পড়ানোর ধরণ এবং তার সাথে বোঝাপড়া যাচাই করে সিদ্ধান্ত নিতে পারবেন।"
      },
      {
        question: "নির্বাচিত টিউটর যদি ভালো পড়াতে না পারে বা উপযুক্ত না হয়?",
        answer: "ডেমো ক্লাসে বা প্রথম কয়েক দিনের মধ্যে যদি শিক্ষককে আপনার উপযুক্ত মনে না হয়, আমাদের সাপোর্ট টিমকে জানান। আমরা আপনার রিকোয়েস্ট পুনরায় রিভিউ করে কোনো অতিরিক্ত চার্জ ছাড়াই দ্রুত নতুন টিউটর ম্যাচ করে দেব।"
      },
      {
        question: "টিউটরের মাসিক বেতন কীভাবে পরিশোধ করব?",
        answer: "মাস শেষে শিক্ষকের বেতন সরাসরি টিউটরকে পরিশোধ করতে হবে। পেমেন্ট কীভাবে করবেন (নগদ টাকা, ব্যাংক ট্রান্সফার বা মোবাইল ব্যাংকিং যেমন বিকাশ, রকেট) তা অভিভাবক এবং টিউটর নিজেরা আলোচনা করে নির্ধারণ করে নেবেন।"
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
            <>Parent & Guardian <span className="text-[#86c240]">FAQ</span></>
          ) : (
            <>অভিভাবকদের জন্য <span className="text-[#86c240]">জিজ্ঞাসাবলী</span></>
          )}
        </h1>
        <div className="w-24 h-1 bg-[#86c240] mx-auto rounded-full"></div>
        <p className="text-slate-500 font-medium max-w-xl mx-auto">
          {language === 'en'
            ? "Find answers to common questions about hiring tutors, safety, pricing, and matching services."
            : "শিক্ষক নিয়োগ, নিরাপত্তা, টিউশন ফি এবং টিউটর ম্যাচিং প্রক্রিয়া সম্পর্কিত বিভিন্ন সাধারণ জিজ্ঞাসাগুলোর উত্তর জেনে নিন।"
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
          placeholder={language === 'en' ? "Search parent questions..." : "প্রশ্ন দিয়ে খুঁজুন..."}
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
          <a href="mailto:tutorcorebd@gmail.com" className="flex items-center gap-2 px-4 py-2.5 bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-[#86c240]/10">
            <Mail className="w-4 h-4" /> {language === 'en' ? "Email Us" : "আমাদের ইমেইল করুন"}
          </a>
          <a href="tel:+8801785346691" className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition-colors border border-slate-700">
            <PhoneCall className="w-4 h-4" /> {language === 'en' ? "Live Call: +8801785346691" : "সরাসরি কল: +8801785346691"}
          </a>
        </div>
      </div>

    </div>
  );
};

export default ParentFAQ;
