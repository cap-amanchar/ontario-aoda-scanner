export default function ScanPage() {
  return (
    <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px' }}>
        Website Scanner
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>
        Enter a URL to scan for Ontario AODA compliance
      </p>

      <div
        style={{
          padding: '24px',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          backgroundColor: '#f9fafb',
        }}
      >
        <p style={{ textAlign: 'center', color: '#6b7280' }}>
          🚧 Web scanner coming soon. Use the Chrome extension for now!
        </p>
      </div>
    </main>
  );
}
