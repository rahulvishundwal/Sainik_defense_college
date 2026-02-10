function NewsBulletin() {
  const [news, setNews] = React.useState([]);

  React.useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(setNews);
  }, []);

  return (
    <div className="news-bulletin-container">
      <div className="news-bulletin-header">
        📰 Latest Updates
      </div>

      <div className="news-scroll-container">
        {news.map(n => (
          <div className="news-item" key={n.id}>
            <h4>{n.title}</h4>
            <p>{n.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomePage() {
  return (
    <>
      <ImageSlider />

      <div className="home-content-wrapper">
        <div className="main-content">
          <h2>Welcome to Sainik Defense College</h2>
          <p>Excellence | Discipline | Leadership</p>
        </div>

        <div className="news-sidebar">
          <NewsBulletin />
        </div>
      </div>
    </>
  );
}

function Admission() {
  return <h2>Admission Form Coming Soon</h2>;
}

function Login() {
  return <h2>Login Page</h2>;
}

function App() {
  const [page, setPage] = React.useState('home');

  React.useEffect(() => {
    document.querySelectorAll('[data-page]').forEach(el => {
      el.onclick = () => setPage(el.dataset.page);
    });
  }, []);

  if (page === 'admission') return <Admission />;
  if (page === 'login') return <Login />;
  return <HomePage />;
}

ReactDOM.createRoot(document.getElementById('app-root')).render(<App />);
