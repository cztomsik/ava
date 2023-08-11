/**
 * Small wrapper around a form element to prevent default submission
 */
export const Form = ({ onSubmit, ...props }) => {
  const handleSubmit = event => {
    event.preventDefault()
    onSubmit()
  }

  return <form onSubmit={handleSubmit} {...props} />
}
