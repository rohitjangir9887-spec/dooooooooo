import ErrorPage from './ErrorPage'

export default function AuthError({ code = 401 }) {
  return <ErrorPage code={code} />
}
