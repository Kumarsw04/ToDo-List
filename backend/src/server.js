
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} = require('./influx');

const {
  logEventToExcel,
} = require('./excel');

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

// Middleware
app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'x-test-user-id',
      'x-client-source',
    ],
  }),
);

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'Backend running',
    service: 'TodoList API',
  });
});

// Temporary identity for testing
function getTestIdentity(req) {
  return {
    userId: req.header('x-test-user-id') || 'test-user',
    source: req.header('x-client-source') || 'unknown',
  };
}

// Log an event to Excel without losing a successful
// InfluxDB operation if Excel is temporarily unavailable.
async function recordExcelEvent(event) {
  try {
    await logEventToExcel(event);
  } catch (error) {
    console.error(
      'WARNING: InfluxDB saved the event, ' +
      'but Excel logging failed:',
      error,
    );

    console.error(
      'Run npm run sync:excel to rebuild the workbook.',
    );
  }
}

// GET: Current task list
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await getTasks();

    res.status(200).json(tasks);
  } catch (error) {
    console.error('GET /api/tasks failed:', error);

    res.status(500).json({
      error: 'Failed to load tasks',
    });
  }
});

// POST: Create task
app.post('/api/tasks', async (req, res) => {
  try {
    const title = req.body?.title;

    if (
      typeof title !== 'string' ||
      !title.trim() ||
      title.trim().length > 500
    ) {
      return res.status(400).json({
        error: 'Valid task title required (1-500 characters)',
      });
    }

    const identity = getTestIdentity(req);

    const result = await createTask(
      title.trim(),
      identity.userId,
      identity.source,
    );

    await recordExcelEvent(result.event);

    res.status(201).json(result.task);
  } catch (error) {
    console.error('POST /api/tasks failed:', error);

    res.status(500).json({
      error: 'Failed to create task',
    });
  }
});

// PATCH: Complete or reopen task
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const completed = req.body?.completed;

    if (typeof completed !== 'boolean') {
      return res.status(400).json({
        error: 'completed must be a boolean',
      });
    }

    const identity = getTestIdentity(req);

    const result = await updateTask(
      req.params.id,
      completed,
      identity.userId,
      identity.source,
    );

    if (!result) {
      return res.status(404).json({
        error: 'Task not found',
      });
    }

    await recordExcelEvent(result.event);

    res.status(200).json(result.task);
  } catch (error) {
    console.error('PATCH /api/tasks failed:', error);

    res.status(500).json({
      error: 'Failed to update task',
    });
  }
});

// DELETE: Delete task and record event
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const identity = getTestIdentity(req);

    const result = await deleteTask(
      req.params.id,
      identity.userId,
      identity.source,
    );

    if (!result) {
      return res.status(404).json({
        error: 'Task not found',
      });
    }

    await recordExcelEvent(result.event);

    res.status(200).json({
      message: 'Task deleted',
    });
  } catch (error) {
    console.error('DELETE /api/tasks failed:', error);

    res.status(500).json({
      error: 'Failed to delete task',
    });
  }
});

// Unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API route not found',
  });
});

// Start backend
app.listen(PORT, HOST, () => {
  console.log('-----------------------------------');
  console.log('TodoList Backend Started');
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Tasks:  http://localhost:${PORT}/api/tasks`);
  console.log('InfluxDB: Configured');
  console.log('Excel logging: Enabled');
  console.log('-----------------------------------');
});
