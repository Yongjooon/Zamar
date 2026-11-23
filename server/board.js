import { createHash } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { postExpiration } from '../shared/retention.js';
import { HttpError } from './http.js';
import { removeExpired } from './retention.js';

const PAGE_SIZE = 20;
const DOC_ID = /^[A-Za-z0-9]{20}$/;
const EXPIRED_MESSAGE = '글이 삭제되었거나 보관 기간이 지났습니다.';

function postRef(db, id) {
  if (typeof id !== 'string' || !DOC_ID.test(id)) throw new HttpError(400, '올바른 글을 선택해 주세요.');
  return db.collection('boardPosts').doc(id);
}

function assertVisible(snapshot, now) {
  if (!snapshot.exists || snapshot.data().expiresAt.toMillis() <= now.getTime()) {
    throw new HttpError(404, EXPIRED_MESSAGE);
  }
}

function content(value, maximum) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || text.length > maximum) throw new HttpError(400, '내용을 1~' + maximum + '자로 입력해 주세요.');
  return text;
}

// Scope the ownership marker to one post and keep it out of API responses.
function ownerKey(postId, uid) {
  return createHash('sha256').update(postId + ':' + uid).digest('hex');
}

function describePost(snapshot, uid) {
  const post = snapshot.data();
  return {
    id: snapshot.id, text: post.text, createdAt: post.createdAt.toMillis(),
    expiresAt: post.expiresAt.toMillis(), commentCount: post.commentCount,
    canDelete: post.ownerKey === ownerKey(snapshot.id, uid),
  };
}

function describeComment(snapshot) {
  const comment = snapshot.data();
  return { id: snapshot.id, text: comment.text, createdAt: comment.createdAt.toMillis() };
}

async function page(collection, query, cursor) {
  if (cursor !== undefined) {
    if (typeof cursor !== 'string' || !DOC_ID.test(cursor)) throw new HttpError(400, '다음 페이지를 찾을 수 없습니다.');
    const previous = await collection.doc(cursor).get();
    if (!previous.exists) throw new HttpError(409, '목록이 갱신되었습니다. 새로고침해 주세요.');
    query = query.startAfter(previous);
  }
  const snapshot = await query.limit(PAGE_SIZE + 1).get();
  const docs = snapshot.docs.slice(0, PAGE_SIZE);
  return { docs, next: snapshot.size > PAGE_SIZE ? docs.at(-1).id : null };
}

export async function listPosts(db, uid, cursor) {
  const posts = db.collection('boardPosts');
  const now = Timestamp.now();
  const query = posts.where('expiresAt', '>', now).orderBy('expiresAt', 'desc');
  const { docs, next } = await page(posts, query, cursor);
  return { posts: docs.map((snapshot) => describePost(snapshot, uid)), next };
}

export async function listComments(db, id, cursor) {
  const ref = postRef(db, id);
  assertVisible(await ref.get(), new Date());
  const comments = ref.collection('comments');
  const { docs, next } = await page(comments, comments.orderBy('createdAt', 'desc'), cursor);
  assertVisible(await ref.get(), new Date());
  return { comments: docs.map(describeComment), next };
}

export async function createPost(db, uid, value) {
  const text = content(value, 1000);
  const now = new Date();
  const createdAt = Timestamp.fromDate(now);
  const expiresAt = Timestamp.fromDate(postExpiration(now));
  const ref = db.collection('boardPosts').doc();
  await ref.create({ text, createdAt, expiresAt, commentCount: 0, ownerKey: ownerKey(ref.id, uid) });
  return { id: ref.id, text, createdAt: createdAt.toMillis(), expiresAt: expiresAt.toMillis(), commentCount: 0, canDelete: true };
}

export async function createComment(db, id, value) {
  const ref = postRef(db, id);
  const text = content(value, 500);
  const comment = ref.collection('comments').doc();
  return db.runTransaction(async (transaction) => {
    const post = await transaction.get(ref);
    const now = new Date();
    assertVisible(post, now);
    transaction.create(comment, { text, createdAt: Timestamp.fromDate(now) });
    transaction.update(ref, { commentCount: FieldValue.increment(1) });
    return { id: comment.id, text, createdAt: now.getTime() };
  });
}

export async function deletePost(db, uid, id) {
  const ref = postRef(db, id);
  const now = Timestamp.now();
  await db.runTransaction(async (transaction) => {
    const post = await transaction.get(ref);
    if (!post.exists) throw new HttpError(404, EXPIRED_MESSAGE);
    if (post.data().ownerKey !== ownerKey(ref.id, uid)) {
      throw new HttpError(403, '본인이 작성한 글만 삭제할 수 있습니다.');
    }
    if (post.data().expiresAt.toMillis() > now.toMillis()) {
      transaction.update(ref, { expiresAt: now });
    }
  });

  // Expiring first prevents new replies and lets the scheduled cleanup resume if needed.
  try {
    await removeExpired(db, ref, (post) => post.expiresAt.toMillis() <= now.toMillis(), ['comments']);
  } catch (error) {
    console.error('Board cleanup deferred', error.code ?? error.name);
  }
  return { deleted: true };
}
