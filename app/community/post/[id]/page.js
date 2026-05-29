"use client";

import { use, useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import MobileNav from "../../../components/MobileNav";
import ThemeToggle from "../../../components/ThemeToggle"
import ProfileHoverCard from "../../../components/ProfileHoverCard"
import { Skeleton } from "../../../components/Skeleton"

export default function PostDetail({ params }) {
  const { id } = use(params);
  const [user, setUser] = useState(null);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [deleteCommentConfirm, setDeleteCommentConfirm] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      await fetchPost();
      await fetchComments();
      await fetchLikes(user.id);
      setLoading(false);
    };
    init();
  }, [id]);

  const fetchPost = async () => {
    const { data } = await supabase.from("posts").select("*").eq("id", id).single();
    if (data) setPost(data);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments").select("*").eq("post_id", String(id))
      .order("created_at", { ascending: true });
    if (data) setComments(data);
  };

  const fetchLikes = async (userId) => {
    const { data } = await supabase.from("likes").select("*").eq("user_id", String(userId));
    if (data) setLikes(data);
  };

  const handleLike = async () => {
    if (!post) return;
    const alreadyLiked = likes.some(l => l.post_id === String(post.id));
    if (alreadyLiked) {
      await supabase.from("likes").delete().eq("user_id", String(user.id)).eq("post_id", String(post.id));
      await supabase.from("posts").update({ likes: Math.max((post.likes || 1) - 1, 0) }).eq("id", post.id);
    } else {
      await supabase.from("likes").insert([{ user_id: String(user.id), post_id: String(post.id) }]);
      await supabase.from("posts").update({ likes: (post.likes || 0) + 1 }).eq("id", post.id);
      if (String(post.user_id) !== String(user.id)) {
        await supabase.from("notifications").insert([{
          user_id: String(post.user_id),
          type: "like",
          message: (user.user_metadata?.username || user.email) + " liked your post",
          is_read: false,
          link: "/community/post/" + post.id,
        }]);
      }
    }
    await fetchPost();
    await fetchLikes(user.id);
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    const currentUsername = user.user_metadata?.username || user.email;
    await supabase.from("comments").insert([{
      user_id: String(user.id),
      post_id: String(post.id),
      username: currentUsername,
      content: commentText,
    }]);
    if (post && String(post.user_id) !== String(user.id)) {
      await supabase.from("notifications").insert([{
        user_id: String(post.user_id),
        type: "comment",
        message: currentUsername + " replied: \"" + commentText.slice(0, 40) + "\"",
        is_read: false,
        link: "/community/post/" + post.id,
      }]);
      fetch("/api/send-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: post.user_id,
          title: "MatrixVerse",
          body: currentUsername + " replied to your post",
          url: "/community/post/" + post.id,
        }),
      }).catch(() => {});
    }
    setCommentText("");
    await fetchComments();
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentText("");
  };

  const saveEditComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    await supabase.from("comments").update({ content: editCommentText }).eq("id", commentId);
    setEditingCommentId(null);
    setEditCommentText("");
    await fetchComments();
  };

  const executeDeleteComment = async (commentId) => {
    await supabase.from("comments").delete().eq("id", commentId);
    setDeleteCommentConfirm(null);
    await fetchComments();
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return seconds + "s ago";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
    return Math.floor(seconds / 86400) + "d ago";
  };

  const isLiked = () => likes.some(l => l.post_id === String(post?.id));
  const username = user?.user_metadata?.username || user?.email;
  const commentCount = comments.length;

  if (loading) return (
    <main className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-2xl px-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </main>
  );

  if (!post) return (
    <main className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center">
      <p className="text-[var(--text-muted)]">Post not found.</p>
    </main>
  );

  return (
    <main className="bg-[var(--bg-primary)] min-h-screen">
      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-[var(--accent-blue)] font-bold text-xl">MatrixVerse</a>
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <a href="/community" className="text-[var(--accent-blue)] text-sm font-semibold hover:underline">← Back to Feed</a>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 pb-24">

        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <ProfileHoverCard username={post.username}>
                <a href={"/profile/" + post.username}>
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-blue)] flex items-center justify-center text-[var(--bg-primary)] font-bold text-sm overflow-hidden">
                    {post.username?.charAt(0).toUpperCase()}
                  </div>
                </a>
              </ProfileHoverCard>
              <div>
                <ProfileHoverCard username={post.username}>
                  <a href={"/profile/" + post.username} className="text-[var(--text-primary)] font-semibold text-sm hover:text-[var(--accent-blue)] transition-colors">
                    @{post.username}
                  </a>
                </ProfileHoverCard>
                <div className="text-[var(--text-muted)] text-xs">{getTimeAgo(post.created_at)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {post.pair_tag && (
                <span className="bg-[var(--accent-blue-bg)] text-[var(--accent-blue)] text-xs font-bold px-2 py-1 rounded-full">{post.pair_tag}</span>
              )}
              <span className="text-xs font-bold px-2 py-1 rounded-full" style={{
                backgroundColor: ({
                  "Trade Setup": "#00D4FF", "Market Analysis": "#7C3AED",
                  "Profit Update": "#00FF88", "Psychology": "#FFD700",
                  "Educational": "#FF6B35", "Meme": "#FF4757",
                }[post.post_type] || "#8B949E") + "20",
                color: ({
                  "Trade Setup": "#00D4FF", "Market Analysis": "#7C3AED",
                  "Profit Update": "#00FF88", "Psychology": "#FFD700",
                  "Educational": "#FF6B35", "Meme": "#FF4757",
                }[post.post_type] || "#8B949E"),
              }}>
                {post.post_type}
              </span>
            </div>
          </div>

          <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">{post.content}</p>

          {post.image_url && (
            <img src={post.image_url} alt="Trade chart" className="w-full rounded-xl mb-4 border border-[var(--border)]" />
          )}

          <div className="flex items-center gap-4 pt-3 border-t border-[var(--border)]">
            <button onClick={handleLike} className="flex items-center gap-1.5 group">
              <span className={"text-lg transition-transform group-hover:scale-110 " + (isLiked() ? "text-[var(--accent-red)]" : "text-[var(--text-muted)] group-hover:text-[var(--accent-red)]")}>
                {isLiked() ? "❤️" : "🤍"}
              </span>
              <span className={"text-xs font-semibold " + (isLiked() ? "text-[var(--accent-red)]" : "text-[var(--text-muted)]")}>
                {post.likes || 0}
              </span>
            </button>
            <div className="flex items-center gap-1.5 text-[var(--accent-blue)]">
              <span className="text-lg">💬</span>
              <span className="text-xs font-semibold">{commentCount} {commentCount === 1 ? "reply" : "replies"}</span>
            </div>
          </div>
        </div>

        <h3 className="text-[var(--text-primary)] font-bold text-lg mb-4">Replies ({commentCount})</h3>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-full bg-[var(--accent-purple)] flex items-center justify-center text-[var(--text-primary)] font-bold text-xs flex-shrink-0 overflow-hidden">
            {username?.charAt(0).toUpperCase()}
          </div>
          <input
            type="text"
            placeholder="Write a reply..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleComment()}
            className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[#8B949E] rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
          />
          <button
            onClick={handleComment}
            disabled={!commentText.trim()}
            className="bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-4 py-2 rounded-full text-xs hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-40"
          >
            Reply
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {comments.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm text-center py-8">No replies yet. Be the first to reply!</p>
          ) : (
            comments.map((comment, i) => {
              const isOwnComment = String(comment.user_id) === String(user.id);
              return (
                <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <ProfileHoverCard username={comment.username}>
                      <a href={"/profile/" + comment.username}>
                        <div className="w-8 h-8 rounded-full bg-[var(--accent-purple)] flex items-center justify-center text-[var(--text-primary)] font-bold text-xs flex-shrink-0 overflow-hidden">
                          {comment.username?.charAt(0).toUpperCase()}
                        </div>
                      </a>
                    </ProfileHoverCard>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ProfileHoverCard username={comment.username}>
                            <a href={"/profile/" + comment.username} className="text-[var(--accent-blue)] text-xs font-bold hover:underline">
                              @{comment.username}
                            </a>
                          </ProfileHoverCard>
                          <span className="text-[var(--text-muted)] text-[10px]">{getTimeAgo(comment.created_at)}</span>
                        </div>
                        {isOwnComment && editingCommentId !== comment.id && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button onClick={() => startEditComment(comment)} className="text-[var(--text-muted)] hover:text-[var(--accent-blue)] text-xs transition-colors">Edit</button>
                            {deleteCommentConfirm === comment.id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => executeDeleteComment(comment.id)} className="text-[var(--accent-red)] text-xs font-bold hover:underline">Delete</button>
                                <button onClick={() => setDeleteCommentConfirm(null)} className="text-[var(--text-muted)] text-xs hover:text-[var(--text-primary)]">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteCommentConfirm(comment.id)} className="text-[var(--text-muted)] hover:text-[var(--accent-red)] text-xs transition-colors">Delete</button>
                            )}
                          </div>
                        )}
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="flex items-center gap-2 mt-1.5">
                          <input
                            type="text"
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveEditComment(comment.id)}
                            className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
                            autoFocus
                          />
                          <button onClick={() => saveEditComment(comment.id)} className="text-[var(--accent-green)] text-xs font-bold hover:underline">Save</button>
                          <button onClick={cancelEditComment} className="text-[var(--text-muted)] text-xs hover:text-[var(--text-primary)]">Cancel</button>
                        </div>
                      ) : (
                        <p className="text-[var(--text-secondary)] text-sm leading-relaxed mt-1">{comment.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <MobileNav username={username} />
    </main>
  );
}
