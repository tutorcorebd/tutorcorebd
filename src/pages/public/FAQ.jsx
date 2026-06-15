import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Mail, PhoneCall } from 'lucide-react';

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(0); // Default expand first item
  const [language, setLanguage] = useState('en'); // 'en' or 'bn'

  const faqData = {
    en: [
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
    ],
    bn: [
      {
        question: "টিউটরকোর কী?",
        answer: "টিউটরকোর হলো একটি প্রিমিয়াম অনলাইন এডুটেক ম্যাচিং প্ল্যাটফর্ম যা ছাত্র-ছাত্রী ও অভিভাবকদের দেশের সেরা গৃহশিক্ষক ও অনলাইন টিউটরদের সাথে যুক্ত করে। আমরা শিক্ষার্থীদের ভালো ফলাফলোর জন্য পড়ালেখার প্রয়োজনীয়তা অনুযায়ী অভিজ্ঞ শিক্ষকদের খুঁজে পেতে সাহায্য করি।"
      },
      {
        question: "কেন টিউটরকোর বেছে নেবেন?",
        answer: "সাধারণ লিস্টিং ওয়েবসাইটের বিপরীতে, টিউটরকোর একটি বিশ্বস্ত মাধ্যম হিসেবে কাজ করে। আমরা প্রতিটি শিক্ষকের প্রশংসাপত্র, প্রাতিষ্ঠানিক পরিচয় এবং ব্যাকগ্রাউন্ড ব্যক্তিগতভাবে যাচাই করি। এছাড়া আমাদের এখানে গ্রুপ ব্যাচ টিউটরিং, নিয়মিত পারফরম্যান্স মনিটরিং এবং নিরাপদ পেমেন্ট সুবিধা রয়েছে।"
      },
      {
        question: "টিউটর ম্যাচিং প্রক্রিয়া কীভাবে কাজ করে?",
        answer: "অভিভাবকগণ শিক্ষার্থীর ক্লাস, বিষয়, স্থান এবং বাজেট উল্লেখ করে একটি টিউশন রিকোয়েস্ট পোস্ট করেন। আমাদের প্ল্যাটফর্ম সেই অনুযায়ী যোগ্য টিউটরদের ম্যাচ করে। টিউটররা আবেদন করার পর আমাদের অ্যাডমিন টিম আবেদনসমূহ রিভিউ করে সেরা প্রার্থীদের অভিভাবকদের কাছে প্রস্তাব করে।"
      },
      {
        question: "টিউটরকোর ব্যবহার করতে কোনো ফি দিতে হয় কি?",
        answer: "অভিভাবক ও শিক্ষার্থীদের জন্য টিউশন রিকোয়েস্ট পোস্ট করা সম্পূর্ণ ফ্রি। সফলভাবে টিউশন পাওয়ার পর প্রথম মাসের বেতন থেকে টিউটরদের একটি নির্দিষ্ট প্ল্যাটফর্ম ফি বা ম্যাচিং কমিশন দিতে হয়, যা আবেদনের পূর্বেই জানিয়ে দেওয়া হয়।"
      },
      {
        question: "টিউটরকোর কীভাবে টিউটরদের ভেরিফাই করে?",
        answer: "টিউটরদের তাদের শিক্ষাগত যোগ্যতার সার্টিফিকেট, প্রাতিষ্ঠানিক আইডি কার্ড এবং ব্যাকগ্রাউন্ড ভেরিফিকেশনের তথ্য সাবমিট করতে হয়। আমাদের ভেরিফিকেশন টিম তথ্যগুলো ব্যক্তিগতভাবে যাচাই করে প্রোফাইলে ভেরিফাইড ব্যাজ প্রদান করে।"
      },
      {
        question: "টিউশন বেতন কীভাবে পরিশোধ করতে হয়?",
        answer: "টিউশন ম্যাচিং পর্যায়ে অভিভাবক এবং টিউটরের মধ্যে আলোচনা করে বেতন নির্ধারণ করা হয়। আমরা সরাসরি মাসিক পেমেন্ট করতে সুপারিশ করি, তবে অভিভাবক ও টিউটরের পারস্পরিক আলোচনার ভিত্তিতে সাপ্তাহিক বা কাস্টম পেমেন্ট পদ্ধতিও নির্ধারণ করা যেতে পারে।"
      },
      {
        question: "টিউটরকোর-এ কোন কোন বিষয় শেখানো হয়?",
        answer: "আমরা প্রাথমিক/মাধ্যমিক বিদ্যালয়ের সকল বিষয় (গণিত, বিজ্ঞান, ইংরেজি, পদার্থবিজ্ঞান), বোর্ড পরীক্ষার প্রস্তুতি (SAT, IELTS, HSC/SSC), ভাষা শিক্ষা, কম্পিউটার কোডিং এবং দক্ষতা উন্নয়ন সহ সব ধরণের বিষয় সাপোর্ট করি।"
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
            <>Frequently <span className="text-[#86c240]">A</span>sked <span className="text-[#86c240]">Q</span>uestions</>
          ) : (
            <>সচরাচর জিজ্ঞাসিত <span className="text-[#86c240]">প্রশ্নাবলী</span></>
          )}
        </h1>
        <div className="w-24 h-1 bg-[#86c240] mx-auto rounded-full"></div>
        <p className="text-slate-500 font-medium max-w-xl mx-auto">
          {language === 'en' 
            ? "Find answers to common questions about how TutorCore works for students, parents, and tutors."
            : "ছাত্র-ছাত্রী, অভিভাবক এবং টিউটরদের জন্য টিউটরকোর কীভাবে কাজ করে সে সম্পর্কে সাধারণ প্রশ্নগুলির উত্তর খুঁজুন।"
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
          placeholder={language === 'en' ? "Search questions or keywords..." : "প্রশ্ন বা কিওয়ার্ড দিয়ে খুঁজুন..."}
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
              : `"${searchQuery}" এর জন্য কোনো প্রশ্ন পাওয়া যায়নি।`
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
            {language === 'en' ? "Still have questions?" : "এখনো কোনো প্রশ্ন আছে কি?"}
          </h3>
          <p className="text-slate-450 text-sm font-medium">
            {language === 'en' 
              ? "If you couldn't find an answer here, our team is happy to assist you."
              : "আপনি যদি এখানে উত্তর খুঁজে না পান, আমাদের সাপোর্ট টিম আপনাকে সাহায্য করতে প্রস্তুত।"
            }
          </p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <a href="mailto:support@tutorcore.com" className="flex items-center gap-2 px-4 py-2.5 bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-[#86c240]/10">
            <Mail className="w-4 h-4" /> {language === 'en' ? "Email Us" : "ইমেইল করুন"}
          </a>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition-colors border border-slate-700">
            <PhoneCall className="w-4 h-4" /> {language === 'en' ? "Live Call" : "সরাসরি কল"}
          </button>
        </div>
      </div>

    </div>
  );
};

export default FAQ;
