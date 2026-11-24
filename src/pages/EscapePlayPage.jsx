import { useCallback, useState } from 'react';
import Icon from '../components/Icon.jsx';
import QrCamera from '../components/QrCamera.jsx';

export default function EscapePlayPage() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [result, setResult] = useState(null);

  const onResult = useCallback((value) => {
    setResult(value);
    setCameraOpen(false);
  }, []);

  return (
    <main className="escapePage escapePlayPage" aria-label="자마르 방탈출 게임">
      <a className="escapeBack" href="#/escape">← 처음으로</a>
      <div className="escapeGame">
        <div className="escapeCode" role="group" aria-label="아직 발견하지 못한 네 자리 숫자">
          {[0, 1, 2, 3].map((digit) => <span key={digit} aria-hidden="true">?</span>)}
        </div>
        <img className="escapePath" src="/escape-path.png" width="1536" height="1024"
          alt="등불을 든 탐험가 캐릭터가 어두운 숲속의 구불구불한 길을 따라 걸어가는 모습" />
        <button className="escapeCapture" type="button" onClick={() => setCameraOpen(true)}>
          <Icon name="camera" />촬영하기
        </button>
        {result !== null && (
          <section className="escapeScanResult" role="status" aria-label="QR 코드 인식 결과">
            <strong>QR 코드를 인식했습니다</strong>
            <p>{result}</p>
          </section>
        )}
      </div>
      {cameraOpen && <QrCamera onClose={() => setCameraOpen(false)} onResult={onResult} />}
    </main>
  );
}
