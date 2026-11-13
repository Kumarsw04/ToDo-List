
import { useCallback, useEffect, useState } from 'react';
import './App.css';

// Task data type
type Task = {
  id: string;
  title: string;
  completed: boolean;
};

// Website -> Express backend
const API_URL = 'http://localhost:5000/api';

// Temporary test user identification
const TEST_USER_ID = 'user-web-01';

const API_HEADERS = {
  'Content-Type': 'application/json',
  'x-test-user-id': TEST_USER_ID,
  'x-client-source': 'web',
};

function App() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // GET: Load tasks from Express + InfluxDB Cloud
  const loadTasks = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'GET',
        headers: API_HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Failed to load tasks: ${response.status}`);
      }

      const data: Task[] = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid task response');
      }

      setTasks(data);
      setError('');
    } catch (err) {
      console.error('Load tasks error:', err);
      setError(
        'Could not load tasks from the backend. Check that Express is running.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load tasks when the website opens
  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  // POST: Create a task
  const addTask = async () => {
    const title = task.trim();

    if (!title || saving) {
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.status}`);
      }

      setTask('');
      await loadTasks();
    } catch (err) {
      console.error('Create task error:', err);
      setError('Could not save the task.');
    } finally {
      setSaving(false);
    }
  };

  // PATCH: Complete or reopen a task
  const toggleTask = async (id: string) => {
    if (busyTaskId !== null) {
      return;
    }

    const existing = tasks.find(item => item.id === id);

    if (!existing) {
      return;
    }

    try {
      setBusyTaskId(id);
      setError('');

      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: API_HEADERS,
        body: JSON.stringify({
          completed: !existing.completed,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.status}`);
      }

      await loadTasks();
    } catch (err) {
      console.error('Update task error:', err);
      setError('Could not update the task.');
    } finally {
      setBusyTaskId(null);
    }
  };

  // DELETE: Record deletion event in InfluxDB
  const deleteTask = async (id: string) => {
    if (busyTaskId !== null) {
      return;
    }

    try {
      setBusyTaskId(id);
      setError('');

      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: API_HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.status}`);
      }

      await loadTasks();
    } catch (err) {
      console.error('Delete task error:', err);
      setError('Could not delete the task.');
    } finally {
      setBusyTaskId(null);
    }
  };

  // Task progress
  const completedCount = tasks.filter(
    item => item.completed
  ).length;

  const progress = tasks.length > 0
    ? (completedCount / tasks.length) * 100
    : 0;

  return (
    <main className="container">
      <div className="todo-app">

        {/* Header */}
        <header className="header">
          <h1>My Tasks</h1>
          <p>Organize your day, one task at a time.</p>
        </header>

        {/* Progress */}
        <section className="progress-card">
          <p>Your daily progress</p>

          <h2>
            {completedCount} of {tasks.length} completed
          </h2>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        {/* Add task */}
        <form
          className="input-row"
          onSubmit={event => {
            event.preventDefault();
            void addTask();
          }}
        >
          <input
            type="text"
            placeholder="Enter a new task..."
            aria-label="New task"
            value={task}
            maxLength={500}
            onChange={event => setTask(event.target.value)}
            disabled={saving}
          />

          <button
            type="submit"
            className="add-button"
            aria-label="Add task"
            disabled={saving || !task.trim()}
          >
            {saving ? '...' : '+'}
          </button>
        </form>

        {/* Error message */}
        {error && (
          <p role="alert" style={{ color: '#ef4444' }}>
            {error}
          </p>
        )}

        {/* Task list */}
        <div className="section-header">
          <h3>Your Tasks</h3>
          <span>{tasks.length} tasks</span>
        </div>

        <div className="task-list">
          {loading ? (
            <p className="empty-message">
              Loading tasks...
            </p>
          ) : tasks.length === 0 ? (
            <p className="empty-message">
              No tasks yet. Add your first task!
            </p>
          ) : (
            tasks.map(item => (
              <div className="task-card" key={item.id}>

                <label className="task-info">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    disabled={busyTaskId !== null}
                    onChange={() => void toggleTask(item.id)}
                  />

                  <span
                    className={
                      item.completed ? 'completed' : ''
                    }
                  >
                    {item.title}
                  </span>
                </label>

                <button
                  type="button"
                  className="delete-button"
                  disabled={busyTaskId !== null}
                  onClick={() => void deleteTask(item.id)}
                  aria-label={`Delete ${item.title}`}
                >
                  {busyTaskId === item.id
                    ? 'Please wait...'
                    : 'Delete'}
                </button>

              </div>
            ))
          )}
        </div>

      </div>
    </main>
  );
}

export default App;
