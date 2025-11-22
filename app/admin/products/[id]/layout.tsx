// Layout for dynamic route - exports generateStaticParams for static export
export async function generateStaticParams() {
  // Return empty array for client-side dynamic routes
  // This satisfies Next.js static export requirement
  return [];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

