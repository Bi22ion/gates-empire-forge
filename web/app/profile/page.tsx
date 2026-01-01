import { auth, currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function ProfilePage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) return <div>Unauthorized</div>;

  // Fetch only audits belonging to THIS user
  const myAudits = await prisma.audit.findMany({
    where: { userId: userId },
    orderBy: { createdAt: 'desc' }
  });

  const totalXp = myAudits.reduce((acc, audit) => acc + audit.xpScore, 0);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '50px', fontFamily: 'monospace' }}>
      <div style={{ border: '1px solid #22c55e', padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#22c55e' }}>CITIZEN: {user?.username || user?.firstName || "UNKNOWN"}</h1>
        <p style={{ color: '#666' }}>EMPIRE_ID: {userId}</p>
        
        <div style={{ display: 'flex', gap: '20px', margin: '30px 0' }}>
          <div style={{ background: '#111', padding: '20px', flex: 1, border: '1px solid #333' }}>
            <p style={{ margin: 0, color: '#666' }}>RANK_XP</p>
            <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{totalXp.toLocaleString()}</h2>
          </div>
        </div>

        <h3>RECENT_VERIFICATIONS</h3>
        {myAudits.map(audit => (
          <div key={audit.id} style={{ padding: '10px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
            <span>{audit.repoUrl.split('/').pop()}</span>
            <span style={{ color: '#22c55e' }}>+{audit.xpScore} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}