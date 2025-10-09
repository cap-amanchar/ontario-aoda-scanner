export default function HomePage() {
  return (
    <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }}>ModernA11y</h1>
      <p style={{ fontSize: '24px', color: '#6b7280', marginBottom: '40px' }}>
        Ontario AODA Accessibility Scanner
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}
      >
        <div
          style={{
            padding: '24px',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
            🔍 Chrome Extension
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>
            Scan any website directly from your browser
          </p>
          <a
            href="/scan"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
            }}
          >
            Learn More
          </a>
        </div>

        <div
          style={{
            padding: '24px',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
            📊 Dashboard
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>
            Track your compliance progress over time
          </p>
          <a
            href="/dashboard"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
            }}
          >
            View Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
