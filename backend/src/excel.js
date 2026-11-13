
const ExcelJS = require('exceljs');
const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const EXCEL_PATH = path.join(
  DATA_DIR,
  'task_activity.xlsx',
);

const SHEET_NAME = 'Task Activity';

const COLUMNS = [
  {header: 'Event ID', key: 'eventId', width: 45},
  {header: 'Timestamp (UTC)', key: 'timestamp', width: 30},
  {header: 'Task ID', key: 'taskId', width: 42},
  {header: 'Task Title', key: 'title', width: 40},
  {header: 'Action', key: 'action', width: 18},
  {header: 'User ID', key: 'userId', width: 25},
  {header: 'Platform', key: 'source', width: 18},
];

// Serialize writes within this Node.js process
let writeQueue = Promise.resolve();

function queueWrite(operation) {
  const next = writeQueue.then(operation);

  // Keep the queue usable after an error
  writeQueue = next.catch(() => {});

  return next;
}

function createWorkbook() {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = 'TodoList Backend';

  const sheet = workbook.addWorksheet(SHEET_NAME);

  sheet.columns = COLUMNS;

  sheet.getRow(1).font = {
    bold: true,
    color: {argb: 'FFFFFFFF'},
  };

  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {argb: 'FF2563EB'},
  };

  sheet.views = [
    {state: 'frozen', ySplit: 1},
  ];

  sheet.autoFilter = {
    from: 'A1',
    to: 'G1',
  };

  return workbook;
}

function appendRow(sheet, event) {
  sheet.addRow({
    eventId: event.eventId,
    timestamp: event.timestamp,
    taskId: event.id,
    title: event.title,
    action: event.action,
    userId: event.userId,
    source: event.source,
  });
}

async function loadWorkbook() {
  await fs.mkdir(DATA_DIR, {recursive: true});

  const workbook = new ExcelJS.Workbook();

  try {
    await fs.access(EXCEL_PATH);
    await workbook.xlsx.readFile(EXCEL_PATH);

    if (!workbook.getWorksheet(SHEET_NAME)) {
      throw new Error('Excel activity worksheet is missing');
    }

    return workbook;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    return createWorkbook();
  }
}

// Append one event after InfluxDB write succeeds
async function logEventToExcel(event) {
  return queueWrite(async () => {
    const workbook = await loadWorkbook();
    const sheet = workbook.getWorksheet(SHEET_NAME);

    // Avoid duplicate rows when retrying a log operation
    let alreadyLogged = false;

    sheet.getColumn(1).eachCell(
      {includeEmpty: false},
      cell => {
        if (cell.value === event.eventId) {
          alreadyLogged = true;
        }
      },
    );

    if (!alreadyLogged) {
      appendRow(sheet, event);
      await workbook.xlsx.writeFile(EXCEL_PATH);
    }

    console.log(
      `[Excel] ${event.action}: ${event.title}`,
    );

    return EXCEL_PATH;
  });
}

// Rebuild Excel using InfluxDB as the source of truth
async function rebuildExcel(events) {
  return queueWrite(async () => {
    await fs.mkdir(DATA_DIR, {recursive: true});

    const workbook = createWorkbook();
    const sheet = workbook.getWorksheet(SHEET_NAME);

    for (const event of events) {
      appendRow(sheet, event);
    }

    await workbook.xlsx.writeFile(EXCEL_PATH);

    console.log(
      `[Excel] Rebuilt ${events.length} event rows`,
    );

    return EXCEL_PATH;
  });
}

module.exports = {
  EXCEL_PATH,
  logEventToExcel,
  rebuildExcel,
};
