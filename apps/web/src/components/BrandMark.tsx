/** Trendit mark — rising trend spark */
export function BrandMark({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <path
        d="M5 22 L12 14 L17 18 L27 7"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="27" cy="7" r="2.5" fill="#E8B84A" />
    </svg>
  )
}

/** Precomputed logo data-URI for WaaP `project.logo` */
export const TRENDIT_LOGO_BASE64 =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTYiIGZpbGw9IiMwQjFGM0EiLz48cGF0aCBkPSJNMTQgNDAgTDI2IDI4IEwzNCAzNCBMNTAgMTYiIHN0cm9rZT0iIzRGNDZFNSIgc3Ryb2tlLXdpZHRoPSI0LjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMTYiIHI9IjQuNSIgZmlsbD0iI0U4Qjg0QSIvPjwvc3ZnPg=='
