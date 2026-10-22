export function ScanPrompt({ message }: { message: string }) {
  return (
    <div className="card">
      <h1>Scan to check in</h1>
      <p className="subtitle">{message}</p>
    </div>
  );
}
