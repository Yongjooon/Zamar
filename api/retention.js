import { HttpError, route } from '../server/http.js';
import { pruneExpired } from '../server/retention.js';

export default route(['GET'], async ({ db }, request) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.authorization !== 'Bearer ' + secret) {
    throw new HttpError(401, 'Unauthorized');
  }
  const removed = await pruneExpired(db);
  console.info('Expired Zamar data removed', removed);
  return { removed };
});
