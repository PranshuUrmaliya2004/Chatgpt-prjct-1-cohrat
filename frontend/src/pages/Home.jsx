import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <main className="auth-page">
      <section className="auth-card home-card" aria-labelledby="home-title">
        <div className="brand-mark" aria-hidden="true">C</div>
        <p className="eyebrow">Your workspace</p>
        <h1 id="home-title">A calmer place to think.</h1>
        <p className="auth-intro">Welcome to your conversations and ideas. Sign in or create an account to begin.</p>

        <div className="home-actions">
          <Link to="/login" className="auth-button">Log in</Link>
          <Link to="/register" className="auth-button auth-button-secondary">Create account</Link>
        </div>
      </section>
    </main>
  )
}

export default Home