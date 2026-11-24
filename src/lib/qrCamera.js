export function cameraErrorMessage(error) {
  switch (error?.name) {
    case 'NotAllowedError':
      return '카메라 권한이 필요합니다. 브라우저의 사이트 설정에서 카메라를 허용한 뒤 다시 촬영해 주세요.';
    case 'NotFoundError':
      return '연결된 카메라를 찾지 못했습니다. 카메라가 있는 기기에서 다시 시도해 주세요.';
    case 'NotReadableError':
      return '카메라를 사용할 수 없습니다. 다른 앱에서 사용 중인지 확인해 주세요.';
    case 'SecurityError':
      return '카메라는 HTTPS 연결에서 사용할 수 있습니다. 보안 연결로 접속해 주세요.';
    case 'NotSupportedError':
      return '이 브라우저에서는 카메라를 사용할 수 없습니다. Safari 또는 Chrome에서 열어 주세요.';
    default:
      return error?.message || '카메라 연결에 실패했습니다. 닫은 뒤 다시 촬영해 주세요.';
  }
}

// Decode frames locally. No camera images or QR contents are uploaded.
export async function scanQrCamera(video, { signal, onResult, onError }) {
  if (signal.aborted) return () => {};
  if (!window.isSecureContext) throw new DOMException('', 'SecurityError');
  if (!navigator.mediaDevices?.getUserMedia) throw new DOMException('', 'NotSupportedError');

  let stream;
  let timer;
  let stopped = false;

  function stop() {
    stopped = true;
    window.clearTimeout(timer);
    stream?.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
    signal.removeEventListener('abort', stop);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pagehide', stop);
  }

  function onVisibilityChange() {
    if (document.hidden && !stopped) {
      stop();
      onError(new Error('카메라가 중지되었습니다. 닫은 뒤 다시 촬영해 주세요.'));
    }
  }

  signal.addEventListener('abort', stop, { once: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', stop, { once: true });

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    // The permission dialog can resolve after the scanner was closed.
    if (stopped) { stop(); return stop; }
    video.srcObject = stream;
    await video.play();
    if (stopped) return stop;

    const { default: decode } = await import('jsqr');
    if (stopped) return stop;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('카메라 영상을 읽을 수 없습니다. 다른 브라우저에서 시도해 주세요.');

    function scan() {
      if (stopped) return;
      try {
        if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {
          const scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
          canvas.width = Math.round(video.videoWidth * scale);
          canvas.height = Math.round(video.videoHeight * scale);
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = decode(frame.data, frame.width, frame.height, { inversionAttempts: 'attemptBoth' });
          if (code?.data) {
            stop();
            onResult(code.data);
            return;
          }
        }
        timer = window.setTimeout(scan, 200);
      } catch (error) {
        stop();
        onError(error);
      }
    }

    timer = window.setTimeout(scan, 0);
    return stop;
  } catch (error) {
    stop();
    if (!signal.aborted) throw error;
    return stop;
  }
}
