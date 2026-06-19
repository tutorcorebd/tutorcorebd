import React, { useState } from 'react';

const TermsOfUse = () => {
  const [language, setLanguage] = useState('en'); // 'en' or 'bn'

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8 font-sans">
      
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
      <div className="text-center space-y-4 mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">
          {language === 'en' ? (
            <>Terms & <span className="text-[#86c240]">Conditions</span></>
          ) : (
            <>ব্যবহারের <span className="text-[#86c240]">শর্তাবলী</span></>
          )}
        </h1>
        <div className="w-24 h-1 bg-[#86c240] mx-auto rounded-full"></div>
        <p className="text-slate-500 font-medium max-w-xl mx-auto">
          {language === 'en'
            ? "Please read the following platform rules and guidelines carefully."
            : "অনুগ্রহ করে আমাদের প্ল্যাটফর্মের নিয়ম ও নির্দেশনাবলী সতর্কতার সাথে পড়ুন।"
          }
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-8 text-slate-650 leading-relaxed font-medium">
        
        {language === 'en' ? (
          <>
            <section className="space-y-3">
              <p>
                Welcome to <strong>Tutor Core</strong>. Please read these terms and conditions carefully before using this site, registering an account, or utilizing any match-making services from Tutor Core. By accessing or using our website, you agree to be bound by this Agreement.
              </p>
              <p>
                This agreement applies to all users of the platform, including students, parents/guardians, and tutors who register or browse our website.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">Tutor's Responsibilities</h2>
              <ul className="list-decimal list-inside space-y-2 pl-2">
                <li>Before applying for any tuition job, tutors must review job details including location, remuneration, subjects, and schedules. Requirements for matched tuition postings are irreversible.</li>
                <li>Tutors must not cancel a tutoring assignment after receiving guardian contact information. Regular updates must be shared with our platform coordinates.</li>
                <li>Tutors must cooperate fully with platform representatives during the processing of matches.</li>
                <li>If a parent cancels the tutoring service due to a tutor's negligence, voluntary cancellation, or lack of dedication, the tutor assumes full responsibility and may be liable to pay platform service charges.</li>
                <li>For safety, tutors (especially female tutors) are advised to bring a relative, friend, or well-wisher to the initial face-to-face meeting with guardians.</li>
                <li>Violations of any platform terms will result in the permanent deactivation of your tutor profile, restricting access to future matching services.</li>
                <li>Tutor Core is a matching marketplace platform and does not assume responsibility for individual physical safety or personal disputes.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">Service Fees & Commissions</h2>
              <p>Upon securing a tuition assignment, the tutor is obligated to pay the platform service fee based on the following schedule:</p>
              <ul className="list-disc list-inside space-y-2 pl-4 text-slate-600">
                <li><strong>Standard Tuitions</strong>: A one-time matching service charge of 60% of the first month's salary, payable within 5 days of assignment confirmation.</li>
                <li><strong>Short-Term Programs (Under 2 months) / Crash Courses</strong>: A one-time service charge of 40% of the course fee, payable within 5 days.</li>
                <li><strong>Single Month Programs</strong>: A one-time matching charge of 25% of the total monthly payment.</li>
              </ul>
              <p className="mt-4 font-bold text-slate-800">Cancellations in the First Month:</p>
              <ul className="list-disc list-inside space-y-2 pl-4 text-slate-600">
                <li>If a tutor voluntarily cancels the job or the parent cancels due to the tutor's lack of sincerity/professionalism, the tutor remains liable for the full service charge.</li>
                <li>If the parent cancels the tutoring service voluntarily without fault of the tutor, service charge adjustments are credited to the tutor's platform wallet for priority matching with alternative jobs within 30 days.</li>
                <li>If no payment was received from the parent, 100% of the service charge paid is credited back to the tutor's wallet. If partial payment was received, the service charge is adjusted proportionally.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">Platform Role as a Matching Marketplace</h2>
              <p>
                Tutor Core serves as an online directory and matching marketplace. Initial conditions, budgets, and scheduling are set entirely by the parent or guardian. Tutor Core has no direct authority to modify these parameters and does not guarantee tuition fees or tutor conduct. Matching services are utilized at your own risk.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">Membership and Eligibility</h2>
              <p>
                Users must be at least 18 years old to create a tutor or parent profile. Users under the age of 18 may only utilize matching services under the direct supervision and authorization of their parents or legal guardians. You agree to provide accurate, truthful registration information and keep it updated.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">Parent and Student Guidelines</h2>
              <ul className="list-decimal list-inside space-y-2 pl-2">
                <li>Parents and students must be legally eligible to solicit services and agree to provide comprehensive, accurate descriptions of tutoring requirements.</li>
                <li>Parents are strongly encouraged to verify the credentials of matched tutors by requesting photocopies of their national IDs, university registration cards, and academic certificates. Tutor Core is not liable for misconduct, safety incidents, or disputes.</li>
                <li>Tuition salary terms and payment modes are agreed upon directly between parents and tutors. Tutor Core is not responsible for salary disputes or collection.</li>
                <li>Tutor matching requests are free to post. Registered details will be displayed on the public Job Board for tutors to review and apply.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">Accurate Information Guarantee</h2>
              <p>
                You represent and warrant that all information you provide during registration, tutoring requests, profiles, and messages is truthful, complete, and not misleading. You agree not to post fraudulent records, violate third-party copyrights/intellectual property rights, or upload malicious files. We reserve the right to suspend accounts that violate these guidelines without prior notice.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">Disclaimer of Warranties & Limitation of Liability</h2>
              <p>
                Tutor Core does not guarantee that matches will meet your specific educational expectations. We make no representations regarding the uninterrupted accessibility or error-free operation of our web services. Tutor Core, along with its founders, team members, and ISPs, shall not be held liable for any direct, indirect, incidental, or consequential damages resulting from the use of our services.
              </p>
            </section>
          </>
        ) : (
          <>
            <section className="space-y-3">
              <p>
                <strong>টিউটর কোর (Tutor Core)</strong>-তে আপনাকে স্বাগতম। আমাদের ওয়েবসাইট ব্যবহার করার, কোনো অ্যাকাউন্ট রেজিস্টার করার অথবা টিউটর কোর-এর ম্যাচিং সেবা গ্রহণ করার পূর্বে অনুগ্রহ করে ব্যবহারের শর্তাবলী ও নিয়মনীতি সতর্কতার সাথে পড়ুন। আমাদের ওয়েবসাইট ব্যবহার বা অ্যাক্সেস করার মাধ্যমে, আপনি এই চুক্তির শর্তাবলীতে সম্মতি জ্ঞাপন করছেন।
              </p>
              <p>
                এই চুক্তিটি প্ল্যাটফর্মের সমস্ত ব্যবহারকারীর জন্য প্রযোজ্য, যার মধ্যে ছাত্র-ছাত্রী, অভিভাবক এবং আমাদের ওয়েবসাইটে রেজিস্টার করা বা ব্রাউজ করা শিক্ষকরা অন্তর্ভুক্ত রয়েছেন।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">টিউটরের দায়িত্ব ও কর্তব্য</h2>
              <ul className="list-decimal list-inside space-y-2 pl-2">
                <li>যেকোনো টিউশন জবে আবেদন করার পূর্বে টিউটরকে লোকেশন, বেতন, বিষয় এবং সময়সূচী সহ জবের সমস্ত বিবরণ যাচাই করে নিতে হবে। একবার ম্যাচিং হয়ে যাওয়ার পর জবের শর্ত পরিবর্তন করা যাবে না।</li>
                <li>অভিভাবকের যোগাযোগের তথ্য পাওয়ার পর টিউটর কোনো টিউটরিং অ্যাসাইনমেন্ট বাতিল করতে পারবেন না। টিউশন প্রক্রিয়ার নিয়মিত আপডেট আমাদের ম্যাচিং কো-অর্ডিনেটরদের জানাতে হবে।</li>
                <li>ম্যাচিং সম্পন্ন করার প্রক্রিয়ায় টিউটরকে প্ল্যাটফর্ম প্রতিনিধিদের সাথে পূর্ণ সহযোগিতা করতে হবে।</li>
                <li>টিউটরের অবহেলা, ইচ্ছাকৃত অবহেলা বা দায়িত্বহীনতার কারণে যদি অভিভাবক টিউশন বাতিল করেন, তবে টিউটর এর জন্য সম্পূর্ণ দায়ী থাকবেন এবং তাকে প্ল্যাটফর্মের সার্ভিস চার্জ পরিশোধ করতে হতে পারে।</li>
                <li>নিরাপত্তার স্বার্থে, টিউটরদের (বিশেষ করে মহিলা টিউটরদের) অভিভাবকদের সাথে প্রথম মিটিংয়ের সময় কোনো অভিভাবক, বন্ধু বা শুভাকাঙ্ক্ষীকে সাথে রাখার পরামর্শ দেওয়া হচ্ছে।</li>
                <li>প্ল্যাটফর্মের যেকোনো নিয়মনীতি ভঙ্গ করলে আপনার টিউটর প্রোফাইলটি স্থায়ীভাবে নিষ্ক্রিয় (Deactivate) করে দেওয়া হবে এবং আপনি ভবিষ্যতে কোনো টিউশন জবে আবেদন করতে পারবেন না।</li>
                <li>টিউটর কোর একটি ম্যাচিং মার্কেটপ্লেস এবং এটি কোনো ব্যবহারকারীর ব্যক্তিগত নিরাপত্তা বা ব্যক্তিগত কোনো বিরোধের দায়িত্ব বহন করে না।</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">সার্ভিস ফি ও কমিশন</h2>
              <p>টিউশন ম্যাচিং সফলভাবে সম্পন্ন হওয়ার পর, টিউটর নিম্নলিখিত নিয়ম অনুযায়ী প্ল্যাটফর্ম সার্ভিস ফি পরিশোধ করতে বাধ্য থাকবেন:</p>
              <ul className="list-disc list-inside space-y-2 pl-4 text-slate-600">
                <li><strong>সাধারণ টিউশন</strong>: প্রথম মাসের বেতনের ৬০% এককালীন সার্ভিস চার্জ হিসেবে ম্যাচিং নিশ্চিত হওয়ার ৫ দিনের মধ্যে পরিশোধ করতে হবে।</li>
                <li><strong>স্বল্পমেয়াদী টিউশন (২ মাসের নিচে) / ক্র্যাশ কোর্স</strong>: মোট কোর্স ফি-র ৪০% সার্ভিস চার্জ হিসেবে ৫ দিনের মধ্যে পরিশোধ করতে হবে।</li>
                <li><strong>একক মাসের টিউশন</strong>: মোট মাসিক পেমেন্টের ২৫% ম্যাচিং চার্জ হিসেবে এককালীন পরিশোধ করতে হবে।</li>
              </ul>
              <p className="mt-4 font-bold text-slate-800">প্রথম মাসের মধ্যে টিউশন বাতিল হলে করণীয়:</p>
              <ul className="list-disc list-inside space-y-2 pl-4 text-slate-600">
                <li>টিউটর যদি নিজে থেকে চাকরি ছেড়ে দেন বা টিউটরের পেশাদারিত্বের অভাবের কারণে অভিভাবক তাকে বাদ দেন, তবে টিউটরকে সম্পূর্ণ সার্ভিস চার্জ পরিশোধ করতে হবে।</li>
                <li>টিউটরের কোনো ভুল ছাড়া যদি অভিভাবক টিউশন বাতিল করেন, তবে পরিশোধিত চার্জ টিউটরের প্ল্যাটফর্ম ওয়ালেটে ক্রেডিট হিসেবে যোগ হবে। পরবর্তী ৩০ দিনের মধ্যে অন্য জব ম্যাচিংয়ের সময় তা সমন্বয় করা হবে।</li>
                <li>অভিভাবকের কাছ থেকে কোনো পেমেন্ট পাওয়া না গেলে সার্ভিস চার্জের ১০০% ওয়ালেটে ফেরত দেওয়া হবে। আংশিক পেমেন্ট পাওয়া গেলে প্রাপ্ত বেতনের অনুপাতে সার্ভিস চার্জ সমন্বয় করা হবে।</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">ম্যাচিং মার্কেটপ্লেস হিসেবে প্ল্যাটফর্মের ভূমিকা</h2>
              <p>
                টিউটর কোর একটি অনলাইন ডিরেক্টরি এবং ম্যাচিং মার্কেটপ্লেস হিসেবে কাজ করে। টিউশনের প্রাথমিক প্রয়োজনীয়তা, বাজেট এবং সময়সূচী অভিভাবকরা নির্ধারণ করেন। টিউটর কোর-এর এসব শর্তাবলী পরিবর্তন করার কোনো সরাসরি এক্তিয়ার নেই এবং এটি শিক্ষকের আচরণ বা অভিভাবকের বেতন পরিশোধের নিশ্চয়তা দেয় না। ব্যবহারকারীরা তাদের নিজস্ব ঝুঁকিতে ম্যাচিং সেবা ব্যবহার করবেন।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">সদস্যপদ এবং যোগ্যতা</h2>
              <p>
                টিউটর বা অভিভাবক প্রোফাইল তৈরি করতে ব্যবহারকারীর বয়স কমপক্ষে ১৮ বছর হতে হবে। ১৮ বছরের কম বয়সী শিক্ষার্থীরা কেবল তাদের বাবা-মা বা আইনগত অভিভাবকের প্রত্যক্ষ তত্ত্বাবধানে এবং অনুমোদনে এই ম্যাচিং সেবা ব্যবহার করতে পারবে। আপনি রেজিস্ট্রেশনের সময় সঠিক ও সত্য তথ্য প্রদান করতে এবং তা নিয়মিত আপডেট রাখতে অঙ্গীকারাবদ্ধ।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">অভিভাবক ও শিক্ষার্থীদের নির্দেশনাবলী</h2>
              <ul className="list-decimal list-inside space-y-2 pl-2">
                <li>অভিভাবক এবং শিক্ষার্থীদের অবশ্যই আইনিভাবে সেবা চাওয়ার যোগ্যতা থাকতে হবে এবং তারা টিউশন জবের সঠিক বিবরণ প্রদান করতে সম্মত থাকবেন।</li>
                <li>অভিভাবকদের বিশেষভাবে অনুরোধ করা হচ্ছে যে তারা নির্বাচিত টিউটরের ন্যাশনাল আইডি কার্ড (NID), বিশ্ববিদ্যালয়ের আইডি কার্ড এবং সার্টিফিকেটসমূহের ফটোকপি সংগ্রহ করে সত্যতা যাচাই করে নেবেন। টিউটরের কোনো আচরণ, দুর্ঘটনা বা বিরোধের জন্য টিউটর কোর দায়ী থাকবে না।</li>
                <li>টিউশনের বেতন এবং তা পরিশোধের মাধ্যম অভিভাবক ও শিক্ষকরা সরাসরি নিজেরা ঠিক করবেন। বেতন সংক্রান্ত কোনো জটিলতার দায় টিউটর কোর বহন করবে না।</li>
                <li>টিউটর ম্যাচিং রিকোয়েস্ট পোস্ট করা অভিভাবকদের জন্য সম্পূর্ণ ফ্রি। আপনার পোস্ট করা রিকোয়েস্টটি আমাদের পাবলিক জব বোর্ডে প্রদর্শিত হবে যাতে শিক্ষকরা আবেদন করতে পারেন।</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">সঠিক তথ্যের নিশ্চয়তা</h2>
              <p>
                আপনি নিশ্চয়তা দিচ্ছেন যে রেজিস্ট্রেশন, প্রোফাইল, টিউশন রিকোয়েস্ট এবং মেসেজে আপনার দেওয়া সমস্ত তথ্য সত্য, নির্ভুল ও সম্পূর্ণ। কোনো প্রকার ভুয়া তথ্য পোস্ট করা, অন্যের কপিরাইট লঙ্ঘন করা বা কোনো ক্ষতিকারক ফাইল আপলোড করা কঠোরভাবে নিষিদ্ধ। কোনো প্রোফাইলে নিয়মভঙ্গকারী তথ্য পাওয়া গেলে পূর্ব নোটিশ ছাড়াই অ্যাকাউন্ট স্থগিত করার অধিকার আমরা সংরক্ষণ করি।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">দায় ও ওয়ারেন্টির সীমাবদ্ধতা</h2>
              <p>
                টিউটর কোর গ্যারান্টি দেয় না যে কোনো টিউটর বা ম্যাচ আপনার সুনির্দিষ্ট প্রত্যাশা পূরণ করতে পারবে। আমাদের অনলাইন সেবা সর্বদা নিরবচ্ছিন্ন বা ত্রুটিহীন থাকবে এমন কোনো নিশ্চয়তা দেওয়া হচ্ছে না। টিউটর কোর, এর প্রতিষ্ঠাতা, টিম মেম্বার এবং ইন্টারনেট সার্ভিস পার্টনাররা সেবা ব্যবহারের ফলে হওয়া কোনো প্রত্যক্ষ বা পরোক্ষ ক্ষতির জন্য আইনগতভাবে দায়ী থাকবেন না।
              </p>
            </section>
          </>
        )}

      </div>
    </div>
  );
};

export default TermsOfUse;
