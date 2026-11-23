import Icon from '../components/Icon.jsx';
import SetlistPlayer from '../components/SetlistPlayer.jsx';

export default function SetlistPage({ week, result }) {
  const songs = result?.entries ?? [];
  const playlistKey = songs.map(({ videoId }) => videoId).join(',');

  if (songs.length > 0) return <SetlistPlayer key={playlistKey} playlistKey={playlistKey} songs={songs} />;

  return (
    <section className="card">
      <div className="cardHead"><h2>재생목록</h2></div>
      <div className={result?.error ? 'empty formError' : 'empty'} role={result?.error ? 'alert' : 'status'}>
        <span className="emptyIcon"><Icon name="music" /></span>
        {result?.error ?? (week && !result ? '곡 목록을 불러오는 중…' : '등록된 곡이 없습니다.')}
      </div>
    </section>
  );
}
