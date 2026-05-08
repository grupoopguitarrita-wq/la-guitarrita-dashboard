'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, TrendingDown } from 'lucide-react'
import type { AuditWithLocation } from '@/app/dashboard/page'
import type { Location } from '@/types/database'

type RankingListProps = {
  audits: AuditWithLocation[]
  locations: Location[]
}

type LocationRanking = {
  locationId: string
  locationName: string
  avgScore: number
  auditCount: number
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-600'
  if (score >= 75) return 'text-blue-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function getScoreBgColor(score: number): string {
  if (score >= 90) return 'bg-emerald-50'
  if (score >= 75) return 'bg-blue-50'
  if (score >= 60) return 'bg-amber-50'
  return 'bg-red-50'
}

function getRankBadge(rank: number): { icon: React.ReactNode; bg: string } {
  if (rank === 1) {
    return { icon: <Trophy className="h-4 w-4 text-amber-500" />, bg: 'bg-amber-50' }
  }
  if (rank === 2) {
    return { icon: <span className="text-xs font-bold text-slate-400">2</span>, bg: 'bg-slate-50' }
  }
  if (rank === 3) {
    return { icon: <span className="text-xs font-bold text-amber-700">3</span>, bg: 'bg-amber-50/50' }
  }
  return { icon: <span className="text-xs font-medium text-muted-foreground">{rank}</span>, bg: 'bg-muted' }
}

export function RankingList({ audits, locations }: RankingListProps) {
  const rankings = useMemo((): LocationRanking[] => {
    const locationData: Record<string, { total: number; count: number; name: string }> = {}

    for (const audit of audits) {
      // Calculate effective global score
      let effectiveGlobal = audit.global_score
      if (effectiveGlobal === null) {
        const scores = [audit.salon_score, audit.cocina_score, audit.calidad_score]
          .filter((s): s is number => s !== null)
        effectiveGlobal = scores.length > 0
          ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
          : null
      }

      if (effectiveGlobal === null) continue

      const locId = audit.location_id
      if (!locationData[locId]) {
        locationData[locId] = { total: 0, count: 0, name: audit.location.name }
      }
      locationData[locId].total += effectiveGlobal
      locationData[locId].count += 1
    }

    const rankings: LocationRanking[] = []
    for (const [locationId, data] of Object.entries(locationData)) {
      rankings.push({
        locationId,
        locationName: data.name,
        avgScore: Math.round(data.total / data.count),
        auditCount: data.count
      })
    }

    return rankings.sort((a, b) => b.avgScore - a.avgScore)
  }, [audits])

  if (rankings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking de Locales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No hay datos para mostrar
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          Ranking de Locales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rankings.map((ranking, index) => {
            const rank = index + 1
            const badge = getRankBadge(rank)
            const isLast = rank === rankings.length && rankings.length > 1

            return (
              <div
                key={ranking.locationId}
                className={`flex items-center gap-3 p-3 rounded-lg ${getScoreBgColor(ranking.avgScore)}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${badge.bg}`}>
                  {badge.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate flex items-center gap-2">
                    {ranking.locationName}
                    {isLast && <TrendingDown className="h-4 w-4 text-red-500" />}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ranking.auditCount} auditoria{ranking.auditCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className={`text-lg font-bold ${getScoreColor(ranking.avgScore)}`}>
                  {ranking.avgScore}%
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
