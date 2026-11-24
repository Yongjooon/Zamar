import { loadEscapeProgress, updateEscapeProgress } from '../server/escape.js';
import { requireActiveUser, route } from '../server/http.js';

export default route(['GET', 'POST'], async (firebase, request) => {
  const { uid } = await requireActiveUser(firebase, request);
  return request.method === 'GET'
    ? loadEscapeProgress(firebase.db, uid)
    : updateEscapeProgress(firebase.db, uid, request.body);
});
