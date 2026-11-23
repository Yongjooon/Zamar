import { Timestamp } from 'firebase-admin/firestore';
import { weekRetentionCutoff } from '../shared/retention.js';

const CHILD_BATCH_SIZE = 200;
const PARENT_BATCH_SIZE = 8;
const WORK_TIME_MS = 18000;

export async function removeExpired(db, ref, stillExpired, childCollections) {
  return db.runTransaction(async (transaction) => {
    const parent = await transaction.get(ref);
    if (!parent.exists || !stillExpired(parent.data())) return 0;
    const children = await Promise.all(childCollections.map((name) =>
      transaction.get(ref.collection(name).limit(CHILD_BATCH_SIZE))));
    for (const group of children) {
      for (const item of group.docs) transaction.delete(item.ref);
    }
    // Keep the parent discoverable until all of its children have been removed.
    if (children.some((group) => group.size === CHILD_BATCH_SIZE)) return 0;
    transaction.delete(ref);
    return 1;
  });
}

async function prune(db, query, stillExpired, childCollections, deadline) {
  let deleted = 0;
  while (Date.now() < deadline) {
    const expired = await query.limit(PARENT_BATCH_SIZE).get();
    if (expired.empty) break;
    const counts = await Promise.all(expired.docs.map(({ ref }) =>
      removeExpired(db, ref, stillExpired, childCollections)));
    deleted += counts.reduce((sum, count) => sum + count, 0);
    if (expired.size < PARENT_BATCH_SIZE && counts.every(Boolean)) break;
  }
  return deleted;
}

export async function pruneExpired(db, now = new Date()) {
  const cutoff = weekRetentionCutoff(now);
  const expiresBy = Timestamp.fromDate(now);
  const deadline = Date.now() + WORK_TIME_MS;
  const weeksQuery = db.collection('weeks').where('sunday', '<', cutoff).orderBy('sunday');
  const postsQuery = db.collection('boardPosts').where('expiresAt', '<=', expiresBy).orderBy('expiresAt');
  const [weeks, posts] = await Promise.all([
    prune(db, weeksQuery, (week) => week.sunday < cutoff, ['positions', 'songs'], deadline),
    prune(db, postsQuery, (post) => post.expiresAt.toMillis() <= now.getTime(), ['comments'], deadline),
  ]);
  return { weeks, posts };
}
