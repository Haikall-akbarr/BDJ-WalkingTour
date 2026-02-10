
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  TrendingUp, 
  Users, 
  Map, 
  DollarSign, 
  CalendarClock,
  UserPlus
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts"

const STATS = [
  { label: "Total Income", value: "Rp 12.5M", icon: DollarSign, trend: "+12%", color: "text-green-600" },
  { label: "Total Bookings", value: "184", icon: Users, trend: "+5%", color: "text-blue-600" },
  { label: "Active Tours", value: "8", icon: Map, trend: "Stable", color: "text-primary-foreground" }
];

const REVENUE_DATA = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
];

const UNASSIGNED_TOURS = [
  { id: "t1", name: "Heritage Trail", date: "22 Jan 2024", time: "09:00 AM", pax: 12 },
  { id: "t2", name: "Kuin Floating Market", date: "23 Jan 2024", time: "05:30 AM", pax: 8 },
  { id: "t3", name: "Pacinan Night Walk", date: "25 Jan 2024", time: "07:00 PM", pax: 15 },
];

const GUIDES = [
  { id: "g1", name: "Andi Saputra" },
  { id: "g2", name: "Budi Santoso" },
  { id: "g3", name: "Siti Aminah" },
  { id: "g4", name: "Diana Putri" },
];

export default function OwnerDashboard() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Business Monitoring</h1>
          <p className="text-muted-foreground">Real-time overview of JelajahBorneoKu operations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Reports</Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Monthly Summary</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STATS.map((stat, idx) => (
          <Card key={idx} className="border-none shadow-md">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className={`text-xs ${stat.color} flex items-center gap-1`}>
                  <TrendingUp className="h-3 w-3" /> {stat.trend} this month
                </p>
              </div>
              <div className="bg-primary/10 p-3 rounded-xl">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Income Overview</CardTitle>
            <CardDescription>Monthly revenue growth visualization.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f5f5f5'}} />
                <Bar dataKey="value" fill="#98DDCA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Guide Assignment Section */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-secondary" /> 
              Upcoming Tours (Assign Guides)
            </CardTitle>
            <CardDescription>Allocate resources for upcoming schedules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {UNASSIGNED_TOURS.map((tour) => (
              <div key={tour.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-slate-50 gap-4">
                <div className="space-y-1">
                  <p className="font-bold">{tour.name}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{tour.date}</span>
                    <span>•</span>
                    <span>{tour.time}</span>
                    <span>•</span>
                    <Badge variant="outline" className="text-[10px] py-0">{tour.pax} Pax</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select>
                    <SelectTrigger className="w-[180px] bg-white">
                      <SelectValue placeholder="Select Guide" />
                    </SelectTrigger>
                    <SelectContent>
                      {GUIDES.map(guide => (
                        <SelectItem key={guide.id} value={guide.id}>{guide.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1">
                    <UserPlus className="h-3 w-3" /> Assign
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
