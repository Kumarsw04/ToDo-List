
const {randomUUID} = require('crypto');
const {
  InfluxDB,
  Point,
} = require('@influxdata/influxdb-client');

const {
  INFLUX_URL,
  INFLUX_TOKEN,
  INFLUX_ORG,
  INFLUX_BUCKET,
} = process.env;

// Validate configuration
for (const name of [
  'INFLUX_URL',
  'INFLUX_TOKEN',
  'INFLUX_ORG',
  'INFLUX_BUCKET',
]) {
  if (!process.env[name]) {
    throw new Error(`Missing environment variable: ${name}`);
  }
}

// Connect to InfluxDB Cloud
const influxDB = new InfluxDB({
  url: INFLUX_URL,
  token: INFLUX_TOKEN,
  timeout: 10000,
});

const queryApi = influxDB.getQueryApi(INFLUX_ORG);

// Write one event to InfluxDB
async function writeEvent(event) {
  const eventId = randomUUID();
  const timestamp = new Date();

  const savedEvent = {
    eventId,
    id: event.id,
    title: event.title,
    action: event.action,
    userId: event.userId,
    source: event.source,
    timestamp: timestamp.toISOString(),
  };

  const writeApi = influxDB.getWriteApi(
    INFLUX_ORG,
    INFLUX_BUCKET,
    'ns',
  );

  const point = new Point('todo_events')
    .tag('taskId', event.id)
    .tag('eventId', eventId)
    .tag('userId', event.userId)
    .tag('source', event.source)
    .stringField('title', event.title)
    .stringField('action', event.action)
    .timestamp(timestamp);

  writeApi.writePoint(point);

  // Wait until InfluxDB finishes the write
  await writeApi.close();

  console.log(
    `[InfluxDB] ${event.action}: ${event.title}`,
  );

  return savedEvent;
}

// Read all retained event records
async function getEvents() {
  const fluxQuery = `
    from(bucket: ${JSON.stringify(INFLUX_BUCKET)})
      |> range(start: 0)
      |> filter(fn: (r) =>
        r._measurement == "todo_events"
      )
      |> filter(fn: (r) =>
        r._field == "title" or
        r._field == "action"
      )
      |> keep(columns: [
        "_time",
        "_field",
        "_value",
        "taskId",
        "eventId",
        "userId",
        "source"
      ])
  `;

  const rows = await queryApi.collectRows(fluxQuery);

  const eventMap = new Map();

  for (const row of rows) {
    if (!row.taskId) {
      continue;
    }

    // New events have eventId.
    // Older events are identified by task and timestamp.
    const key = row.eventId
      ? `event:${row.eventId}`
      : [
          'legacy',
          row.taskId,
          row._time,
          row.userId || '',
          row.source || '',
        ].join('|');

    if (!eventMap.has(key)) {
      eventMap.set(key, {
        eventId: row.eventId || key,
        id: row.taskId,
        title: '',
        action: '',
        userId: row.userId || 'unknown',
        source: row.source || 'unknown',
        timestamp: row._time,
      });
    }

    const event = eventMap.get(key);

    if (row._field === 'title') {
      event.title = String(row._value);
    }

    if (row._field === 'action') {
      event.action = String(row._value);
    }
  }

  return Array.from(eventMap.values())
    .filter(event => event.action)
    .sort((a, b) => {
      const timeDifference =
        Date.parse(a.timestamp) -
        Date.parse(b.timestamp);

      if (timeDifference !== 0) {
        return timeDifference;
      }

      return a.eventId.localeCompare(b.eventId);
    });
}

// Convert event history into current task state
async function getTasks() {
  const events = await getEvents();
  const taskMap = new Map();

  for (const event of events) {
    if (event.action === 'deleted') {
      taskMap.delete(event.id);
      continue;
    }

    const existing = taskMap.get(event.id);

    taskMap.set(event.id, {
      id: event.id,
      title: event.title || existing?.title || '',
      completed: event.action === 'completed',
      userId: event.userId,
      source: event.source,
      updatedAt: event.timestamp,
    });
  }

  return Array.from(taskMap.values())
    .sort(
      (a, b) =>
        Date.parse(b.updatedAt) -
        Date.parse(a.updatedAt),
    );
}

// Create task
async function createTask(title, userId, source) {
  const id = randomUUID();

  const event = await writeEvent({
    id,
    title,
    action: 'created',
    userId,
    source,
  });

  return {
    task: {
      id,
      title,
      completed: false,
      userId,
      source,
      updatedAt: event.timestamp,
    },
    event,
  };
}

// Complete or reopen task
async function updateTask(id, completed, userId, source) {
  const tasks = await getTasks();
  const existing = tasks.find(task => task.id === id);

  if (!existing) {
    return null;
  }

  const event = await writeEvent({
    id,
    title: existing.title,
    action: completed ? 'completed' : 'reopened',
    userId,
    source,
  });

  return {
    task: {
      ...existing,
      completed,
      userId,
      source,
      updatedAt: event.timestamp,
    },
    event,
  };
}

// Delete task
async function deleteTask(id, userId, source) {
  const tasks = await getTasks();
  const existing = tasks.find(task => task.id === id);

  if (!existing) {
    return null;
  }

  const event = await writeEvent({
    id,
    title: existing.title,
    action: 'deleted',
    userId,
    source,
  });

  return {event};
}

module.exports = {
  getEvents,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
