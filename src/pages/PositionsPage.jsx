import Icon from '../components/Icon.jsx';

export default function PositionsPage({ week, result }) {
  const positions = result?.entries ?? [];

  return (
    <section className="card positionsCard" aria-labelledby="assignments-heading">
      <div className="cardHead">
        <h2 id="assignments-heading">담당자 배정</h2>
        {positions.length > 0 && <span className="countLabel">{positions.length}개 포지션</span>}
      </div>
      {positions.length > 0 && (
        <ul className="positionList">
          {positions.map((position) => (
            <li key={position.id}>
              <span className="positionIcon"><Icon name={/보컬|싱어|vocal|singer/i.test(position.role) ? 'mic' : 'music'} /></span>
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
