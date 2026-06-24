'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { AuditWithLocation } from '@/app/dashboard/page'

type LocalesGridProps = {
  audits: AuditWithLocation[]
}

type LocaleData = {
  name: string
  salon: number | null
  cocina: number | null
  calidad: number | null
  global: number | null
  auditor: string
  date: string
  status: string
}

function getScoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground'
  if (score >= 90) return 'text-emerald-600'
  if (score >= 75) return 'text-blue-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function getScoreBg(score: number | null): string {
  if (score === null) return 'bg-muted/50'
  if (score >= 90) return 'bg-emerald-500'
  if (score >= 75) return 'bg-blue-500'
  if (score >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

function getGlobalBg(score: number | null): string {
  if (score === null) return 'bg-muted'
  if (score >= 90) return 'bg-emerald-100 border-emerald-300'
  if (score >= 75) return 'bg-blue-100 border-blue-300'
  if (score >= 60) return 'bg-amber-100 border-amber-300'
  return 'bg-red-100 border-red-300'
}

function ScoreBar({ label, score }: { label: string; score: number | null }) {
  const width = score !== null ? `${score}%` : '0%'
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${getScoreColor(score)}`}>
          {score !== null ? `${score}%` : '-'}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${getScoreBg(score)} transition-all duration-500`}
          style={{ width }}
        />
      </div>
    </div>
  )
}

export function LocalesGrid({ audits }: LocalesGridProps) {
  const localesData = useMemo((): LocaleData[] => {
    const localesMap = new Map<string, LocaleData>()
    
    for (const audit of audits) {
      const name = audit.location.name
      
      // If we already have data for this locale, only update if this audit has better/more complete data
      const existing = localesMap.get(name)
      if (existing) {
        // Prefer audit with more complete scores
        const existingScores = [existing.salon, existing.cocina, existing.calidad].filter(s => s !== null).length
        const newScores = [audit.salon_score, audit.cocina_score, audit.calidad_score].filter(s => s !== null).length
        
        if (newScores <= existingScores) continue
      }
      
      // Calculate global if not present
      let globalScore = audit.global_score
      if (globalScore === null) {
        const scores = [audit.salon_score, audit.cocina_score, audit.calidad_score].filter((s): s is number => s !== null)
        if (scores.length > 0) {
          globalScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        }
      }
      
      localesMap.set(name, {
        name,
        salon: audit.salon_score,
        cocina: audit.cocina_score,
        calidad: audit.calidad_score,
        global: globalScore,
        auditor: audit.auditor_name,
        date: audit.audit_date,
        status: audit.status
      })
    }
    
    // Sort by global score descending, then by name
    return Array.from(localesMap.values()).sort((a, b) => {
      if (a.global === null && b.global === null) return a.name.localeCompare(b.name)
      if (a.global === null) return 1
      if (b.global === null) return -1
      if (b.global !== a.global) return b.global - a.global
      return a.name.localeCompare(b.name)
    })
  }, [audits])

  if (localesData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No hay datos de locales disponibles
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-red-600" />
          Resultados por Local ({localesData.length})
        </h2>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500" /> 90+
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500" /> 75-89
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500" /> 60-74
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" /> &lt;60
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {localesData.map((locale, index) => {
          const rank = index + 1
          const isTop3 = rank <= 3
          const isBottom3 = rank > localesData.length - 3 && localesData.length > 6
          
          return (
            <Card 
              key={locale.name} 
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                isTop3 ? 'ring-2 ring-emerald-200' : isBottom3 ? 'ring-1 ring-red-200' : ''
              }`}
            >
              {/* Rank badge */}
              <div className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                rank === 1 ? 'bg-amber-400 text-amber-900' :
                rank === 2 ? 'bg-slate-300 text-slate-700' :
                rank === 3 ? 'bg-amber-600 text-amber-100' :
                'bg-muted text-muted-foreground'
              }`}>
                {rank}
              </div>
              
              <CardContent className="p-4 space-y-4">
                {/* Header */}
                <div className="pr-8">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    {locale.name}
                    {isTop3 && <TrendingUp className="h-4 w-4 text-emerald-600" />}
                    {isBottom3 && <TrendingDown className="h-4 w-4 text-red-600" />}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {locale.auditor} - {new Date(locale.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                  </p>
                </div>
                
                {/* Global Score */}
                <div className={`text-center py-3 rounded-lg border ${getGlobalBg(locale.global)}`}>
                  <p className="text-xs text-muted-foreground mb-1">Global</p>
                  <p className={`text-3xl font-bold ${getScoreColor(locale.global)}`}>
                    {locale.global !== null ? `${locale.global}%` : '-'}
                  </p>
                </div>
                
                {/* Area Scores */}
                <div className="space-y-2">
                  <ScoreBar label="Salon" score={locale.salon} />
                  <ScoreBar label="Cocina" score={locale.cocina} />
                  <ScoreBar label="Calidad" score={locale.calidad} />
                </div>
                
                {/* Status */}
                <div className="flex justify-end">
                  <Badge variant={locale.status === 'submitted' ? 'default' : 'secondary'} className="text-xs">
                    {locale.status === 'submitted' ? 'Enviada' : 'En progreso'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
