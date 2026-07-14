import React, { useState, useEffect } from "react";
import { BookOpen, Calendar, User, MessageSquare, ArrowRight, Heart, Send, CheckCircle2 } from "lucide-react";
import { BlogPost, BlogComment } from "../types";
import { apiFetch } from "../utils/api";

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await apiFetch("/api/blog");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Error loading blog posts:", err);
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !authorName || !commentText) return;
    setIsSubmittingComment(true);

    try {
      const res = await apiFetch("/api/blog/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: selectedPost.id,
          authorName,
          commentText
        })
      });

      if (res.ok) {
        setAuthorName("");
        setCommentText("");
        // Reload details
        const data = await res.json();
        // Update selectedPost in state to show new comment immediately
        setSelectedPost(prev => prev ? { ...prev, comments: [...(prev.comments || []), data.comment] } : null);
        fetchPosts();
      }
    } catch (err) {
      console.error("Error creating comment:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setIsSubmittingNewsletter(true);

    try {
      const res = await apiFetch("/api/blog/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail })
      });

      if (res.ok) {
        setNewsletterSuccess(true);
        setNewsletterEmail("");
      }
    } catch (err) {
      console.error("Error signing up for newsletter:", err);
    } finally {
      setIsSubmittingNewsletter(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-fade-in">
      
      {/* Blog Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyan-950/20 via-purple-950/15 to-transparent border border-gray-850 p-8 sm:p-12 rounded-3xl text-center">
        <BookOpen className="w-10 h-10 text-cyan-400 mx-auto mb-5" />
        <h2 className="font-display font-bold text-3xl text-white tracking-tight leading-none mb-3">CreatorPilot CMS Hub</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto leading-relaxed font-sans">
          Organic scaling diagnostics, algorithm breakdown metrics, and copywriting cheat sheets compiled by our engineering desk.
        </p>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Articles List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="text-3xs font-bold uppercase tracking-widest text-gray-500 mb-2 px-1">Latest Editorial Logs</div>
          
          {posts.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-gray-850 rounded-2xl">
              <p className="text-xs text-gray-500">Loading published content articles...</p>
            </div>
          ) : (
            posts.map((post) => (
              <article 
                key={post.id}
                className="glass-panel p-6 sm:p-8 rounded-2xl hover:border-gray-800 transition duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-4 text-3xs text-gray-500 mb-4 font-mono uppercase tracking-wider">
                    <span className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-purple-500" />
                      <span>By {post.author.name}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-teal-500" />
                      <span>{post.comments?.length || 0} Comments</span>
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg sm:text-xl text-white hover:text-cyan-400 transition cursor-pointer mb-3" onClick={() => setSelectedPost(post)}>
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray-400 mb-6 leading-relaxed font-sans">
                    {post.excerpt}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-5 border-t border-gray-850/60">
                  <span className="bg-gray-900 border border-gray-800 text-gray-400 text-3xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {post.category}
                  </span>
                  <button 
                    onClick={() => setSelectedPost(post)}
                    className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold flex items-center space-x-1.5 group"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Right: Newsletter Sidebar */}
        <div className="lg:col-span-4">
          <div className="glass-panel p-6 rounded-2xl sticky top-24 space-y-6">
            <div>
              <h3 className="font-display font-semibold text-white mb-2">Algorithm Alert Logs</h3>
              <p className="text-2xs text-gray-400 leading-relaxed font-sans">
                Get notified of real-time social algorithm updates before they affect your organic view channels.
              </p>
            </div>

            {newsletterSuccess ? (
              <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-xl flex items-start space-x-3 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Onboarding validated. You have joined the Pilot Alert pipeline.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="space-y-3.5">
                <input 
                  type="email" 
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 focus:border-cyan-500 focus:outline-none px-4 py-3 rounded-xl text-xs text-white"
                  placeholder="yourname@gmail.com"
                />
                <button 
                  type="submit"
                  disabled={isSubmittingNewsletter}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-xl text-xs transition"
                >
                  {isSubmittingNewsletter ? "Subscribing..." : "Join Alert Pipeline"}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

      {/* ARTICLE FULL MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel bg-[#0d0f12] w-full max-w-3xl rounded-3xl max-h-[90vh] overflow-y-auto relative p-6 sm:p-10 space-y-8">
            <button 
              onClick={() => setSelectedPost(null)}
              className="absolute top-6 right-6 text-sm text-gray-500 hover:text-white transition bg-gray-900 border border-gray-800 px-3.5 py-1.5 rounded-lg font-semibold"
            >
              Close x
            </button>

            {/* Header metadata */}
            <div className="space-y-4 pt-4">
              <span className="bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-3xs font-bold font-mono px-2.5 py-1 rounded uppercase tracking-widest">
                {selectedPost.category}
              </span>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-white leading-tight tracking-tight">{selectedPost.title}</h1>
              
              <div className="flex items-center space-x-3 text-3xs text-gray-500 font-mono uppercase">
                <span>Published: {new Date(selectedPost.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span>By {selectedPost.author.name}</span>
              </div>
            </div>

            {/* Content Body */}
            <div className="prose prose-invert max-w-none text-sm text-gray-300 leading-relaxed font-sans border-b border-gray-850 pb-8">
              {selectedPost.content}
            </div>

            {/* Comment Section */}
            <div className="space-y-6">
              <h3 className="font-display font-semibold text-white text-base">Discussion Comments ({selectedPost.comments?.length || 0})</h3>
              
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2">
                {(!selectedPost.comments || selectedPost.comments.length === 0) ? (
                  <p className="text-xs text-gray-500 font-sans italic">No discussions logged for this report yet. Start the conversation!</p>
                ) : (
                  selectedPost.comments.map((comment, index) => (
                    <div key={index} className="p-4 bg-gray-900/60 border border-gray-850 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-cyan-300">{comment.authorName}</span>
                        <span className="text-3xs text-gray-500 font-mono">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-400 font-sans leading-relaxed">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleCreateComment} className="space-y-4 pt-4 border-t border-gray-850">
                <div className="text-2xs font-bold uppercase tracking-widest text-gray-400">Append Discussion Post</div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-3xs font-bold uppercase tracking-wider text-gray-500">Your Display Name</label>
                    <input 
                      type="text" 
                      required
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 focus:border-cyan-500 focus:outline-none px-4 py-2.5 rounded-xl text-xs text-white"
                      placeholder="e.g. Creator_Pilot_Alpha"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-3xs font-bold uppercase tracking-wider text-gray-500">Discussion Content</label>
                  <textarea 
                    required
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 focus:border-cyan-500 focus:outline-none px-4 py-2.5 rounded-xl text-xs text-white resize-none"
                    placeholder="Contribute constructive feedback or notes on this diagnostic bulletin..."
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmittingComment}
                  className="px-6 py-3 bg-gray-900 hover:bg-gray-850 border border-gray-800 hover:border-gray-700 text-white font-semibold rounded-xl text-xs transition flex items-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isSubmittingComment ? "Posting..." : "Submit Comment"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
