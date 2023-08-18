import { useCallback, useRef } from "preact/hooks"

export const Form = ({ onSubmit, ...props }) => {
  const ref = useRef(null)

  const handleSubmit = useCallback(event => {
    event.preventDefault()
    onSubmit()
  }, [])

  return <form noValidate ref={ref} onSubmit={handleSubmit} {...props} />
}
