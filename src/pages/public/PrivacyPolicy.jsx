import React, { useState } from 'react';

const PrivacyPolicy = () => {
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
            <>Privacy <span className="text-[#86c240]">Policy</span></>
          ) : (
            <>প্রাইভেসি <span className="text-[#86c240]">পলিসি (গোপনীয়তা নীতি)</span></>
          )}
        </h1>
        <div className="w-24 h-1 bg-[#86c240] mx-auto rounded-full"></div>
        <p className="text-slate-500 font-medium max-w-xl mx-auto">
          {language === 'en' 
            ? "Learn how Tutor Core collects, uses, and safeguards your personal data."
            : "জেনে নিন কীভাবে টিউটর কোর আপনার ব্যক্তিগত তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষিত রাখে।"
          }
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-8 text-slate-650 leading-relaxed font-medium">
        
        {language === 'en' ? (
          <>
            <section className="space-y-3">
              <p>
                At <strong>Tutor Core</strong>, accessible via <em>tutorcorebd.com</em>, safeguarding the privacy of our community members is one of our highest priorities. This Privacy Policy outlines the categories of data we collect, how it is recorded, and the ways we utilize it.
              </p>
              <p>
                If you have additional questions or require further clarification about our data practices, please do not hesitate to contact our team via email at <strong>tutorcorebd@gmail.com</strong>.
              </p>
              <p>
                This policy applies solely to our online operations and is valid for visitors to our website regarding information shared and/or collected on Tutor Core. It does not extend to information collected offline or via channels other than this platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">Consent</h2>
              <p>
                By accessing and utilizing our website, you hereby explicitly consent to the terms of this Privacy Policy and agree to comply with its conditions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">Information We Collect</h2>
              <p>
                The personal details you are asked to share, along with the reasons you are prompted to provide them, will be made clear to you at the point of collection.
              </p>
              <p>
                If you communicate with us directly, we may acquire supplemental information, including your full name, email address, phone number, the content of your message, any attachments you send, and other voluntary information you choose to provide.
              </p>
              <p>
                When registering for a Tutor Core account, we request your contact details, including items such as your name, address, email address, and phone number.
              </p>
            </section>

            <section className="space-y-3 border-l-4 border-[#86c240] pl-4 bg-green-50/10 py-1">
              <h2 className="text-2xl font-black text-slate-855">Tutor Verification & Profile Authenticity</h2>
              <p>
                To maintain the safety and integrity of our community, <strong>Tutor Core</strong> mandates identity verification for all tutors. Every registered tutor is required to upload a clear and authentic copy of their National Identity Card (NID) and University Student ID Card.
              </p>
              <p>
                We perform rigorous background audits and match details against academic records. <strong>Providing false, forged, or misleading documents or information is strictly prohibited and constitutes a direct breach of our Terms. Doing so will lead to the immediate, permanent suspension of your account, and we reserve the right to report such incidents to the appropriate authorities.</strong>
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">How We Use Your Information</h2>
              <p>We leverage the data we collect in a variety of ways to support our operations, including to:</p>
              <ul className="list-disc list-inside space-y-2 pl-4 text-slate-600">
                <li>Provide, manage, and maintain the functionality of our matching platform.</li>
                <li>Enhance, customize, and expand our platform's services and user experience.</li>
                <li>Understand and analyze usage trends and patterns of our site visitors.</li>
                <li>Design and introduce new products, features, utilities, and services.</li>
                <li>Interact with you directly or through representatives for support, platform updates, and promotional communications.</li>
                <li>Send administrative and informational emails.</li>
                <li>Identify, investigate, and prevent fraudulent activity.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">Log Files</h2>
              <p>
                Tutor Core employs standard log files. These files log visitors when they navigate websites—a standard procedure for web hosting analytics. Information recorded includes internet protocol (IP) addresses, browser variants, Internet Service Providers (ISPs), date/time stamps, referring/exit pages, and potentially page click counts. This data contains no personally identifiable information. The purpose is to monitor browsing trends, administer the site, track user navigation on the platform, and aggregate broad demographic information.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">Cookies and Web Beacons</h2>
              <p>
                Like other modern websites, Tutor Core uses "cookies" to store visitor preferences and record visited pages. This data is used to optimize user experience by customizing our web page content based on the visitor's browser type and other variables.
              </p>
              <p>
                Google is a third-party vendor on our platform. It utilizes DART cookies to serve advertisements to visitors based on their activity on our site and other internet portals. You can choose to opt out of the use of DART cookies by visiting the Google Ad Network Privacy Policy at: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-[#86c240] hover:underline">https://policies.google.com/technologies/ads</a>.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">Third-Party Privacy Disclosures</h2>
              <p>
                Tutor Core's Privacy Policy does not apply to other external advertisers or websites. We advise you to consult the respective privacy policies of these third-party ad servers or networks for detailed information on their practices, including instructions on how to opt-out.
              </p>
              <p>
                You can disable cookies through your individual browser preferences. Detailed information on cookie configuration for specific browsers can be found on their respective developer websites.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">CCPA Privacy Disclosures (Do Not Sell My Information)</h2>
              <p>Under the California Consumer Privacy Act (CCPA), consumers have the right to:</p>
              <ul className="list-disc list-inside space-y-2 pl-4 text-slate-600">
                <li>Request that a business disclose the categories and specific pieces of personal data collected about them.</li>
                <li>Request that a business delete any personal data collected about them.</li>
                <li>Request that a business that sells personal data, refrain from selling their personal information.</li>
              </ul>
              <p>If you submit a data request, we have one month to respond to you. Please contact us to exercise these rights.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">GDPR Data Protection Rights</h2>
              <p>We want to ensure you are fully aware of your data protection rights. Every user is entitled to:</p>
              <ul className="list-disc list-inside space-y-2 pl-4 text-slate-600">
                <li><strong>Access</strong>: Request copies of your personal data (we may charge a small administrative fee).</li>
                <li><strong>Rectification</strong>: Request correction of inaccurate information or completion of incomplete profiles.</li>
                <li><strong>Erasure</strong>: Request deletion of your personal records under certain conditions.</li>
                <li><strong>Restrict Processing</strong>: Request restriction of personal data processing under specific conditions.</li>
                <li><strong>Object to Processing</strong>: Object to our processing of your personal data under specific conditions.</li>
                <li><strong>Data Portability</strong>: Request transfer of collected data to another entity or directly to you.</li>
              </ul>
              <p>If you make a request, we have one month to respond. Please contact support to initiate a request.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">Protecting Children's Privacy</h2>
              <p>
                Protecting children online is a vital priority. We encourage parents and guardians to participate in and monitor their children's digital activities.
              </p>
              <p>
                Tutor Core does not knowingly collect any Personally Identifiable Information from children under the age of 13. If you believe your child has shared this kind of information on our platform, please contact us immediately, and we will take prompt action to remove it from our systems.
              </p>
            </section>
          </>
        ) : (
          <>
            <section className="space-y-3">
              <p>
                <strong>টিউটর কোর (Tutor Core)</strong>-তে (যা <em>tutorcorebd.com</em> এর মাধ্যমে অ্যাক্সেস করা যায়), আমাদের প্ল্যাটফর্ম ব্যবহারকারীদের গোপনীয়তা রক্ষা করা আমাদের অন্যতম প্রধান অগ্রাধিকার। এই প্রাইভেসি পলিসি ডকুমেন্টে আমরা কোন ধরণের তথ্য সংগ্রহ ও রেকর্ড করি এবং তা কীভাবে ব্যবহার করি সে সম্পর্কে বিস্তারিত আলোচনা করা হয়েছে।
              </p>
              <p>
                আমাদের গোপনীয়তা নীতি সম্পর্কে আপনার যদি অতিরিক্ত কোনো প্রশ্ন থাকে বা আরও বিস্তারিত তথ্যের প্রয়োজন হয়, তবে ইমেলের মাধ্যমে আমাদের টিমের সাথে যোগাযোগ করতে দ্বিধা করবেন না: <strong>tutorcorebd@gmail.com</strong>।
              </p>
              <p>
                এই গোপনীয়তা নীতিটি শুধুমাত্র আমাদের অনলাইন কার্যক্রমের জন্য প্রযোজ্য এবং এটি আমাদের ওয়েবসাইটে ভিজিটরদের শেয়ার করা এবং/অথবা সংগ্রহ করা তথ্যের ক্ষেত্রে কার্যকর। এটি অফলাইনে বা এই ওয়েবসাইট ব্যতীত অন্য কোনো চ্যানেলের মাধ্যমে সংগ্রহ করা তথ্যের ক্ষেত্রে প্রযোজ্য নয়।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">সম্মতি (Consent)</h2>
              <p>
                আমাদের ওয়েবসাইট ব্যবহার করার মাধ্যমে, আপনি আমাদের প্রাইভেসি পলিসিতে সম্মতি জ্ঞাপন করছেন এবং এর শর্তাবলীতে রাজি হচ্ছেন।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">যেসব তথ্য আমরা সংগ্রহ করি</h2>
              <p>
                আপনাকে যেসব ব্যক্তিগত তথ্য প্রদান করতে বলা হবে এবং কী কারণে তা চাওয়া হচ্ছে, তা তথ্য চাওয়ার নির্দিষ্ট সময়েই আপনাকে স্পষ্ট জানিয়ে দেওয়া হবে।
              </p>
              <p>
                আপনি যদি সরাসরি আমাদের সাথে যোগাযোগ করেন, আমরা আপনার সম্পর্কে অতিরিক্ত তথ্য পেতে পারি যেমন আপনার নাম, ইমেল ঠিকানা, ফোন নম্বর, আপনার পাঠানো বার্তার বিবরণ, সংযুক্ত ফাইলসমূহ এবং আপনার প্রদান করা অন্যান্য তথ্যাবলী।
              </p>
              <p>
                একটি টিউটর কোর অ্যাকাউন্টের জন্য রেজিস্টার করার সময়, আমরা আপনার যোগাযোগের তথ্য চাইতে পারি, যার মধ্যে নাম, ঠিকানা, ইমেল ঠিকানা এবং ফোন নম্বরের মতো বিষয় অন্তর্ভুক্ত রয়েছে।
              </p>
            </section>

            <section className="space-y-3 border-l-4 border-[#86c240] pl-4 bg-green-50/10 py-1">
              <h2 className="text-2xl font-black text-slate-855">টিউটর ভেরিফিকেশন ও প্রোফাইলের সত্যতা</h2>
              <p>
                আমাদের প্ল্যাটফর্মের নিরাপত্তা এবং সততা বজায় রাখার জন্য, <strong>টিউটর কোর</strong> সকল টিউটরদের পরিচয়পত্র ভেরিফিকেশন করা বাধ্যতামূলক করেছে। প্রতিটি রেজিস্টার্ড টিউটরকে তাদের জাতীয় পরিচয়পত্র (NID) এবং বিশ্ববিদ্যালয় স্টুডেন্ট আইডি কার্ডের স্পষ্ট ও আসল কপি আপলোড করতে হবে।
              </p>
              <p>
                আমরা সংগৃহীত ডকুমেন্টস পুঙ্খানুপুঙ্খভাবে নিরীক্ষণ করি। <strong>কোনো প্রকার মিথ্যা, জাল বা বিভ্রান্তিকর কাগজপত্র বা তথ্য প্রদান করা কঠোরভাবে নিষিদ্ধ এবং এটি আমাদের নীতিমালার পরিপন্থী। এই ধরণের কোনো অসদুপায় বা প্রতারণার আশ্রয় নিলে সংশ্লিষ্ট টিউটরের অ্যাকাউন্টটি অবিলম্বে স্থায়ীভাবে স্থগিত (Suspended) করা হবে এবং প্রয়োজনে আমরা যথাযথ আইনি ব্যবস্থা গ্রহণের অধিকার সংরক্ষণ করি।</strong>
              </p>
            </section>


            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">আপনার তথ্য যেভাবে ব্যবহার করা হয়</h2>
              <p>আমরা সংগৃহীত তথ্য বিভিন্ন উপায়ে ব্যবহার করি, যার মধ্যে রয়েছে:</p>
              <ul className="list-disc list-inside space-y-2 pl-4 text-slate-600">
                <li>আমাদের ওয়েবসাইট পরিচালনা, প্রদান এবং রক্ষণাবেক্ষণ করা।</li>
                <li>আমাদের ওয়েবসাইটের ফিচার ও ইউজার এক্সপেরিয়েন্স উন্নত ও প্রসারিত করা।</li>
                <li>ভিজিটররা কীভাবে আমাদের প্ল্যাটফর্ম ব্যবহার করেন তা বিশ্লেষণ করা।</li>
                <li>নতুন প্রোডাক্ট, সার্ভিস, ফিচার এবং কার্যকারিতা তৈরি করা।</li>
                <li>গ্রাহক সেবা প্রদান, আপডেট ও প্ল্যাটফর্ম সংক্রান্ত তথ্য প্রদান এবং প্রচারণামূলক উদ্দেশ্যে সরাসরি বা আমাদের সহযোগীদের মাধ্যমে যোগাযোগ করা।</li>
                <li>আপনাকে প্রয়োজনীয় নোটিফিকেশন ও ইমেল পাঠানো।</li>
                <li>প্রতারণা ও জালিয়াতি সনাক্ত করা এবং প্রতিরোধ করা।</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">লগ ফাইল (Log Files)</h2>
              <p>
                টিউটর কোর স্ট্যান্ডার্ড লগ ফাইল ব্যবহারের নিয়ম অনুসরণ করে। এই ফাইলগুলো ভিজিটররা যখন ওয়েবসাইটে আসেন তখন তা রেকর্ড করে—যা প্রায় সব হোস্টিং কোম্পানির অ্যানালিটিক্সের একটি সাধারণ অংশ। লগ ফাইলের মাধ্যমে সংগৃহীত তথ্যের মধ্যে রয়েছে ইন্টারনেট প্রোটোকল (আইপি) ঠিকানা, ব্রাউজারের ধরণ, ইন্টারনেট সার্ভিস প্রোভাইডার (আইএসপি), তারিখ ও সময়, রেফারিং/এক্সিট পেজ এবং ক্লিকের সংখ্যা। এই তথ্যগুলোর সাথে ব্যক্তিগতভাবে সনাক্তযোগ্য কোনো তথ্যের সংযোগ থাকে না। এই তথ্য বিশ্লেষণের মূল উদ্দেশ্য হলো সাইটের ট্রেন্ড পর্যবেক্ষণ করা, সাইট পরিচালনা করা, ব্যবহারকারীদের ট্র্যাক করা এবং ডেমোগ্রাফিক তথ্য সংগ্রহ করা।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">কুকিজ এবং ওয়েব বিকন (Cookies and Web Beacons)</h2>
              <p>
                অন্যান্য ওয়েবসাইটের মতো টিউটর কোর-ও 'কুকিজ' ব্যবহার করে। এই কুকিজগুলো ভিজিটরদের পছন্দ এবং ওয়েবসাইটের কোন কোন পেজ ভিজিট করেছেন তা রেকর্ড করতে ব্যবহৃত হয়। ব্যবহারকারীর ব্রাউজারের ধরণ এবং অন্যান্য তথ্যের ওপর ভিত্তি করে ওয়েবসাইটের কন্টেন্ট কাস্টমাইজ করে ব্যবহারকারীর অভিজ্ঞতাকে সহজ ও উন্নত করাই এর মূল লক্ষ্য।
              </p>
              <p>
                গুগল আমাদের সাইটে একটি থার্ড-পার্টি ভেন্ডর হিসেবে কাজ করে। এটি আমাদের সাইট ও ইন্টারনেটের অন্যান্য সাইটে ভিজিটরদের অ্যাক্টিভিটির ওপর ভিত্তি করে বিজ্ঞাপন দেখানোর জন্য DART কুকিজ ব্যবহার করে। আপনি চাইলে গুগলের অ্যাড নেটওয়ার্ক প্রাইভেসি পলিসির এই লিঙ্কে গিয়ে DART কুকিজের ব্যবহার বন্ধ করতে পারেন: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-[#86c240] hover:underline">https://policies.google.com/technologies/ads</a>।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">তৃতীয় পক্ষের প্রাইভেসি নীতি (Third-Party Privacy Disclosures)</h2>
              <p>
                টিউটর কোর-এর প্রাইভেসি পলিসি অন্য কোনো বিজ্ঞাপনদাতা বা ওয়েবসাইটের ক্ষেত্রে প্রযোজ্য নয়। তাই বিস্তারিত তথ্যের জন্য এবং কীভাবে নির্দিষ্ট অপশন থেকে অপ্ট-আউট করা যায় তা জানতে আমরা আপনাকে সেইসব থার্ড-পার্টি অ্যাড সার্ভারের প্রাইভেসি পলিসিগুলো দেখার পরামর্শ দিচ্ছি।
              </p>
              <p>
                আপনি চাইলে আপনার ব্রাউজারের সেটিংসের মাধ্যমে কুকিজ ডিসেবল বা বন্ধ করে রাখতে পারেন। নির্দিষ্ট ব্রাউজারে কুকি ম্যানেজমেন্ট সম্পর্কে আরও বিস্তারিত তথ্য সংশ্লিষ্ট ব্রাউজারের নিজস্ব ওয়েবসাইটে পাওয়া যাবে।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">সিসিপিএ গোপনীয়তা অধিকার (CCPA Privacy Disclosures)</h2>
              <p>ক্যালিফোর্নিয়া উপভোক্তা সুরক্ষা আইনের (CCPA) অধীনে ক্যালিফোর্নিয়ার গ্রাহকদের নিম্নলিখিত অধিকারগুলো রয়েছে:</p>
              <ul className="list-disc list-inside space-y-2 pl-4 text-slate-600">
                <li>ব্যবসায়ীর কাছে তার সংগ্রহ করা ব্যক্তিগত তথ্যের ক্যাটাগরি ও সুনির্দিষ্ট তথ্য প্রকাশের দাবি জানানো।</li>
                <li>ব্যবসায়ীর কাছে তার সম্পর্কে সংগৃহীত সমস্ত ব্যক্তিগত তথ্য মুছে ফেলার অনুরোধ করা।</li>
                <li>গ্রাহকের ব্যক্তিগত তথ্য বিক্রি না করার জন্য অনুরোধ জানানো।</li>
              </ul>
              <p>আপনি যদি কোনো অনুরোধ সাবমিট করেন, আমাদের প্রতিক্রিয়া জানাতে এক মাস সময় লাগবে। এই অধিকারগুলো ব্যবহার করতে চাইলে আমাদের সাথে যোগাযোগ করুন।</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">জিডিপিআর ডেটা সুরক্ষা অধিকার (GDPR Data Protection Rights)</h2>
              <p>আমরা নিশ্চিত করতে চাই যে আপনি আপনার ডেটা সুরক্ষার অধিকার সম্পর্কে সম্পূর্ণ সচেতন। প্রতিটি ব্যবহারকারী নিম্নলিখিত অধিকারগুলোর অধিকারী:</p>
              <ul className="list-disc list-inside space-y-2 pl-4 text-slate-600">
                <li><strong>অ্যাক্সেসের অধিকার</strong>: আপনার ব্যক্তিগত ডেটার কপি পাওয়ার অনুরোধ করার অধিকার (এজন্য আমরা সামান্য ফি চার্জ করতে পারি)।</li>
                <li><strong>সংশোধনের অধিকার</strong>: আপনার প্রোফাইলের ভুল তথ্য সংশোধন বা অসম্পূর্ণ তথ্য সম্পূর্ণ করার অনুরোধ করার অধিকার।</li>
                <li><strong>মুছে ফেলার অধিকার</strong>: নির্দিষ্ট শর্ত সাপেক্ষে আপনার ব্যক্তিগত ডেটা আমাদের সিস্টেম থেকে মুছে ফেলার অনুরোধ করার অধিকার।</li>
                <li><strong>প্রসেসিং সীমিত করার অধিকার</strong>: নির্দিষ্ট শর্তে আপনার ডেটার প্রসেসিং বা ব্যবহার সীমিত করার অনুরোধ করার অধিকার।</li>
                <li><strong>আপত্তির অধিকার</strong>: নির্দিষ্ট শর্ত সাপেক্ষে আমাদের ডেটা প্রসেসিং পদ্ধতির বিরুদ্ধে আপত্তি জানানোর অধিকার।</li>
                <li><strong>ডেটা স্থানান্তরের অধিকার</strong>: সংগৃহীত ডেটা অন্য কোনো প্রতিষ্ঠানে বা সরাসরি আপনার কাছে স্থানান্তর করার অনুরোধ করার অধিকার।</li>
              </ul>
              <p>অনুরোধ জানানোর পর আমাদের উত্তর দেওয়ার জন্য এক মাস সময় থাকে। এই অধিকারগুলো ব্যবহার করতে চাইলে অনুগ্রহ করে যোগাযোগ করুন।</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-black text-slate-850">শিশুদের গোপনীয়তা রক্ষা (Protecting Children's Privacy)</h2>
              <p>
                অনলাইনে শিশুদের নিরাপত্তা রক্ষা করা আমাদের অন্যতম দায়িত্ব। আমরা অভিভাবক ও মেন্টরদের তাদের সন্তানদের অনলাইন কার্যক্রম পর্যবেক্ষণ, অংশগ্রহণ এবং পরিচালনায় যুক্ত থাকার জন্য উৎসাহিত করি।
              </p>
              <p>
                টিউটর কোর ১৩ বছরের কম বয়সী শিশুদের কাছ থেকে জেনেশুনে কোনো ব্যক্তিগতভাবে সনাক্তযোগ্য তথ্য সংগ্রহ করে না। আপনি যদি মনে করেন যে আপনার সন্তান আমাদের সাইটে এই ধরণের তথ্য শেয়ার করেছে, তবে অবিলম্বে আমাদের সাথে যোগাযোগ করুন। আমরা দ্রুত আমাদের সিস্টেম থেকে উক্ত তথ্য মুছে ফেলার সর্বাত্মক চেষ্টা করব।
              </p>
            </section>
          </>
        )}

      </div>
    </div>
  );
};

export default PrivacyPolicy;
