'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList, Clock, CheckCircle, TrendingUp, AlertTriangle, XCircle } from 'lucide-react'
import type { AuditWithLocation } from '@/app/dashboard/page'
import type { Location } from '@/types/database'

type SummaryCardsProps = {
  audits: AuditWithLocation[]
  locations: Location[]
}

function getScoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground'
  if (score >= 90) return 'text-emerald-600'
  if (score >= 75) return 'text-blue-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function getScoreBgColor(score: number | null): string {
  if (score === null) return 'bg-muted'
  if (score >= 90) return 'bg-emerald-50'
  if (score >= 75) return 'bg-blue-50'
  if (score >= 60) return 'bg-amber-50'
  return 'bg-red-50'
}

function calculateEffectiveGlobalScore(audit: AuditWithLocation): number | null {
  // If global_score exists, use it
  if (audit.global_score !== null) {
    return audit.global_score
  }
  
  // Otherwise, calculate from available area scores
  const scores = [audit.salon_score, audit.cocina_score, audit.calidad_score].filter(
    (s): s is number => s !== null
  )
  
  if (scores.length === 0) return null
  
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
}

export function SummaryCards({ audits, locations }: SummaryCardsProps) {
  const stats = useMemo(() => {
    const total = audits.length
    const inProgress = audits.filter(a => a.status === 'in_progress').length
    const submitted = audits.filter(a => a.status === 'submitted').length

    // Calculate total "No cumple" findings from noCumpleCount field
    const totalNoCumple = audits.reduce((sum, a) => sum + (a.noCumpleCount || 0), 0)

    // Calculate average global score (only from audits with scores)
    const auditsWithScores = audits
      .map(a => calculateEffectiveGlobalScore(a))
      .filter((s): s is number => s !== null)
    
    const avgGlobalScore = auditsWithScores.length > 0
      ? Math.round(auditsWithScores.reduce((sum, s) => sum + s, 0) / auditsWithScores.length)
      : null

    // Find worst performing location
    const locationScores: Record<string, { total: number; count: number; name: string }> = {}
    
    for (const audit of audits) {
      const score = calculateEffectiveGlobalScore(audit)
      if (score === null) continue
      
      const locId = audit.location_id
      if (!locationScores[locId]) {
        locationScores[locId] = { total: 0, count: 0, name: audit.location.name }
      }
      locationScores[locId].total += score
      locationScores[locId].count += 1
    }

    let worstLocation: { name: string; score: number } | null = null
    
    for (const [, data] of Object.entries(locationScores)) {
      const avgScore = Math.round(data.total / data.count)
      if (worstLocation === null || avgScore < worstLocation.score) {
        worstLocation = { name: data.name, score: avgScore }
      }
    }

    return {
      total,
      inProgress,
      submitted,
      totalNoCumple,
      avgGlobalScore,
      worstLocation
    }
  }, [audits])

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {/* Total Audits */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total auditorias</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* In Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
              <p className="text-xs text-muted-foreground">En progreso</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submitted */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.submitted}</p>
              <p className="text-xs text-muted-foreground">Enviadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Score */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getScoreBgColor(stats.avgGlobalScore)}`}>
              <TrendingUp className={`h-5 w-5 ${getScoreColor(stats.avgGlobalScore)}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${getScoreColor(stats.avgGlobalScore)}`}>
                {stats.avgGlobalScore !== null ? `${stats.avgGlobalScore}%` : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground">Promedio global</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total No Cumple */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stats.totalNoCumple > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
              <XCircle className={`h-5 w-5 ${stats.totalNoCumple > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${stats.totalNoCumple > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {stats.totalNoCumple}
              </p>
              <p className="text-xs text-muted-foreground">No cumple</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
