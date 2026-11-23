import Icon from '../components/Icon.jsx';

const positionIcons = [
  [/인도자|예배 인도|worship leader|conductor/i, 'conductor'],
  [/싱어|보컬|찬양대|singer|vocal/i, 'mic'],
  [/신디|신시|synth/i, 'synth'],
  [/피아노|건반|키보드|piano|keyboard/i, 'piano'],
  [/드럼|drum|percussion/i, 'drum'],
  [/베이스|bass/i, 'bass'],
  [/어쿠스틱|통기타|acoustic/i, 'acousticGuitar'],
  [/일렉|기타|electric|guitar/i, 'electricGuitar'],
  [/엔지니어|음향|믹서|engineer|audio|sound/i, 'mixer'],
  [/ppt|미디어|자막|영상|media|slides/i, 'presentation'],
  [/회중|성도|congregation/i, 'people'],
];

export default function PositionsPage({ week, result }) {
  const positions = result?.entries ?? [];

  return (
    <section className="card positionsCard" aria-labelledby="assignments-heading">
      <div className="cardHead">
        <h2 id="assignments-heading">포지션</h2>
        {positions.length > 0 && <span className="countLabel">{positions.length}개 포지션</span>}
      </div>
      {positions.length > 0 && (
        <ul className="positionList">
          {positions.map((position) => (
            <li key={position.id}>
              <span className="positionIcon"><Icon name={positionIcons.find(([pattern]) => pattern.test(position.role))?.[1] ?? 'music'} /></span>
              <div className="positionText">
                <span className="roleName">{position.role}</span>
                <strong className="personName">{position.assignees.join(' · ') || '미배정'}</strong>
              </div>
            </li>
          ))}
        </ul>
      )}
      {positions.length === 0 && (
        <div className={result?.error ? 'empty formError' : 'empty'} role={result?.error ? 'alert' : 'status'}>
          <span className="emptyIcon"><Icon name="positions" /></span>
          {result?.error ?? (week && !result ? '배정 정보를 불러오는 중…' : '등록된 배정이 없습니다.')}
        </div>
      )}
    </section>
  );
}
