import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import styles from './ErrorPage.module.css'

const ERRORS = {
  400: { headline: 'Bad Request',        name: 'Bad Request',           desc: 'The request was malformed or missing required fields.',    cat: '4XX', catLabel: 'CLIENT ERROR', color: '#c9922a', rgb: '201,146,42' },
  401: { headline: 'Access Denied',      name: 'Unauthorized',          desc: 'Sign in to continue. This page requires a valid session.', cat: '4XX', catLabel: 'AUTH ERROR',   color: '#5b9bd5', rgb: '91,155,213'  },
  403: { headline: 'No Entry',           name: 'Forbidden',             desc: "You don't have permission to view this page.",             cat: '4XX', catLabel: 'AUTH ERROR',   color: '#5b9bd5', rgb: '91,155,213'  },
  404: { headline: 'Page Not Found',     name: 'Not Found',             desc: "The page you're looking for has stepped out for a cut.",   cat: '4XX', catLabel: 'CLIENT ERROR', color: '#c9922a', rgb: '201,146,42' },
  500: { headline: 'Something Broke',    name: 'Internal Server Error', desc: "Something went wrong on our end. We're on it.",            cat: '5XX', catLabel: 'SERVER ERROR', color: '#c85c28', rgb: '200,92,40'   },
  502: { headline: 'Bad Gateway',        name: 'Bad Gateway',           desc: 'The upstream service is currently unreachable.',           cat: '5XX', catLabel: 'SERVER ERROR', color: '#c85c28', rgb: '200,92,40'   },
  503: { headline: 'Temporarily Closed', name: 'Service Unavailable',   desc: "We're briefly offline for maintenance. Back shortly.",     cat: '5XX', catLabel: 'SERVER ERROR', color: '#c85c28', rgb: '200,92,40'   },
  504: { headline: 'Request Timed Out',  name: 'Gateway Timeout',       desc: 'The server took too long to respond. Try again.',          cat: '5XX', catLabel: 'SERVER ERROR', color: '#c85c28', rgb: '200,92,40'   },
}

function ScissorsIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  )
}

function ServerIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function getIcon(code) {
  if (code === 401 || code === 403) return <LockIcon />
  if (code >= 500) return <ServerIcon />
  return <ScissorsIcon />
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 22 } },
}

function toHex(color, opacity) {
  return color + Math.round(opacity * 255).toString(16).padStart(2, '0')
}

export default function ErrorPage({ code = 404 }) {
  const err = ERRORS[code] ?? ERRORS[404]
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.grain} aria-hidden="true" />
      <span className={styles.watermark} aria-hidden="true">{code}</span>

      <header className={styles.topBar}>
        <Link to="/" className={styles.wordmark}>
          <span className={styles.glyph}>B</span>
          <span className={styles.logotype}>Casa <em>Barbero</em></span>
        </Link>
        <div
          className={styles.badge}
          style={{
            color: err.color,
            borderColor: toHex(err.color, 0.28),
            backgroundColor: toHex(err.color, 0.07),
          }}
        >
          {err.cat} · {err.catLabel}
        </div>
      </header>

      <motion.main
        className={styles.center}
        variants={container}
        initial="hidden"
        animate="show"
        role="main"
      >
        <motion.div variants={item}>
          <div
            className={styles.iconCircle}
            style={{
              color: err.color,
              borderColor: toHex(err.color, 0.25),
              backgroundColor: toHex(err.color, 0.06),
              '--pulse-rgb': err.rgb,
            }}
          >
            {getIcon(code)}
          </div>
        </motion.div>

        <motion.div variants={item}>
          <span className={styles.code} style={{ color: err.color }}>{code}</span>
        </motion.div>

        <motion.div variants={item} className={styles.razorRule} aria-hidden="true" />

        <motion.h1 variants={item} className={styles.headline}>{err.headline}</motion.h1>

        <motion.p variants={item} className={styles.statusName}>
          HTTP {code} — {err.name}
        </motion.p>

        <motion.p variants={item} className={styles.desc}>{err.desc}</motion.p>

        <motion.div variants={item} className={styles.actions}>
          <button
            className={styles.btnPrimary}
            style={{ backgroundColor: err.color }}
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
          <Link to="/" className={styles.btnGhost}>Return Home</Link>
        </motion.div>
      </motion.main>

      <footer className={styles.foot}>
        Casa Barbero &middot; {code} {err.name}
      </footer>
    </div>
  )
}
