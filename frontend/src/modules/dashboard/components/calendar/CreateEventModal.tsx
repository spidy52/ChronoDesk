import {
  useState,
} from 'react';

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

  if (!open) return null;

  const handleCreate =
    () => {

      onCreate({
        title,

        description,

        date,

        startTime,

        endTime,
      });

      setTitle('');
      setDescription('');
      setDate('');
      setStartTime('');
      setEndTime('');
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