import {
  Activity,
  BarChart3,
  ChartNoAxesCombined,
  CircleCheck,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { ReactNode } from 'react';
import snapshot from '../public/data/public_snapshot.json';

type NavRow = { date: string; index_points: number };

const formatPct = (value: number, signed = false) => {
  const prefix = signed && value >= 0 ? '+' : '';
  return `${prefix}${(value * 100).toFixed(2)}%`;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(value);

function PathChart({ rows }: { rows: NavRow[] }) {
  const sampled = rows.filter((_, index) => index % Math.ceil(rows.length / 260) === 0 || index === rows.length - 1);
  const values = sampled.map((row) => row.index_points);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, 1);
  const width = 1040;
  const height = 330;
  const pad = { left: 56, right: 28, top: 24, bottom: 34 };
  const x = (index: number) =>
    pad.left + (index / Math.max(sampled.length - 1, 1)) * (width - pad.left - pad.right);
  const y = (value: number) =>
    height - pad.bottom - ((value - (min - spread * 0.08)) / (spread * 1.16)) * (height - pad.top - pad.bottom);
  const line = sampled.map((row, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(row.index_points).toFixed(1)}`).join(' ');
  const area = `${line} L${x(sampled.length - 1).toFixed(1)},${height - pad.bottom} L${x(0).toFixed(1)},${height - pad.bottom} Z`;
  const grid = [0, 0.5, 1].map((ratio) => ({
    value: max - ratio * (max - min),
    yy: pad.top + ratio * (height - pad.top - pad.bottom),
  }));
  const labels = [sampled[0], sampled[Math.floor(sampled.length / 2)], sampled.at(-1)].filter(Boolean) as NavRow[];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="悟空质量价值指数历史路径">
      <defs><linearGradient id="nav-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ef5a49" stopOpacity="0.26" /><stop offset="1" stopColor="#ef5a49" stopOpacity="0" /></linearGradient></defs>
      {grid.map(({ value, yy }) => <g key={yy}><line x1={pad.left} x2={width - pad.right} y1={yy} y2={yy} stroke="#eadfd4" strokeDasharray="3 7" /><text x="4" y={yy + 4} fill="#8a8178" fontSize="11">{formatNumber(value)}</text></g>)}
      <path d={area} fill="url(#nav-fill)" />
      <path d={line} fill="none" stroke="#e65342" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {labels.map((row, index) => <text key={row.date} x={index === 0 ? pad.left : index === 2 ? width - pad.right : width / 2} y={height - 8} textAnchor={index === 0 ? 'start' : index === 2 ? 'end' : 'middle'} fill="#8a8178" fontSize="11">{row.date.slice(0, 7)}</text>)}
    </svg>
  );
}

export default function Home() {
  const strategy = snapshot.strategy;
  const highlights = snapshot.factor_highlights;
  const navRows = snapshot.nav_daily as NavRow[];
  const latest = navRows.at(-1);

  return (
    <main className="min-h-screen bg-[#f8f5f0] text-[#21201e]">
      <div className="mx-auto max-w-6xl px-5 pb-14 pt-6 sm:px-9 sm:pt-8">
        <header className="flex items-center justify-between border-b border-[#e7ded4] pb-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#20252c] text-lg font-bold text-[#f9f4eb]">W</span><div><p className="text-base font-semibold tracking-tight">悟空质量价值指数</p><p className="mt-0.5 text-xs tracking-[0.12em] text-[#837970]">WUKONG QUALITY VALUE INDEX</p></div></div><div className="rounded-full border border-[#e6d6cc] bg-[#fff8f4] px-3 py-1.5 text-xs font-medium text-[#b74738]">收盘观察 · {snapshot.data_as_of}</div></header>

        <section className="grid gap-8 py-12 lg:grid-cols-[1.18fr_0.82fr] lg:items-end"><div><p className="mb-4 text-xs font-semibold tracking-[0.18em] text-[#b74738]">QUALITY · VALUE · DISCIPLINE</p><h1 className="max-w-3xl text-4xl font-semibold leading-[1.13] tracking-[-0.045em] text-[#20252c] sm:text-6xl">从质量价值出发，<br />以价格纪律完成投资。</h1><p className="mt-5 max-w-xl text-base leading-7 text-[#665f58]">以全市场基本面筛选为起点，在估值、现金创造与股东结构之间寻找长期可验证的优势，并以分批交易纪律记录策略路径。</p></div><div className="rounded-2xl border border-[#ddd3c8] bg-[#fffdf9] p-6 shadow-[0_16px_40px_rgba(58,47,38,0.06)]"><div className="flex items-center justify-between text-xs text-[#82786f]"><span>最新指数点数</span><Activity className="h-4 w-4 text-[#e65342]" /></div><p className="mt-3 text-5xl font-semibold tracking-[-0.04em] text-[#20252c]">{formatNumber(strategy.latest_index_points)}</p><p className="mt-4 flex items-center gap-2 text-sm font-medium text-[#d74b3a]"><TrendingUp className="h-4 w-4" />{formatPct(strategy.latest_return, true)} <span className="font-normal text-[#81776e]">最近收盘变动</span></p></div></section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={<ChartNoAxesCombined className="h-4 w-4" />} label="历史年化" value={formatPct(strategy.cagr)} detail={`${strategy.start} 至 ${strategy.end}`} accent="text-[#dc4c3b]" /><Metric icon={<TrendingDown className="h-4 w-4" />} label="最大回撤" value={formatPct(strategy.max_drawdown)} detail="按历史收盘净值计算" accent="text-[#279461]" /><Metric icon={<BarChart3 className="h-4 w-4" />} label="Sharpe" value={strategy.sharpe.toFixed(2)} detail="零无风险利率口径" accent="text-[#dc4c3b]" /><Metric icon={<CircleCheck className="h-4 w-4" />} label="数据更新" value={snapshot.data_as_of} detail="盘后可用收盘数据" accent="text-[#3f6fb3]" /></section>

        <section className="mt-10 rounded-2xl border border-[#e1d7cc] bg-[#fffdf9] p-5 sm:p-7"><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold tracking-[0.16em] text-[#b74738]">INDEX PATH</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">历史净值与指数点数</h2></div><p className="text-sm text-[#7b7269]">{navRows[0]?.date} → {latest?.date} · {latest ? formatNumber(latest.index_points) : '—'} 点</p></div><PathChart rows={navRows} /></section>

        <section className="mt-10 grid gap-7 lg:grid-cols-[0.86fr_1.14fr]"><div className="rounded-2xl bg-[#20252c] p-7 text-[#f8f3ea]"><p className="text-xs font-semibold tracking-[0.16em] text-[#e9a296]">RESEARCH FRAMEWORK</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">把“看好”变成可验证的纪律。</h2><div className="mt-7 space-y-4 text-sm leading-6 text-[#c9c2b9]"><p><span className="mr-2 text-[#f07767]">01</span>质量与价值：以财务稳健、现金创造和估值安全边际形成基础观察。</p><p><span className="mr-2 text-[#f07767]">02</span>股东结构：关注筹码变化与拥挤度，辅助理解市场定价的阶段性特征。</p><p><span className="mr-2 text-[#f07767]">03</span>价格纪律：通过分批建仓、排名缓冲与网格止盈，避免用情绪替代执行。</p></div></div>
          <div className="rounded-2xl border border-[#e1d7cc] bg-[#fffdf9] p-6 sm:p-7"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold tracking-[0.16em] text-[#b74738]">FACTOR EVIDENCE</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">因子研究摘要</h2></div><ShieldCheck className="h-7 w-7 text-[#e65342]" /></div><div className="mt-6 space-y-3">{highlights.map((factor) => <article key={`${factor.name}-${factor.horizon}`} className="rounded-xl border border-[#ebe2d9] bg-[#fdfaf6] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{factor.name} <span className="font-normal text-[#7d746b]">· {factor.label}</span></h3><p className="mt-1 text-sm text-[#756c63]">{factor.horizon} · {factor.months}个月 · 正 IC 比例 {formatPct(factor.positive_ratio)}</p></div><span className="rounded-full bg-[#fff0ec] px-3 py-1 text-sm font-semibold text-[#d74b3a]">Rank IC {factor.mean_rank_ic.toFixed(3)}</span></div><div className="mt-3 flex items-center gap-2 text-sm text-[#615950]"><span className="rounded-md bg-[#eee8e0] px-2 py-1 font-semibold text-[#2e2d2a]">ICIR {factor.icir.toFixed(2)}</span><span>平均 Rank IC / 月度波动率</span></div></article>)}</div></div></section>

        <footer className="mt-12 border-t border-[#e4dace] pt-6 text-center text-xs leading-6 text-[#837970]">悟空质量价值指数 · 研究员 Cade Li · 数据按收盘后版本更新 · 研究资料，不构成投资建议</footer>
      </div>
    </main>
  );
}

function Metric({ icon, label, value, detail, accent }: { icon: ReactNode; label: string; value: string; detail: string; accent: string }) {
  return <article className="rounded-xl border border-[#e1d7cc] bg-[#fffdf9] p-4 shadow-[0_8px_20px_rgba(58,47,38,0.03)]"><div className={`flex items-center gap-2 text-xs font-medium ${accent}`}>{icon}{label}</div><p className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#252522]">{value}</p><p className="mt-1 text-xs text-[#81776e]">{detail}</p></article>;
}
