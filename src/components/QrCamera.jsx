import { useEffect, useRef, useState } from 'react';
import { cameraErrorMessage, scanQrCamera } from '../lib/qrCamera.js';
import Modal from './Modal.jsx';

export default function QrCamera({ onClose, onResult }) {
  const video = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    scanQrCamera(video.current, {
      signal: controller.signal,
      onResult,
      onError: (error) => { if (!controller.signal.aborted) setError(cameraErrorMessage(error)); },
    }).then(() => {
      if (!controller.signal.aborted) setReady(true);
    }).catch((error) => {
      if (!controller.signal.aborted) setError(cameraErrorMessage(error));
    });
    return () => controller.abort();
  }, [onResult]);

  return (
    <Modal title="QR 코드 촬영" className="qrDialog" showCloseButton={false} onClose={onClose}>
      <div className="qrViewfinder">
        <video ref={video} autoPlay muted playsInline aria-label="QR 코드 인식용 카메라 미리보기" />
        {!error && <div className="qrGuide" aria-hidden="true" />}
      </div>
      {error
        ? <p className="formError" role="alert">{error}</p>
        : <p className="weekHint" role="status">{ready ? 'QR 코드를 사각형 안에 맞춰 주세요. 인식하면 자동으로 닫힙니다.' : '카메라 연결 중… 권한 요청이 나오면 허용해 주세요.'}</p>}
      <button className="ghostBtn" type="button" onClick={onClose}>촬영 닫기</button>
    </Modal>
  );
}
