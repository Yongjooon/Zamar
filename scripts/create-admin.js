import { provisionAccount } from '../server/accounts.js';
import { getFirebaseAdmin } from '../server/firebase-admin.js';

try {
  const [loginId, name] = process.argv.slice(2);
  const password = process.env.ZAMAR_ADMIN_PASSWORD ?? process.env.ZAMAR_INITIAL_PASSWORD;
  const { account } = await provisionAccount(getFirebaseAdmin(), { loginId, name, role: 'admin', password });
  console.log('Administrator ' + account.loginId + ' created in ' + process.env.FIREBASE_PROJECT_ID + '.');
} catch (error) {
  console.error('Administrator creation failed:', error.code ?? error.message);
  process.exitCode = 1;
}
