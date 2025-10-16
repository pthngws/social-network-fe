import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postService } from '../services/postService';
import Modal from './UI/Modal';
import Card from './UI/Card';
import Input from './UI/Input';
import Button from './UI/Button';
import Alert from './UI/Alert';
import CreatePostModal from './CreatePostModal';
import MediaPreviewModal from './MediaPreviewModal';
import { useApiLoading } from '../hooks/useApiLoading';
import {
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/solid';
import { FaReply } from 'react-icons/fa';
import { IoSend } from 'react-icons/io5';
import { FaRegComment } from "react-icons/fa6";

const Post = ({ post }) => {
  const [reactionType, setReactionType] = useState(post.reactionType || null);
  const [reactionCounts, setReactionCounts] = useState(post.reactionCounts || {});
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [showReplies, setShowReplies] = useState({});
  const [showComments, setShowComments] = useState(false);
  const { startLoading, stopLoading } = useApiLoading();
  const currentUserId = Number(localStorage.getItem('userId'));
  const [previewMedia, setPreviewMedia] = useState({ isOpen: false, url: '', type: '' });
  const reactionMenuTimeout = useRef(null);

  // Emoji 3D từ Google Noto Emoji
  const reactionEmojis = {
    ICON_LIKE: '/emojis/iconlike.png',
    LIKE: '/emojis/like.svg',
    LOVE: '/emojis/love.svg',
    CARE: '/emojis/care.svg',
    HAHA: '/emojis/haha.svg',
    WOW: '/emojis/wow.svg',
    SAD: '/emojis/sad.svg',
    ANGRY: '/emojis/angry.svg',
  };

  const reactionLabels = {
    LIKE: 'Thích',
    LOVE: 'Yêu thích',
    CARE: 'Thương thương',
    HAHA: 'Haha',
    WOW: 'Wow',
    SAD: 'Buồn',
    ANGRY: 'Phẫn nộ',
  };

  const reactionColors = {
    LIKE: 'text-blue-500',
    CARE: 'text-yellow-500',
    LOVE: 'text-red-500', // ❤️ Màu đỏ
    HAHA: 'text-yellow-500', // 😂 Màu vàng
    WOW: 'text-yellow-500', // 😮 Màu tím
    SAD: 'text-yellow-500', // 😢 Màu xanh lam
    ANGRY: 'text-orange-500', // 😣 Màu cam
  };

  const timeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return date.toLocaleString();
  };

  const handleReact = async (type) => {
    try {
      await postService.reactPost(post.id, type);
      if (reactionType === type) {
        setReactionType(null);
        setReactionCounts({
          ...reactionCounts,
          [type]: (reactionCounts[type] || 1) - 1,
        });
      } else {
        const newReactionCounts = { ...reactionCounts };
        if (reactionType) {
          newReactionCounts[reactionType] = (newReactionCounts[reactionType] || 1) - 1;
        }
        newReactionCounts[type] = (newReactionCounts[type] || 0) + 1;
        setReactionType(type);
        setReactionCounts(newReactionCounts);
      }
      setShowReactionMenu(false);
    } catch (err) {
      setAlert({ show: true, type: 'error', message: 'Lỗi phản ứng bài viết' });
    }
  };

  const handleLikeClick = async () => {
    if (reactionType) {
      await handleReact(reactionType);
    } else {
      await handleReact('LIKE');
    }
  };

  const handleMouseEnter = () => {
    console.log('Mouse entered');
    if (reactionMenuTimeout.current) {
      clearTimeout(reactionMenuTimeout.current);
    }
    setShowReactionMenu(true);
  };

  const handleMouseLeave = () => {
    reactionMenuTimeout.current = setTimeout(() => {
      setShowReactionMenu(false);
    }, 200); // Delay 200ms
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
      startLoading();
      await postService.deletePost(post.id);
      setAlert({ show: true, type: 'success', message: 'Xóa bài viết thành công!' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setAlert({ show: true, type: 'error', message: 'Lỗi xóa bài viết' });
    } finally {
      stopLoading();
    }
  };

  const handlePostUpdated = () => {
    window.location.reload();
  };

  const handleReport = async () => {
    const reason = document.querySelector('input[name="reportReason"]:checked')?.value;
    if (reason) {
      try {
        startLoading();
        await postService.reportPost({ title: reason, postId: post.id });
        setAlert({ show: true, type: 'success', message: 'Báo cáo thành công!' });
        setShowReportModal(false);
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
      } catch (err) {
        setAlert({ show: true, type: 'error', message: 'Lỗi báo cáo' });
      } finally {
        stopLoading();
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

  const handleMediaClick = (mediaUrl, mediaType) => {
    setPreviewMedia({
      isOpen: true,
      url: mediaUrl,
      type: mediaType,
    });
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

  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + (count || 0), 0);
  const sortedReactions = Object.entries(reactionCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type);

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
            src={post.authorImageUrl || '/default-avatar.png'}
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
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2 mt-2">
            {post.mediaUrls.map((mediaUrl) => {
              const mediaType = mediaUrl.split('.').pop().toLowerCase();
              const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
              const isImage = imageExtensions.includes(mediaType);

              return (
                <div
                  key={mediaUrl}
                  className="overflow-hidden rounded-lg"
                  onClick={() => handleMediaClick(mediaUrl, isImage ? 'image' : 'video')}
                >
                  {isImage ? (
                    <img
                      src={mediaUrl}
                      alt="Media"
                      className="w-full h-full object-cover rounded-lg transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        console.error('Image load failed:', mediaUrl);
                        e.target.src = '/fallback-image.png';
                      }}
                    />
                  ) : (
                    <video
                      src={mediaUrl}
                      className="w-full h-full object-cover rounded-lg"
                      controls
                      onError={(e) => console.error('Video load failed:', mediaUrl)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reaction Counts */}
      {totalReactions > 0 && (
        <div className="px-4 py-2 flex items-center space-x-1">
          <div className="flex">
            {sortedReactions.map((type, index) => (
              <div
                key={type}
                className="relative"
                style={{ zIndex: sortedReactions.length - index, marginLeft: index > 0 ? '-8px' : '0' }}
              >
                <img
                  src={type === 'LIKE' ? '/emojis/like.png' : reactionEmojis[type]}
                  alt={type}
                  className="w-5 h-5"
                />
              </div>
            ))}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{totalReactions}</span>
        </div>
      )}

      {/* Interaction Bar */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
        <div
          className="relative pointer-events-auto"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            className={`flex items-center space-x-2 text-lg font-medium ${reactionType ? reactionColors[reactionType] : 'text-gray-500 dark:text-gray-400'} hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg px-4 py-2 transition-all duration-200`}
            onClick={handleLikeClick}
            aria-label="React to post"
          >
            {reactionType ? (
              <img src={reactionEmojis[reactionType]} alt={reactionType} className="w-6 h-6" />
            ) : (
              <img src={reactionEmojis.ICON_LIKE} alt="LIKE" className="w-6 h-6" />
            )}
            <span>{reactionType ? reactionLabels[reactionType] : 'Thích'}</span>
          </button>
          <AnimatePresence>
            {showReactionMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute -top-20 left-0 flex space-x-3 p-3 rounded-lg shadow-lg border bg-white dark:bg-gray-700 z-[3000]"
                style={{
                  minHeight: 60,
                  border: '2px solid #e5e7eb',
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {['LIKE', 'LOVE', 'CARE', 'HAHA', 'WOW', 'SAD', 'ANGRY'].map((type) => (
                  <div
                    key={type}
                    className="relative cursor-pointer"
                    onClick={() => handleReact(type)}
                  >
                    <div className="w-12 h-12 hover:scale-125 transition-transform duration-200 flex items-center justify-center">
                      <img
                        src={reactionEmojis[type]}
                        alt={type}
                        className="w-10 h-10"
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          className="flex items-center space-x-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg px-3 py-2 transition-all duration-200"
          onClick={handleToggleComments}
          aria-label="Toggle comments"
        >
          <FaRegComment className="h-6 w-6" />
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

      {/* Media Preview Modal */}
      <MediaPreviewModal
        isOpen={previewMedia.isOpen}
        onClose={() => setPreviewMedia({ isOpen: false, url: '', type: '' })}
        mediaUrl={previewMedia.url}
        mediaType={previewMedia.type}
      />
    </Card>
  );
};

export default Post;