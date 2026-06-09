import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { Users, FileText, CheckCircle } from 'lucide-react';

const AdminDashboard = () => {
  const { profile } = useAuthStore();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-slate-600">Welcome back, {profile?.full_name}. Here is an overview of the platform.</p>
      
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg"><FileText className="w-8 h-8 text-blue-600" /></div>
          <div>
            <div className="text-2xl font-bold">Manage Requests</div>
            <Link to="/admin/requests" className="text-sm text-primary hover:underline">Go to Assignment Hub &rarr;</Link>
          </div>
        </div>
        {/* Placeholders for actual stats */}
        <div className="card flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-lg"><CheckCircle className="w-8 h-8 text-green-600" /></div>
          <div>
            <div className="text-2xl font-bold">Assigned</div>
            <div className="text-sm text-slate-500">Track successful matches</div>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="bg-purple-100 p-3 rounded-lg"><Users className="w-8 h-8 text-purple-600" /></div>
          <div>
            <div className="text-2xl font-bold">Users</div>
            <div className="text-sm text-slate-500">Tutors & Guardians</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
