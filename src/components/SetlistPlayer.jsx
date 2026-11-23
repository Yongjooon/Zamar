import { useEffect, useRef, useState } from 'react';
import { loadYouTubePlayer, youtubeUrl } from '../lib/youtube.js';
import Icon from './Icon.jsx';

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
    <div className="setlistGrid">
      <section className="card playerCard" aria-label="YouTube 재생">
        <div className="videoFrame">
          <div className="videoPlaceholder"><Icon name="play" /></div>
          <div className="videoHost" ref={host} />
        </div>
        <div className="padded formStack">
          <h2>{songs[selected].title}</h2>
          {!ready && !message && <p className="weekHint" role="status">플레이어를 불러오는 중…</p>}
          {message && <p className="formError" role="status">{message}</p>}
          <div className="actionRow playerActions">
            <button className="iconBtn" aria-label="이전 곡" type="button" onClick={() => play(selected - 1)} disabled={!ready || selected === 0}><Icon name="chevLeft" /></button>
            <button className="iconBtn" aria-label="다음 곡" type="button" onClick={() => play(selected + 1)} disabled={!ready || selected === songs.length - 1}><Icon name="chevRight" /></button>
            <a className="textBtn" href={youtubeUrl(songs[selected].videoId)} target="_blank" rel="noreferrer">YouTube에서 열기<Icon name="external" /></a>
          </div>
        </div>
      </section>
      <section className="card playlistCard">
        <div className="cardHead"><h2>재생목록</h2><span className="countLabel">{songs.length}곡</span></div>
        <ol className="songList">
          {songs.map((song, index) => (
            <li key={song.id}>
              <button className="songButton" type="button" disabled={!ready}
                aria-current={index === selected ? 'true' : undefined} onClick={() => play(index)}>
                <span className="songNumber">{index + 1}</span>
                <span className="songTitle">{song.title}</span>
                <Icon name={index === selected ? 'music' : 'play'} />
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
