import { motion } from 'framer-motion'
import { Scissors, Server, Lock } from 'lucide-react'
import { navigate } from '../../services/navigation.js'

const ERRORS = {
  400: { headline: 'Bad Request',        name: 'Bad Request',           desc: 'The request was malformed or missing required fields.',    cat: '4XX', catLabel: 'CLIENT ERROR', color: '#C9A84C', rgb: '201,168,76'  },
  401: { headline: 'Access Denied',      name: 'Unauthorized',          desc: 'Sign in to continue. This page requires a valid session.', cat: '4XX', catLabel: 'AUTH ERROR',   color: '#5B9BD5', rgb: '91,155,213'  },
  403: { headline: 'No Entry',           name: 'Forbidden',             desc: "You don't have permission to view this page.",             cat: '4XX', catLabel: 'AUTH ERROR',   color: '#5B9BD5', rgb: '91,155,213'  },
  404: { headline: 'Page Not Found',     name: 'Not Found',             desc: "The page you're looking for doesn't exist in the admin.",  cat: '4XX', catLabel: 'CLIENT ERROR', color: '#C9A84C', rgb: '201,168,76'  },
  500: { headline: 'Something Broke',    name: 'Internal Server Error', desc: "Something went wrong on our end. We're on it.",            cat: '5XX', catLabel: 'SERVER ERROR', color: '#E05555', rgb: '224,85,85'    },
  502: { headline: 'Bad Gateway',        name: 'Bad Gateway',           desc: 'The upstream service is currently unreachable.',           cat: '5XX', catLabel: 'SERVER ERROR', color: '#E05555', rgb: '224,85,85'    },
  503: { headline: 'Temporarily Closed', name: 'Service Unavailable',   desc: "The service is briefly offline for maintenance.",          cat: '5XX', catLabel: 'SERVER ERROR', color: '#E05555', rgb: '224,85,85'    },
  504: { headline: 'Request Timed Out',  name: 'Gateway Timeout',       desc: 'The server took too long to respond. Try again.',          cat: '5XX', catLabel: 'SERVER ERROR', color: '#E05555', rgb: '224,85,85'    },
}

function getIcon(code) {
  if (code === 401 || code === 403) return <Lock size={26} strokeWidth={1.5} />
  if (code >= 500) return <Server size={26} strokeWidth={1.5} />
  return <Scissors size={26} strokeWidth={1.5} />
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

  return (
    <div className="error-page">
      <div className="error-grain" aria-hidden="true" />
      <span className="error-watermark" aria-hidden="true">{code}</span>

      <header className="error-topbar">
        <button
          className="error-wordmark"
          onClick={() => navigate('/admin/dashboard')}
          aria-label="Go to dashboard"
        >
          <span className="error-glyph">B</span>
          <span className="error-logotype">Casa <em>Barbero</em></span>
        </button>
        <div
          className="error-badge"
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
        className="error-center"
        variants={container}
        initial="hidden"
        animate="show"
        role="main"
      >
        <motion.div variants={item}>
          <div
            className="error-icon-circle"
            style={{
              color: err.color,
              borderColor: toHex(err.color, 0.25),
              backgroundColor: toHex(err.color, 0.06),
              '--err-pulse-rgb': err.rgb,
            }}
          >
            {getIcon(code)}
          </div>
        </motion.div>

        <motion.div variants={item}>
          <span className="error-code" style={{ color: err.color }}>{code}</span>
        </motion.div>

        <motion.div variants={item} className="error-razor" aria-hidden="true" />

        <motion.h1 variants={item} className="error-headline">{err.headline}</motion.h1>

        <motion.p variants={item} className="error-status-name">
          HTTP {code} — {err.name}
        </motion.p>

        <motion.p variants={item} className="error-desc">{err.desc}</motion.p>

        <motion.div variants={item} className="error-actions">
          <button
            className="error-btn-primary"
            style={{ backgroundColor: err.color }}
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
          <button
            className="error-btn-ghost"
            onClick={() => navigate('/admin/dashboard')}
          >
            Dashboard
          </button>
        </motion.div>
      </motion.main>

      <footer className="error-foot">
        Casa Barbero Admin &middot; {code} {err.name}
      </footer>
    </div>
  )
}
