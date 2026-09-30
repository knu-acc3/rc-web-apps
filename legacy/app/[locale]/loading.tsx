export default function LocaleLoading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      style={{
        minHeight: '50vh',
        padding: '20px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ height: 38, width: '45%', borderRadius: 14, background: 'rgba(127,127,127,0.18)', marginBottom: 18 }} />
        <div style={{ height: 52, borderRadius: 16, background: 'rgba(127,127,127,0.12)', marginBottom: 18 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} style={{ height: 122, borderRadius: 14, background: 'rgba(127,127,127,0.10)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
