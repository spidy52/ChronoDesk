import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useWorkspaceStore } from '../../../../store/workspaceStore';

export default function DeleteWorkspaceModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const { activeWorkspace, deleteWorkspaceById } = useWorkspaceStore();
  const [confirmName, setConfirmName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!activeWorkspace) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmName !== activeWorkspace.name) return;

    try {
      setLoading(true);
      await deleteWorkspaceById(activeWorkspace._id);
      onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to delete workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-950 border border-red-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Warning Background Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 blur-3xl rounded-full pointer-events-none"></div>

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Delete Workspace
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 flex items-center justify-center text-zinc-400 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="mb-6">
          <p className="text-zinc-300 text-sm leading-relaxed">
            This action <span className="font-bold text-red-400">cannot</span> be undone. This will permanently delete the <strong>{activeWorkspace.name}</strong> workspace, along with all associated tasks, chats, and data.
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <label className="text-sm font-medium text-zinc-300 block mb-2">
              Please type <strong className="text-white select-all">{activeWorkspace.name}</strong> to confirm.
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="w-full border border-zinc-800 bg-zinc-900/50 rounded-2xl px-4 py-3 outline-none text-white focus:border-red-500 transition-all"
              required
            />
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-zinc-800 text-zinc-300 rounded-2xl py-3 hover:bg-zinc-900 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || confirmName !== activeWorkspace.name}
              className="flex-1 bg-red-600/90 text-white rounded-2xl py-3 hover:bg-red-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/50"
            >
              {loading ? 'Deleting...' : 'Delete Workspace'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
