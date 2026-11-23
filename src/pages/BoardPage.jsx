import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/session.js';

const formatDate = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});

function getPage(query, signal) {
  const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value));
  return apiRequest('/api/board?' + params, { authorized: true, signal });
}

function BoardDate({ value }) {
  const date = new Date(value);
  return <time dateTime={date.toISOString()}>{formatDate.format(date)}</time>;
}

function Comments({ postId, onAdded }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const request = new AbortController();
    getPage({ postId }, request.signal).then(setResult).catch((error) => {
      if (!request.signal.aborted) setError(error.message);
    });
    return () => request.abort();
  }, [postId]);

  async function more() {
    if (!result?.next || busy) return;
    setBusy(true);
    setError('');
    try {
      const next = await getPage({ postId, after: result.next });
      setResult({ comments: [...result.comments, ...next.comments], next: next.next });
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function postComment(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const text = new FormData(form).get('text').trim();
    if (!text || busy) return;
    setBusy(true);
    setError('');
    try {
      const { comment } = await apiRequest('/api/board', {
        authorized: true, method: 'POST', data: { type: 'comment', postId, text },
      });
      setResult((current) => ({ ...current, comments: [comment, ...(current?.comments ?? [])] }));
      onAdded();
      form.reset();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="formStack boardComments" aria-label="익명 댓글 목록">
      {!result && !error && <p className="weekHint" role="status">댓글을 불러오는 중…</p>}
      {result?.comments.length === 0 && <p className="weekHint">등록된 댓글이 없습니다.</p>}
      {result?.comments.map((comment) => (
        <div key={comment.id} className="boardComment">
          <div className="boardMeta"><strong>익명</strong><BoardDate value={comment.createdAt} /></div>
          <p className="bubbleText">{comment.text}</p>
        </div>
      ))}
      {result?.next && <button className="ghostBtn" type="button" onClick={more} disabled={busy}>이전 댓글 더 보기</button>}
      {error && <p className="formError" role="alert">{error}</p>}
      {result && (
        <form className="formStack" onSubmit={postComment}>
          <label>익명 댓글<textarea className="input boardInput" name="text" rows={2} maxLength={500} required /></label>
          <button className="ghostBtn" type="submit" disabled={busy}>댓글 달기</button>
        </form>
      )}
    </section>
  );
}

export default function BoardPage({ now }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [openPost, setOpenPost] = useState(null);

  useEffect(() => {
    const request = new AbortController();
    getPage({}, request.signal).then(setResult).catch((error) => {
      if (!request.signal.aborted) setError(error.message);
    });
    return () => request.abort();
  }, []);

  async function refresh(after) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await getPage({ after });
      if (!after) {
        setResult(response);
      } else {
        setResult((current) => {
          const existing = new Set(current.posts.map(({ id }) => id));
          const posts = response.posts.filter(({ id }) => !existing.has(id));
          return { posts: [...current.posts, ...posts], next: response.next };
        });
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function postMessage(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const text = new FormData(form).get('text').trim();
    if (!text || busy) return;
    setBusy(true);
    setError('');
    try {
      const { post } = await apiRequest('/api/board', { authorized: true, method: 'POST', data: { type: 'post', text } });
      setResult((current) => ({ posts: [post, ...(current?.posts ?? [])], next: current?.next ?? null }));
      form.reset();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  function commentAdded(id) {
    setResult((current) => current && ({
      ...current,
      posts: current.posts.map((post) => post.id === id ? { ...post, commentCount: post.commentCount + 1 } : post),
    }));
  }

  const posts = result?.posts.filter((post) => post.expiresAt > now.getTime()) ?? [];

  return (
    <section className="card scrollCard">
      <div className="cardHead">
        <h2>익명 게시판</h2>
        <button className="ghostBtn" type="button" onClick={() => refresh()} disabled={busy || (!result && !error)}>새로고침</button>
      </div>
      <div className="formStack padded">
        <p className="weekHint">글과 댓글은 익명으로 표시되며, 게시글 작성 한 달 뒤 글과 댓글이 함께 자동 삭제됩니다.</p>
        <form className="formStack" onSubmit={postMessage}>
          <label>익명 글<textarea className="input boardInput" name="text" rows={3} maxLength={1000} required /></label>
          <button className="primaryBtn" type="submit" disabled={busy || (!result && !error)}>글 올리기</button>
        </form>
        {error && <p className="formError" role="alert">{error}</p>}
        {!result && !error && <p className="weekHint" role="status">글을 불러오는 중…</p>}
        {result && posts.length === 0 && <p className="weekHint">등록된 글이 없습니다.</p>}
        {posts.map((post) => (
          <article key={post.id} className="bubble formStack">
            <div className="boardMeta"><strong>익명</strong><BoardDate value={post.createdAt} /></div>
            <p className="bubbleText">{post.text}</p>
            <button type="button" className="ghostBtn" aria-expanded={openPost === post.id} onClick={() => setOpenPost(openPost === post.id ? null : post.id)}>
              {openPost === post.id ? '댓글 닫기' : '댓글 ' + post.commentCount + '개'}
            </button>
            {openPost === post.id && <Comments postId={post.id} onAdded={() => commentAdded(post.id)} />}
          </article>
        ))}
        {result?.next && <button className="ghostBtn" type="button" onClick={() => refresh(result.next)} disabled={busy}>이전 글 더 보기</button>}
      </div>
    </section>
  );
}
