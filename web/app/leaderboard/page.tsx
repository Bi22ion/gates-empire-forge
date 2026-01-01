import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function LeaderboardPage() {
  // Fetch audits from the Gates Empire database
  const audits = await prisma.audit.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '50px', fontFamily: 'monospace' }}>
      <h1 style={{ color: '#22c55e', borderBottom: '1px solid #22c55e', paddingBottom: '10px' }}>
        GATES_EMPIRE // GLOBAL_LEADERBOARD
      </h1>
      <table style={{ width: '100%', marginTop: '30px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#666', borderBottom: '1px solid #333' }}>
            <th style={{ padding: '10px' }}>REPOSITORY</th>
            <th style={{ padding: '10px' }}>VERIFIED_XP</th>
            <th style={{ padding: '10px' }}>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {audits.map((audit) => (
            <tr key={audit.id} style={{ borderBottom: '1px solid #111' }}>
              <td style={{ padding: '15px', color: '#22c55e' }}>{audit.repoUrl}</td>
              <td style={{ padding: '15px', fontWeight: 'bold' }}>{audit.xpScore} XP</td>
              <td style={{ padding: '15px', color: '#888' }}>{audit.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {audits.length === 0 && <p style={{ marginTop: '20px', color: '#444' }}>NO_DATA_FOUND: EMPIRE_AWAITING_INPUT</p>}
    </div>
  );
}