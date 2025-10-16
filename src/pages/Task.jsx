import React, { useState, useEffect } from "react";
import { taskService } from "../services/taskService";
import TaskModal from "../components/TaskModal";
import ListTask from "../components/ListTask";
import Calendar from "../components/Calendar";

function Task() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState({
    completed: "all",
    priority: "all",
    search: "",
    selectedDate: "",
  });

  // Fetch tasks from backend
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const result = await taskService.getTasks();
        setTasks(result.data.data || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tasks:", error.message);
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Filter tasks based on criteria
  const filteredTasks = tasks.filter((task) => {
    const matchesCompleted =
      filter.completed === "all" ||
      task.completed === (filter.completed === "true");
    const matchesPriority =
      filter.priority === "all" || task.priority === filter.priority;
    const matchesSearch = task.title
      .toLowerCase()
      .includes(filter.search.toLowerCase());
    const selectedDate = filter.selectedDate ? new Date(filter.selectedDate) : null;
    const startDate = task.startDate ? new Date(task.startDate) : null;
    const endDate = task.endDate ? new Date(task.endDate) : null;
    const matchesDate =
      !selectedDate ||
      (startDate &&
        endDate &&
        selectedDate >= startDate &&
        selectedDate <= endDate);

    return matchesCompleted && matchesPriority && matchesSearch && matchesDate;
  });

  // Format date
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return !isNaN(date) ? date.toLocaleDateString("vi-VN") : "Unknown";
    } catch {
      return "Unknown";
    }
  };

  // Handle task click for editing
  const handleItemClick = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  // Handle adding new task
  const handleAddClick = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  // Handle saving task
  const handleSave = async (task) => {
    try {
      if (task.id) {
        await taskService.updateTask(task.id, task);
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? task : t))
        );
      } else {
        const res = await taskService.addTask(task);
        setTasks((prev) => [...prev, res.data]);
      }
    } catch (error) {
      console.error("Error saving task:", error);
    }
    setModalOpen(false);
  };

  // Handle deleting task
  const handleDelete = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Handle toggling task completion
  const handleToggle = async (taskId) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const updatedTask = { ...task, completed: !task.completed };
      await taskService.updateTask(taskId, updatedTask);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? updatedTask : t))
      );
    } catch (error) {
      console.error("Error updating completion status:", error);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-8 mt-10">
      <div className="max-w-2xl mx-auto">

        {/* Filter Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow mb-6">
{/* Filter Section */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
    <select
      name="completed"
      value={filter.completed}
      onChange={handleFilterChange}
      className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
    >
      <option value="all">Tất cả</option>
      <option value="true">Đã hoàn thành</option>
      <option value="false">Chưa hoàn thành</option>
    </select>

    <select
      name="priority"
      value={filter.priority}
      onChange={handleFilterChange}
      className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
    >
      <option value="all">Tất cả</option>
      <option value="Cao">Cao</option>
      <option value="Trung bình">Trung bình</option>
      <option value="Thấp">Thấp</option>
    </select>

    <input
      type="date"
      name="selectedDate"
      value={filter.selectedDate}
      onChange={handleFilterChange}
      className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
    />
  </div>

  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
    <input
      type="text"
      name="search"
      value={filter.search}
      onChange={handleFilterChange}
      placeholder="Tìm kiếm"
      className="flex-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
    />

    <button
      onClick={handleAddClick}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
    >
      + Thêm
    </button>
  </div>



          {/* View Mode Tabs */}
          <div className="flex border-b dark:border-gray-700 mt-6 mb-4">
            {["list", "calendar"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 pb-2 transition-colors ${
                  viewMode === mode
                    ? "border-b-2 border-blue-500 font-semibold text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                }`}
              >
                {mode === "list" ? "Danh sách" : "Lịch"}
              </button>
            ))}
          </div>
        </div>

        {/* Task List or Calendar */}
        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-20">
            Loading...
          </p>
        ) : viewMode === "list" ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">
            <ListTask
              tasks={filteredTasks}
              onToggle={handleToggle}
              onItemClick={handleItemClick}
              onDelete={handleDelete}
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">
            <Calendar tasks={filteredTasks} />
          </div>
        )}

        {/* Task Modal */}
        <TaskModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          initialTask={editingTask}
        />
      </div>
    </div>
  );
}

export default Task;