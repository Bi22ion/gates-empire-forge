import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body style={{ margin: 0, backgroundColor: '#000', color: '#fff', fontFamily: 'monospace' }}>
          <nav style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '20px 50px', 
            borderBottom: '1px solid #22c55e', 
            backgroundColor: '#050505' 
          }}>
            <div style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '1px' }}>GATES_EMPIRE</div>
            <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
              <a href="/" style={{ color: '#fff', textDecoration: 'none' }}>[ AUDIT ]</a>
              <a href="/leaderboard" style={{ color: '#fff', textDecoration: 'none' }}>[ LEADERBOARD ]</a>
              <SignedOut>
                <SignInButton mode="modal">
                  <button style={{ 
                    background: 'transparent', 
                    border: '1px solid #22c55e', 
                    color: '#22c55e', 
                    cursor: 'pointer', 
                    padding: '8px 15px',
                    fontFamily: 'monospace' 
                  }}>LOGIN</button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <a href="/profile" style={{ color: '#fff', textDecoration: 'none' }}>[ PROFILE ]</a>
                <UserButton />
              </SignedIn>
            </div>
          </nav>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}