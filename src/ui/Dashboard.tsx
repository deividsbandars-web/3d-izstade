import React, { useCallback, useEffect, useState } from 'react';

interface Project {
  id: string;
  name: string;
  lastModified: string;
}

export default function Dashboard({ user, onOpenProject }: { user: any, onOpenProject: (id: string) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/projects?userId=${user.id}`);
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (e) {
      console.error('Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const res = await fetch('http://localhost:3000/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name: newProjectName })
      });
      const data = await res.json();
      if (res.ok) {
        setProjects([...projects, data.project]);
        setNewProjectName('');
      }
    } catch (e) {
      console.error('Failed to create project');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-gray-800 pb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter">PROJECTS</h1>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">Logged in as {user.username}</p>
          </div>
          <button className="bg-gray-900 border border-gray-800 px-6 py-2 rounded-full font-bold text-xs uppercase hover:bg-gray-800 transition-colors">
            Logout
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Create Section */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-blue-500">Create New</h2>
            <form onSubmit={handleCreateProject} className="space-y-4 bg-gray-900 p-6 rounded-2xl border border-gray-800">
              <input 
                type="text" 
                placeholder="Project Name..."
                className="w-full bg-black border border-gray-800 p-3 rounded-xl outline-none focus:border-blue-500 transition-colors"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
              <button 
                type="submit"
                className="w-full bg-blue-600 py-3 rounded-xl font-black uppercase tracking-tighter hover:bg-blue-700 transition-all"
              >
                Launch Project
              </button>
            </form>
          </div>

          {/* List Section */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Your Archive</h2>
            {isLoading ? (
              <div className="text-gray-600 animate-pulse uppercase text-xs font-black">Decrypting projects...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => onOpenProject(p.id)}
                    className="group bg-gray-900 border border-gray-800 p-6 rounded-2xl cursor-pointer hover:border-blue-500 transition-all hover:translate-y-[-2px]"
                  >
                    <h3 className="text-xl font-black tracking-tight mb-1 group-hover:text-blue-400 transition-colors">{p.name}</h3>
                    <p className="text-[10px] text-gray-600 font-bold uppercase">ID: {p.id.substring(0, 8)}...</p>
                    <div className="mt-4 pt-4 border-t border-gray-800/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-black uppercase text-blue-500">Open 3D Editor →</span>
                    </div>
                  </div>
                ))}
                {projects.length === 0 && (
                  <div className="col-span-2 py-12 border-2 border-dashed border-gray-800 rounded-3xl flex items-center justify-center text-gray-700 font-bold uppercase text-xs tracking-widest">
                    No projects found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
