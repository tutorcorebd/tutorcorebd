import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { Share2, Wallet, Users, CheckCircle2, Gift, Sparkles, ArrowRight } from 'lucide-react';

const AffiliateProgram = () => {
  const { profile } = useAuthStore();

  const dashboardHref =
    profile?.role === 'guardian'
      ? '/guardian/affiliate'
      : profile?.role === 'affiliate'
      ? '/affiliate/dashboard'
      : profile?.role === 'admin'
      ? '/admin/affiliates'
      : '/tutor/affiliate';

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-sans">
      {/* Hero */}
      <section className="bg-gradient-to-br from-white via-[#86c240]/5 to-[#86c240]/15 py-16 px-4 text-center border-b border-slate-100 rounded-b-[40px]">
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#86c240]/10 border border-[#86c240]/20 text-[#5d8f24] text-xs font-bold uppercase tracking-wider">
            <Share2 className="w-3.5 h-3.5" /> Tutor Core Affiliate Program
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tight">
            Earn Commission by Referring Parents & Tutors
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Share your unique referral link or submit tuition leads directly from your dashboard. Earn{' '}
            <strong className="text-[#5d8f24]">10% of Tutor Core's platform charge</strong> for every confirmed tuition, paid via bKash/Nagad or redeemed with{' '}
            <strong className="text-purple-600">+10% bonus platform credit</strong>.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            {profile ? (
              <Link
                to={dashboardHref}
                className="px-7 py-3.5 bg-[#86c240] hover:bg-[#72ad30] text-white font-bold rounded-2xl text-sm flex items-center gap-2 shadow-lg shadow-[#86c240]/25 transition-all"
              >
                Open Affiliate Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register?role=tutor"
                  className="px-7 py-3.5 bg-[#86c240] hover:bg-[#72ad30] text-white font-bold rounded-2xl text-sm flex items-center gap-2 shadow-lg shadow-[#86c240]/25 transition-all"
                >
                  Join as Affiliate Partner <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-2xl text-sm transition-all"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="max-w-6xl mx-auto px-4 mt-14 grid md:grid-cols-3 gap-6">
        <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#86c240]/10 text-[#86c240] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Refer Parents or Tutors</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Verified Tutors, Guardians, and Affiliates can refer both new tuition leads (manual form) and new signups (30-day link attribution).
          </p>
        </div>

        <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Gift className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">10% Welcome Discount</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Tutors who register through your referral link receive an exclusive 10% discount on their very first platform charge!
          </p>
        </div>

        <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">bKash, Nagad or +10% Credit</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Once the 15-day confirmation hold clears, withdraw directly to bKash/Nagad within 7 working days or redeem as Tutor Core Credit for +10% extra bonus!
          </p>
        </div>
      </section>

      {/* Commission Example */}
      <section className="max-w-4xl mx-auto px-4 mt-12">
        <div className="bg-slate-900 text-white p-8 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 text-[#86c240] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Example Commission Calculation
          </div>
          <h3 className="text-xl font-bold">How Much Can You Earn?</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Suppose you refer a parent or submit a tuition lead with a monthly salary of <strong>5,000 BDT</strong>, and the tutor pays a 55% platform charge of <strong>2,750 BDT</strong>. At our 10% affiliate commission rate, you earn <strong>275 BDT</strong> once confirmed and active for 15 days!
          </p>
          <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-300">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#86c240]" /> Minimum cashout: 300 BDT</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#86c240]" /> 30-day cookie tracking</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#86c240]" /> Self-referral protection active</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AffiliateProgram;
