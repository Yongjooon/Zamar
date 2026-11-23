import { deleteAccount, listAccounts, provisionAccount } from '../server/accounts.js';
import { requireAdmin, route } from '../server/http.js';

export default route(['GET', 'POST', 'DELETE'], async (firebase, request) => {
  const adminUid = await requireAdmin(firebase, request);
  if (request.method === 'GET') return listAccounts(firebase.db, request.query?.after);
  if (request.method === 'POST') {
    return provisionAccount(firebase, {
      loginId: request.body?.loginId,
      name: request.body?.name,
      role: 'user',
      password: process.env.ZAMAR_INITIAL_PASSWORD,
    });
  }
  await deleteAccount(firebase, request.body?.uid, adminUid);
  return { ok: true };
});
