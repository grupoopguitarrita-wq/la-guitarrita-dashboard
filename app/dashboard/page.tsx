import DashboardView from "@/components/dashboard/DashboardView"
import { getDashboardByPeriod } from "@/lib/dashboard-data"

// Always read fresh data from Supabase (no static caching).
export const dynamic = "force-dynamic"

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ year?: string; quarter?: string }> }) {
  const params = await searchParams
  const year = Number(params.year) || 2026
  const quarter = ["Q1", "Q2", "Q3", "Q4"].includes(params.quarter ?? "") ? params.quarter! : "Q3"
  const dashboard = await getDashboardByPeriod(year, quarter)
  return <DashboardView dashboard={dashboard} initialYear={year} initialQuarter={quarter} />
}
