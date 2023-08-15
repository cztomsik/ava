export const Button = ({ class: className = "", submit = false, ...props }) => {
  props.type = submit ? "submit" : "button"
  props.class = `btn ${submit ? "btn-primary" : "btn-secondary"} ${className}`

  return <button {...props} />
}
