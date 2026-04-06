
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Package, AlertCircle } from 'lucide-react';

type StatusDatum = {
  name: string;
  value: number;
};

type DateDatum = {
  date: string;
  count: number;
};

export default function AdminStatsPage() {
  const firestore = useFirestore();

  const allRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'collectionRequests'), limit(500));
  }, [firestore]);

  const { data: requests, isLoading } = useCollection(allRequestsQuery);

  // 통계 데이터 가공
  const statusCounts = requests?.reduce((acc: any, curr: any) => {
    acc[curr.currentStatus] = (acc[curr.currentStatus] || 0) + 1;
    return acc;
  }, {}) || {};

  const pieData: StatusDatum[] = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value: Number(value),
  }));
  const COLORS = ['#336699', '#3DC2D8', '#FF8C00', '#DC3545', '#10B981', '#6366F1', '#8B5CF6'];

  const dateCounts = requests?.reduce((acc: any, curr: any) => {
    const date = curr.requestDate;
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {}) || {};

  const lineData: DateDatum[] = Object.entries(dateCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count: Number(count) }));

  // 실제 데이터 기반 계산
  const totalRequests = requests?.length || 0;
  const contaminationRate = totalRequests 
    ? (requests!.filter(r => r.isContaminated).length / totalRequests * 100).toFixed(1)
    : "0.0";
  
  const completionRate = totalRequests
    ? (requests!.filter(r => ['납품완료', '병원확인완료', '종결'].includes(r.currentStatus)).length / totalRequests * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">통계 리포트</h1>
        <p className="text-muted-foreground font-medium">실시간 데이터 기반의 운영 성과 및 공정 분석</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">누적 총 요청</p>
              <p className="text-2xl font-black">{totalRequests}건</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">평균 오염물 비중</p>
              <p className="text-2xl font-black">{contaminationRate}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">전체 공정 완료율</p>
              <p className="text-2xl font-black">{completionRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardHeader className="border-b px-6 py-4 flex flex-row items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold">일별 수거 요청 추이</CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[350px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-slate-300 italic">차트 로딩 중...</div>
            ) : lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#336699" strokeWidth={3} dot={{ r: 4, fill: '#336699' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300 text-sm">데이터가 없습니다.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardHeader className="border-b px-6 py-4 flex flex-row items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold">공정 상태별 분포</CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[350px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-slate-300 italic">차트 로딩 중...</div>
            ) : pieData.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full md:w-48 space-y-2 mt-4 md:mt-0">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        <span className="font-medium text-slate-600">{d.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300 text-sm">데이터가 없습니다.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
