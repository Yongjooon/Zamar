import { useState } from 'react';
import { signIn } from '../lib/session.js';

export default function LoginPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const { loginId, password } = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError('');
    try {
      await signIn(loginId, password);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="loginShell">
      <div className="loginLayout">
        <div className="loginBrand">
          <span className="brandMark" aria-hidden="true">Z<span>.</span></span>
          <strong>Zamar</strong>
          <p>찬양팀</p>
        </div>
        <section className="loginCard">
          <h1>로그인</h1>
          <p className="weekHint">팀 계정으로 로그인하세요.</p>
          <form className="formStack" onSubmit={submit}>
            <label>아이디<input className="input" name="loginId" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={40} required /></label>
            <label>비밀번호<input className="input" name="password" type="password" autoComplete="current-password" maxLength={128} required /></label>
            {error && <p className="formError" role="alert">{error}</p>}
            <button className="primaryBtn" type="submit" disabled={busy}>{busy ? '처리 중…' : '로그인'}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
