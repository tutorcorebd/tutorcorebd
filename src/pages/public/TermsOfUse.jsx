import React from 'react';

const TermsOfUse = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Terms of Use</h1>
      <div className="prose prose-slate max-w-none">
        <p className="mb-4">
          Welcome to TutorCore. By accessing our platform, you agree to these Terms of Use. Please read them carefully.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p className="mb-4">
          By registering for an account or using our services, you agree to be bound by these Terms. If you do not agree to all the terms and conditions, you must not use our platform.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. User Accounts</h2>
        <p className="mb-4">
          You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Conduct</h2>
        <p className="mb-4">
          You agree to use the platform only for lawful purposes. You must not use the platform in any way that violates any applicable local, national, or international law or regulation.
        </p>
      </div>
    </div>
  );
};

export default TermsOfUse;
