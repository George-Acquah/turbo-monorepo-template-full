import { ClaimPage } from '@/views/claim';

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ClaimPage token={token} />;
}
