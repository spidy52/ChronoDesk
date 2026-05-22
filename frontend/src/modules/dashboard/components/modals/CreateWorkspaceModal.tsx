import { useState } from 'react';
import { X } from 'lucide-react';
import { useWorkspaceStore } from '../../../../store/workspaceStore';

export default function CreateWorkspaceModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const { addWorkspace } = useWorkspaceStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      await addWorkspace({ name, description });
      onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">
              New Workspace
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              Create a dedicated space for your projects
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 flex items-center justify-center text-zinc-400 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="text-sm font-medium text-zinc-300 block mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marketing Campaign"
              className="w-full border border-zinc-800 bg-zinc-900/50 rounded-2xl px-4 py-3 outline-none text-white focus:border-blue-500 transition-all"
              required
            />
          </div>

          <div className="mb-8">
            <label className="text-sm font-medium text-zinc-300 block mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this workspace for?"
              rows={3}
              className="w-full border border-zinc-800 bg-zinc-900/50 rounded-2xl px-4 py-3 outline-none text-white focus:border-blue-500 transition-all resize-none"
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
              disabled={loading || !name.trim()}
              className="flex-1 bg-blue-600 text-white rounded-2xl py-3 hover:bg-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
