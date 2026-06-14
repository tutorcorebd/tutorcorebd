import TuitionJobsBoard from '../../components/tuition/TuitionJobsBoard';

const JobBoard = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Find Tuitions</h2>
        <p className="text-sm font-medium text-slate-400 mt-1">
          Explore tuition requests posted by verified parents and guardians.
        </p>
      </div>
      <TuitionJobsBoard isPublic={true} />
    </div>
  );
};

export default JobBoard;
