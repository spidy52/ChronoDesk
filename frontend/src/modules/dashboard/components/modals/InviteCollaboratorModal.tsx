import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, UserPlus } from 'lucide-react';
import { api } from '../../../../lib/axios';
import { useTaskStore } from '../../../../store/useTaskStore';

export default function InviteCollaboratorModal({
  task,
  onClose,
}: {
  task: any;
  onClose: () => void;
}) {
  const { addCollaboratorToTask, removeCollaboratorFromTask } = useTaskStore();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/members');
      setMembers(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isCollaborator = (userId: string) => {
    return task.collaborators?.some((c: any) => (c._id || c) === userId);
  };

  const handleToggleCollaborator = async (userId: string) => {
    try {
      if (isCollaborator(userId)) {
        await removeCollaboratorFromTask(task._id, userId);
      } else {
        await addCollaboratorToTask(task._id, userId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(search.toLowerCase()) ||
    member.email.toLowerCase().includes(search.toLowerCase())
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <UserPlus size={20} className="text-primary" />
              Collaborators
            </h2>
            <p className="text-zinc-400 text-xs mt-1">
              Invite people to work on this task
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 flex items-center justify-center text-zinc-400 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* SEARCH */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 mb-6 flex items-center gap-3 focus-within:border-primary/50 transition-all">
          <Search size={16} className="text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-white"
          />
        </div>

        {/* LIST */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="text-center text-zinc-500 text-sm py-4">Loading members...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center text-zinc-500 text-sm py-4">No members found</div>
          ) : (
            filteredMembers.map((member) => (
              <div 
                key={member.userId} 
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-800/50 hover:bg-zinc-900/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{member.name}</h4>
                    <p className="text-xs text-zinc-500">{member.email}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleToggleCollaborator(member.userId)}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-all border
                    ${isCollaborator(member.userId) 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
                    }
                  `}
                >
                  {isCollaborator(member.userId) ? <Check size={14} /> : <PlusIcon />}
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  );
}
