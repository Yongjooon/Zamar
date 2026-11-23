import { useEffect, useRef, useState } from 'react';
import { loadYouTubePlayer, youtubeUrl } from '../lib/youtube.js';

export default function SetlistPlayer({ songs, playlistKey }) {
  const host = useRef(null);
  const player = useRef(null);
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    let instance;
    const wrapper = host.current;
    const videoIds = playlistKey.split(',');
    loadYouTubePlayer().then((yt) => {
      if (!active) return;
      const frame = document.createElement('div');
      wrapper.append(frame);
      instance = new yt.Player(frame, {
        videoId: videoIds[0],
        playerVars: { playsinline: 1, origin: window.location.origin },
        events: {
          onReady(event) {
            if (!active) return;
            player.current = event.target;
            event.target.getIframe().title = 'Setlist YouTube 플레이어';
            event.target.cuePlaylist(videoIds, 0);
            setReady(true);
          },
          onStateChange(event) {
            if (!active || event.data !== yt.PlayerState.PLAYING) return;
            const index = event.target.getPlaylistIndex();
            if (index >= 0 && index < videoIds.length) setSelected(index);
            setMessage('');
          },
          onAutoplayBlocked() {
            if (active) setMessage('플레이어의 재생 버튼을 눌러 주세요.');
          },
          onError(event) {
            if (!active) return;
            const index = event.target.getPlaylistIndex();
            if (index >= 0 && index < videoIds.length) setSelected(index);
            setMessage('이 영상은 앱에서 재생할 수 없습니다. YouTube에서 열어 주세요.');
          },
        },
      });
    }).catch((error) => {
      if (active) setMessage(error.message);
    });

    return () => {
      active = false;
      player.current = null;
      instance?.destroy();
      wrapper.replaceChildren();
    };
  }, [playlistKey]);

  function play(index) {
    if (!ready || index < 0 || index >= songs.length) return;
    setSelected(index);
    setMessage('');
    player.current.playVideoAt(index);
  }

  return (
    <div className="padded formStack">
      <div className="videoFrame" ref={host} />
      {!ready && !message && <p className="weekHint" role="status">플레이어를 불러오는 중…</p>}
      {message && <p className="formError" role="status">{message}</p>}
      <div className="actionRow">
        <button className="ghostBtn" type="button" onClick={() => play(selected - 1)} disabled={!ready || selected === 0}>이전 곡</button>
        <button className="ghostBtn" type="button" onClick={() => play(selected + 1)} disabled={!ready || selected === songs.length - 1}>다음 곡</button>
        <a className="textBtn" href={youtubeUrl(songs[selected].videoId)} target="_blank" rel="noreferrer">YouTube에서 열기</a>
      </div>
      <ol className="songList">
        {songs.map((song, index) => (
          <li key={song.id}>
            <button className={'row songButton' + (index === selected ? ' selected' : '')} type="button" disabled={!ready} aria-current={index === selected ? 'true' : undefined} onClick={() => play(index)}>
              <span>{index + 1}. {song.title}</span><span aria-hidden="true">▶</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
