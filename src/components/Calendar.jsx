import React, { useState } from 'react';

const Calendar = ({ tasks }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getWeekDays = (startDate) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  };

  const changeWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + direction * 7);
    setCurrentWeek(newWeek);
  };

  const weekStart = getWeekStart(currentWeek);
  const weekDays = getWeekDays(weekStart);

  return (
    <div >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => changeWeek(-1)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          Tuần trước
        </button>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {formatMonthYear(weekStart)}
        </h2>
        <button
          onClick={() => changeWeek(1)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          Tuần sau
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className="py-3 border-r border-gray-200 dark:border-gray-600 last:border-r-0"
            >
              {formatDate(day)}
            </div>
          ))}
        </div>

        {/* Tasks Grid */}
        <div className="bg-white dark:bg-gray-900 py-4 px-2 relative">
          <div className="relative w-full" style={{ minHeight: `${Math.max(tasks.length, 3) * 48}px` }}>
            {tasks.map((task, idx) => {
              const taskStart = new Date(task.startDate);
              const taskEnd = new Date(task.endDate);

              const weekStartTime = new Date(weekStart);
              weekStartTime.setHours(0, 0, 0, 0);

              const weekEndTime = new Date(weekStartTime);
              weekEndTime.setDate(weekEndTime.getDate() + 6);
              weekEndTime.setHours(23, 59, 59, 999);

              if (taskEnd < weekStartTime || taskStart > weekEndTime) return null;

              const startOffset = Math.max(0, Math.floor((taskStart - weekStartTime) / (1000 * 60 * 60 * 24)));
              const endOffset = Math.min(6, Math.floor((taskEnd - weekStartTime) / (1000 * 60 * 60 * 24)));
              const span = endOffset - startOffset + 1;

              return (
                <div
                  key={task._id}
                  className="absolute rounded-md overflow-hidden"
                  style={{
                    top: `${idx * 48}px`,
                    left: `${(100 / 7) * startOffset}%`,
                    width: `${(100 / 7) * span}%`,
                    height: '40px',
                  }}
                >
                  <div
                    className={`relative h-full px-3 py-2 text-sm font-medium text-white truncate ${
                      task.priority === 'Cao'
                        ? 'bg-red-500 hover:bg-red-600'
                        : task.priority === 'Trung bình'
                        ? 'bg-yellow-500 hover:bg-yellow-600'
                        : 'bg-green-500 hover:bg-green-600'
                    } transition-colors`}
                  >
                    {/* Progress Overlay */}
                    <div
                      className="absolute top-0 left-0 h-full bg-black bg-opacity-20 z-0 transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    />
                    {/* Task Content */}
                    <div className="relative z-10 flex justify-between items-center">
                      <span className="truncate">{task.title}</span>
                      <span className="text-xs ml-2 whitespace-nowrap">{task.progress}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;