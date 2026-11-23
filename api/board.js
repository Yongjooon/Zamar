import { createComment, createPost, deletePost, listComments, listPosts } from '../server/board.js';
import { HttpError, requireActiveUser, route } from '../server/http.js';

export default route(['GET', 'POST', 'DELETE'], async (firebase, request) => {
  const { uid } = await requireActiveUser(firebase, request);
  const { db } = firebase;
  if (request.method === 'GET') {
    const { postId, after } = request.query ?? {};
    return postId === undefined ? listPosts(db, uid, after) : listComments(db, postId, after);
  }
  const { type, postId, text } = request.body ?? {};
  if (request.method === 'DELETE') return deletePost(db, uid, postId);
  if (type === 'post') return { post: await createPost(db, uid, text) };
  if (type === 'comment') return { comment: await createComment(db, postId, text) };
  throw new HttpError(400, '글 또는 댓글을 선택해 주세요.');
});
