import React from "react";

interface FraudRecord {
  user_id: string;
  transaction_id: string;
  message_id: string;
  amount: number;
  message_text: string;
  transaction_risk_flag: "LOW" | "MEDIUM" | "HIGH";
  message_risk_flag: "LOW" | "MEDIUM" | "HIGH";
  overall_risk_score: "LOW" | "MEDIUM" | "HIGH";
  requires_immediate_review: boolean;
  risk_reason: string;
}

interface DashboardProps {
  data: FraudRecord[];
}

const RISK_COLORS: Record<string, string> = {
  LOW: "#22c55e",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
};

function RiskBadge({ level }: { level: string }) {
  return (
    <span
      style={{
        backgroundColor: RISK_COLORS[level] ?? "#6b7280",
        color: "#fff",
        borderRadius: "4px",
        padding: "2px 8px",
        fontSize: "0.75rem",
        fontWeight: 600,
      }}
    >
      {level}
    </span>
  );
}

function RiskDistribution({ data }: { data: FraudRecord[] }) {
  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  for (const r of data) counts[r.overall_risk_score]++;
  const total = data.length || 1;

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
        Risk Distribution
      </h2>
      {(["HIGH", "MEDIUM", "LOW"] as const).map((level) => (
        <div key={level} style={{ marginBottom: "0.4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <RiskBadge level={level} />
            <span style={{ fontSize: "0.85rem" }}>
              {counts[level]} ({((counts[level] / total) * 100).toFixed(1)}%)
            </span>
          </div>
          <div style={{ background: "#e5e7eb", borderRadius: "4px", height: "8px" }}>
            <div
              style={{
                width: `${(counts[level] / total) * 100}%`,
                background: RISK_COLORS[level],
                borderRadius: "4px",
                height: "100%",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function HighRiskUserCount({ data }: { data: FraudRecord[] }) {
  const highRiskUsers = new Set(
    data.filter((r) => r.requires_immediate_review).map((r) => r.user_id)
  );

  return (
    <div
      style={{
        background: "#fef2f2",
        border: "1px solid #fca5a5",
        borderRadius: "8px",
        padding: "1rem",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <span style={{ fontSize: "2rem" }}>⚠️</span>
      <div>
        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#dc2626" }}>
          {highRiskUsers.size}
        </div>
        <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
          High-Risk Users Requiring Immediate Review
        </div>
      </div>
    </div>
  );
}

function TransactionTrends({ data }: { data: FraudRecord[] }) {
  const sorted = [...data].sort((a, b) =>
    a.transaction_id.localeCompare(b.transaction_id)
  );
  const maxAmount = Math.max(...sorted.map((r) => r.amount), 1);
  const chartHeight = 80;
  const barWidth = Math.max(8, Math.floor(320 / (sorted.length || 1)));

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
        Transaction Trends
      </h2>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "3px",
          height: `${chartHeight}px`,
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {sorted.map((r) => (
          <div
            key={r.transaction_id}
            title={`${r.transaction_id}: $${r.amount} (${r.overall_risk_score})`}
            style={{
              width: `${barWidth}px`,
              minWidth: `${barWidth}px`,
              height: `${Math.max(4, (r.amount / maxAmount) * chartHeight)}px`,
              background: RISK_COLORS[r.overall_risk_score],
              borderRadius: "2px 2px 0 0",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "4px" }}>
        Each bar represents a transaction, coloured by risk level.
      </div>
    </div>
  );
}

function RecordsTable({ data }: { data: FraudRecord[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
        Flagged Records
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
        <thead>
          <tr style={{ background: "#f3f4f6" }}>
            {["User", "Transaction", "Amount", "Risk Score", "Reason", "Review"].map(
              (h) => (
                <th
                  key={h}
                  style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600 }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr
              key={`${r.transaction_id}-${r.message_id}`}
              style={{ borderBottom: "1px solid #e5e7eb" }}
            >
              <td style={{ padding: "6px 10px" }}>{r.user_id}</td>
              <td style={{ padding: "6px 10px" }}>{r.transaction_id}</td>
              <td style={{ padding: "6px 10px" }}>${r.amount.toFixed(2)}</td>
              <td style={{ padding: "6px 10px" }}>
                <RiskBadge level={r.overall_risk_score} />
              </td>
              <td style={{ padding: "6px 10px" }}>{r.risk_reason}</td>
              <td style={{ padding: "6px 10px" }}>
                {r.requires_immediate_review ? "✅ Yes" : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FraudMonitoringDashboard({ data = [] }: DashboardProps) {
  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "2rem",
        color: "#111827",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
        Fraud Monitoring Dashboard
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem", fontSize: "0.9rem" }}>
        Powered by Ascend · Microsoft Fabric
      </p>

      <HighRiskUserCount data={data} />
      <RiskDistribution data={data} />
      <TransactionTrends data={data} />
      <RecordsTable data={data} />
    </div>
  );
}
