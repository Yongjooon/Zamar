import { useState } from 'react';
import { MIN_PASSWORD_LENGTH } from '../../shared/identity.js';
import { changePassword } from '../lib/session.js';

export default function PasswordPage({ onToast }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const { current, password, confirm } = Object.fromEntries(new FormData(form));
    setBusy(true);
    setError('');
    try {
      if (password !== confirm) throw new Error('새 비밀번호가 서로 다릅니다.');
      await changePassword(current, password);
      form.reset();
      onToast('비밀번호를 변경했습니다.');
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card scrollCard">
      <div className="cardHead"><h2>비밀번호 변경</h2></div>
      <form className="formStack padded" onSubmit={submit}>
        <label>현재 비밀번호<input className="input" name="current" type="password" autoComplete="current-password" required /></label>
        <label>새 비밀번호<input className="input" name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} maxLength={128} required /></label>
        <label>새 비밀번호 확인<input className="input" name="confirm" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} maxLength={128} required /></label>
        {error && <p className="formError" role="alert">{error}</p>}
        <button className="primaryBtn" type="submit" disabled={busy}>{busy ? '변경 중…' : '변경'}</button>
      </form>
    </section>
  );
}
