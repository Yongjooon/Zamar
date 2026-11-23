const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  'youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com',
  'youtube-nocookie.com', 'www.youtube-nocookie.com',
]);

export function getVideoId(value) {
  try {
    const url = new URL(value.trim());
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    const [, first, second] = url.pathname.split('/');
    let id;
    if (url.hostname === 'youtu.be') id = first;
    else if (YOUTUBE_HOSTS.has(url.hostname)) {
      if (first === 'watch') id = url.searchParams.get('v');
      else if (['shorts', 'live', 'embed'].includes(first)) id = second;
    }
    return id && VIDEO_ID.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function youtubeUrl(id) {
  return 'https://www.youtube.com/watch?v=' + id;
}

let iframeApi;

export function loadYouTubePlayer() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  iframeApi ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = window.setTimeout(fail, 15000);
    const previous = window.onYouTubeIframeAPIReady;

    function restore() {
      window.clearTimeout(timeout);
      window.onYouTubeIframeAPIReady = previous;
    }

    function fail() {
      script.remove();
      restore();
      iframeApi = null;
      reject(new Error('YouTube 플레이어에 연결하지 못했습니다.'));
    }

    window.onYouTubeIframeAPIReady = () => {
      restore();
      resolve(window.YT);
      previous?.();
    };
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = fail;
    document.head.append(script);
  });
  return iframeApi;
}
