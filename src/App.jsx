import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Link,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowDownUp,
  ArrowLeft,
  Bookmark,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  Gamepad2,
  Heart,
  Home,
  ImagePlus,
  LoaderCircle,
  MessageCircle,
  Moon,
  Plus,
  Search,
  Send,
  Settings2,
  Sparkles,
  Sun,
  ThumbsUp,
  TrendingUp,
  Upload,
  Users,
  X,
  Pencil,
  Trash2,
  ExternalLink,
  Link2,
  ChartNoAxesColumnIncreasing,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

const TYPES = ["Discussion", "Question", "Opinion", "Guide", "Showcase"];
const TYPE_CLASS = {
  Discussion: "lavender",
  Question: "blue",
  Opinion: "peach",
  Guide: "sage",
  Showcase: "pink",
};
const GAMES = [
  "General Gaming",
  "Animal Crossing",
  "Minecraft",
  "Stardew Valley",
  "The Sims",
  "Fortnite",
  "Genshin Impact",
  "Honkai: Star Rail",
  "Pokémon",
  "Other",
];
const defaultPrefs = {
  theme: "soft",
  layout: "list",
  richFeed: false,
  sort: "newest",
  animations: true,
};

function readPrefs() {
  try {
    return {
      ...defaultPrefs,
      ...JSON.parse(localStorage.getItem("hobbyhub-preferences") || "{}"),
    };
  } catch {
    return defaultPrefs;
  }
}
function timeAgo(value) {
  if (!value) return "Recently";
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000),
  );
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function initials(name = "Player") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}
function videoEmbed(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be")
      return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`;
    if (
      ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(
        parsed.hostname,
      )
    ) {
      const id = parsed.searchParams.get("v");
      if (id && /^[\w-]{11}$/.test(id))
        return `https://www.youtube-nocookie.com/embed/${id}`;
      const match = parsed.pathname.match(/^\/embed\/([\w-]{11})$/);
      if (match) return `https://www.youtube-nocookie.com/embed/${match[1]}`;
    }
  } catch {
    /* invalid URL */
  }
  return null;
}
function validHttpUrl(value) {
  if (!value) return true;
  try {
    const u = new URL(value);
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
}
function Loading({ label = "Gathering the community…" }) {
  return (
    <div className="loading-state">
      <span className="loader-wave">
        <i />
        <i />
        <i />
      </span>
      <span>{label}</span>
    </div>
  );
}
function Badge({ children, type }) {
  return (
    <span className={`badge ${TYPE_CLASS[type] || "neutral"}`}>{children}</span>
  );
}
function Avatar({ name }) {
  return (
    <span className="avatar" aria-label={name}>
      {initials(name)}
    </span>
  );
}

function Header({ user, prefs, setPrefs }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const update = (key, value) => setPrefs((p) => ({ ...p, [key]: value }));
  return (
    <header className="topbar">
      <Link to="/" className="brand" aria-label="HobbyHub home">
        <span className="brand-mark">
          <Gamepad2 size={22} />
        </span>
        <span>
          hobby<span>hub</span>
          <small>your games, your people</small>
        </span>
      </Link>
      <nav className="main-nav">
        <Link to="/">
          <Home size={16} /> Explore
        </Link>
        <Link to="/?view=trending">
          <TrendingUp size={16} /> Trending
        </Link>
        <Link to="/?view=saved">
          <Bookmark size={16} /> Saved
        </Link>
      </nav>
      <div className="header-actions">
        <span className="identity-chip">
          <span className="status-dot" />{" "}
          {user ? `Player ${user.id.slice(0, 5).toUpperCase()}` : "Connecting…"}
        </span>
        <div className="settings-wrap">
          <button
            className="icon-button"
            onClick={() => setSettingsOpen((v) => !v)}
            aria-label="Display settings"
            title="Display settings"
          >
            <Settings2 size={19} />
          </button>
          {settingsOpen && (
            <div className="settings-popover">
              <div className="popover-title">
                Your space{" "}
                <button
                  className="mini-icon"
                  onClick={() => setSettingsOpen(false)}
                  aria-label="Close settings"
                >
                  <X size={15} />
                </button>
              </div>
              <label>
                Color theme
                <select
                  value={prefs.theme}
                  onChange={(e) => update("theme", e.target.value)}
                >
                  <option value="soft">Soft neutrals</option>
                  <option value="lavender">Lavender mist</option>
                  <option value="sage">Sage garden</option>
                  <option value="dark">Evening mode</option>
                </select>
              </label>
              <label>
                Feed layout
                <select
                  value={prefs.layout}
                  onChange={(e) => update("layout", e.target.value)}
                >
                  <option value="list">Comfortable list</option>
                  <option value="grid">Card grid</option>
                </select>
              </label>
              <label>
                Default sorting
                <select
                  value={prefs.sort}
                  onChange={(e) => update("sort", e.target.value)}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="popular">Most upvoted</option>
                  <option value="least">Least upvoted</option>
                </select>
              </label>
              <label className="toggle-row">
                Show post previews{" "}
                <input
                  type="checkbox"
                  checked={prefs.richFeed}
                  onChange={(e) => update("richFeed", e.target.checked)}
                />
              </label>
              <label className="toggle-row">
                Motion effects{" "}
                <input
                  type="checkbox"
                  checked={prefs.animations}
                  onChange={(e) => update("animations", e.target.checked)}
                />
              </label>
              <p className="muted tiny">
                Preferences are saved in this browser.
              </p>
            </div>
          )}
        </div>
        <Link to="/create" className="button button-primary create-nav">
          <Plus size={17} /> Create post
        </Link>
      </div>
    </header>
  );
}

function PostCard({ post, prefs, saved, toggleSaved, compact = false }) {
  const [voting, setVoting] = useState(false);
  const [votes, setVotes] = useState(post.upvotes || 0);
  const [message, setMessage] = useState("");
  useEffect(() => setVotes(post.upvotes || 0), [post.upvotes]);
  async function upvote(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!supabase || voting) return;
    setVoting(true);
    setMessage("");
    const { data, error } = await supabase.rpc("increment_post_upvotes", {
      post_id_input: post.id,
    });
    if (error) setMessage("Could not save your upvote.");
    else setVotes(typeof data === "number" ? data : votes + 1);
    setVoting(false);
  }
  return (
    <article
      className={`post-card ${prefs.layout === "grid" && !compact ? "grid-card" : ""}`}
    >
      <div className="post-card-main">
        <div className="post-meta-line">
          <Badge type={post.post_type}>{post.post_type || "Discussion"}</Badge>
          <span className="game-label">
            <Gamepad2 size={13} /> {post.game_title || "General Gaming"}
          </span>
        </div>
        <Link to={`/posts/${post.id}`} className="post-title-link">
          <h3>{post.title}</h3>
        </Link>
        {prefs.richFeed && post.content && (
          <p className="post-preview">
            {post.content.length > 180
              ? `${post.content.slice(0, 180)}…`
              : post.content}
          </p>
        )}
        {prefs.richFeed && post.image_url && (
          <img
            className="feed-image"
            src={post.image_url}
            alt=""
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <div className="post-footer">
          <span className="post-time">
            <Clock3 size={14} /> {timeAgo(post.created_at)}
          </span>
          <span className="post-author">
            <Avatar
              name={
                post.author_name ||
                `Player ${String(post.author_id || "").slice(0, 5)}`
              }
            />{" "}
            {post.author_name ||
              `Player ${String(post.author_id || "")
                .slice(0, 5)
                .toUpperCase()}`}
          </span>
        </div>
      </div>
      <div className="post-card-actions">
        <button
          className={`vote-button ${voting ? "is-loading" : ""}`}
          onClick={upvote}
          disabled={voting}
          aria-label={`Upvote post, ${votes} votes`}
        >
          <ThumbsUp size={16} /> <span>{votes}</span>
        </button>
        <Link
          className="comment-count"
          to={`/posts/${post.id}`}
          aria-label="Open discussion"
        >
          <MessageCircle size={16} />
          <span>Discuss</span>
        </Link>
        <button
          className={`save-button ${saved ? "saved" : ""}`}
          onClick={() => toggleSaved(post.id)}
          aria-label={saved ? "Remove bookmark" : "Bookmark post"}
          title={saved ? "Saved" : "Save for later"}
        >
          <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
        </button>
        {message && <span className="tiny error-text">{message}</span>}
      </div>
    </article>
  );
}

function Home({ user, prefs, savedIds, toggleSaved }) {
  const [params, setParams] = useSearchParams();
  const view = params.get("view") || "all";
  const selectedGame = params.get("game") || "All games";
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All types");
  const [gameInput, setGameInput] = useState("");
  const [stats, setStats] = useState({ posts: 0, comments: 0, votes: 0 });

  const loadPosts = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    let query = supabase.from("posts").select("*");
    if (selectedGame !== "All games")
      query = query.eq("game_title", selectedGame);
    if (view === "saved") {
      query = query.in(
        "id",
        savedIds.length ? savedIds : ["00000000-0000-0000-0000-000000000000"],
      );
    }
    if (view === "trending")
      query = query
        .order("upvotes", { ascending: false })
        .order("created_at", { ascending: false });
    else if (prefs.sort === "popular")
      query = query
        .order("upvotes", { ascending: false })
        .order("created_at", { ascending: false });
    else if (prefs.sort === "least")
      query = query
        .order("upvotes", { ascending: true })
        .order("created_at", { ascending: false });
    else
      query = query.order("created_at", { ascending: prefs.sort === "oldest" });
    const { data, error: fetchError } = await query.limit(100);
    if (fetchError) setError(fetchError.message);
    else setPosts(data || []);
    setLoading(false);
  }, [selectedGame, view, savedIds, prefs.sort]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);
  useEffect(() => {
    let active = true;
    async function loadStats() {
      if (!supabase) return;
      const [p, c] = await Promise.all([
        supabase
          .from("posts")
          .select("id,upvotes", { count: "exact", head: true }),
        supabase.from("comments").select("id", { count: "exact", head: true }),
      ]);
      if (active)
        setStats({ posts: p.count || 0, comments: c.count || 0, votes: 0 });
    }
    loadStats();
    return () => {
      active = false;
    };
  }, [posts.length]);

  const visiblePosts = useMemo(
    () =>
      posts.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) &&
          (type === "All types" || p.post_type === type),
      ),
    [posts, search, type],
  );

  const setGame = (game) =>
    setParams((old) => {
      const next = new URLSearchParams(old);
      if (game === "All games") next.delete("game");
      else next.set("game", game);
      return next;
    });
  return (
    <main>
      <section className="welcome-panel">
        <div className="welcome-copy">
          <div className="eyebrow">
            <Sparkles size={14} /> A little corner of the internet, just for
            gamers
          </div>
          <h1>
            Your games.
            <br />
            <span>Your people.</span>
          </h1>
          <p>
            Share what you're playing, ask questions, find your next favorite,
            and connect with people who love games as much as you do.
          </p>
          <div className="welcome-actions">
            <Link to="/create" className="button button-primary">
              <Plus size={17} /> Start a discussion
            </Link>
            <a href="#the-feed" className="text-link">
              Explore conversations <span>↓</span>
            </a>
          </div>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-spark spark-one">✳</div>
          <div className="art-spark spark-two">✦</div>
          <div className="game-tile tile-main">
            <Gamepad2 size={46} strokeWidth={1.4} />
          </div>
          <div className="game-tile tile-small tile-lavender">
            <Heart size={23} />
          </div>
          <div className="game-tile tile-small tile-sage">
            <MessageCircle size={23} />
          </div>
          <div className="art-caption">good games, good company</div>
        </div>
        <div className="welcome-decoration" />
      </section>

      <section className="community-strip">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Find your people</span>
            <h2>What are we playing?</h2>
          </div>
          <span className="muted small">
            Pick a game to explore its conversations
          </span>
        </div>
        <div className="game-chips">
          <button
            className={`game-chip all-chip ${selectedGame === "All games" ? "active" : ""}`}
            onClick={() => setGame("All games")}
          >
            <Compass size={16} /> All communities
          </button>
          {GAMES.map((game, i) => (
            <button
              key={game}
              className={`game-chip game-chip-${i % 5} ${selectedGame === game ? "active" : ""}`}
              onClick={() => setGame(game)}
            >
              {game}
            </button>
          ))}
          <form
            className="custom-game-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (gameInput.trim()) setGame(gameInput.trim());
            }}
          >
            <input
              value={gameInput}
              onChange={(e) => setGameInput(e.target.value)}
              placeholder="Find another game…"
              aria-label="Enter a game title"
            />
            <button type="submit" aria-label="Filter by game">
              <Search size={15} />
            </button>
          </form>
        </div>
      </section>

      <section className="stats-row">
        <div className="stat-card">
          <span className="stat-icon lavender-bg">
            <MessageCircle size={18} />
          </span>
          <div>
            <strong>{stats.posts}</strong>
            <span>conversations</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon sage-bg">
            <Users size={18} />
          </span>
          <div>
            <strong>{stats.comments}</strong>
            <span>community replies</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon peach-bg">
            <Heart size={18} />
          </span>
          <div>
            <strong>
              {visiblePosts.reduce((sum, p) => sum + (p.upvotes || 0), 0)}
            </strong>
            <span>upvotes in this view</span>
          </div>
        </div>
      </section>

      <section className="feed-section" id="the-feed">
        <div className="feed-heading">
          <div>
            <span className="eyebrow">
              {view === "saved"
                ? "Kept close"
                : view === "trending"
                  ? "Community favorites"
                  : "The community board"}
            </span>
            <h2>
              {view === "saved"
                ? "Saved posts"
                : view === "trending"
                  ? "Trending discussions"
                  : selectedGame === "All games"
                    ? "The conversation is open"
                    : selectedGame}
            </h2>
            <p className="muted">
              {view === "saved"
                ? "Conversations you want to come back to."
                : "Every game, every player, one welcoming space."}
            </p>
          </div>
          <Link to="/create" className="button button-outline">
            <Plus size={16} /> New post
          </Link>
        </div>
        <div className="feed-controls">
          <label className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search post titles…"
            />
          </label>
          <label className="select-box">
            <ArrowDownUp size={15} />
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option>All types</option>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <ChevronDown size={14} />
          </label>
          <span className="result-count">
            {visiblePosts.length} {visiblePosts.length === 1 ? "post" : "posts"}
          </span>
        </div>
        {!isSupabaseConfigured && (
          <div className="setup-notice">
            <CircleHelp size={19} />
            <div>
              <strong>Connect your Supabase project</strong>
              <p>
                Add your project URL and publishable/anon key to{" "}
                <code>.env</code>, then run the SQL setup script included in
                this project.
              </p>
            </div>
          </div>
        )}
        {loading ? (
          <Loading label="Finding conversations…" />
        ) : error ? (
          <div className="error-panel">
            <strong>We couldn't load the feed.</strong>
            <p>{error}</p>
            <button className="button button-outline" onClick={loadPosts}>
              Try again
            </button>
          </div>
        ) : visiblePosts.length ? (
          <div
            className={`post-list ${prefs.layout === "grid" ? "post-grid" : ""}`}
          >
            {visiblePosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                prefs={prefs}
                saved={savedIds.includes(post.id)}
                toggleSaved={toggleSaved}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">
              <MessageCircle size={25} />
            </span>
            <h3>
              {view === "saved"
                ? "Nothing saved yet"
                : search || type !== "All types"
                  ? "No conversations found"
                  : "Be the first to start a conversation"}
            </h3>
            <p>
              {view === "saved"
                ? "Bookmark a post and it will be waiting here."
                : "Every community starts with one post. Share what is on your mind."}
            </p>
            <Link to="/create" className="button button-primary">
              <Plus size={16} /> Create a post
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

function PostForm({ initial, onSubmit, submitting, submitLabel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [game, setGame] = useState(initial?.game_title || "General Gaming");
  const [customGame, setCustomGame] = useState(
    GAMES.includes(initial?.game_title) ? "" : initial?.game_title || "",
  );
  const [type, setType] = useState(initial?.post_type || "Discussion");
  const [imageUrl, setImageUrl] = useState(initial?.image_url || "");
  const [videoUrl, setVideoUrl] = useState(initial?.video_url || "");
  const [referenceId, setReferenceId] = useState(
    initial?.referenced_post_id || "",
  );
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initial?.image_url || "");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (title.trim().length < 3)
      return setError("Add a title with at least 3 characters.");
    if (title.trim().length > 160)
      return setError("Keep the title under 160 characters.");
    if (!validHttpUrl(imageUrl))
      return setError(
        "Enter a valid image URL beginning with http:// or https://.",
      );
    if (videoUrl && !videoEmbed(videoUrl))
      return setError("Use a valid YouTube or youtu.be video URL.");
    if (referenceId && !/^[0-9a-f-]{36}$/i.test(referenceId.trim()))
      return setError("Reference a post using its full UUID.");
    let uploadedImageUrl = imageUrl.trim() || null;
    if (imageFile) {
      if (
        !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
          imageFile.type,
        )
      )
        return setError("Choose a JPG, PNG, WEBP, or GIF image.");
      if (imageFile.size > 5 * 1024 * 1024)
        return setError("Images must be 5 MB or smaller.");
      const ext = imageFile.name.split(".").pop().toLowerCase();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(path, imageFile, {
          upsert: false,
          contentType: imageFile.type,
        });
      if (uploadError)
        return setError(
          `Image upload failed: ${uploadError.message}. Check the Storage setup in README.md.`,
        );
      const { data } = supabase.storage.from("post-images").getPublicUrl(path);
      uploadedImageUrl = data.publicUrl;
    }
    await onSubmit(
      {
        title: title.trim(),
        content: content.trim() || null,
        game_title: game === "Other" ? customGame.trim() || "Other" : game,
        post_type: type,
        image_url: uploadedImageUrl,
        video_url: videoUrl.trim() || null,
        referenced_post_id: referenceId.trim() || null,
      },
      setError,
    );
  }
  return (
    <form className="post-form" onSubmit={handleSubmit}>
      <label className="field-label">
        Post title <span>Required</span>
        <input
          autoFocus
          maxLength={160}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What would you like to talk about?"
          required
        />
      </label>
      <div className="form-two-col">
        <label className="field-label">
          Game or community
          <select value={game} onChange={(e) => setGame(e.target.value)}>
            {GAMES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Post type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      {game === "Other" && (
        <label className="field-label">
          Game title
          <input
            value={customGame}
            onChange={(e) => setCustomGame(e.target.value)}
            placeholder="Enter the game name"
          />
        </label>
      )}
      <label className="field-label">
        Your thoughts <span>Optional</span>
        <textarea
          rows={6}
          maxLength={10000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add context, ask a question, or tell the community what you think…"
        />
        <small>{content.length}/10,000 characters</small>
      </label>
      <div className="media-field">
        <label className="field-label">
          <span className="field-icon">
            <ImagePlus size={16} /> Image URL
          </span>
          <span>Optional</span>
          <input
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              if (!imageFile) setImagePreview(e.target.value);
            }}
            placeholder="https://example.com/image.jpg"
          />
        </label>
        <div className="or-divider">
          <span>or upload an image (max 5 MB)</span>
        </div>
        <label className="upload-control">
          <Upload size={17} />
          <span>
            {imageFile ? imageFile.name : "Choose an image from your device"}
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => {
              setImageFile(e.target.files?.[0] || null);
              if (e.target.files?.[0]) setImageUrl("");
            }}
          />
        </label>
        {imagePreview && (
          <div className="image-preview-wrap">
            <img
              src={imagePreview}
              alt="Post preview"
              className="image-preview"
              onError={() => setImagePreview("")}
            />
            <button
              type="button"
              className="mini-icon remove-preview"
              onClick={() => {
                setImageFile(null);
                setImageUrl("");
                setImagePreview("");
              }}
              aria-label="Remove image"
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>
      <label className="field-label">
        YouTube video URL <span>Optional</span>
        <input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
        />
      </label>
      <label className="field-label">
        Reference another post <span>Optional · paste its full post ID</span>
        <input
          value={referenceId}
          onChange={(e) => setReferenceId(e.target.value)}
          placeholder="Post UUID"
        />
      </label>
      {error && <div className="form-error">{error}</div>}
      <div className="form-footer">
        <p>
          <span className="privacy-dot" /> Be kind. Keep it welcoming.
        </p>
        <div>
          <Link to="/" className="button button-quiet">
            Cancel
          </Link>
          <button
            className="button button-primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <LoaderCircle className="spin" size={16} /> Saving…
              </>
            ) : (
              <>
                <Send size={16} /> {submitLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

function CreatePost({ user }) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  async function submit(values, setError) {
    if (!supabase || !user)
      return setError(
        "Supabase is not connected yet. Follow the setup steps in README.md.",
      );
    setSubmitting(true);
    const { data, error } = await supabase
      .from("posts")
      .insert({
        ...values,
        author_id: user.id,
        author_name:
          localStorage.getItem("hobbyhub-display-name") || "Community Player",
      })
      .select("id")
      .single();
    setSubmitting(false);
    if (error) return setError(error.message);
    navigate(`/posts/${data.id}`);
  }
  return (
    <main className="narrow-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} /> Back to the community
      </Link>
      <div className="page-intro">
        <span className="eyebrow">Your voice belongs here</span>
        <h1>Start a discussion</h1>
        <p>Share a question, an idea, or something you love about a game.</p>
      </div>
      <div className="form-card">
        <PostForm
          onSubmit={submit}
          submitting={submitting}
          submitLabel="Publish post"
        />
      </div>
    </main>
  );
}

function EditPost({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    async function load() {
      const { data, error: e } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();
      if (e) setError(e.message);
      else if (data.author_id !== user?.id)
        setError("Only the original author can edit this post.");
      else setPost(data);
      setLoading(false);
    }
    if (supabase && user) load();
    else {
      setError("Supabase is not connected.");
      setLoading(false);
    }
  }, [id, user]);
  async function submit(values, setFormError) {
    setSubmitting(true);
    const { error: e } = await supabase
      .from("posts")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("author_id", user.id);
    setSubmitting(false);
    if (e) return setFormError(e.message);
    navigate(`/posts/${id}`);
  }
  return (
    <main className="narrow-page">
      <Link to={`/posts/${id}`} className="back-link">
        <ArrowLeft size={16} /> Back to post
      </Link>
      <div className="page-intro">
        <span className="eyebrow">Make it yours</span>
        <h1>Edit your post</h1>
        <p>Update the details of your conversation.</p>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="error-panel">{error}</div>
      ) : (
        <div className="form-card">
          <PostForm
            initial={post}
            onSubmit={submit}
            submitting={submitting}
            submitLabel="Save changes"
          />
        </div>
      )}
    </main>
  );
}

function PostDetails({ user, savedIds, toggleSaved }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [reference, setReference] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem("hobbyhub-display-name") || "",
  );
  const [nameEditing, setNameEditing] = useState(false);
  const load = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setError("Connect Supabase to view posts.");
      return;
    }
    setLoading(true);
    setError("");
    const { data, error: e } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();
    if (e) {
      setError("This post could not be found.");
      setLoading(false);
      return;
    }
    setPost(data);
    if (data.referenced_post_id) {
      const { data: ref } = await supabase
        .from("posts")
        .select("id,title,game_title,post_type,author_name,created_at")
        .eq("id", data.referenced_post_id)
        .maybeSingle();
      setReference(ref || null);
    }
    const { data: cs, error: ce } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", id)
      .order("created_at", { ascending: true });
    if (ce) setCommentError(ce.message);
    else setComments(cs || []);
    setLoading(false);
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);
  async function addComment(e) {
    e.preventDefault();
    setCommentError("");
    if (!comment.trim()) return setCommentError("Write a comment first.");
    if (!user) return setCommentError("Connect Supabase before commenting.");
    setPostingComment(true);
    const name = displayName.trim().slice(0, 40) || "Community Player";
    const { error: e2 } = await supabase
      .from("comments")
      .insert({
        post_id: id,
        author_id: user.id,
        author_name: name,
        content: comment.trim(),
      });
    setPostingComment(false);
    if (e2) setCommentError(e2.message);
    else {
      setComment("");
      await load();
    }
  }
  async function upvote() {
    if (!supabase || voteLoading) return;
    setVoteLoading(true);
    const { data, error: e } = await supabase.rpc("increment_post_upvotes", {
      post_id_input: id,
    });
    if (e) setError(e.message);
    else
      setPost((p) => ({
        ...p,
        upvotes: typeof data === "number" ? data : (p.upvotes || 0) + 1,
      }));
    setVoteLoading(false);
  }
  async function deletePost() {
    if (
      !window.confirm(
        "Delete this post and its comments? This cannot be undone.",
      )
    )
      return;
    setDeleting(true);
    const { error: e } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("author_id", user.id);
    setDeleting(false);
    if (e) setError(e.message);
    else navigate("/");
  }
  async function deleteComment(commentId) {
    if (!window.confirm("Delete this comment?")) return;
    const { error: e } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("author_id", user.id);
    if (e) setCommentError(e.message);
    else setComments((cs) => cs.filter((c) => c.id !== commentId));
  }
  function saveName() {
    const value = displayName.trim().slice(0, 40) || "Community Player";
    localStorage.setItem("hobbyhub-display-name", value);
    setDisplayName(value);
    setNameEditing(false);
  }
  if (loading)
    return (
      <main className="narrow-page">
        <Loading label="Opening the conversation…" />
      </main>
    );
  if (!post)
    return (
      <main className="narrow-page">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} /> Back to the community
        </Link>
        <div className="error-panel">{error || "Post not found."}</div>
      </main>
    );
  const ownPost = user?.id === post.author_id;
  const embed = post.video_url ? videoEmbed(post.video_url) : null;
  return (
    <main className="narrow-page detail-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} /> Back to the community
      </Link>
      <article className="detail-card">
        <div className="detail-topline">
          <div className="post-meta-line">
            <Badge type={post.post_type}>{post.post_type}</Badge>
            <span className="game-label">
              <Gamepad2 size={14} /> {post.game_title}
            </span>
          </div>
          {ownPost && (
            <div className="owner-actions">
              <Link
                to={`/posts/${id}/edit`}
                className="icon-button"
                title="Edit post"
                aria-label="Edit post"
              >
                <Pencil size={16} />
              </Link>
              <button
                className="icon-button danger-icon"
                onClick={deletePost}
                disabled={deleting}
                title="Delete post"
                aria-label="Delete post"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
        <h1>{post.title}</h1>
        <div className="detail-author">
          <Avatar name={post.author_name || "Community Player"} />
          <div>
            <strong>{post.author_name || "Community Player"}</strong>
            <span>
              {timeAgo(post.created_at)}
              {post.updated_at && post.updated_at !== post.created_at
                ? " · edited"
                : ""}
            </span>
          </div>
        </div>
        {post.content && (
          <div className="post-body">
            {post.content.split("\n").map((line, i) => (
              <p key={i}>{line || "\u00a0"}</p>
            ))}
          </div>
        )}
        {post.image_url && (
          <img
            className="detail-image"
            src={post.image_url}
            alt="Image shared in this post"
            onError={(e) => {
              e.currentTarget.alt = "The linked image could not be loaded";
            }}
          />
        )}
        {embed && (
          <div className="video-frame">
            <iframe
              src={embed}
              title={`Video for ${post.title}`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        )}
        {post.video_url && !embed && (
          <p className="muted">
            This video URL is not from a supported provider.
          </p>
        )}
        {reference && (
          <div className="reference-box">
            <span className="eyebrow">
              <Link2 size={13} /> Referenced discussion
            </span>
            <Link to={`/posts/${reference.id}`}>
              <strong>{reference.title}</strong>
              <span>
                {reference.game_title} ·{" "}
                {reference.author_name || "Community Player"}{" "}
                <ExternalLink size={13} />
              </span>
            </Link>
          </div>
        )}
        {post.referenced_post_id && !reference && (
          <p className="muted tiny">
            The referenced post is no longer available.
          </p>
        )}
        {error && <div className="form-error">{error}</div>}
        <div className="detail-actions">
          <button
            className="button button-primary"
            onClick={upvote}
            disabled={voteLoading}
          >
            <ThumbsUp size={16} />{" "}
            {voteLoading ? "Saving…" : `Upvote · ${post.upvotes || 0}`}
          </button>
          <button
            className={`button button-outline ${savedIds.includes(post.id) ? "saved-button" : ""}`}
            onClick={() => toggleSaved(post.id)}
          >
            <Bookmark size={16} />{" "}
            {savedIds.includes(post.id) ? "Saved" : "Save for later"}
          </button>
          <span className="detail-action-spacer" />
          <span className="muted small">
            <MessageCircle size={15} /> {comments.length} replies
          </span>
        </div>
      </article>
      <section className="comments-panel">
        <div className="comments-heading">
          <div>
            <span className="eyebrow">Keep it going</span>
            <h2>
              Community replies{" "}
              <span className="count-pill">{comments.length}</span>
            </h2>
          </div>
        </div>
        <form className="comment-composer" onSubmit={addComment}>
          <div className="composer-avatar">
            <Avatar name={displayName || "Player"} />
          </div>
          <div className="composer-content">
            <div className="name-editor">
              {nameEditing ? (
                <>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={40}
                    placeholder="Choose a display name"
                  />
                  <button
                    type="button"
                    onClick={saveName}
                    className="mini-icon"
                    aria-label="Save display name"
                  >
                    <Check size={15} />
                  </button>
                </>
              ) : (
                <>
                  <span>
                    Replying as{" "}
                    <strong>{displayName || "Community Player"}</strong>
                  </span>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setNameEditing(true)}
                  >
                    Change
                  </button>
                </>
              )}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add something kind or helpful to the conversation…"
              rows={3}
              maxLength={3000}
            />
            {commentError && <p className="error-text tiny">{commentError}</p>}
            <div className="composer-footer">
              <span className="muted tiny">{comment.length}/3,000</span>
              <button
                className="button button-primary button-small"
                type="submit"
                disabled={postingComment}
              >
                {postingComment ? (
                  <LoaderCircle size={15} className="spin" />
                ) : (
                  <Send size={15} />
                )}{" "}
                Reply
              </button>
            </div>
          </div>
        </form>
        <div className="comment-list">
          {comments.map((c) => (
            <article className="comment" key={c.id}>
              <Avatar name={c.author_name || "Player"} />
              <div className="comment-content">
                <div className="comment-byline">
                  <strong>{c.author_name || "Community Player"}</strong>
                  <span>{timeAgo(c.created_at)}</span>
                  {c.author_id === user?.id && (
                    <button
                      className="comment-delete"
                      onClick={() => deleteComment(c.id)}
                      title="Delete your comment"
                      aria-label="Delete your comment"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p>{c.content}</p>
              </div>
            </article>
          ))}
          {!comments.length && (
            <div className="comments-empty">
              <MessageCircle size={21} />
              <p>No replies yet. Start the conversation.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function NotFound() {
  return (
    <main className="narrow-page">
      <div className="empty-state">
        <h1>That page wandered off.</h1>
        <p>The page may have moved or no longer exists.</p>
        <Link className="button button-primary" to="/">
          Return to HobbyHub
        </Link>
      </div>
    </main>
  );
}

export default function App() {
  const [prefs, setPrefsState] = useState(readPrefs);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("hobbyhub-saved") || "[]");
    } catch {
      return [];
    }
  });
  const setPrefs = (updater) =>
    setPrefsState((old) => {
      const next = typeof updater === "function" ? updater(old) : updater;
      localStorage.setItem("hobbyhub-preferences", JSON.stringify(next));
      return next;
    });
  const toggleSaved = (id) =>
    setSavedIds((old) => {
      const next = old.includes(id)
        ? old.filter((x) => x !== id)
        : [...old, id];
      localStorage.setItem("hobbyhub-saved", JSON.stringify(next));
      return next;
    });
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      let session = data.session;
      if (!session) {
        const { data: anonData, error } =
          await supabase.auth.signInAnonymously();
        if (error) console.error("Anonymous sign-in failed:", error.message);
        session = anonData?.session || null;
      }
      if (alive) {
        setUser(session?.user || null);
        setAuthLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (alive) setUser(session?.user || null);
      },
    );
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = prefs.theme;
    document.documentElement.dataset.motion = prefs.animations ? "on" : "off";
  }, [prefs]);
  return (
    <div className="app-shell">
      <Header user={user} prefs={prefs} setPrefs={setPrefs} />
      {authLoading ? (
        <main className="narrow-page">
          <Loading label="Setting up your community profile…" />
        </main>
      ) : (
        <Routes>
          <Route
            path="/"
            element={
              <Home
                user={user}
                prefs={prefs}
                savedIds={savedIds}
                toggleSaved={toggleSaved}
              />
            }
          />
          <Route path="/create" element={<CreatePost user={user} />} />
          <Route
            path="/posts/:id"
            element={
              <PostDetails
                user={user}
                savedIds={savedIds}
                toggleSaved={toggleSaved}
              />
            }
          />
          <Route path="/posts/:id/edit" element={<EditPost user={user} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      )}
      <footer className="site-footer">
        <Link to="/" className="footer-brand">
          <Gamepad2 size={17} /> HobbyHub
        </Link>
        <span>A softer corner of the gaming internet.</span>
        <span>Made for every kind of player.</span>
      </footer>
    </div>
  );
}
