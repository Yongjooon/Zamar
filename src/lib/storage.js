import seedData from '../data/Data.json';

// Read-only data for the Positions/Setlist pages.
// (Chat is stored separately in localStorage per week.)

export function loadData() {
  return structuredClone(seedData);
}
