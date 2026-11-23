import Icon from '../components/Icon.jsx';
import SetlistPlayer from '../components/SetlistPlayer.jsx';
import { formatSundayLabel } from '../lib/date.js';

export default function SetlistPage({ week, result, onEdit }) {
  const songs = result?.entries ?? [];
  const playlistKey = songs.map(({ videoId }) => videoId).join(',');

  return (
    <section className="card scrollCard">
      <div className="cardHead">
        <div>
          <div className="weekLabel">{week ? formatSundayLabel(week.sunday) : '-'}</div>
          <div className="weekHint">선택한 주차의 재생목록</div>
        </div>
        {week && onEdit && <button className="ghostBtn" type="button" onClick={onEdit}>편집</button>}
      </div>
      {songs.length > 0 && <SetlistPlayer key={playlistKey} playlistKey={playlistKey} songs={songs} />}
      {songs.length === 0 && (
        <div className="empty" role="status">
          <div className="emptyIcon"><Icon name="music" /></div>
          <div className="emptyTitle">{result?.error ?? (week && !result ? '곡 목록을 불러오는 중…' : '등록된 곡이 없습니다.')}</div>
        </div>
      )}
    </section>
  );
}
