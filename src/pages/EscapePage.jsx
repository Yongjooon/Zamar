export default function EscapePage() {
  return (
    <main className="escapePage" aria-labelledby="escape-title">
      <a className="escapeBack" href="#/">← Zamar로 돌아가기</a>
      <div className="escapeMessage">
        <h1 id="escape-title">자마르 방탈출</h1>
        <a className="escapeStart" href="#/escape/play" lang="en">start<span aria-hidden="true"> →</span></a>
      </div>
    </main>
  );
}
