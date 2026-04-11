
Developer Plan Trial
🔌 Connect your
BigQuery
,
Databricks
, or
Snowflake
Data Plane
Select plan

Search
Ctrl+K



9+

portia.m.jefferson@gmail.com's Instance
User avatar
Conversations
Applications
Filter...
Fraud Monitoring Dashboard
Portia
·
1 day ago
·
Saved




Fraud Monitoring Dashboard
Preview
Code
Open in Portia


JSX
227 lines

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Cell,
} from 'recharts';
import { AlertTriangle, BarChart3, LineChart as LineChartIcon, RefreshCw, Shield, Users } from 'lucide-react';

const CONNECTION = 'data_plane_fabric';
const RISK_COLORS = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#22c55e',
};

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value);
const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);

const normalizeDistribution = (rows) =>
  rows.map((row) => ({
    overall_risk_score: row.overall_risk_score,
    record_count: Number(row.record_count || 0),
  }));

const normalizeHighRiskUsers = (rows) =>
  rows.map((row) => ({
    user_id: row.user_id,
    high_risk_records: Number(row.high_risk_records || 0),
    total_high_risk_amount: Number(row.total_high_risk_amount || 0),
  }));

const normalizeTrend = (rows) =>
  rows.map((row) => ({
    transaction_id: String(row.transaction_id),
    amount: Number(row.amount || 0),
    overall_risk_score: row.overall_risk_score,
  }));

export default function App() {
  const [distribution, setDistribution] = useState([]);
  const [highRiskUsers, setHighRiskUsers] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const distributionResult = await window.ascend.runQuery(
        `SELECT
            overall_risk_score,
            COUNT(*) AS record_count
         FROM {{ ref('fraud_risk_dataset', flow='fraud_detection') }}
         GROUP BY overall_risk_score
         ORDER BY CASE overall_risk_score WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END`,
        { connection: CONNECTION }
      );

      const highRiskUsersResult = await window.ascend.runQuery(
        `SELECT
            user_id,
            COUNT(*) AS high_risk_records,
            SUM(CAST(amount AS FLOAT)) AS total_high_risk_amount
         FROM {{ ref('fraud_risk_dataset', flow='fraud_detection') }}
         WHERE overall_risk_score = 'HIGH'
         GROUP BY user_id
         ORDER BY high_risk_records DESC, total_high_risk_amount DESC, user_id`,
        { connection: CONNECTION }
      );

      const trendResult = await window.ascend.runQuery(
        `SELECT
            CAST(transaction_id AS NVARCHAR(MAX)) AS transaction_id,
            CAST(amount AS FLOAT) AS amount,
            overall_risk_score
         FROM {{ ref('fraud_risk_dataset', flow='fraud_detection') }}
         ORDER BY transaction_id`,
        { connection: CONNECTION }
      );

      setDistribution(normalizeDistribution(distributionResult.rows || []));
      setHighRiskUsers(normalizeHighRiskUsers(highRiskUsersResult.rows || []));
      setTrend(normalizeTrend(trendResult.rows || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fraud dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = useMemo(() => {
    const totalRecords = distribution.reduce((sum, row) => sum + row.record_count, 0);
    const highRiskCount = distribution.find((row) => row.overall_risk_score === 'HIGH')?.record_count || 0;
    const totalHighRiskAmount = highRiskUsers.reduce((sum, row) => sum + row.total_high_risk_amount, 0);
    return { totalRecords, highRiskCount, totalHighRiskAmount };
  }, [distribution, highRiskUsers]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-400" />
              Fraud Monitoring Dashboard
            </h1>
            <p className="text-slate-400 mt-2">
              Simple monitoring view for fraud scoring volume, high-risk users, and transaction amount patterns.
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-sm text-slate-400">Total records</div>
            <div className="text-3xl font-semibold mt-2">{formatNumber(summary.totalRecords)}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-sm text-slate-400">High-risk records</div>
            <div className="text-3xl font-semibold mt-2 text-red-400">{formatNumber(summary.highRiskCount)}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:col-span-2">
            <div className="text-sm text-slate-400">Total high-risk transaction amount</div>
            <div className="text-3xl font-semibold mt-2 text-amber-300">{formatCurrency(summary.totalHighRiskAmount)}</div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-semibold">Overall Risk Distribution</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution}>
                  <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                  <XAxis dataKey="overall_risk_score" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="record_count" radius={[8, 8, 0, 0]}>
                    {distribution.map((entry) => (
                      <Cell key={entry.overall_risk_score} fill={RISK_COLORS[entry.overall_risk_score] || '#0ea5e9'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold">High-Risk Transactions by User</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={highRiskUsers} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <YAxis dataKey="user_id" type="category" stroke="#94a3b8" fontSize={12} width={60} />
                  <Tooltip formatter={(value) => formatNumber(Number(value || 0))} />
                  <Legend />
                  <Bar dataKey="high_risk_records" name="High-risk records" fill="#f97316" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <LineChartIcon className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold">Transaction Amount Trend by Risk Level</h2>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                <XAxis dataKey="transaction_id" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip formatter={(value) => formatCurrency(Number(value || 0))} />
                <Legend />
                <Line type="monotone" dataKey="amount" name="Transaction amount" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
            <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500" /> HIGH</span>
            <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500" /> MEDIUM</span>
            <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500" /> LOW</span>
            <span>Use hover to inspect each transaction amount.</span>
          </div>
        </section>
      </div>
    </div>
  );
}
Ascend.io | portia.m.jefferson@gmail.com's Instance
