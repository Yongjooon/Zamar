import { createComment, createPost, listComments, listPosts } from '../server/board.js';
import { HttpError, requireActiveUser, route } from '../server/http.js';

export default route(['GET', 'POST'], async (firebase, request) => {
  await requireActiveUser(firebase, request);
  const { db } = firebase;
  if (request.method === 'GET') {
    const { postId, after } = request.query ?? {};
    return postId === undefined ? listPosts(db, after) : listComments(db, postId, after);
  }
  const { type, postId, text } = request.body ?? {};
  if (type === 'post') return { post: await createPost(db, text) };
  if (type === 'comment') return { comment: await createComment(db, postId, text) };
  throw new HttpError(400, '글 또는 댓글을 선택해 주세요.');
});
