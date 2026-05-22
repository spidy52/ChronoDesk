import {
  useEffect,
  useState,
} from 'react';

import DashboardLayout from '../../../layouts/DashboardLayout';

import CreateEventModal from '../components/calendar/CreateEventModal';

import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock3,
  CalendarDays,
  Video,
  Trash2,
} from 'lucide-react';

import { useEventStore } from '../../../store/useEventStore';

import { useTaskStore } from '../../../store/useTaskStore';

export default function CalendarPage() {

  const {
    events,
    fetchAllEvents,
    addEvent,
    removeEvent,
  } = useEventStore() as any;

  const {
    tasks,
    fetchAllTasks,
  } = useTaskStore() as any;

  /* ================= STATES ================= */

  const [selectedDay, setSelectedDay] =
    useState(
      new Date().getDate()
    );

  const [openModal, setOpenModal] =
    useState(false);

  const [currentMonth, setCurrentMonth] =
    useState(
      new Date().getMonth()
    );

  const [currentYear, setCurrentYear] =
    useState(
      new Date().getFullYear()
    );

  /* ================= FETCH ================= */

  useEffect(() => {

    fetchAllEvents();

    fetchAllTasks();

  }, []);

  /* ================= CREATE EVENT ================= */

  const handleCreateEvent =
    async (data: any) => {

      await addEvent({
        ...data,

        type:
          data.type ||
          'Program',

        meetingLink:
          data.meetingLink ||
          'https://meet.google.com/abc-defg-hij',
      });

      setOpenModal(false);

      fetchAllEvents();
    };

  /* ================= MONTH ================= */

  const monthName =
    new Date(
      currentYear,
      currentMonth
    ).toLocaleString(
      'default',
      {
        month: 'long',
      }
    );

  const days = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ];

  const totalDays =
    new Date(
      currentYear,
      currentMonth + 1,
      0
    ).getDate();

  const dates = Array.from(
    { length: totalDays },
    (_, i) => i + 1
  );

  /* ================= FILTER ================= */

  const selectedEvents =
    events.filter(
      (event: any) =>
        new Date(
          event.date
        ).getDate() ===
          selectedDay &&
        new Date(
          event.date
        ).getMonth() ===
          currentMonth
    );

  const selectedTasks =
    tasks.filter(
      (task: any) =>
        task.status !==
          'completed' &&
        task.dueDate &&
        new Date(
          task.dueDate
        ).getDate() ===
          selectedDay &&
        new Date(
          task.dueDate
        ).getMonth() ===
          currentMonth
    );

  /* ================= NAVIGATION ================= */

  const prevMonth = () => {

    if (currentMonth === 0) {

      setCurrentMonth(11);

      setCurrentYear(
        currentYear - 1
      );

    } else {

      setCurrentMonth(
        currentMonth - 1
      );
    }
  };

  const nextMonth = () => {

    if (currentMonth === 11) {

      setCurrentMonth(0);

      setCurrentYear(
        currentYear + 1
      );

    } else {

      setCurrentMonth(
        currentMonth + 1
      );
    }
  };

  return (
    <DashboardLayout>

      <div className="flex h-full">

        {/* ================= LEFT PANEL ================= */}

        <div
          className="
            w-[340px]
            border-r
            bg-card
            p-5
            overflow-y-auto
          "
        >

          {/* HEADER */}

          <div className="flex items-center justify-between mb-8">

            <div>

              <h1 className="text-3xl font-bold">
                Schedule
              </h1>

              <p className="text-sm text-muted-foreground mt-1">
                Programs, tasks & meetings
              </p>
            </div>

            <button
              onClick={() =>
                setOpenModal(true)
              }
              className="
                w-11
                h-11
                rounded-2xl
                bg-primary
                text-primary-foreground
                flex
                items-center
                justify-center
                shadow-lg
              "
            >

              <Plus size={18} />
            </button>
          </div>

          {/* TODAY */}

          <div
            className="
              bg-primary
              text-primary-foreground
              rounded-3xl
              p-3
              mb-3
            "
          >

            <p className="text-sm opacity-80 mb-2">
              Today
            </p>

            <h2 className="text-4xl font-bold">

              {new Date().getDate()}
            </h2>

            <p className="mt-2 text-lg">

              {monthName} {currentYear}
            </p>
          </div>

          {/* SELECTED DATE */}

          <div>

            <div className="flex items-center justify-between mb-5">

              <h2 className="text-xl font-bold">
                Schedule
              </h2>

              <span className="text-sm text-muted-foreground">

                {selectedDay} {monthName}
              </span>
            </div>

            <div className="space-y-4">

              {selectedEvents.length === 0 &&
                selectedTasks.length === 0 && (

                <div
                  className="
                    border
                    rounded-3xl
                    p-6
                    text-center
                    bg-background
                  "
                >

                  <h3 className="font-bold text-lg mb-2">
                    No Schedule
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    No meetings or tasks for this date.
                  </p>
                </div>
              )}

              {selectedEvents.map(
                (event: any) => (

                  <EventCard
                    key={event._id}
                    event={event}
                    onDelete={
                      removeEvent
                    }
                  />
                )
              )}

              {selectedTasks.map(
                (task: any) => (

                  <TaskRow
                    key={task._id}
                    task={task}
                  />
                )
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT ================= */}

        <div className="flex-1 p-5">

          {/* TOP */}

          <div className="flex items-center justify-between mb-5">

            <div className="flex items-center gap-3">

              <button
                onClick={prevMonth}
                className="
                  w-10
                  h-10
                  rounded-2xl
                  border
                  bg-card
                  flex
                  items-center
                  justify-center
                "
              >

                <ChevronLeft size={18} />
              </button>

              <button
                onClick={nextMonth}
                className="
                  w-10
                  h-10
                  rounded-2xl
                  border
                  bg-card
                  flex
                  items-center
                  justify-center
                "
              >

                <ChevronRight size={18} />
              </button>

              <h2 className="text-3xl font-bold">

                {monthName} {currentYear}
              </h2>
            </div>

            <div
              className="
                flex
                items-center
                gap-2
                border
                bg-card
                rounded-2xl
                px-4
                py-2
              "
            >

              <CalendarDays size={18} />

              Monthly View
            </div>
          </div>

          {/* DAYS */}

          <div className="grid grid-cols-7 gap-2 mb-2">

            {days.map((day) => (

              <div
                key={day}
                className="
                  text-center
                  py-2
                  text-xs
                  font-bold
                  text-muted-foreground
                "
              >
                {day}
              </div>
            ))}
          </div>

          {/* GRID */}

          <div className="grid grid-cols-7 gap-2">

            {dates.map((date) => {

              const dayEvents =
                events.filter(
                  (event: any) =>
                    new Date(
                      event.date
                    ).getDate() ===
                      date &&
                    new Date(
                      event.date
                    ).getMonth() ===
                      currentMonth
                );

              const dayTasks =
                tasks.filter(
                  (task: any) =>
                    task.status !==
                      'completed' &&
                    task.dueDate &&
                    new Date(
                      task.dueDate
                    ).getDate() ===
                      date &&
                    new Date(
                      task.dueDate
                    ).getMonth() ===
                      currentMonth
                );

              return (
                <button
                  key={date}
                  onClick={() =>
                    setSelectedDay(
                      date
                    )
                  }
                  className={`
                    h-[88px]
                    rounded-2xl
                    border
                    p-2
                    text-left
                    transition-all

                    ${
                      selectedDay ===
                      date
                        ? 'bg-white border-primary'
                        : 'bg-card hover:bg-secondary'
                    }
                  `}
                >

                  {/* DATE */}

                  <div className="flex items-center justify-between mb-1">

                    <span
                      className={`
                        text-xs
                        font-bold

                        ${
                          selectedDay ===
                          date
                            ? 'text-black'
                            : ''
                        }
                      `}
                    >
                      {date}
                    </span>

                    {(dayEvents.length >
                      0 ||
                      dayTasks.length >
                        0) && (
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    )}
                  </div>

                  {/* ITEMS */}

                  <div className="space-y-1">

                    {dayEvents
                      .slice(0, 1)
                      .map(
                        (
                          event: any
                        ) => (

                          <div
                            key={
                              event._id
                            }
                            className="
                              text-[9px]
                              px-2
                              py-1
                              rounded-md
                              bg-blue-500/10
                              text-blue-500
                              truncate
                              font-medium
                            "
                          >

                            {event.title}
                          </div>
                        )
                      )}

                    {dayTasks
                      .slice(0, 1)
                      .map(
                        (
                          task: any
                        ) => (

                          <div
                            key={
                              task._id
                            }
                            className="
                              text-[9px]
                              px-2
                              py-1
                              rounded-md
                              bg-orange-500/10
                              text-orange-500
                              truncate
                              font-medium
                            "
                          >

                            {task.title}
                          </div>
                        )
                      )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL */}

      <CreateEventModal
        open={openModal}
        onClose={() =>
          setOpenModal(false)
        }
        onCreate={
          handleCreateEvent
        }
      />
    </DashboardLayout>
  );
}

/* ================= EVENT CARD ================= */

function EventCard({
  event,
  onDelete,
}: any) {

  return (
    <div
      className="
        p-4
        rounded-3xl
        border
        bg-background
      "
    >

      {/* TOP */}

      <div className="flex items-center justify-between mb-3">

        <span
          className="
            px-3
            py-1
            rounded-xl
            bg-primary/10
            text-primary
            text-xs
            font-semibold
          "
        >

          {event.type ||
            'Program'}
        </span>

        <button
          onClick={() =>
            onDelete(
              event._id
            )
          }
          className="
            text-red-500
            hover:opacity-80
          "
        >

          <Trash2 size={16} />
        </button>
      </div>

      {/* TITLE */}

      <h3
        className="
          text-lg
          font-bold
          mb-2
          truncate
        "
      >

        {event.title}
      </h3>

      {/* DESCRIPTION */}

      {event.description && (

        <p
          className="
            text-sm
            text-muted-foreground
            mb-3
            line-clamp-2
          "
        >

          {event.description}
        </p>
      )}

      {/* TIME */}

      <div
        className="
          flex
          items-center
          gap-2
          text-sm
          text-muted-foreground
          mb-2
        "
      >

        <Clock3 size={14} />

        <span>
          {event.startTime} -{' '}
          {event.endTime}
        </span>
      </div>

      {/* SESSION */}

      <div
        className="
          flex
          items-center
          gap-2
          text-sm
          text-muted-foreground
          mb-2
        "
      >

        <Video size={14} />

        Online Session
      </div>

      {/* LINK */}

      <p
        className="
          text-[11px]
          text-muted-foreground
          truncate
          mb-4
        "
      >

        {event.meetingLink}
      </p>

      {/* ACTION */}

      <button
        onClick={() =>
          window.open(
            event.meetingLink,
            '_blank'
          )
        }
        className="
          w-full
          py-2.5
          rounded-2xl
          bg-primary
          text-primary-foreground
          font-medium
          transition-all
          hover:opacity-90
        "
      >

        Join Meeting
      </button>
    </div>
  );
}

/* ================= TASK ROW ================= */

function TaskRow({
  task,
}: any) {

  return (
    <div
      className="
        p-4
        rounded-3xl
        border
        bg-background
      "
    >

      <div className="flex items-start justify-between gap-4">

        <div className="flex-1 min-w-0">

          <div className="flex items-center gap-3 mb-2">

            <h3
              className="
                text-lg
                font-bold
                truncate
              "
            >

              {task.title}
            </h3>

            <span
              className="
                px-3
                py-1
                rounded-xl
                bg-orange-500/10
                text-orange-500
                text-xs
                font-semibold
              "
            >

              Task
            </span>
          </div>

          <p
            className="
              text-sm
              text-muted-foreground
              line-clamp-2
            "
          >

            {task.description}
          </p>
        </div>

        <div
          className="
            px-3
            py-2
            rounded-2xl
            bg-orange-500/10
            text-orange-500
            text-xs
            font-semibold
            whitespace-nowrap
          "
        >

          Pending
        </div>
      </div>
    </div>
  );
}