
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000/api";

export default function App() {
  const [dealers, setDealers] = useState([]);
  const [states, setStates] = useState([]);
  const [state, setState] = useState("");
  const [selected, setSelected] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("dealers");
  const [form, setForm] = useState({
    username: "", first_name: "", last_name: "", email: "", password: ""
  });
  const [login, setLogin] = useState({ username: "", password: "" });
  const [review, setReview] = useState({
    name: "", review: "", purchase: false
  });

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  }

  async function loadDealers(filter = state) {
    setLoading(true);
    try {
      const query = filter ? `?state=${encodeURIComponent(filter)}` : "";
      const data = await request(`/dealers/${query}`);
      setDealers(data);
    } catch (error) {
      setMessage(`Could not load dealers: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadStates() {
    try {
      setStates(await request("/states/"));
    } catch {
      setStates([]);
    }
  }

  useEffect(() => {
    loadDealers("");
    loadStates();
  }, []);

  async function openDealer(dealer) {
    setSelected(dealer);
    setPage("details");
    setMessage("");
    try {
      const data = await request(`/dealers/${dealer.id}/`);
      setSelected(data);
      setReviews(data.reviews || []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function submitReview(event) {
    event.preventDefault();
    try {
      await request(`/dealers/${selected.id}/reviews/`, {
        method: "POST",
        body: JSON.stringify(review)
      });
      setReview({ name: "", review: "", purchase: false });
      setMessage("Review submitted successfully!");
      await openDealer(selected);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function register(event) {
    event.preventDefault();
    try {
      await request("/register/", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setMessage("Registration successful. You can now log in.");
      setPage("login");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function signIn(event) {
    event.preventDefault();
    try {
      const data = await request("/login/", {
        method: "POST",
        body: JSON.stringify(login)
      });
      setMessage(`Welcome, ${data.username}!`);
      setPage("dealers");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function signOut() {
    try {
      const data = await request("/logout/");
      setMessage(data.message);
      setPage("dealers");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#" onClick={() => setPage("dealers")}>
          <span className="brand-icon">🚘</span> AutoReview
        </a>
        <nav>
          <button onClick={() => { setPage("dealers"); setSelected(null); }}>
            Dealers
          </button>
          <button onClick={() => setPage("login")}>Login</button>
          <button onClick={() => setPage("register")}>Register</button>
          <button onClick={signOut}>Logout</button>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">YOUR NEXT DRIVE STARTS HERE</span>
          <h1>Find a dealer.<br />Share your experience.</h1>
          <p>Explore dealerships and discover honest customer reviews.</p>
          <button className="primary" onClick={() => {
            setPage("dealers");
            document.getElementById("dealer-list")?.scrollIntoView();
          }}>
            Explore Dealers →
          </button>
        </div>
        <div className="hero-art">🚗</div>
      </section>

      {message && (
        <div className="notice">
          {message}
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}

      <main className="main" id="dealer-list">
        {page === "dealers" && (
          <>
            <div className="section-heading">
              <div>
                <span className="eyebrow">EXPLORE</span>
                <h2>Dealerships near you</h2>
                <p>Browse dealers and read customer experiences.</p>
              </div>
              <select value={state} onChange={e => {
                setState(e.target.value);
                loadDealers(e.target.value);
              }}>
                <option value="">All states</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {loading ? <p>Loading dealerships...</p> : dealers.length === 0 ? (
              <div className="empty">
                <span>🏢</span>
                <h3>No dealerships found</h3>
                <p>Add dealerships using the Django admin panel.</p>
                <a href="http://127.0.0.1:8000/admin/" target="_blank"
                   rel="noreferrer">Open Django Admin ↗</a>
              </div>
            ) : (
              <div className="dealer-grid">
                {dealers.map(dealer => (
                  <article className="dealer-card" key={dealer.id}>
                    <div className="dealer-icon">🏢</div>
                    <span className="tag">{dealer.state}</span>
                    <h3>{dealer.full_name}</h3>
                    <p>📍 {dealer.city}, {dealer.state}</p>
                    <p className="address">{dealer.address || "Dealership"}</p>
                    <button className="outline"
                      onClick={() => openDealer(dealer)}>
                      View Details →
                    </button>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {page === "details" && selected && (
          <section className="panel">
            <button className="back" onClick={() => setPage("dealers")}>
              ← Back to dealers
            </button>
            <span className="eyebrow">DEALERSHIP DETAILS</span>
            <h2>{selected.full_name}</h2>
            <p>📍 {selected.address ? `${selected.address}, ` : ""}
              {selected.city}, {selected.state} {selected.zip}</p>
            <h3>Customer reviews ({reviews.length})</h3>
            {reviews.length ? reviews.map(item => (
              <article className="review-card" key={item.id}>
                <div className="review-title">
                  <strong>{item.name || "Customer"}</strong>
                  <span className={`sentiment ${item.sentiment}`}>
                    {item.sentiment || "Review"}
                  </span>
                </div>
                <p>{item.review}</p>
                <small>{item.purchase ? "Purchased a vehicle" : "Visitor"}</small>
              </article>
            )) : <p>No reviews yet. Be the first to share your experience.</p>}

            <h3>Write a review</h3>
            <form className="form" onSubmit={submitReview}>
              <label>Your name
                <input value={review.name} onChange={e =>
                  setReview({...review, name: e.target.value})}
                  placeholder="Your name" />
              </label>
              <label>Your experience
                <textarea required value={review.review}
                  onChange={e => setReview({...review, review: e.target.value})}
                  placeholder="Describe your experience..." />
              </label>
              <label className="check">
                <input type="checkbox" checked={review.purchase}
                  onChange={e => setReview({...review, purchase: e.target.checked})} />
                I purchased a vehicle from this dealer
              </label>
              <button className="primary">Submit Review</button>
            </form>
          </section>
        )}

        {page === "register" && (
          <section className="auth panel">
            <span className="eyebrow">JOIN OUR COMMUNITY</span>
            <h2>Create your account</h2>
            <form className="form" onSubmit={register}>
              <label>Username<input required value={form.username}
                onChange={e => setForm({...form, username:e.target.value})} /></label>
              <div className="two-col">
                <label>First Name<input value={form.first_name}
                  onChange={e => setForm({...form, first_name:e.target.value})} /></label>
                <label>Last Name<input value={form.last_name}
                  onChange={e => setForm({...form, last_name:e.target.value})} /></label>
              </div>
              <label>Email<input type="email" value={form.email}
                onChange={e => setForm({...form, email:e.target.value})} /></label>
              <label>Password<input type="password" required value={form.password}
                onChange={e => setForm({...form, password:e.target.value})} /></label>
              <button className="primary">Register</button>
            </form>
            <p>Already registered? <button className="text-button"
              onClick={() => setPage("login")}>Log in</button></p>
          </section>
        )}

        {page === "login" && (
          <section className="auth panel">
            <span className="eyebrow">WELCOME BACK</span>
            <h2>Login to AutoReview</h2>
            <form className="form" onSubmit={signIn}>
              <label>Username<input required value={login.username}
                onChange={e => setLogin({...login, username:e.target.value})} /></label>
              <label>Password<input type="password" required value={login.password}
                onChange={e => setLogin({...login, password:e.target.value})} /></label>
              <button className="primary">Login</button>
            </form>
            <p>New here? <button className="text-button"
              onClick={() => setPage("register")}>Create an account</button></p>
          </section>
        )}
      </main>

      <footer>
        <div className="brand">🚘 AutoReview</div>
        <p>Helping drivers make informed decisions.</p>
        <div className="footer-links">
          <a href="/About.html">About</a>
          <a href="/Contact.html">Contact</a>
        </div>
        <small>© 2026 AutoReview. Built for car buyers.</small>
      </footer>
    </div>
  );
}
