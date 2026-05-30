import { useState, useEffect } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, PieChart, Pie, Legend } from "recharts";

// ─── REAL BACKTEST DATA ───────────────────────────────────────────────────────
const EQUITY_RAW = [
  {d:"2021-01-04",e:1000000},{d:"2021-01-07",e:1000000},{d:"2021-01-12",e:1000000},{d:"2021-01-15",e:1000000},{d:"2021-01-20",e:1000000},{d:"2021-01-25",e:1000000},{d:"2021-01-28",e:1000000},{d:"2021-02-02",e:1000000},{d:"2021-02-05",e:1000000},{d:"2021-02-10",e:1000000},{d:"2021-02-17",e:1000000},{d:"2021-02-22",e:1000000},{d:"2021-03-01",e:1000000},{d:"2021-03-08",e:1000000},{d:"2021-03-11",e:1000000},{d:"2021-03-16",e:1000000},{d:"2021-03-19",e:1000000},{d:"2021-03-24",e:1000000},{d:"2021-03-29",e:1000000},{d:"2021-04-01",e:1000000},{d:"2021-04-06",e:1000000},{d:"2021-04-09",e:1000000},{d:"2021-04-14",e:1000000},{d:"2021-04-19",e:1000000},{d:"2021-04-22",e:1000000},{d:"2021-04-27",e:1000000},{d:"2021-04-30",e:1000000},{d:"2021-05-05",e:1000000},{d:"2021-05-10",e:1000000},{d:"2021-05-13",e:1000000},{d:"2021-05-18",e:1000000},{d:"2021-05-21",e:1000000},{d:"2021-05-26",e:1000000},{d:"2021-06-01",e:1000000},{d:"2021-06-04",e:1000000},{d:"2021-06-09",e:1000000},{d:"2021-06-14",e:1000000},{d:"2021-06-17",e:1000000},{d:"2021-06-22",e:1000000},{d:"2021-06-25",e:1000000},{d:"2021-06-30",e:1000000},{d:"2021-07-06",e:1000000},{d:"2021-07-09",e:1000000},{d:"2021-07-14",e:1000000},{d:"2021-07-19",e:1000000},{d:"2021-07-22",e:1000000},{d:"2021-07-27",e:1000000},{d:"2021-07-30",e:1000000},{d:"2021-08-04",e:1000000},{d:"2021-08-09",e:1000000},{d:"2021-08-12",e:1000000},{d:"2021-08-17",e:1000000},{d:"2021-08-20",e:1000000},{d:"2021-08-25",e:1000000},{d:"2021-08-30",e:1000000},{d:"2021-09-02",e:1000000},{d:"2021-09-08",e:1000000},{d:"2021-09-13",e:1000000},{d:"2021-09-16",e:1000000},{d:"2021-09-21",e:1000000},{d:"2021-09-24",e:1000000},{d:"2021-09-29",e:1000000},{d:"2021-10-04",e:1000000},{d:"2021-10-07",e:1000000},{d:"2021-10-12",e:1000000},{d:"2021-10-15",e:1000000},{d:"2021-10-20",e:1000000},{d:"2021-10-25",e:1000000},{d:"2021-10-28",e:1000000},{d:"2021-11-02",e:1000000},{d:"2021-11-05",e:1000000},{d:"2021-11-10",e:1000000},{d:"2021-11-15",e:1000000},{d:"2021-11-18",e:1000000},{d:"2021-11-23",e:1000000},{d:"2021-11-26",e:1000000},{d:"2021-12-01",e:1000000},{d:"2021-12-06",e:1000000},{d:"2021-12-09",e:1000000},{d:"2021-12-13",e:1000077},{d:"2021-12-16",e:999283},{d:"2021-12-21",e:999208},{d:"2021-12-24",e:999208},{d:"2021-12-29",e:999208},{d:"2022-01-04",e:999208},{d:"2022-01-07",e:999208},{d:"2022-01-12",e:999208},{d:"2022-01-18",e:998413},{d:"2022-01-21",e:998413},{d:"2022-01-26",e:998413},{d:"2022-01-31",e:998413},{d:"2022-02-03",e:998413},{d:"2022-02-08",e:998413},{d:"2022-02-11",e:998413},{d:"2022-02-14",e:998561},{d:"2022-02-17",e:998413},{d:"2022-02-22",e:994762},{d:"2022-02-25",e:993500},{d:"2022-03-02",e:992348},{d:"2022-03-07",e:990831},{d:"2022-03-10",e:990127},{d:"2022-03-15",e:989250},{d:"2022-03-18",e:990414},{d:"2022-03-23",e:990414},{d:"2022-03-28",e:990414},{d:"2022-04-01",e:990414},{d:"2022-04-06",e:989651},{d:"2022-04-11",e:989651},{d:"2022-04-14",e:988912},{d:"2022-04-19",e:988912},{d:"2022-04-22",e:988203},{d:"2022-04-27",e:987471},{d:"2022-04-29",e:987010},{d:"2022-05-04",e:986398},{d:"2022-05-09",e:985662},{d:"2022-05-12",e:985662},{d:"2022-05-17",e:985662},{d:"2022-05-20",e:984929},{d:"2022-05-25",e:984929},{d:"2022-05-31",e:984929},{d:"2022-06-03",e:984929},{d:"2022-06-08",e:984186},{d:"2022-06-13",e:984186},{d:"2022-06-16",e:983350},{d:"2022-06-21",e:983350},{d:"2022-06-24",e:983350},{d:"2022-06-29",e:983350},{d:"2022-07-05",e:983350},{d:"2022-07-08",e:983350},{d:"2022-07-13",e:982580},{d:"2022-07-18",e:982580},{d:"2022-07-21",e:982580},{d:"2022-07-26",e:982580},{d:"2022-07-29",e:982580},{d:"2022-08-03",e:983024},{d:"2022-08-08",e:983311},{d:"2022-08-11",e:983605},{d:"2022-08-16",e:983605},{d:"2022-08-19",e:983605},{d:"2022-08-24",e:983605},{d:"2022-08-29",e:983605},{d:"2022-09-01",e:983605},{d:"2022-09-07",e:983605},{d:"2022-09-12",e:983605},{d:"2022-09-15",e:983871},{d:"2022-09-20",e:984140},{d:"2022-09-23",e:984140},{d:"2022-09-28",e:984140},{d:"2022-10-03",e:984415},{d:"2022-10-06",e:984415},{d:"2022-10-11",e:984692},{d:"2022-10-14",e:984692},{d:"2022-10-19",e:984692},{d:"2022-10-24",e:984979},{d:"2022-10-27",e:984979},{d:"2022-11-01",e:984979},{d:"2022-11-04",e:985273},{d:"2022-11-09",e:985576},{d:"2022-11-14",e:985576},{d:"2022-11-17",e:985576},{d:"2022-11-22",e:985869},{d:"2022-11-25",e:985869},{d:"2022-11-30",e:986175},{d:"2022-12-05",e:986175},{d:"2022-12-08",e:986490},{d:"2022-12-13",e:986490},{d:"2022-12-16",e:986490},{d:"2022-12-21",e:986490},{d:"2022-12-28",e:986490},{d:"2023-01-03",e:986490},{d:"2023-01-06",e:986490},{d:"2023-01-11",e:987193},{d:"2023-01-17",e:987918},{d:"2023-01-20",e:987918},{d:"2023-01-25",e:987918},{d:"2023-01-30",e:988664},{d:"2023-02-02",e:988664},{d:"2023-02-07",e:989428},{d:"2023-02-10",e:989428},{d:"2023-02-15",e:989428},{d:"2023-02-21",e:990213},{d:"2023-02-24",e:990213},{d:"2023-03-01",e:991008},{d:"2023-03-06",e:991008},{d:"2023-03-09",e:991834},{d:"2023-03-14",e:991834},{d:"2023-03-17",e:991834},{d:"2023-03-22",e:992672},{d:"2023-03-27",e:992672},{d:"2023-03-30",e:993521},{d:"2023-04-04",e:993521},{d:"2023-04-06",e:994383},{d:"2023-04-11",e:994383},{d:"2023-04-14",e:994383},{d:"2023-04-19",e:995260},{d:"2023-04-24",e:995260},{d:"2023-04-27",e:996148},{d:"2023-04-28",e:996148},{d:"2023-05-03",e:996148},{d:"2023-05-08",e:997052},{d:"2023-05-11",e:997052},{d:"2023-05-16",e:997969},{d:"2023-05-19",e:997969},{d:"2023-05-24",e:997969},{d:"2023-05-30",e:997969},{d:"2023-06-02",e:998897},{d:"2023-06-07",e:998897},{d:"2023-06-12",e:998897},{d:"2023-06-15",e:999840},{d:"2023-06-20",e:999840},{d:"2023-06-23",e:999840},{d:"2023-06-28",e:999840},{d:"2023-07-05",e:999840},{d:"2023-07-10",e:999840},{d:"2023-07-13",e:1000800},{d:"2023-07-18",e:1001776},{d:"2023-07-21",e:1001776},{d:"2023-07-26",e:1001776},{d:"2023-07-31",e:1002768},{d:"2023-08-03",e:1002768},{d:"2023-08-08",e:1003780},{d:"2023-08-11",e:1003780},{d:"2023-08-16",e:1003780},{d:"2023-08-21",e:1003780},{d:"2023-08-24",e:1004808},{d:"2023-08-29",e:1004808},{d:"2023-09-01",e:1004808},{d:"2023-09-06",e:1005854},{d:"2023-09-11",e:1005854},{d:"2023-09-14",e:1006920},{d:"2023-09-19",e:1006920},{d:"2023-09-22",e:1006920},{d:"2023-09-27",e:1007148},{d:"2023-10-02",e:1007148},{d:"2023-10-05",e:1007148},{d:"2023-10-10",e:1007148},{d:"2023-10-13",e:1007148},{d:"2023-10-18",e:1007148},{d:"2023-10-23",e:1007148},{d:"2023-10-26",e:1007148},{d:"2023-10-31",e:1007148},{d:"2023-11-03",e:1007148},{d:"2023-11-08",e:1007148},{d:"2023-11-13",e:1007148},{d:"2023-11-16",e:1007148},{d:"2023-11-21",e:1007148},{d:"2023-11-23",e:968633}
];

const TRADES = [
  {pair:"KO/MCD",pnl:76.52,pct:0.11,exit:"SIGNAL",hold:4},{pair:"KO/MCD",pnl:-794.82,pct:-1.14,exit:"STOP_LOSS",hold:32},{pair:"AAPL/MCD",pnl:147.82,pct:0.21,exit:"STOP_LOSS",hold:2},{pair:"MSFT/MCD",pnl:1287.63,pct:1.84,exit:"SIGNAL",hold:32},{pair:"MSFT/MCD",pnl:-794.55,pct:-1.14,exit:"STOP_LOSS",hold:28},{pair:"AAPL/MSFT",pnl:226.50,pct:0.32,exit:"SIGNAL",hold:8},{pair:"AAPL/GOOGL",pnl:309.16,pct:0.44,exit:"SIGNAL",hold:14},{pair:"AAPL/MCD",pnl:624.57,pct:0.89,exit:"SIGNAL",hold:19},{pair:"MSFT/META",pnl:220.42,pct:0.31,exit:"SIGNAL",hold:11},{pair:"AAPL/META",pnl:310.23,pct:0.44,exit:"SIGNAL",hold:8},{pair:"AAPL/META",pnl:-482.31,pct:-0.69,exit:"STOP_LOSS",hold:15},{pair:"PEP/WMT",pnl:142.18,pct:0.20,exit:"SIGNAL",hold:6},{pair:"MRK/ABT",pnl:98.91,pct:0.14,exit:"SIGNAL",hold:9},{pair:"COP/SLB",pnl:92.96,pct:0.13,exit:"SIGNAL",hold:7},{pair:"JPM/WFC",pnl:276.34,pct:0.39,exit:"SIGNAL",hold:12},{pair:"XOM/CVX",pnl:187.45,pct:0.27,exit:"SIGNAL",hold:10},{pair:"GS/WFC",pnl:-312.44,pct:-0.45,exit:"STOP_LOSS",hold:18},{pair:"AAPL/MSFT",pnl:183.71,pct:0.26,exit:"SIGNAL",hold:9},{pair:"PEP/WMT",pnl:89.34,pct:0.13,exit:"SIGNAL",hold:5},{pair:"GS/JNJ",pnl:-2239.0,pct:-3.20,exit:"STOP_LOSS",hold:10},{pair:"AAPL/MRK",pnl:-2124.0,pct:-3.04,exit:"STOP_LOSS",hold:2},{pair:"MSFT/MRK",pnl:-1915.0,pct:-2.74,exit:"STOP_LOSS",hold:2},{pair:"BAC/JNJ",pnl:1686.0,pct:2.41,exit:"END_OF_BACKTEST",hold:38},{pair:"GOOGL/MCD",pnl:678.24,pct:0.97,exit:"MAX_HOLD",hold:46},{pair:"AAPL/META",pnl:433.95,pct:0.62,exit:"SIGNAL",hold:16},{pair:"AAPL/MSFT",pnl:151.04,pct:0.22,exit:"SIGNAL",hold:6},{pair:"PEP/WMT",pnl:71.20,pct:0.10,exit:"SIGNAL",hold:4},{pair:"PEP/WMT",pnl:79.82,pct:0.11,exit:"SIGNAL",hold:5},{pair:"COP/SLB",pnl:-187.44,pct:-0.27,exit:"STOP_LOSS",hold:12},{pair:"MRK/ABT",pnl:-0.0,pct:0,exit:"END_OF_BACKTEST",hold:38}
];

const METRICS = {
  totalReturn: -3.06, cagr: -1.03, sharpe: -0.77, sortino: -0.50,
  calmar: -0.25, maxDD: -4.17, vol: 1.33, totalTrades: 85,
  winRate: 40.0, avgWin: 345, avgLoss: -737, profitFactor: 0.31,
  finalEquity: 969401,
};

const EXIT_DATA = [
  { name: "SIGNAL", trades: 20, winRate: 90, avgPnl: 220, color: "#00d4aa" },
  { name: "STOP_LOSS", trades: 56, winRate: 23, avgPnl: -523, color: "#ff4757" },
  { name: "MAX_HOLD", trades: 7, winRate: 29, avgPnl: -373, color: "#ffa502" },
  { name: "END", trades: 2, winRate: 50, avgPnl: 835, color: "#5352ed" },
];

const TOP_PAIRS = [
  { pair: "MSFT/MCD", total: 1288, count: 1 },
  { pair: "AAPL/MCD", total: 772, count: 2 },
  { pair: "GOOGL/MCD", total: 678, count: 1 },
  { pair: "AAPL/MSFT", total: 561, count: 3 },
  { pair: "PEP/WMT", total: 383, count: 4 },
  { pair: "AAPL/GOOGL", total: 309, count: 1 },
  { pair: "AAPL/META", total: 262, count: 3 },
  { pair: "MSFT/META", total: 220, count: 1 },
];

// Build drawdown series
function buildDrawdown(equity) {
  let peak = equity[0].e;
  return equity.map(pt => {
    if (pt.e > peak) peak = pt.e;
    const dd = ((pt.e - peak) / peak) * 100;
    return { d: pt.d, dd };
  });
}

const fmt = (n, prefix = "$") => {
  if (Math.abs(n) >= 1e6) return prefix + (n / 1e6).toFixed(3) + "M";
  if (Math.abs(n) >= 1e3) return prefix + (n / 1e3).toFixed(1) + "K";
  return prefix + n.toFixed(0);
};
const pct = n => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
const color = n => n >= 0 ? "#00d4aa" : "#ff4757";

const TABS = ["Overview", "Equity Curve", "Trades", "Pairs Analysis"];

export default function QuantDashboard() {
  const [tab, setTab] = useState(0);
  const [hovered, setHovered] = useState(null);
  const ddData = buildDrawdown(EQUITY_RAW);

  const winTrades = TRADES.filter(t => t.pnl > 0);
  const lossTrades = TRADES.filter(t => t.pnl <= 0);

  return (
    <div style={{
      background: "#0a0e1a", minHeight: "100vh", color: "#e8eaf6",
      fontFamily: "'JetBrains Mono', 'Fira Mono', monospace", fontSize: 13,
      padding: 0,
    }}>
      {/* ── HEADER ────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg,#0d1321 0%,#1a2340 100%)",
        borderBottom: "1px solid #1e2d4a", padding: "18px 28px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 11, color: "#4a6fa5", letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>
            Quant Research Lab
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#e8eaf6", letterSpacing: -0.5 }}>
            Statistical Arbitrage — Pairs Trading Engine
          </div>
          <div style={{ fontSize: 11, color: "#4a6fa5", marginTop: 2 }}>
            Cointegration · Mean Reversion · Kelly Sizing · Hurst Filter
            &nbsp;|&nbsp; Jan 2021 – Nov 2023
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#4a6fa5" }}>Final Equity</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: color(METRICS.totalReturn) }}>
            {fmt(METRICS.finalEquity)}
          </div>
          <div style={{ fontSize: 12, color: color(METRICS.totalReturn) }}>
            {pct(METRICS.totalReturn)} total return
          </div>
        </div>
      </div>

      {/* ── TABS ──────────────────────────────────────────── */}
      <div style={{ display: "flex", borderBottom: "1px solid #1e2d4a", background: "#0d1321", padding: "0 28px" }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "12px 18px", fontSize: 12, letterSpacing: 1,
            color: tab === i ? "#00d4aa" : "#4a6fa5",
            borderBottom: tab === i ? "2px solid #00d4aa" : "2px solid transparent",
            fontFamily: "inherit", textTransform: "uppercase",
            transition: "color 0.2s",
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: "24px 28px" }}>

        {/* ══ TAB 0: OVERVIEW ══════════════════════════════ */}
        {tab === 0 && (
          <div>
            {/* Metric cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
              {[
                { label: "CAGR", value: pct(METRICS.cagr), sub: "annualized return", pos: METRICS.cagr >= 0 },
                { label: "Sharpe Ratio", value: METRICS.sharpe.toFixed(2), sub: "risk-adjusted return", pos: METRICS.sharpe >= 0 },
                { label: "Max Drawdown", value: pct(METRICS.maxDD), sub: "peak-to-trough", pos: false },
                { label: "Win Rate", value: METRICS.winRate.toFixed(1) + "%", sub: `${METRICS.totalTrades} total trades`, pos: METRICS.winRate >= 50 },
                { label: "Profit Factor", value: METRICS.profitFactor.toFixed(2), sub: "gross wins / gross losses", pos: METRICS.profitFactor >= 1 },
                { label: "Sortino Ratio", value: METRICS.sortino.toFixed(2), sub: "downside-adj return", pos: METRICS.sortino >= 0 },
                { label: "Annualized Vol", value: METRICS.vol.toFixed(2) + "%", sub: "low due to pair hedging", pos: true },
                { label: "Calmar Ratio", value: METRICS.calmar.toFixed(2), sub: "CAGR / max drawdown", pos: METRICS.calmar >= 0 },
              ].map((m, i) => (
                <div key={i} style={{
                  background: "#0d1321", border: "1px solid #1e2d4a",
                  borderRadius: 8, padding: "14px 16px",
                }}>
                  <div style={{ fontSize: 10, color: "#4a6fa5", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: m.pos ? "#00d4aa" : "#ff4757" }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: 10, color: "#3a4f72", marginTop: 4 }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Mini equity + exit pie */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
              <div style={{ background: "#0d1321", border: "1px solid #1e2d4a", borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 10, color: "#4a6fa5", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                  Equity Curve — $1M Initial Capital
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={EQUITY_RAW}>
                    <defs>
                      <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                    <XAxis dataKey="d" tick={{ fill: "#3a4f72", fontSize: 9 }} interval={40} />
                    <YAxis domain={[940000, 1020000]} tick={{ fill: "#3a4f72", fontSize: 9 }}
                      tickFormatter={v => "$" + (v/1000).toFixed(0) + "K"} />
                    <ReferenceLine y={1000000} stroke="#4a6fa5" strokeDasharray="4 4" />
                    <Area type="monotone" dataKey="e" stroke="#00d4aa" strokeWidth={2}
                      fill="url(#eqGrad)" dot={false} />
                    <Tooltip
                      formatter={v => [fmt(v), "Equity"]}
                      contentStyle={{ background: "#0d1321", border: "1px solid #1e2d4a", borderRadius: 6, fontSize: 11 }}
                      labelStyle={{ color: "#4a6fa5" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: "#0d1321", border: "1px solid #1e2d4a", borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 10, color: "#4a6fa5", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                  Exit Reason Breakdown
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={EXIT_DATA} dataKey="trades" nameKey="name"
                      cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                      paddingAngle={3}>
                      {EXIT_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v, n, p) => [v + " trades", p.payload.name]}
                      contentStyle={{ background: "#0d1321", border: "1px solid #1e2d4a", borderRadius: 6, fontSize: 11 }}
                    />
                    <Legend formatter={(v) => <span style={{ color: "#8a9bc0", fontSize: 10 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Strategy info box */}
            <div style={{ background: "#0d1321", border: "1px solid #1e2d4a", borderRadius: 8, padding: 16, marginTop: 14 }}>
              <div style={{ fontSize: 10, color: "#4a6fa5", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
                Strategy Architecture
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {[
                  { title: "Pair Selection", items: ["Engle-Granger cointegration (ADF test)", "TLS hedge ratio estimation", "Hurst exponent < 0.5 (mean-rev filter)", "R² ≥ 0.70 quality gate", "Half-life: 2–30 days only"] },
                  { title: "Signal & Sizing", items: ["Entry: |z-score| > 2.0σ", "Exit: |z-score| < 0.5σ", "Stop-loss: |z-score| > 3.5σ", "Kelly Criterion (25% fractional)", "Max 8 concurrent positions"] },
                  { title: "Risk Controls", items: ["8bps round-trip transaction costs", "Max drawdown circuit breaker: 15%", "Max holding period: 45 days", "Rolling 126-day lookback window", "Re-scan every 5 trading days"] },
                ].map((sec, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 11, color: "#00d4aa", marginBottom: 6, fontWeight: 600 }}>{sec.title}</div>
                    {sec.items.map((item, j) => (
                      <div key={j} style={{ fontSize: 10, color: "#6a7f9a", marginBottom: 3 }}>
                        <span style={{ color: "#4a6fa5", marginRight: 6 }}>▸</span>{item}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 1: EQUITY CURVE ══════════════════════════ */}
        {tab === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "#0d1321", border: "1px solid #1e2d4a", borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 10, color: "#4a6fa5", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
                Portfolio Equity — Full History
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={EQUITY_RAW}>
                  <defs>
                    <linearGradient id="eqGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
                  <XAxis dataKey="d" tick={{ fill: "#3a4f72", fontSize: 10 }} interval={30} />
                  <YAxis domain={[930000, 1020000]} tick={{ fill: "#3a4f72", fontSize: 10 }}
                    tickFormatter={v => "$" + (v / 1000).toFixed(0) + "K"} width={62} />
                  <ReferenceLine y={1000000} stroke="#5352ed" strokeDasharray="6 3"
                    label={{ value: "Capital", fill: "#5352ed", fontSize: 9 }} />
                  <Tooltip
                    formatter={v => [fmt(v), "Equity"]}
                    contentStyle={{ background: "#0d1321", border: "1px solid #1e2d4a", borderRadius: 6, fontSize: 11 }}
                  />
                  <Area type="monotone" dataKey="e" stroke="#00d4aa" strokeWidth={2} fill="url(#eqGrad2)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "#0d1321", border: "1px solid #1e2d4a", borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 10, color: "#4a6fa5", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
                Drawdown — Rolling Peak-to-Trough (%)
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={ddData}>
                  <defs>
                    <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4757" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff4757" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
                  <XAxis dataKey="d" tick={{ fill: "#3a4f72", fontSize: 10 }} interval={30} />
                  <YAxis tick={{ fill: "#3a4f72", fontSize: 10 }}
                    tickFormatter={v => v.toFixed(1) + "%"} width={48} />
                  <ReferenceLine y={0} stroke="#4a6fa5" strokeWidth={1} />
                  <Tooltip
                    formatter={v => [v.toFixed(2) + "%", "Drawdown"]}
                    contentStyle={{ background: "#0d1321", border: "1px solid #1e2d4a", borderRadius: 6, fontSize: 11 }}
                  />
                  <Area type="monotone" dataKey="dd" stroke="#ff4757" strokeWidth={1.5} fill="url(#ddGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ══ TAB 2: TRADES ════════════════════════════════ */}
        {tab === 2 && (
          <div>
            {/* PnL distribution */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
              <div style={{ background: "#0d1321", border: "1px solid #1e2d4a", borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 10, color: "#4a6fa5", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                  Trade PnL Distribution
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={TRADES.slice().sort((a,b)=>b.pnl-a.pnl)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
                    <XAxis dataKey="pair" tick={{ fill: "#3a4f72", fontSize: 8 }} interval={4} />
                    <YAxis tick={{ fill: "#3a4f72", fontSize: 9 }} tickFormatter={v => "$"+v} width={52} />
                    <ReferenceLine y={0} stroke="#4a6fa5" />
                    <Tooltip
                      formatter={(v) => ["$" + v.toFixed(0), "PnL"]}
                      contentStyle={{ background: "#0d1321", border: "1px solid #1e2d4a", borderRadius: 6, fontSize: 11 }}
                    />
                    <Bar dataKey="pnl" radius={[2,2,0,0]}>
                      {TRADES.slice().sort((a,b)=>b.pnl-a.pnl).map((t, i) => (
                        <Cell key={i} fill={t.pnl >= 0 ? "#00d4aa" : "#ff4757"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: "#0d1321", border: "1px solid #1e2d4a", borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 10, color: "#4a6fa5", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
                  Exit Stats
                </div>
                {EXIT_DATA.map((e, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ color: e.color, fontSize: 10, fontWeight: 600 }}>{e.name}</span>
                      <span style={{ color: "#4a6fa5", fontSize: 10 }}>{e.trades} trades</span>
                    </div>
                    <div style={{ background: "#1a2540", borderRadius: 3, height: 6, overflow: "hidden" }}>
                      <div style={{ width: (e.winRate) + "%", height: "100%", background: e.color, borderRadius: 3 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                      <span style={{ color: "#3a4f72", fontSize: 9 }}>WR: {e.winRate}%</span>
                      <span style={{ color: color(e.avgPnl), fontSize: 9 }}>Avg: ${e.avgPnl}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trade table */}
            <div style={{ background: "#0d1321", border: "1px solid #1e2d4a", borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 10, color: "#4a6fa5", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                All Trades (sorted by PnL)
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1e2d4a" }}>
                      {["Pair", "Direction", "PnL", "Return %", "Hold (days)", "Exit Reason"].map(h => (
                        <th key={h} style={{ padding: "6px 10px", color: "#4a6fa5", textAlign: "left", fontWeight: 400, fontSize: 10, letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TRADES.slice().sort((a,b)=>b.pnl-a.pnl).map((t, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #111a2e" }}>
                        <td style={{ padding: "6px 10px", color: "#a8b8d0", fontWeight: 600 }}>{t.pair}</td>
                        <td style={{ padding: "6px 10px", color: t.pnl >= 0 ? "#00d4aa" : "#ff4757", fontSize: 10 }}>
                          {t.pnl >= 0 ? "▲" : "▼"} {t.exit === "SIGNAL" ? "CLEAN EXIT" : t.exit}
                        </td>
                        <td style={{ padding: "6px 10px", color: color(t.pnl), fontWeight: 700 }}>
                          {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(0)}
                        </td>
                        <td style={{ padding: "6px 10px", color: color(t.pct) }}>
                          {t.pct >= 0 ? "+" : ""}{t.pct.toFixed(2)}%
                        </td>
                        <td style={{ padding: "6px 10px", color: "#6a7f9a" }}>{t.hold}d</td>
                        <td style={{ padding: "6px 10px" }}>
                          <span style={{
                            background: t.exit === "SIGNAL" ? "#001a14" : t.exit === "STOP_LOSS" ? "#1a0008" : "#1a1400",
                            color: t.exit === "SIGNAL" ? "#00d4aa" : t.exit === "STOP_LOSS" ? "#ff4757" : "#ffa502",
                            padding: "2px 7px", borderRadius: 4, fontSize: 9, letterSpacing: 1,
                          }}>{t.exit}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 3: PAIRS ANALYSIS ════════════════════════ */}
        {tab === 3 && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              {/* Top pairs bar chart */}
              <div style={{ background: "#0d1321", border: "1px solid #1e2d4a", borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 10, color: "#4a6fa5", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                  Top Pairs — Total PnL
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={TOP_PAIRS} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#3a4f72", fontSize: 9 }} tickFormatter={v => "$"+v} />
                    <YAxis type="category" dataKey="pair" tick={{ fill: "#a8b8d0", fontSize: 10 }} width={70} />
                    <ReferenceLine x={0} stroke="#4a6fa5" />
                    <Tooltip
                      formatter={v => ["$" + v.toFixed(0), "Total PnL"]}
                      contentStyle={{ background: "#0d1321", border: "1px solid #1e2d4a", borderRadius: 6, fontSize: 11 }}
                    />
                    <Bar dataKey="total" radius={[0,3,3,0]}>
                      {TOP_PAIRS.map((t, i) => (
                        <Cell key={i} fill={t.total >= 0 ? "#00d4aa" : "#ff4757"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Trade count */}
              <div style={{ background: "#0d1321", border: "1px solid #1e2d4a", borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 10, color: "#4a6fa5", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                  Trade Frequency by Pair
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={TOP_PAIRS} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#3a4f72", fontSize: 9 }} />
                    <YAxis type="category" dataKey="pair" tick={{ fill: "#a8b8d0", fontSize: 10 }} width={70} />
                    <Tooltip
                      formatter={v => [v + " trades", "Count"]}
                      contentStyle={{ background: "#0d1321", border: "1px solid #1e2d4a", borderRadius: 6, fontSize: 11 }}
                    />
                    <Bar dataKey="count" fill="#5352ed" radius={[0,3,3,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Algorithm explanation */}
            <div style={{ background: "#0d1321", border: "1px solid #1e2d4a", borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 10, color: "#4a6fa5", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
                Algorithm Deep Dive
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 18 }}>
                {[
                  {
                    title: "Step 1 — Cointegration Test",
                    color: "#00d4aa",
                    body: `Two price series Pₐ and P_b are cointegrated if their log-spread
s_t = log(Pₐ) − β·log(P_b) is stationary (I(0)).

We apply the Augmented Dickey-Fuller test to s_t.
Rejection of the unit root null at p < 0.05 means
the spread will mean-revert — tradeable!`,
                  },
                  {
                    title: "Step 2 — Hedge Ratio (TLS)",
                    color: "#5352ed",
                    body: `Total Least Squares (TLS) avoids the regressor-endogeneity
bias that plagues OLS hedge ratios.

The β minimises orthogonal distance from the log-price
scatter, giving a symmetric, bias-free estimate of the
long-run equilibrium relationship.`,
                  },
                  {
                    title: "Step 3 — Hurst Exponent",
                    color: "#ffa502",
                    body: `The Hurst exponent H measures fractal self-similarity.

H < 0.5 → mean-reverting (anti-persistent)
H ≈ 0.5 → random walk (no edge)
H > 0.5 → trending (momentum)

We only trade spreads where H < 0.5, ensuring
the statistical edge is real.`,
                  },
                  {
                    title: "Step 4 — Z-Score Signals",
                    color: "#ff4757",
                    body: `z_t = (s_t − μ_s) / σ_s

Enter LONG spread when z < −2σ (spread too cheap)
Enter SHORT spread when z > +2σ (spread too expensive)
Exit when |z| < 0.5σ (mean reversion complete)
Stop-loss at |z| > 3.5σ (regime break)`,
                  },
                ].map((sec, i) => (
                  <div key={i} style={{ borderLeft: `2px solid ${sec.color}`, paddingLeft: 12 }}>
                    <div style={{ color: sec.color, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{sec.title}</div>
                    <pre style={{ color: "#6a7f9a", fontSize: 10, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                      {sec.body}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
