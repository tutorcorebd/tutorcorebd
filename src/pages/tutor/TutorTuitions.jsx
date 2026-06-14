import TuitionJobsBoard from '../../components/tuition/TuitionJobsBoard';

const TutorTuitions = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-black text-slate-800">Find Tuitions</h2>
        <p className="text-sm font-medium text-slate-400 mt-1">
          Apply to matches that fit your qualifications and location.
        </p>
      </div>
      <TuitionJobsBoard isPublic={false} />
    </div>
  );
};

export default TutorTuitions;
