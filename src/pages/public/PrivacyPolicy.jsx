import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-slate max-w-none">
        <p className="mb-4">
          At TutorCore, we take your privacy seriously. This Privacy Policy explains how we collect, use, and share your personal information.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
        <p className="mb-4">
          We collect information you provide directly to us, such as your name, email address, phone number, and any other information you choose to provide when you create an account or update your profile.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
        <p className="mb-4">
          We use the information we collect to provide, maintain, and improve our services, communicate with you, and personalize your experience.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Information Sharing</h2>
        <p className="mb-4">
          We do not share your personal information with third parties except as necessary to provide our services or as required by law.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
