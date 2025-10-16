import React from "react";
import TaskItem from "./TaskItem";

function ListTask({ tasks, onToggle, onItemClick, onDelete }) {
    return (

            <div className="flex flex-row flex-wrap gap-4 px-1  py-5">
                {tasks.map((task) => (
                    <TaskItem 
                        key={task._id} 
                        task={task} 
                        onToggle={onToggle} 
                        onItemClick={onItemClick} 
                        onDelete={onDelete} 
                    />
                ))}
            </div>
    );
}

export default ListTask;
