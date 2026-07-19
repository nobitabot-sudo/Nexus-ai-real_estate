import * as React from "react"
import { useGetCallStats } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { Phone, Clock, PhoneCall, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { formatSecondsToDuration } from "@/lib/formatters"
import { Link } from "wouter"
import { Button } from "@/components/ui/button"

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend 
}: { 
  title: string, 
  value: React.ReactNode, 
  icon: any, 
  description?: string,
  trend?: number
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend !== undefined) && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {trend !== undefined && (
              <span className={trend >= 0 ? "text-green-600 flex items-center" : "text-red-600 flex items-center"}>
                {trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {Math.abs(trend)}%
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

const COLORS = {
  positive: "hsl(142, 71%, 45%)",
  neutral: "hsl(215, 16%, 47%)",
  negative: "hsl(0, 84%, 60%)"
}

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useGetCallStats()
  
  if (isError) {
    return (
      <div className="p-8 w-full flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load statistics</h2>
        <p className="text-muted-foreground">Please try refreshing the page.</p>
      </div>
    )
  }

  const sentimentData = stats ? [
    { name: 'Positive', value: stats.sentimentBreakdown.positive, color: COLORS.positive },
    { name: 'Neutral', value: stats.sentimentBreakdown.neutral, color: COLORS.neutral },
    { name: 'Negative', value: stats.sentimentBreakdown.negative, color: COLORS.negative },
  ].filter(d => d.value > 0) : []

  // Calculate week-over-week trend
  let totalCallsTrend = 0
  if (stats && stats.callsLastWeek > 0) {
    totalCallsTrend = Math.round(((stats.callsThisWeek - stats.callsLastWeek) / stats.callsLastWeek) * 100)
  } else if (stats && stats.callsThisWeek > 0 && stats.callsLastWeek === 0) {
    totalCallsTrend = 100
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">Review your AI agent's performance and call metrics.</p>
        </div>
        <Link href="/calls">
          <Button>View All Calls</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-[120px] rounded-xl" />
            <Skeleton className="h-[120px] rounded-xl" />
            <Skeleton className="h-[120px] rounded-xl" />
            <Skeleton className="h-[120px] rounded-xl" />
          </>
        ) : stats ? (
          <>
            <StatCard 
              title="Total Calls" 
              value={stats.totalCalls} 
              icon={Phone} 
              description="vs last week"
              trend={totalCallsTrend}
            />
            <StatCard 
              title="Answered Rate" 
              value={stats.totalCalls > 0 ? `${Math.round((stats.answeredCalls / stats.totalCalls) * 100)}%` : "0%"} 
              icon={PhoneCall} 
              description={`${stats.answeredCalls} calls answered`}
            />
            <StatCard 
              title="Avg. Duration" 
              value={formatSecondsToDuration(stats.avgDurationSeconds)} 
              icon={Clock} 
              description="across all answered calls"
            />
            <StatCard 
              title="Top Intent" 
              value={stats.topIntents.length > 0 ? stats.topIntents[0] : "None"} 
              icon={TrendingUp} 
              description={stats.topIntents.length > 1 ? `followed by ${stats.topIntents[1]}` : undefined}
            />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Call Volume</CardTitle>
            <CardDescription>Daily call counts over the last period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {isLoading ? (
                <Skeleton className="w-full h-full" />
              ) : stats && stats.callsByDay.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.callsByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]} 
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
                  No call data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentiment</CardTitle>
            <CardDescription>Breakdown of AI assessed caller sentiment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex flex-col items-center justify-center">
              {isLoading ? (
                <Skeleton className="w-[200px] h-[200px] rounded-full" />
              ) : sentimentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value, entry: any) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
                  No sentiment data
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
