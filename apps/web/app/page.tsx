export default function HomePage() {
  return (
    <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }}>ComplyCA</h1>
      <p style={{ fontSize: '24px', color: '#6b7280', marginBottom: '40px' }}>
        Ontario AODA Accessibility Scanner
      </p>

      <div
        style={{
          padding: '32px',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          marginBottom: '40px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
          🔍 Chrome Extension
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          Scan any website directly from your browser for AODA compliance and WCAG 2.0 Level AA violations
        </p>
        <a
          href="/scan"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '600',
          }}
        >
          Learn More
        </a>
      </div>

      <div style={{ fontSize: '14px', color: '#9ca3af' }}>
        <p>Developed by Nizar Amanchar for Canada ❤️</p>
      </div>
    </main>
  );
}
