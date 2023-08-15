export const PageHeader = ({ title, description, children = null }) => {
  return (
    <header class="bg-body border-bottom">
      <div class="container d-flex align-items-center">
        <h2 class="my-3 fs-5 fw-light">
          {title}
          <small class="ms-4 fs-6 text-secondary">{description}</small>
        </h2>

        {children}
      </div>
    </header>
  )
}
