// import { Link } from 'react-router-dom'

// const Register = () => {
//   return (
//     <main className="auth-page">
//       <section className="auth-card" aria-labelledby="register-title">
//         <div className="brand-mark" aria-hidden="true">C</div>
//         <p className="eyebrow">Get started</p>
//         <h1 id="register-title">Create your account</h1>
//         <p className="auth-intro">Set up your personal space in just a few steps.</p>

//         <form className="auth-form">
//           <div className="field-row">
//             <div className="field-group">
//               <label htmlFor="first-name">First name</label>
//               <input id="first-name" name="firstName" type="text" autoComplete="given-name" placeholder="Alex" required />
//             </div>
//             <div className="field-group">
//               <label htmlFor="last-name">Last name</label>
//               <input id="last-name" name="lastName" type="text" autoComplete="family-name" placeholder="Morgan" required />
//             </div>
//           </div>

//           <label htmlFor="register-email">Email address</label>
//           <input id="register-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />

//           <label htmlFor="register-password">Password</label>
//           <input id="register-password" name="password" type="password" autoComplete="new-password" placeholder="Create a password" required />

//           <button className="auth-button" type="submit">Create account</button>
//         </form>

//         <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
//       </section>
//     </main>
//   )
// }

// export default Register




import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const Register = () => {
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email_id, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      const response = await axios.post(
        //  "https://chatgpt-prjct-1-cohrat-2.onrender.com"/api/auth/register",
          'https://chatgpt-prjct-1-cohrat-1.onrender.com/api/auth/register',
        {
          email_id: email_id,
          fullname: {
            firstname: firstName,
            lastname: lastName
          },
          password: password
        },
        {
          withCredentials: true
        }
      )

      console.log(response.data)

      navigate('/')

    } catch (error) {
      console.log('Register error:', error)

      setError(
        error.response?.data?.message ||
        'Registration failed'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section
        className="auth-card"
        aria-labelledby="register-title"
      >
        <div
          className="brand-mark"
          aria-hidden="true"
        >
          C
        </div>

        <p className="eyebrow">
          Get started
        </p>

        <h1 id="register-title">
          Create your account
        </h1>

        <p className="auth-intro">
          Set up your personal space in just a few
          steps.
        </p>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <div className="field-row">

            <div className="field-group">
              <label htmlFor="first-name">
                First name
              </label>

              <input
                id="first-name"
                name="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="Alex"
                value={firstName}
                onChange={(e) =>
                  setFirstName(e.target.value)
                }
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="last-name">
                Last name
              </label>

              <input
                id="last-name"
                name="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Morgan"
                value={lastName}
                onChange={(e) =>
                  setLastName(e.target.value)
                }
                required
              />
            </div>

          </div>

          <label htmlFor="register-email">
            Email address
          </label>

          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email_id}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <label htmlFor="register-password">
            Password
          </label>

          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}

          <button
            className="auth-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Creating account...'
              : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">
            Log in
          </Link>
        </p>
      </section>
    </main>
  )
}

export default Register