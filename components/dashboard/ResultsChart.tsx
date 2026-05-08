'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import type { AuditWithLocation } from '@/app/dashboard/page'
import type { Location } from '@/types/database'

type ResultsChartProps = {
  audits: AuditWithLocation[]
  locations: Location[]
}

type ChartData = {
  name: string
  salon: number | null
  cocina: number | null
  calidad: number | null
  global: number | null
}

function getBarColor(score: number | null): string {
  if (score === null) return '#e5e7eb'
  if (score >= 90) return '#059669'
  if (score >= 75) return '#2563eb'
  if (score >= 60) return '#d97706'
  return '#dc2626'
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number | null; color: string }>; label?: string }) => {
  if (!active || !payload) return null

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3">
      <p className="font-medium mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">
            {entry.value !== null ? `${entry.value}%` : 'Pendiente'}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ResultsChart({ audits, locations }: ResultsChartProps) {
  const chartData = useMemo((): ChartData[] => {
    // Group audits by location and calculate average scores
    const locationData: Record<string, {
      salon: number[]
      cocina: number[]
      calidad: number[]
      global: number[]
    }> = {}

    for (const loc of locations) {
      locationData[loc.id] = { salon: [], cocina: [], calidad: [], global: [] }
    }

    for (const audit of audits) {
      const locId = audit.location_id
      if (!locationData[locId]) continue

      if (audit.salon_score !== null) {
        locationData[locId].salon.push(audit.salon_score)
      }
      if (audit.cocina_score !== null) {
        locationData[locId].cocina.push(audit.cocina_score)
      }
      if (audit.calidad_score !== null) {
        locationData[locId].calidad.push(audit.calidad_score)
      }
      
      // Calculate effective global score
      const effectiveGlobal = audit.global_score ?? (() => {
        const scores = [audit.salon_score, audit.cocina_score, audit.calidad_score]
          .filter((s): s is number => s !== null)
        return scores.length > 0
          ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
          : null
      })()
      
      if (effectiveGlobal !== null) {
        locationData[locId].global.push(effectiveGlobal)
      }
    }

    // Convert to chart data
    return locations
      .filter(loc => {
        // Only include locations with at least one audit
        const data = locationData[loc.id]
        return data && (data.salon.length > 0 || data.cocina.length > 0 || 
               data.calidad.length > 0 || data.global.length > 0)
      })
      .map(loc => {
        const data = locationData[loc.id]
        return {
          name: loc.name,
          salon: data.salon.length > 0
            ? Math.round(data.salon.reduce((a, b) => a + b, 0) / data.salon.length)
            : null,
          cocina: data.cocina.length > 0
            ? Math.round(data.cocina.reduce((a, b) => a + b, 0) / data.cocina.length)
            : null,
          calidad: data.calidad.length > 0
            ? Math.round(data.calidad.reduce((a, b) => a + b, 0) / data.calidad.length)
            : null,
          global: data.global.length > 0
            ? Math.round(data.global.reduce((a, b) => a + b, 0) / data.global.length)
            : null,
        }
      })
  }, [audits, locations])

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resultados por Local</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos para mostrar
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resultados por Local</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] overflow-x-auto">
          <ResponsiveContainer width="100%" height="100%" minWidth={chartData.length * 120}>
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value) => <span className="text-sm">{value}</span>}
              />
              <Bar dataKey="salon" name="Salon" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`salon-${index}`} fill={getBarColor(entry.salon)} />
                ))}
              </Bar>
              <Bar dataKey="cocina" name="Cocina" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cocina-${index}`} fill={getBarColor(entry.cocina)} />
                ))}
              </Bar>
              <Bar dataKey="calidad" name="Calidad" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`calidad-${index}`} fill={getBarColor(entry.calidad)} />
                ))}
              </Bar>
              <Bar dataKey="global" name="Global" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`global-${index}`} fill={getBarColor(entry.global)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
