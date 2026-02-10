const API = "/api";

/* ======================
   SLIDER
====================== */
function Slider() {
  return <div className="slider"></div>;
}

/* ======================
   NEWS (PUBLIC VIEW)
====================== */
function News() {
  const [news, setNews] = React.useState([]);

  React.useEffect(() => {
    fetch(`${API}/news`)
      .then(res => res.json())
      .then(setNews);
  }, []);

  return (
    <div className="news-panel">
      <h3>📰 News Bulletin</h3>
      {news.map(n => (
        <div key={n.id} className="news-item">
          <strong>{n.title}</strong>
          <p>{n.content}</p>
        </div>
      ))}
    </div>
  );
}

/* ======================
   HOME
====================== */
function Home() {
  return (
    <>
      <Slider />
      <div className="home-layout">
        <div className="main-content">
          <h2>Welcome to Sainik Defense College</h2>
          <p>Discipline • Dedication • Academic Excellence</p>
        </div>
        <News />
      </div>
    </>
  );
}

/* ======================
   ADMIN LOGIN
====================== */
function AdminLogin({ onSuccess }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const login = async () => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      onSuccess();
    } else {
      alert("Invalid login");
    }
  };

  return (
    <div className="admin-box">
      <h3>Admin Login</h3>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button onClick={login}>Login</button>
    </div>
  );
}

/* ======================
   EDIT NEWS PANEL
====================== */
function EditNews() {
  const token = localStorage.getItem("token");
  const [news, setNews] = React.useState([]);
  const [form, setForm] = React.useState({ id: null, title: "", content: "" });

  const loadNews = () => {
    fetch(`${API}/news`)
      .then(res => res.json())
      .then(setNews);
  };

  React.useEffect(loadNews, []);

  const saveNews = async () => {
    if (form.id) {
      // UPDATE
      await fetch(`${API}/admin/news/${form.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
    } else {
      // CREATE
      await fetch(`${API}/admin/news`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
    }

    setForm({ id: null, title: "", content: "" });
    loadNews();
  };

  const edit = (n) => {
    setForm(n);
  };

  const remove = async (id) => {
    await fetch(`${API}/admin/news/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    loadNews();
  };

  return (
    <div className="admin-box">
      <h3>🛠️ Edit News Bulletin</h3>

      <input
        placeholder="Title"
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
      />

      <textarea
        placeholder="Content"
        value={form.content}
        onChange={e => setForm({ ...form, content: e.target.value })}
      />

      <button onClick={saveNews}>
        {form.id ? "Update News" : "Add News"}
      </button>

      <hr />

      {news.map(n => (
        <div key={n.id} className="news-item">
          <strong>{n.title}</strong>
          <button onClick={() => edit(n)}>✏️ Edit</button>
          <button onClick={() => remove(n.id)}>❌ Delete</button>
        </div>
      ))}
    </div>
  );
}

/* ======================
   ADMIN DASHBOARD
====================== */
function AdminDashboard() {
  const [tab, setTab] = React.useState("edit");

  return (
    <>
      <nav className="navbar">
        <span onClick={() => setTab("home")}>Home</span>
        <span onClick={() => setTab("edit")}>Edit News Bulletin</span>
        <span onClick={() => {
          localStorage.clear();
          location.reload();
        }}>Logout</span>
      </nav>

      {tab === "home" && <Home />}
      {tab === "edit" && <EditNews />}
    </>
  );
}

/* ======================
   APP ROOT
====================== */
function App() {
  const [isAdmin, setIsAdmin] = React.useState(!!localStorage.getItem("token"));

  return isAdmin
    ? <AdminDashboard />
    : <AdminLogin onSuccess={() => setIsAdmin(true)} />;
}

ReactDOM.createRoot(document.getElementById("app-root")).render(<App />);

