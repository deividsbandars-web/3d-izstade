'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Users, MousePointer2, Download, CreditCard, TrendingUp, Zap, Clock, ShieldCheck 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProDashboard() {
  const { id } = useParams();
  const [overview, setOverview] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>([]);
  const [billing, setBilling] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const baseUrl = 'http://localhost:3000/api';
      const [oRes, aRes, bRes] = await Promise.all([
        fetch(`${baseUrl}/dashboard/overview?sponsorId=${id}`),
        fetch(`${baseUrl}/dashboard/analytics?sponsorId=${id}`),
        fetch(`${baseUrl}/dashboard/billing?sponsorId=${id}`)
      ]);
      setOverview(await oRes.json());
      setAnalytics(await aRes.json());
      setBilling(await bRes.json());
    };
    fetchData();
  }, [id]);

  const handleUpgrade = async (priceId: string) => {
    const res = await fetch('http://localhost:3000/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sponsorId: id, priceId })
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  if (!overview || !billing) return <div className="p-8 flex items-center justify-center min-h-screen">Loading Pro Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-8 font-sans">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Sponsor Portal <span className="text-blue-600">PRO</span>
          </h1>
          <p className="text-gray-500 font-medium">Real-time performance & monetization</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            {overview.liveVisitors} LIVE VISITORS
          </div>
          <button className="bg-white border shadow-sm px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-50 transition">
            Export Report
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Visits', value: overview.totalVisits, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Interactions', value: overview.totalClicks + overview.totalDownloads, icon: MousePointer2, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Avg Session', value: '4m 32s', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Total Spent', value: `$${overview.totalSpent}`, icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
        ].map((kpi, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={kpi.label} 
            className="bg-white p-6 rounded-2xl border shadow-sm flex items-start justify-between"
          >
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
              <h3 className="text-3xl font-black mt-1 text-gray-900">{kpi.value}</h3>
            </div>
            <div className={`${kpi.bg} ${kpi.color} p-3 rounded-xl`}>
              <kpi.icon size={24} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-900">Traffic Analysis</h3>
            <select className="bg-gray-50 border-none text-sm font-bold rounded-lg px-3 py-1">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="visits" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorVisits)" />
                <Area type="monotone" dataKey="interactions" stroke="#9333ea" strokeWidth={4} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription & Billing */}
        <div className="space-y-6">
          <div className="bg-gray-900 text-white p-8 rounded-3xl relative overflow-hidden">
            <Zap className="absolute -right-4 -top-4 w-32 h-32 text-white/5 rotate-12" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-gray-400">Current Plan</h3>
              <h2 className="text-3xl font-black mt-1 flex items-center gap-2">
                {billing.subscription?.status === 'active' ? 'INTERACTIVE' : 'FREE'}
                <ShieldCheck className="text-blue-400" />
              </h2>
              <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex justify-between text-sm mb-2">
                  <span>Pay-per-visitor</span>
                  <span className="font-bold">$0.50 / entry</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[65%]" />
                </div>
              </div>
              <button 
                onClick={() => handleUpgrade('price_basic_id')}
                className="w-full mt-8 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-black transition"
              >
                UPGRADE NOW
              </button>
            </div>
          </div>

          <div className="bg-white border p-8 rounded-3xl shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-6">Recent Payments</h3>
            <div className="space-y-4">
              {billing.payments?.slice(0, 3).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold text-gray-900">{p.type}</p>
                    <p className="text-xs text-gray-500 font-medium">{new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900">${p.amount}</p>
                    <p className="text-[10px] text-green-600 font-bold uppercase">{p.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
