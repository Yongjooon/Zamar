import { readFile } from 'node:fs/promises';
import { getFirebaseAdmin } from '../server/firebase-admin.js';
import { isSunday, isTimeZone, MAX_ASSIGNEES, MAX_ENTRIES } from '../shared/team.js';

function text(value, limit) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= limit;
}

try {
  const source = JSON.parse(await readFile(new URL('../src/data/Data.json', import.meta.url), 'utf8'));
  if (!text(source.teamName, 80) || !isTimeZone(source.timezone) || !Array.isArray(source.weeks)) {
    throw new Error('Verify the team name, timezone and weeks in Data.json.');
  }
  const dates = new Set();
  const weeks = source.weeks.map(({ sunday, positions, setlist }) => {
    if (!isSunday(sunday) || dates.has(sunday) || !Array.isArray(positions) || positions.length > MAX_ENTRIES) {
      throw new Error('Invalid or duplicate week in Data.json: ' + sunday);
    }
    dates.add(sunday);
    if (!Array.isArray(setlist) || setlist.some((song) => song !== '(coming soon)')) {
      throw new Error('Review the existing Setlist entries before importing ' + sunday);
    }
    const roles = new Set();
    const assignments = positions.map(({ role, person, people }, order) => {
      const assignees = Array.isArray(people) ? people : person ? [person] : [];
      if (!text(role, 60) || roles.has(role) ||
          assignees.length > MAX_ASSIGNEES || assignees.some((name) => !text(name, 60))) {
        throw new Error('Invalid position in Data.json: ' + sunday);
      }
      roles.add(role);
      return { role, assignees, order };
    });
    return { sunday, assignments };
  });
  const count = weeks.reduce((sum, week) => sum + week.assignments.length, 0);
  console.log('Validated ' + weeks.length + ' weeks and ' + count + ' assignments.');

  if (process.argv.includes('--apply')) {
    const { db } = getFirebaseAdmin();
    const teamRef = db.collection('config').doc('team');
    await db.runTransaction(async (transaction) => {
      if (!(await transaction.get(teamRef)).exists) {
        transaction.create(teamRef, { teamName: source.teamName, timezone: source.timezone });
      }
    });
    let added = 0;
    for (const { sunday, assignments } of weeks) {
      const weekRef = db.collection('weeks').doc(sunday);
      const created = await db.runTransaction(async (transaction) => {
        if ((await transaction.get(weekRef)).exists) return false;
        transaction.create(weekRef, {
          sunday, positionCount: assignments.length, positionsRevision: 0, songsRevision: 0,
        });
        assignments.forEach((position, index) => {
          transaction.create(weekRef.collection('positions').doc('p' + (index + 1)), position);
        });
        return true;
      });
      if (created) added += 1;
    }
    console.log('Imported ' + added + ' weeks; skipped ' + (weeks.length - added) + ' existing weeks.');
  } else {
    console.log('Dry run. Add --apply to write to Firebase.');
  }
} catch (error) {
  console.error('Data import failed:', error.code ?? error.message);
  process.exitCode = 1;
}
