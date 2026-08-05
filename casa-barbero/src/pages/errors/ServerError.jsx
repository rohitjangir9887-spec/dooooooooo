import ErrorPage from './ErrorPage'

export default function ServerError({ code = 500 }) {
  return <ErrorPage code={code} />
}
