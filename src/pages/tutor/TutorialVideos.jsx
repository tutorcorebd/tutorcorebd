import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { PlayCircle, Video } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TutorialVideos = () => {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuthStore();

  useEffect(() => {
    const fetchTutorials = async () => {
      setLoading(true);
      
      const role = profile?.role || 'tutor';
      
      // Fetch tutorials matching 'all' or the user's specific role
      const { data, error } = await supabase
        .from('tutorials')
        .select('*')
        .in('target_role', ['all', role])
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setTutorials(data);
      }
      
      setLoading(false);
    };

    fetchTutorials();
  }, [profile]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Tutorial Videos</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Learn how to make the most of TutorCore BD</p>
        </div>
        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-[#86c240]">
          <Video className="w-6 h-6" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-400 text-sm font-semibold">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#86c240] mr-3"></div>
          Loading Tutorials...
        </div>
      ) : tutorials.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
            <PlayCircle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">No tutorials available yet</h2>
          <p className="text-slate-500 text-sm max-w-md">
            Check back later! We'll be posting helpful guides and video tutorials here soon.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map(tutorial => (
            <div key={tutorial.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
              <div className="aspect-video bg-slate-900 relative">
                {tutorial.thumbnail_url ? (
                  <img src={tutorial.thumbnail_url} alt={tutorial.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <Video className="w-12 h-12 text-slate-700" />
                  </div>
                )}
                
                {/* Play Button Overlay */}
                <a href={tutorial.video_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer border border-white/30">
                    <PlayCircle className="w-8 h-8 text-white ml-1" />
                  </div>
                </a>
              </div>
              
              <div className="p-5">
                <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2" title={tutorial.title}>
                  {tutorial.title}
                </h3>
                {tutorial.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    {tutorial.description}
                  </p>
                )}
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>{formatDistanceToNow(new Date(tutorial.created_at), { addSuffix: true })}</span>
                  <span className="px-2 py-1 bg-slate-50 rounded-md">
                    {tutorial.target_role === 'all' ? 'General' : tutorial.target_role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TutorialVideos;
