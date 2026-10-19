/** Shows why a save failed; renders nothing when there is no error. */
export function FormError({ error }: { error: Error | null }) {
  if (!error) return null
  return (
    <p
      role="alert"
      className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800"
    >
      {error.message || 'Something went wrong. Please try again.'}
    </p>
  )
}
