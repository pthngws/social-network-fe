import React from 'react';
import { Trash2, CheckCircleIcon } from 'lucide-react';

function TaskItem({ task, onToggle, onItemClick, onDelete }) {
  return (
    <div
      className={`relative group p-4 rounded-2xl shadow-md w-48 h-60 transition-all duration-300 cursor-pointer bg-white dark:bg-gray-900 border-b-4 ${
        task.priority === 'Cao'
          ? 'border-red-500'
          : task.priority === 'Trung bình'
          ? 'border-yellow-500'
          : 'border-green-500'
      } hover:shadow-xl`}
    >
      {/* Nội dung */}
      <div onClick={() => onItemClick(task)} className="h-full w-full">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1 mt-2">
          {task.title}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Từ {new Date(task.startDate).toLocaleDateString('vi-VN')} đến{' '}
          {new Date(task.endDate).toLocaleDateString('vi-VN')}
        </p>

        {/* Thanh tiến độ */}
        <div className="mt-3">
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                task.progress === 100
                  ? 'bg-green-600'
                  : task.progress >= 90
                  ? 'bg-green-400'
                  : task.progress >= 75
                  ? 'bg-lime-400'
                  : task.progress >= 60
                  ? 'bg-yellow-400'
                  : task.progress >= 40
                  ? 'bg-amber-400'
                  : task.progress >= 25
                  ? 'bg-orange-400'
                  : task.progress >= 10
                  ? 'bg-red-400'
                  : 'bg-red-600'
              }`}
              style={{ width: `${task.progress || 0}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1">
            {task.progress || 0}%
          </p>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4 mt-2">
          {task.description}
        </p>
      </div>

      {/* Nút xóa */}
      <div className="absolute top-3 right-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task._id);
          }}
          className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Xóa"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Mức độ ưu tiên và trạng thái hoàn thành */}
      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
        <p
          className={`text-sm font-medium ${
            task.priority === 'Cao'
              ? 'text-red-500'
              : task.priority === 'Trung bình'
              ? 'text-yellow-500'
              : 'text-green-500'
          }`}
        >
          ⚡ {task.priority}
        </p>

        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={(e) => {
              e.stopPropagation();
              onToggle(task._id);
            }}
            className="w-5 h-5 accent-blue-500 rounded-md cursor-pointer"
            title="Đánh dấu hoàn thành"
          />
        </label>
      </div>

      {/* Hiệu ứng hoàn thành */}
      {task.completed && (
        <div className="absolute bottom-3 right-3 w-24 opacity-50 rotate-[-15deg] pointer-events-none select-none">
          <CheckCircleIcon className="text-green-500 w-full h-full" />
        </div>
      )}
    </div>
  );
}

export default TaskItem;