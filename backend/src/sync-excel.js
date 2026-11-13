
require('dotenv').config();

const {getEvents} = require('./influx');

const {
  rebuildExcel,
  EXCEL_PATH,
} = require('./excel');

async function main() {
  try {
    console.log('Reading events from InfluxDB Cloud...');

    const events = await getEvents();

    console.log(`Found ${events.length} events`);

    await rebuildExcel(events);

    console.log('Excel synchronization completed.');
    console.log(`File: ${EXCEL_PATH}`);
  } catch (error) {
    console.error('Excel synchronization failed:', error);
    process.exitCode = 1;
  }
}

void main();
