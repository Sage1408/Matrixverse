"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import MobileNav from "../components/MobileNav";
import ThemeToggle from "../components/ThemeToggle"
import ProfileHoverCard from "../components/ProfileHoverCard"
import { Skeleton, SkeletonCard, SkeletonText } from "../components/Skeleton"

export default function CommunityClient() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showComments, setShowComments] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("latest");
  const [copied, setCopied] = useState(null);
  const [image, setImage] = useState(null);
  const [form, setForm] = useState({
    content: "",
    pair_tag: "",
    post_type: "Trade Setup",
  });
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      await fetchPosts();
      await fetchLikes(user.id);
      await fetchComments();
      await fetchFollowing(user);
    };
    init();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts").select("*")
      .order("created_at", { ascending: false });
    if (data) setPosts(data);
  };

  const fetchLikes = async (userId) => {
    const { data } = await supabase
      .from("likes").select("*").eq("user_id", String(userId));
    if (data) setLikes(data);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments").select("*")
      .order("created_at", { ascending: true });
    if (data) setComments(data);
  };

  const fetchFollowing = async (user) => {
    const currentUsername = user.user_metadata?.username || user.email;
    const { data } = await supabase
      .from("follows").select("following_username")
      .eq("follower_username", currentUsername);
    if (data) setFollowing(data.map(f => f.following_username));
  };

  const sendNotification = async (toUserId, type, message, link) => {
    if (!toUserId || toUserId === String(user.id)) return;
    await supabase.from("notifications").insert([{
      user_id: String(toUserId),
      type,
      message,
      is_read: false,
      link,
    }]);

    fetch("/api/send-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: toUserId,
        title: "MatrixVerse",
        body: message,
        url: link || "/",
      }),
    }).catch(() => {});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let imageUrl = null;
    if (image) {
      const fileExt = image.name.split(".").pop();
      const fileName = user.id + "_" + Date.now() + "." + fileExt;
      const { error: uploadError } = await supabase.storage
        .from("screenshots").upload(fileName, image);
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("screenshots").getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
    }
    await supabase.from("posts").insert([{
      user_id: String(user.id),
      username: user.user_metadata?.username || user.email,
      content: form.content,
      image_url: imageUrl,
      pair_tag: form.pair_tag,
      post_type: form.post_type,
      likes: 0,
      is_repost: false,
      repost_from: null,
    }]);
    setShowModal(false);
    setImage(null);
    setForm({ content: "", pair_tag: "", post_type: "Trade Setup" });
    await fetchPosts();
    setLoading(false);
  };

  const handleLike = async (post) => {
    const postIdStr = String(post.id);
    const userIdStr = String(user.id);
    const alreadyLiked = likes.some(l => l.post_id === postIdStr);
    const currentUsername = user.user_metadata?.username || user.email;
    if (alreadyLiked) {
      await supabase.from("likes").delete().eq("user_id", userIdStr).eq("post_id", postIdStr);
      await supabase.from("posts").update({ likes: Math.max((post.likes || 1) - 1, 0) }).eq("id", post.id);
    } else {
      await supabase.from("likes").insert([{ user_id: userIdStr, post_id: postIdStr }]);
      await supabase.from("posts").update({ likes: (post.likes || 0) + 1 }).eq("id", post.id);
      await sendNotification(post.user_id, "like", currentUsername + " liked your post: \"" + post.content.slice(0, 40) + "...\"", "/community?post=" + post.id);
    }
    await fetchPosts();
    await fetchLikes(user.id);
  };

  const handleComment = async (postId) => {
    if (!commentText.trim()) return;
    const currentUsername = user.user_metadata?.username || user.email;
    const post = posts.find(p => String(p.id) === String(postId));
    await supabase.from("comments").insert([{
      user_id: String(user.id),
      post_id: String(postId),
      username: currentUsername,
      content: commentText,
    }]);
    if (post) {
      await sendNotification(post.user_id, "comment", currentUsername + " replied to your post: \"" + commentText.slice(0, 40) + "\"", "/community?post=" + postId);
    }
    setCommentText("");
    await fetchComments();
  };

  const handleRepost = async (post) => {
    const currentUsername = user.user_metadata?.username || user.email;
    await supabase.from("posts").insert([{
      user_id: String(user.id),
      username: currentUsername,
      content: post.content,
      image_url: post.image_url,
      pair_tag: post.pair_tag,
      post_type: post.post_type,
      likes: 0,
      is_repost: true,
      repost_from: post.username,
    }]);
    await sendNotification(post.user_id, "comment", currentUsername + " reposted your post", "/community?post=" + post.id);
    await fetchPosts();
  };

  const handleShare = (postId) => {
    navigator.clipboard.writeText(window.location.origin + "/community/post/" + postId);
    setCopied(postId);
    setTimeout(() => setCopied(null), 2000);
  };

  const isLiked = (postId) => likes.some(l => l.post_id === String(postId));
  const getPostComments = (postId) => comments.filter(c => c.post_id === String(postId));

  const filteredPosts = () => {
    if (activeTab === "mine") return posts.filter(p => p.user_id === String(user?.id));
    if (activeTab === "following") {
      if (following.length === 0) return [];
      return posts.filter(p => following.includes(p.username));
    }
    return posts;
  };

  const getPostTypeColor = (type) => {
    const map = {
      "Trade Setup": "#00D4FF", "Market Analysis": "#7C3AED",
      "Profit Update": "#00FF88", "Psychology": "#FFD700",
      "Educational": "#FF6B35", "Meme": "#FF4757",
    };
    return map[type] || "#8B949E";
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return seconds + "s ago";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
    return Math.floor(seconds / 86400) + "d ago";
  };

  const inputClass = "w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[#8B949E] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] transition-colors";
  const username = user?.user_metadata?.username || user?.email;

  if (!user) return (
    <main className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-4xl px-6 space-y-6">
        <SkeletonText lines={2} />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </main>
  );

  const displayedPosts = filteredPosts();

  return (
    <main className="bg-[var(--bg-primary)] min-h-screen">

      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-[var(--accent-blue)] font-bold text-xl">MatrixVerse</a>
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <a href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Dashboard</a>
          <a href="/journal" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Journal</a>
          <a href="/leaderboard" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Leaderboard</a>
           <a href="/education" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Learn</a>
           <a href="/glossary" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Glossary</a>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 pb-24">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[var(--text-primary)] font-bold text-3xl mb-1">Community Feed</h1>
            <p className="text-[var(--text-muted)] text-sm">Share setups, ideas and connect with traders</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-5 py-3 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] transition-colors"
          >
            + Post
          </button>
        </div>

        {/* TABS — now includes Following */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { key: "latest", label: "🌐 Latest" },
            { key: "following", label: "👥 Following" },
            { key: "mine", label: "👤 My Posts" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={"px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap " + (
                activeTab === tab.key
                  ? "bg-[var(--accent-blue)] text-[var(--bg-primary)]"
                  : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* FOLLOWING EMPTY STATE */}
        {activeTab === "following" && following.length === 0 && (
          <div className="text-center py-16 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-[var(--text-primary)] font-semibold mb-1">You are not following anyone yet</p>
            <p className="text-[var(--text-muted)] text-sm mb-4">Follow traders to see their posts here</p>
            <a href="/search" className="bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-5 py-2 rounded-full text-xs hover:bg-[var(--accent-blue-hover)] transition-colors">
              Find Traders
            </a>
          </div>
        )}

        {/* FOLLOWING TAB WITH PEOPLE BUT NO POSTS */}
        {activeTab === "following" && following.length > 0 && displayedPosts.length === 0 && (
          <div className="text-center py-16 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-[var(--text-primary)] font-semibold mb-1">No posts from people you follow yet</p>
            <p className="text-[var(--text-muted)] text-sm">Check back later or explore the Latest feed</p>
          </div>
        )}

        {/* POSTS */}
        {(activeTab !== "following" && displayedPosts.length === 0) ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-[var(--text-muted)] text-sm mb-4">No posts yet. Be the first!</p>
            <button onClick={() => setShowModal(true)} className="bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-5 py-2 rounded-full text-xs">
              Create First Post
            </button>
          </div>
        ) : displayedPosts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {displayedPosts.map((post) => (
              <div key={post.id} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">

                {post.is_repost && (
                  <div className="text-[var(--text-muted)] text-xs mb-3 flex items-center gap-1">
                    🔁
                    <ProfileHoverCard username={post.username}>
                      <a href={"/profile/" + post.username} className="text-[var(--accent-green)] font-semibold hover:underline">{post.username}</a>
                    </ProfileHoverCard>
                    <span> reposted from </span>
                    <ProfileHoverCard username={post.repost_from}>
                      <a href={"/profile/" + post.repost_from} className="text-[var(--accent-blue)] font-semibold hover:underline">@{post.repost_from}</a>
                    </ProfileHoverCard>
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <ProfileHoverCard username={post.username}>
                      <a href={"/profile/" + post.username}>
                        <div className="w-9 h-9 rounded-full bg-[var(--accent-blue)] flex items-center justify-center text-[var(--bg-primary)] font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity overflow-hidden">
                          {post.username?.charAt(0).toUpperCase()}
                        </div>
                      </a>
                    </ProfileHoverCard>
                    <div>
                      <ProfileHoverCard username={post.username}>
                        <a href={"/profile/" + post.username} className="text-[var(--text-primary)] font-semibold text-sm hover:text-[var(--accent-blue)] transition-colors block">
                          @{post.username}
                        </a>
                      </ProfileHoverCard>
                      <div className="text-[var(--text-muted)] text-xs">{getTimeAgo(post.created_at)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {post.pair_tag && (
                      <span className="bg-[var(--accent-blue-bg)] text-[var(--accent-blue)] text-xs font-bold px-2 py-1 rounded-full">{post.pair_tag}</span>
                    )}
                    <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: getPostTypeColor(post.post_type) + "20", color: getPostTypeColor(post.post_type) }}>
                      {post.post_type}
                    </span>
                  </div>
                </div>

                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-3 ml-12">{post.content}</p>

                {post.image_url && (
                  <img src={post.image_url} alt="Trade chart" className="w-full rounded-xl mb-3 border border-[var(--border)]" />
                )}

                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] ml-12">
                  <button onClick={() => handleLike(post)} className="flex items-center gap-1.5 group">
                    <span className={"text-lg transition-transform group-hover:scale-110 " + (isLiked(post.id) ? "text-[var(--accent-red)]" : "text-[var(--text-muted)] group-hover:text-[var(--accent-red)]")}>
                      {isLiked(post.id) ? "❤️" : "🤍"}
                    </span>
                    <span className={"text-xs font-semibold " + (isLiked(post.id) ? "text-[var(--accent-red)]" : "text-[var(--text-muted)] group-hover:text-[var(--accent-red)]")}>
                      {post.likes || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => { setShowComments(showComments === post.id ? null : post.id); setCommentText(""); }}
                    className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--accent-blue)] group"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">💬</span>
                    <span className="text-xs font-semibold">{getPostComments(post.id).length}</span>
                  </button>

                  <button onClick={() => handleRepost(post)} className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--accent-green)] group">
                    <span className="text-lg group-hover:scale-110 transition-transform">🔁</span>
                    <span className="text-xs font-semibold group-hover:text-[var(--accent-green)]">Repost</span>
                  </button>

                  <button onClick={() => handleShare(post.id)} className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--accent-purple)] group">
                    <span className="text-lg group-hover:scale-110 transition-transform">📤</span>
                    <span className={"text-xs font-semibold " + (copied === post.id ? "text-[var(--accent-green)]" : "group-hover:text-[var(--accent-purple)]")}>
                      {copied === post.id ? "Copied!" : "Share"}
                    </span>
                  </button>
                </div>

                  {showComments === post.id && (
                    <div className="mt-4 border-t border-[var(--border)] pt-4 ml-12">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[var(--accent-purple)] flex items-center justify-center text-[var(--text-primary)] font-bold text-xs flex-shrink-0 overflow-hidden">
                          {username?.charAt(0).toUpperCase()}
                        </div>
                        <input
                          type="text"
                          placeholder="Post your reply..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                          className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[#8B949E] rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
                        />
                        <button
                          onClick={() => handleComment(post.id)}
                          disabled={!commentText.trim()}
                          className="bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-4 py-2 rounded-full text-xs hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-40"
                        >
                          Reply
                        </button>
                      </div>
                      {getPostComments(post.id).length > 0 && (
                        <a
                          href={"/community/post/" + post.id}
                          className="block mt-3 text-center text-[var(--accent-blue)] text-xs font-semibold hover:underline"
                        >
                          View all {getPostComments(post.id).length} {getPostComments(post.id).length === 1 ? "reply" : "replies"} →
                        </a>
                      )}
                    </div>
                  )}

              </div>
            ))}
          </div>
        ) : null}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-[var(--text-primary)] font-bold text-lg">Create Post</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl">x</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-4">

              <div>
                <label className="text-[var(--text-muted)] text-xs mb-2 block">Post Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Trade Setup","Market Analysis","Profit Update","Psychology","Educational","Meme"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, post_type: type })}
                      className={"py-2 px-3 rounded-xl border text-xs font-semibold transition-colors " + (
                        form.post_type === type
                          ? "border-[var(--accent-blue)] bg-[var(--accent-blue-bg)] text-[var(--accent-blue)]"
                          : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-blue)]"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[var(--text-muted)] text-xs mb-1 block">Pair Tag (optional)</label>
                <select value={form.pair_tag} onChange={(e) => setForm({ ...form, pair_tag: e.target.value })} className={inputClass}>
                  <option value="">No pair tag</option>
                  {["EURUSD","GBPUSD","XAUUSD","USDJPY","BTCUSD","ETHUSD","USDCAD","AUDUSD","GBPJPY"].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[var(--text-muted)] text-xs mb-1 block">What's on your mind?</label>
                <textarea
                  placeholder="Share your trade idea, analysis, or thought..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required rows={4} className={inputClass}
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] text-xs mb-1 block">Chart Screenshot (optional)</label>
                <input
                  type="file" accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-muted)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[var(--accent-blue)] file:text-[var(--bg-primary)]"
                />
                {image && <p className="text-[var(--accent-green)] text-xs mt-1">Selected: {image.name}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-[var(--border)] text-[var(--text-muted)] font-semibold py-3 rounded-full text-sm hover:border-[var(--hover-border)] hover:text-[var(--text-primary)] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold py-3 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-50">
                  {loading ? "Posting..." : "Post"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <MobileNav username={username} />
    </main>
  );
}
