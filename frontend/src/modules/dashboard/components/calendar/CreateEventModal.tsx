import {
  useState,
} from 'react';
import { Crown } from 'lucide-react';

interface Props {
  open: boolean;

  onClose: () => void;

  onCreate: (
    data: any
  ) => void;
}

export default function CreateEventModal({
  open,
  onClose,
  onCreate,
}: Props) {

  const [title, setTitle] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [date, setDate] =
    useState('');

  const [startTime, setStartTime] =
    useState('');

  const [endTime, setEndTime] =
    useState('');

  const [meetingLink, setMeetingLink] =
    useState('');

  const [isImportant, setIsImportant] =
    useState(false);

  if (!open) return null;

  const handleCreate =
    () => {

      onCreate({
        title,

        description,

        date,

        startTime,

        endTime,

        meetingLink,

        isImportant,
      });

      setTitle('');
      setDescription('');
      setDate('');
      setStartTime('');
      setEndTime('');
      setMeetingLink('');
      setIsImportant(false);
    };

  return (
    <div
      className="
        fixed inset-0
        bg-black/50
        flex items-center
        justify-center
        z-50
      "
    >

      <div
        className="
          w-[500px]
          rounded-3xl
          bg-card
          border
          p-8
        "
      >

        <h2 className="text-3xl font-bold mb-6">
          Create Meeting
        </h2>

        <div className="space-y-4">

          {/* TITLE */}

          <input
            placeholder="Meeting Title"
            value={title}
            onChange={(e) =>
              setTitle(
                e.target.value
              )
            }
            className="
              w-full
              bg-secondary
              rounded-2xl
              px-4
              py-3
              outline-none
            "
          />

          {/* DESCRIPTION */}

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            className="
              w-full
              bg-secondary
              rounded-2xl
              px-4
              py-3
              outline-none
              resize-none
              min-h-[120px]
            "
          />

          {/* DATE */}

          <input
            type="date"
            value={date}
            onChange={(e) =>
              setDate(
                e.target.value
              )
            }
            className="
              w-full
              bg-secondary
              rounded-2xl
              px-4
              py-3
              outline-none
            "
          />

          {/* START */}

          <input
            type="time"
            value={startTime}
            onChange={(e) =>
              setStartTime(
                e.target.value
              )
            }
            className="
              w-full
              bg-secondary
              rounded-2xl
              px-4
              py-3
              outline-none
            "
          />

          {/* END */}

          <input
            type="time"
            value={endTime}
            onChange={(e) =>
              setEndTime(
                e.target.value
              )
            }
            className="
              w-full
              bg-secondary
              rounded-2xl
              px-4
              py-3
              outline-none
            "
          />

          {/* MEETING LINK */}

          <input
            type="url"
            placeholder="Meeting Link (e.g. https://meet.google.com/abc-defg-hij)"
            value={meetingLink}
            onChange={(e) =>
              setMeetingLink(
                e.target.value
              )
            }
            className="
              w-full
              bg-secondary
              rounded-2xl
              px-4
              py-3
              outline-none
            "
          />

          {/* IMPORTANT MEETING TOGGLE */}

          <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 cursor-pointer transition-all hover:bg-amber-500/20 select-none">
            <input
              type="checkbox"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
            />
            <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
              <Crown size={18} className="fill-amber-500/20 text-amber-500" />
              <span>Mark as Important Meeting (Crown)</span>
            </div>
          </label>
        </div>

        {/* ACTIONS */}

        <div className="flex justify-end gap-3 mt-8">

          <button
            onClick={onClose}
            className="
              px-5
              py-3
              rounded-2xl
              border
            "
          >
            Cancel
          </button>

          <button
            onClick={
              handleCreate
            }
            className="
              px-5
              py-3
              rounded-2xl
              bg-primary
              text-primary-foreground
            "
          >
            Create Meeting
          </button>
        </div>
      </div>
    </div>
  );
}