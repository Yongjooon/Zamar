import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import Modal from '../components/Modal.jsx';
import QrCamera from '../components/QrCamera.jsx';
import { apiRequest } from '../lib/session.js';

const scenes = [
  { src: '/escape-path.png', alt: '탐험가가 등불을 들고 숲속 길을 따라 출발하는 모습' },
  { src: '/escape-stage-1.png', alt: '숲의 끝에서 멀리 있는 교회를 발견한 탐험가' },
  { src: '/escape-stage-2.png', alt: '초원을 지나 교회에 더 가까워진 탐험가' },
  { src: '/escape-stage-3.png', alt: '교회 앞마당에 도착해 입구로 걸어가는 탐험가' },
  { src: '/escape-stage-4.png', alt: '따뜻한 빛이 새어 나오는 교회 문 앞에 도착한 탐험가' },
];

export default function EscapePlayPage() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [progress, setProgress] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const working = useRef(false);
  const requestVersion = useRef(0);

  const refresh = useCallback(async (signal) => {
    const version = ++requestVersion.current;
    const result = await apiRequest('/api/escape', { authorized: true, signal });
    if (version === requestVersion.current) setProgress(result.progress);
  }, []);

  useEffect(() => {
    const request = new AbortController();
    function reload() {
      if (working.current || document.hidden) return;
      refresh(request.signal).catch((error) => {
        if (!request.signal.aborted) setError(error.message);
      });
    }
    reload();
    window.addEventListener('focus', reload);
    document.addEventListener('visibilitychange', reload);
    return () => {
      request.abort();
      window.removeEventListener('focus', reload);
      document.removeEventListener('visibilitychange', reload);
    };
  }, [refresh]);

  const round = progress?.round;
  const save = useCallback(async (action, code) => {
    if (working.current || round === undefined) return;
    working.current = true;
    requestVersion.current++;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await apiRequest('/api/escape', {
        authorized: true, method: 'POST', data: { action, code, round },
      });
      setProgress(result.progress);
      setNotice(action === 'reset' ? '새로운 여정을 시작합니다.' : result.alreadyFound ? '이미 찾은 QR 코드입니다. 다른 QR 코드를 찾아보세요.' : '새로운 숫자를 찾았습니다!');
    } catch (error) {
      // Reload after ambiguous failures or a reset in another tab/device.
      try { await refresh(); } catch { /* Keep the last confirmed state. */ }
      setError(error.message);
    } finally {
      working.current = false;
      setBusy(false);
    }
  }, [round, refresh]);

  const onResult = useCallback((value) => {
    setCameraOpen(false);
    void save('scan', value);
  }, [save]);

  const digits = progress?.digits ?? ['?', '?', '?', '?'];
  const scene = scenes[progress?.found ?? 0];

  return (
    <main className="escapePage escapePlayPage" aria-label="자마르 방탈출 게임">
      <a className="escapeBack" href="#/escape">← 처음으로</a>
      <div className="escapeGame">
        <div className="escapeCode" role="group" aria-label={'발견한 숫자: ' + digits.join(' ')}>
          {digits.map((digit, index) => <span key={index} className={digit !== '?' ? 'isRevealed' : undefined} aria-hidden="true">{digit}</span>)}
        </div>
        <img className="escapePath" src={scene.src} width="1536" height="1024" alt={scene.alt} />
        <p className="escapeProgress" role="status">{busy ? '계정에 저장하는 중…' : progress ? `${progress.found} / 4 · 교회를 향한 여정` : '저장된 진행 상태를 불러오는 중…'}</p>
        <button className="escapeCapture" type="button" disabled={!progress || busy || progress.complete} onClick={() => { setError(''); setNotice(''); setCameraOpen(true); }}>
          <Icon name="camera" />촬영하기
        </button>
        {notice && <p className="escapeNotice" role="status">{notice}</p>}
        {error && !progress?.complete && <p className="formError" role="alert">{error}</p>}
        {!progress && error && <button className="ghostBtn" type="button" onClick={() => {
          setError('');
          refresh().catch((error) => setError(error.message));
        }}>다시 불러오기</button>}
      </div>
      {cameraOpen && !progress?.complete && <QrCamera onClose={() => setCameraOpen(false)} onResult={onResult} />}
      {progress?.complete && (
        <Modal title="축하합니다!" className="escapeComplete" dismissible={false} showCloseButton={false}>
          <div className="escapeCompleteMessage">
            <Icon name="check" />
            <p>네 자리 숫자를 모두 찾고<br />교회에 도착했습니다!</p>
            <strong>{digits.join('')}</strong>
            <p className="weekHint">확인을 누르면 처음부터 다시 시작합니다.</p>
          </div>
          {error && <p className="formError" role="alert">{error}</p>}
          <button className="primaryBtn" type="button" disabled={busy} onClick={() => save('reset')}>{busy ? '초기화 중…' : '확인'}</button>
        </Modal>
      )}
    </main>
  );
}
