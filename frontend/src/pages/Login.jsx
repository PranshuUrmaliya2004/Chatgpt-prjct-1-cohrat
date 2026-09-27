// import { Link } from 'react-router-dom'

// const Login = () => {
//   return (
//     <main className="auth-page">
//       <section className="auth-card" aria-labelledby="login-title">
//         <div className="brand-mark" aria-hidden="true">C</div>
//         <p className="eyebrow">Welcome back</p>
//         <h1 id="login-title">Sign in to your workspace</h1>
//         <p className="auth-intro">Continue where you left off with your conversations.</p>

//         <form className="auth-form">
//           <label htmlFor="login-email">Email address</label>
//           <input id="login-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />

//           <label htmlFor="login-password">Password</label>
//           <input id="login-password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required />

//           <button className="auth-button" type="submit">Log in</button>
//         </form>

//         <p className="auth-switch">New here? <Link to="/register">Create an account</Link></p>
//       </section>
//     </main>
//   )
// }

// export default Login




// import { useState } from 'react'
// import { Link, useNavigate } from 'react-router-dom'
// import axios from 'axios'
// const Login = () => {
//   const navigate = useNavigate()

//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
// const[submit,setSubmit]=useState('')
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')

//   const handleSubmit = async (e) => {
//     e.preventDefault()
// setSubmit(true)

//     axios.post(' origin: "https://chatgpt-prjct-1-cohrat-1.onrender.com"/api/auth/login',{
//         email:form.email,
//         password:form.password
//     },{
//         withCredentials:true
//     }
// ).then((res)=>{

// console.log(res)
// navigate('/')
// }).catch((err)=>{

// console.log(err)
// }).finally(()=>{

// setSubmit(false)
// })

//     setError('')
//     setLoading(true)

    
//   }
// //     try {
// //     //   const response = await fetch(
// //     //     ' origin: "https://chatgpt-prjct-1-cohrat-1.onrender.com"/api/auth/login',
// //     //     {
// //     //       method: 'POST',

// //     //       headers: {
// //     //         'Content-Type': 'application/json',
// //     //       },

// //     //       credentials: 'include',

// //     //       body: JSON.stringify({
// //     //         email,
// //     //         password,
// //     //       }),
// //     //     }
// //     //   )

// //       const data = await response.json()

// //       if (!response.ok) {
// //         throw new Error(
// //           data.message || 'Login failed'
// //         )
// //       }

// //       console.log('Login successful:', data)

// //       navigate('/')
// //     } catch (error) {
// //       setError(error.message)
// //     } finally {
// //       setLoading(false)
// //     }
// //   }

//   return (
//     <main className="auth-page">
//       <section
//         className="auth-card"
//         aria-labelledby="login-title"
//       >
//         <div
//           className="brand-mark"
//           aria-hidden="true"
//         >
//           C
//         </div>

//         <p className="eyebrow">
//           Welcome back
//         </p>

//         <h1 id="login-title">
//           Sign in to your workspace
//         </h1>

//         <p className="auth-intro">
//           Continue where you left off with your
//           conversations.
//         </p>

//         <form
//           className="auth-form"
//           onSubmit={handleSubmit}
//         >
//           <label htmlFor="login-email">
//             Email address
//           </label>

//           <input
//             id="login-email"
//             name="email"
//             type="email"
//             autoComplete="email"
//             placeholder="you@example.com"
//             value={email}
//             onChange={(e) =>
//               setEmail(e.target.value)
//             }
//             required
//           />

//           <label htmlFor="login-password">
//             Password
//           </label>

//           <input
//             id="login-password"
//             name="password"
//             type="password"
//             autoComplete="current-password"
//             placeholder="Enter your password"
//             value={password}
//             onChange={(e) =>
//               setPassword(e.target.value)
//             }
//             required
//           />

//           {error && (
//             <p className="auth-error">
//               {error}
//             </p>
//           )}

//           <button
//             className="auth-button"
//             type="submit"
//             disabled={loading}
//           >
//             {loading ? 'Logging in...' : 'Log in'}
//           </button>
//         </form>

//         <p className="auth-switch">
//           New here?{' '}
//           <Link to="/register">
//             Create an account
//           </Link>
//         </p>
//       </section>
//     </main>
//   )
// }

// export default Login






import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const Login = () => {
  const navigate = useNavigate()

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
        // ' origin: "https://chatgpt-prjct-1-cohrat-2.onrender.com"/api/auth/login',
           "https://chatgpt-prjct-1-cohrat-1.onrender.com/api/auth/login",
        {
          email_id: email_id,
          password: password
        },
        {
          withCredentials: true
        }
      )

      console.log('Login successful:', response.data)

      navigate('/')
    } catch (err) {
      console.log('Login error:', err)

      setError(
        err.response?.data?.message ||
        'Login failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section
        className="auth-card"
        aria-labelledby="login-title"
      >
        <div
          className="brand-mark"
          aria-hidden="true"
        >
          C
        </div>

        <p className="eyebrow">
          Welcome back
        </p>

        <h1 id="login-title">
          Sign in to your workspace
        </h1>

        <p className="auth-intro">
          Continue where you left off with your
          conversations.
        </p>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="login-email">
            Email address
          </label>

          <input
            id="login-email"
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

          <label htmlFor="login-password">
            Password
          </label>

          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
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
              ? 'Logging in...'
              : 'Log in'}
          </button>
        </form>

        <p className="auth-switch">
          New here?{' '}
          <Link to="/register">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  )
}

export default Login