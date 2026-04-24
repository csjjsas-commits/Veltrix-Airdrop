import { useState } from 'react';
import { UserTask } from '../../types';
import { TaskCard } from './TaskCard';

interface Props {
  tasks: UserTask[];
  onTaskUpdate?: (taskId: string, updatedTask: UserTask) => void;
}

export const TaskList = ({ tasks, onTaskUpdate }: Props) => {
  const handleTaskUpdate = (updatedTask: UserTask) => {
    if (onTaskUpdate) {
      onTaskUpdate(updatedTask.id, updatedTask);
    }
  };

  return (
    <div className="space-y-5">
      {tasks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/90 p-8 text-center text-slate-400">
          No hay tareas disponibles por el momento.
        </div>
      ) : (
        tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onTaskUpdate={handleTaskUpdate}
          />
        ))
      )}
    </div>
  );
};
