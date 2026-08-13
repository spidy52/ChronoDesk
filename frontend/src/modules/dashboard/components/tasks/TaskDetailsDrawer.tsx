import { useState, useEffect } from 'react';
import { X, Calendar, Flag, Trash2, Check } from 'lucide-react';
import { useTaskStore } from '../../../../store/useTaskStore';
import { useAuthStore } from '../../../../modules/auth/store';
import toast from 'react-hot-toast';

interface TaskDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
}

export default function TaskDetailsDrawer({
  isOpen,
  onClose,
  task,
}: TaskDetailsDrawerProps) {
  const { updateTaskById, deleteTaskById, removeCollaboratorFromTask } = useTaskStore();
  const { user } = useAuthStore();
  const isCreator = user && (task?.createdBy?._id || task?.createdBy) === (user.id || user._id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate || '');
      setShowDeleteConfirm(false);
    }
  }, [task]);

  const handleSave = async () => {
    setLoading(true);

    try {
      await updateTaskById(task._id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        dueDate: dueDate || undefined,
      });

      toast.success('Task updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);

    try {
      await deleteTaskById(task._id);
      toast.success('Task deleted successfully');
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    try {
      await removeCollaboratorFromTask(task._id, userId);
      toast.success('Collaborator removed successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove collaborator');
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">Task Details</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
              >
                <option value="todo">Todo</option>
                <option value="inprogress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <Flag size={16} />
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
              <Calendar size={16} />
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Collaborators Management */}
          {((task.collaborators && task.collaborators.length > 0) || 
            (task.pendingCollaborators && task.pendingCollaborators.length > 0)) && (
            <div>
              <label className="block text-sm font-semibold mb-2">
                Task Collaborators
              </label>
              <div className="bg-secondary/40 border border-border rounded-xl p-4 space-y-3">
                {/* Active Collaborators */}
                {task.collaborators?.map((collab: any) => (
                  <div key={collab._id} className="flex items-center justify-between bg-card border border-border/50 rounded-xl p-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs overflow-hidden shrink-0">
                        {collab.avatar ? (
                          <img src={collab.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          collab.name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-foreground block truncate">{collab.name}</span>
                        <span className="text-[10px] text-muted-foreground block truncate">@{collab.username}</span>
                      </div>
                    </div>
                    {isCreator ? (
                      <button
                        onClick={() => handleRemoveCollaborator(collab._id)}
                        className="w-8 h-8 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 flex items-center justify-center transition-all cursor-pointer border border-transparent hover:border-red-500/20"
                        title="Remove Collaborator"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-[10px] font-semibold border border-green-500/20">
                        Active
                      </span>
                    )}
                  </div>
                ))}

                {/* Pending Collaborators */}
                {task.pendingCollaborators?.map((collab: any) => (
                  <div key={collab._id} className="flex items-center justify-between bg-card border border-border/50 rounded-xl p-2.5 opacity-80">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs overflow-hidden shrink-0">
                        {collab.avatar ? (
                          <img src={collab.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          collab.name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-foreground block truncate">{collab.name}</span>
                        <span className="text-[10px] text-muted-foreground block truncate">@{collab.username}</span>
                      </div>
                    </div>
                    {isCreator ? (
                      <button
                        onClick={() => handleRemoveCollaborator(collab._id)}
                        className="w-8 h-8 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 flex items-center justify-center transition-all cursor-pointer border border-transparent hover:border-red-500/20"
                        title="Cancel Invitation"
                      >
                        <X size={14} />
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-semibold border border-amber-500/20">
                        Pending
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-border">
          {showDeleteConfirm ? (
            <div className="flex items-center justify-between w-full bg-red-500/5 border border-red-500/20 rounded-xl p-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <span className="text-sm font-semibold text-red-500 flex items-center gap-2">
                <Trash2 size={16} />
                Delete this task?
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="px-4 py-3 rounded-xl border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete
              </button>
              <div className="flex-1" />
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-3 rounded-xl border border-border hover:bg-secondary transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check size={16} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
