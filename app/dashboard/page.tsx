import Q2DashboardView from "@/components/dashboard/Q2DashboardView"
import { getQ2Dashboard } from "@/lib/q2-data"

// Always read fresh data from Supabase (no static caching).
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const dashboard = await getQ2Dashboard("Q2")
  return <Q2DashboardView dashboard={dashboard} />
}
