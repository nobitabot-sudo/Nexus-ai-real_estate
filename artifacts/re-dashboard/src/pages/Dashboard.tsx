import { useGetCallStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, PhoneIncoming, Clock, TrendingUp, BrainCircuit } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PieChart, Pie, Cell } from "recharts";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetCallStats();

  if (isLoading || !stats) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-2"><CardContent className="p-6 h-[400px]"><Skeleton className="h-full w-full" /></CardContent></Card>
          <Card><CardContent className="p-6 h-[400px]"><Skeleton className="h-full w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  const volumeChange = stats.callsLastWeek > 0 
    ? Math.round(((stats.callsThisWeek - stats.callsLastWeek) / stats.callsLastWeek) * 100) 
    : 0;

  const sentimentData = [
    { name: "Positive", value: stats.sentimentBreakdown.positive, color: "hsl(173 58% 39%)" },
    { name: "Neutral", value: stats.sentimentBreakdown.neutral, color: "hsl(215 16% 47%)" },
    { name: "Negative", value: stats.sentimentBreakdown.negative, color: "hsl(0 84% 60%)" },
  ].filter(d => d.value > 0);

  const formatDuration = (secs: number) => {
    if (!secs) return "0s";
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your AI agent's performance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCalls}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className={`h-3 w-3 ${volumeChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
              <span className={volumeChange >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                {volumeChange >= 0 ? '+' : ''}{volumeChange}%
              </span> from last week
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Answer Rate</CardTitle>
            <PhoneIncoming className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCalls > 0 ? Math.round((stats.answeredCalls / stats.totalCalls) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.answeredCalls} out of {stats.totalCalls} answered
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.avgDurationSeconds || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all answered calls</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary">Top Intent</CardTitle>
            <BrainCircuit className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-foreground leading-tight truncate">
              {stats.topIntents.length > 0 ? stats.topIntents[0] : "None detected"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Most common caller goal</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Call Volume</CardTitle>
            <CardDescription>Daily call activity over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {stats.callsByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.callsByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getMonth()+1}/${d.getDate()}`;
                    }}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    labelFormatter={(val) => new Date(val).toLocaleDateString()}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No call data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Sentiment Breakdown</CardTitle>
            <CardDescription>Overall tone of AI conversations</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex flex-col items-center justify-center relative">
            {sentimentData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} calls`, '']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none pb-4">
                  <span className="text-3xl font-bold">{stats.answeredCalls}</span>
                  <span className="text-xs text-muted-foreground">Total Answered</span>
                </div>
                
                <div className="w-full flex justify-center gap-4 mt-4">
                  {sentimentData.map((s) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No sentiment data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}