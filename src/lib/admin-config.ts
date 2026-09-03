// Team members who can access the admin panel
export const ADMIN_TEAM = [
  { name: 'Syed Muhammad Azan', photo: '/team/syed-az.jpg', role: 'Lead Developer' },
  { name: 'Mariam Zuberi', photo: '/team/mariam-z.png', role: 'Designer' },
  { name: 'Isbah Ali', photo: '/team/isbah-a.png', role: 'Data Analyst' },
  { name: 'Muhammad Safwan', photo: '/team/safwan.png', role: 'Developer' },
];

export function isValidAdminName(name: string): boolean {
  return ADMIN_TEAM.some(m => m.name === name);
}

export function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL || 'admin@wealthwise.ai',
    password: process.env.ADMIN_PASSWORD || 'WealthWiseAdmin@2026',
  };
}
