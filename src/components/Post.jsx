import React, { useState } from 'react';
import { postService } from '../services/postService';
import Modal from './ui/Modal';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Alert from './ui/Alert';
import CreatePostModal from './CreatePostModal';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/solid';
import { FaReply} from 'react-icons/fa';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import { IoSend } from "react-icons/io5";

const Post = ({ post }) => {
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likedByCount);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' }); // New alert state
  const [showReplies, setShowReplies] = useState({});
  const [showComments, setShowComments] = useState(false);
  const currentUserId = Number(localStorage.getItem('userId'));

  const timeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return date.toLocaleString();
  };

  const handleLike = async () => {
    try {
      await postService.likePost(post.id);
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    } catch (err) {
      setAlert({ show: true, type: 'error', message: 'Lỗi thích bài viết' });
    }
  };

  const handleComment = async () => {
    if (commentText.trim()) {
      try {
        await postService.commentPost(post.id, { content: commentText });
        setCommentText('');
        fetchComments();
      } catch (err) {
        setAlert({ show: true, type: 'error', message: 'Lỗi bình luận' });
      }
    }
  };

  const handleReply = async (parentCommentId) => {
    if (replyText.trim()) {
      try {
        await postService.replyComment(post.id, {
          content: replyText,
          parentCommentId,
        });
        setReplyText('');
        setReplyingTo(null);
        fetchComments();
      } catch (err) {
        setAlert({ show: true, type: 'error', message: 'Lỗi trả lời bình luận' });
      }
    }
  };

  const fetchComments = async () => {
    try {
      const response = await postService.getComments(post.id);
      if (response.data.status === 200) {
        setComments(response.data.data);
      }
    } catch (err) {
      setAlert({ show: true, type: 'error', message: 'Lỗi lấy bình luận' });
    }
  };

  const handleDeleteComment = async (commentId) => {
    setAlert({ show: true, type: 'warning', message: 'Bạn có chắc chắn muốn xóa bình luận này?' });
    try {
      await postService.deleteComment(commentId);
      fetchComments();
      setAlert({ show: true, type: 'success', message: 'Xóa bình luận thành công!' });
      setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
    } catch (err) {
      setAlert({ show: true, type: 'error', message: 'Lỗi xóa bình luận' });
    }
  };

  const handleDeletePost = async () => {
    setAlert({ show: true, type: 'warning', message: 'Bạn có chắc chắn muốn xóa bài viết này?' });
    try {
      await postService.deletePost(post.id);
      setAlert({ show: true, type: 'success', message: 'Xóa bài viết thành công!' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setAlert({ show: true, type: 'error', message: 'Lỗi xóa bài viết' });
    }
  };

  const handlePostUpdated = () => {
    window.location.reload();
  };

  const handleReport = async () => {
    const reason = document.querySelector('input[name="reportReason"]:checked')?.value;
    if (reason) {
      try {
        await postService.reportPost({ title: reason, postId: post.id });
        setAlert({ show: true, type: 'success', message: 'Báo cáo thành công!' });
        setShowReportModal(false);
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
      } catch (err) {
        setAlert({ show: true, type: 'error', message: 'Lỗi báo cáo' });
      }
    } else {
      setAlert({ show: true, type: 'error', message: 'Vui lòng chọn lý do báo cáo' });
    }
  };

  const toggleReplies = (commentId) => {
    setShowReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleToggleComments = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const renderComments = (comments, parentId = null) => {
    return comments
      .filter((comment) => (comment.replyId || null) === parentId)
      .map((comment) => {
        const replies = comments.filter((reply) => reply.replyId === comment.id);
        const isRepliesVisible = showReplies[comment.id] || false;

        return (
          <div key={comment.id} className="relative flex mb-1 mt-2">
            <div className={`relative mr-2 ${parentId ? 'ml-6' : 'ml-0'}`}>
              <img
                src={comment.imageUrl || '/default-avatar.png'}
                alt={comment.authorName}
                className="w-6 h-6 rounded-full object-cover"
              />
              {replies.length > 0 && isRepliesVisible && (
                <div
                  className="absolute left-[10px] top-6 w-4 h-4 border-l-2 border-b-2 border-gray-200 dark:border-gray-600"
                  style={{ borderBottomRightRadius: '8px' }}
                />
              )}
            </div>
            <div className="flex-1">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 max-w-[80%]">
                <div className="flex items-center justify-between">
                  <a
                    href={`/${comment.authorId}`}
                    className="font-semibold text-xs text-gray-900 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400"
                  >
                    {comment.authorName}
                  </a>
                  
                </div>
                <p className="text-xs text-gray-900 dark:text-gray-200 leading-tight max-w-full break-words mt-0.5">
                  {comment.replyAuthorName && comment.replyAuthorId && (
                    <a
                      href={`/${comment.replyAuthorId}`}
                      className="text-blue-500 dark:text-blue-400 font-medium hover:underline mr-1"
                    >
                      @{comment.replyAuthorName}
                    </a>
                  )}
                  {comment.content}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-0.5 ml-2">
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  {timeAgo(comment.timestamp)}
                </span>
                <button
                  className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 text-[11px] flex items-center"
                  onClick={() => setReplyingTo(comment.id)}
                >
                  <FaReply className="h-3 w-3 mr-1" />
                  Trả lời
                </button>
                {replies.length > 0 && (
                  <button
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 text-[11px] flex items-center"
                    onClick={() => toggleReplies(comment.id)}
                  >
                    {isRepliesVisible ? 'Ẩn' : `${replies.length} trả lời`}
                  </button>
                )}
                {comment.authorId === currentUserId && (
                    <button
                    className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-500 text-[11px] flex items-center"   
                      onClick={() => handleDeleteComment(comment.id)}
                      aria-label="Delete comment"
                    >
                      Xóa
                    </button>
                  )}
              </div>
              {replyingTo === comment.id && (
                <div className="flex items-center mt-1 ml-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 max-w-[80%]">
                  <Input
                    as="textarea"
                    rows="1"
                    placeholder={`Trả lời ${comment.authorName}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-gray-900 dark:text-gray-200 border-none focus:ring-0 focus:outline-none py-1 px-2 resize-none"
                  />
                  <button
                    className="bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg px-5 py-2 ml-3 text-sm transition-all duration-200"
                    onClick={() => handleReply(comment.id)}
                  >
                    <IoSend />
                  </button>
                </div>
              )}
              {isRepliesVisible && renderComments(comments, comment.id)}
            </div>
          </div>
        );
      });
  };

  return (
    <Card className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      {/* Alert Display */}
      {alert.show && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ show: false, type: '', message: '' })}
          className="mx-4 mt-2"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <img
            src={post.imageUrl || '/default-avatar.png'}
            alt="User"
            className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 dark:border-blue-400"
          />
          <div>
            <a
              href={`/${post.authorId}`}
              className="font-semibold text-lg text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              {post.authorName}
            </a>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{timeAgo(post.timestamp)}</p>
          </div>
        </div>
        {currentUserId && (
          <div className="relative group">
            <button
              className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full p-2"
              aria-label="Post options"
            >
              <EllipsisHorizontalIcon className="h-6 w-6" />
            </button>
            <div className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300 z-20">
              {post.authorId === currentUserId ? (
                <>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-lg"
                    onClick={() => setShowEditModal(true)}
                  >
                    Chỉnh sửa bài viết
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-b-lg"
                    onClick={handleDeletePost}
                  >
                    Xóa bài viết
                  </button>
                </>
              ) : (
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                  onClick={() => setShowReportModal(true)}
                >
                  Báo cáo bài viết
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-base text-gray-900 dark:text-gray-200 leading-relaxed mb-4">{post.content}</p>
        {post.media && post.media.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2 mt-2">
            {post.media.map((mediaItem) => {
              const mediaUrl = mediaItem.media.url;
              const mediaType = mediaUrl.split('.').pop().toLowerCase();
              return mediaType === 'jpg' || mediaType === 'jpeg' || mediaType === 'png' ? (
                <div key={mediaUrl} className=" overflow-hidden rounded-lg aspect-w-16 aspect-h-9">
                  <img
                    src={mediaUrl}
                    alt="Media"
                    className="w-full h-full object-contain rounded-lg transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div key={mediaUrl} className="relative overflow-hidden rounded-lg aspect-w-16 aspect-h-9">
                  <video
                    src={mediaUrl}
                    controls
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interaction Bar */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
        <button
          className={`flex items-center space-x-2 text-base font-medium ${liked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'} hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg px-3 py-2 transition-all duration-200`}
          onClick={handleLike}
          aria-label="Like post"
        >
          {liked ? (
            <HeartIcon className="h-6 w-6" />
          ) : (
            <HeartOutlineIcon className="h-6 w-6" />
          )}
          <span>Thích {likeCount > 0 ? `(${likeCount})` : ''}</span>
        </button>
        <button
          className="flex items-center space-x-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg px-3 py-2 transition-all duration-200"
          onClick={handleToggleComments}
          aria-label="Toggle comments"
        >
          <ChatBubbleLeftIcon className="h-6 w-6" />
          <span>Bình luận {comments.length > 0 ? `(${comments.length})` : ''}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 shadow-sm">
            <Input
              as="textarea"
              rows="3"
              placeholder="Viết bình luận của bạn..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-transparent text-base text-gray-900 dark:text-gray-200 border-none focus:ring-0 focus:outline-none py-2 px-4 resize-none"
            />
            <button
              className="bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg px-5 py-2 ml-3 text-sm transition-all duration-200"
              onClick={handleComment}
            >
             <IoSend />
            </button>
          </div>
          {renderComments(comments)}
        </div>
      )}

      {/* Edit Post Modal */}
      <CreatePostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onPostCreated={handlePostUpdated}
        post={post}
        isEditMode={true}
      />

      {/* Report Post Modal */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)}>

          <h5 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Báo cáo bài viết</h5>
          <div className="mb-4">
            <label className="block font-semibold text-sm text-gray-900 dark:text-white mb-2">
              Chọn lý do báo cáo:
            </label>
            {['Spam', 'Bạo lực', 'Quấy rối'].map((reason) => (
  <label key={reason} className="flex items-center mb-2 text-sm text-gray-900 dark:text-white cursor-pointer">
    <input
      type="radio"
      name="reportReason"
      value={reason.toLowerCase()}
      className="hidden peer"
    />
    <div className="w-4 h-4 rounded-full border-2 border-gray-400 peer-checked:border-blue-500 peer-checked:bg-blue-500 mr-2"></div>
    {reason}
  </label>
))}

          </div>
          <div className="flex justify-end gap-3">
            <Button
              className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg px-5 py-2 text-sm transition-all duration-200"
              onClick={() => setShowReportModal(false)}
            >
              Đóng
            </Button>
            <Button
              className="bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg px-5 py-2 text-sm transition-all duration-200"
              onClick={handleReport}
            >
              Gửi báo cáo
            </Button>
          </div>

      </Modal>
    </Card>
  );
};

export default Post;