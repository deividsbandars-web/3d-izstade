'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function SponsorDashboard() {
  const { id } = useParams();
  const [stats, setStats] = useState<any>(null);
  const [billing, setBilling] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [sRes, bRes] = await Promise.all([
        fetch(`http://localhost:3000/api/sponsor/${id}/stats`),
        fetch(`http://localhost:3000/api/sponsor/${id}/billing`)
      ]);
      setStats(await sRes.json());
      setBilling(await bRes.json());
    };
    fetchData();
  }, [id]);

  if (!stats || !billing) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-center border-b pb-4">
        <h1 className="text-3xl font-bold">Sponsor: {id}</h1>
        <div className="text-sm text-gray-500">Last updated: {new Date(billing.last_updated).toLocaleString()}</div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <h2 className="text-sm font-semibold text-blue-600 uppercase">Visits</h2>
          <p className="text-4xl font-black mt-2">{stats.visits}</p>
        </div>
        <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
          <h2 className="text-sm font-semibold text-green-600 uppercase">Revenue Generated</h2>
          <p className="text-4xl font-black mt-2">${billing.total_spent}</p>
        </div>
        <div className="p-6 bg-purple-50 border border-purple-200 rounded-xl">
          <h2 className="text-sm font-semibold text-purple-600 uppercase">Avg Time Spent</h2>
          <p className="text-4xl font-black mt-2">{Math.round(stats.avg_time)}s</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border rounded-xl shadow-sm">
          <h3 className="text-lg font-bold mb-4">Engagement</h3>
          <ul className="space-y-3">
            <li className="flex justify-between"><span>Total Clicks:</span> <span className="font-mono">{stats.clicks}</span></li>
            <li className="flex justify-between"><span>Total Downloads:</span> <span className="font-mono">{stats.downloads}</span></li>
          </ul>
        </div>
        <div className="p-6 bg-white border rounded-xl shadow-sm">
          <h3 className="text-lg font-bold mb-4">Billing Status</h3>
          <ul className="space-y-3">
            <li className="flex justify-between"><span>Total Entries:</span> <span className="font-mono">{billing.total_entries}</span></li>
            <li className="flex justify-between text-red-600 font-bold"><span>Total Charged:</span> <span className="font-mono">${billing.total_spent}</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
