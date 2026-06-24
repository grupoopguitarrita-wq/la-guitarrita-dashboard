import Q2DashboardView from "@/components/dashboard/Q2DashboardView"
import { getQ2Locations } from "@/lib/q2-data"

// Always read fresh data from Supabase (no static caching).
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const data = await getQ2Locations("Q2")
  return <Q2DashboardView data={data} />
}
