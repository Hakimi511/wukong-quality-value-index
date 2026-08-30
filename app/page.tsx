import {
  Activity,
  BarChart3,
  CalendarCheck,
  ChartNoAxesCombined,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { ReactNode } from 'react';
import snapshot from '../public/data/public_snapshot.json';

type NumberOrNull = number | null;
type NavRow = { date: string; index_points: number };
type IndustryRow = {
  industry: string;
  count: number;
  weighted_return: NumberOrNull;
  positive_ratio: NumberOrNull;
};
type BenchmarkRow = { name: string; date: string; close: NumberOrNull; change: NumberOrNull };
type DailyBrief = {
  as_of: string;
  previous_date: string;
  index_points: NumberOrNull;
  index_daily_change: NumberOrNull;
  nav_amount: NumberOrNull;
  nav_daily_change: NumberOrNull;
  ytd_return: NumberOrNull;
  cumulative_return: NumberOrNull;
  historical_cagr: NumberOrNull;
  historical_max_drawdown: NumberOrNull;
  historical_sharpe: NumberOrNull;
  action_count: number;
  action_text: string;
  pit_status: string;
  data_status: string;
  conclusion: string;
  industry: { observation: string; coverage: number; total: number; rows: IndustryRow[] };
  benchmarks: BenchmarkRow[];
};

const isFiniteNumber = (value: NumberOrNull | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const formatPct = (value: NumberOrNull | undefined, signed = false) => {
  if (!isFiniteNumber(value)) return '—';
  const prefix = signed && value > 0 ? '+' : '';
  return `${prefix}${(value * 100).toFixed(2)}%`;
};

const formatNumber = (value: NumberOrNull | undefined, digits = 2) =>
  isFiniteNumber(value)
    ? new Intl.NumberFormat('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)
    : '—';

const formatMoney = (value: NumberOrNull | undefined) =>
  isFiniteNumber(value)
    ? new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(value)
    : '—';

const changeClass = (value: NumberOrNull | undefined) =>
  isFiniteNumber(value) ? (value >= 0 ? 'text-[#d74b3a]' : 'text-[#279461]') : 'text-[#81776e]';

function PathChart({ rows, title, resetAtStart = false }: { rows: NavRow[]; title: string; resetAtStart?: boolean }) {
  const sampledBase = rows.filter((_, index) => index % Math.ceil(rows.length / 260) === 0 || index === rows.length - 1);
  const anchor = sampledBase[0]?.index_points || 1000;
  const sampled = resetAtStart
    ? sampledBase.map((row) => ({ ...row, index_points: row.index_points / anchor * 1000 }))
    : sampledBase;
  const values = sampled.map((row) => row.index_points);
  if (values.length < 2) return <div className="grid min-h-64 place-items-center text-sm text-[#837970]">暂无足够净值数据</div>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, 1);
  const width = 1040;
  const height = 330;
  const pad = { left: 56, right: 28, top: 34, bottom: 34 };
  const x = (index: number) => pad.left + (index / Math.max(sampled.length - 1, 1)) * (width - pad.left - pad.right);
  const y = (value: number) => height - pad.bottom - ((value - (min - spread * 0.08)) / (spread * 1.16)) * (height - pad.top - pad.bottom);
  const line = sampled.map((row, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(row.index_points).toFixed(1)}`).join(' ');
  const area = `${line} L${x(sampled.length - 1).toFixed(1)},${height - pad.bottom} L${x(0)},${height - pad.bottom} Z`;
  const grid = [0, 0.5, 1].map((ratio) => ({ value: max - ratio * (max - min), yy: pad.top + ratio * (height - pad.top - pad.bottom) }));
  const labels = [sampled[0], sampled[Math.floor(sampled.length / 2)], sampled.at(-1)].filter(Boolean) as NavRow[];
  const gradient = resetAtStart ? 'nav-fill-year' : 'nav-fill-all';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={title}>
      <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ef5a49" stopOpacity="0.26" /><stop offset="1" stopColor="#ef5a49" stopOpacity="0" /></linearGradient></defs>
      <text x={pad.left} y="18" fill="#81776e" fontSize="12">{title}</text>
      {grid.map(({ value, yy }) => <g key={yy}><line x1={pad.left} x2={width - pad.right} y1={yy} y2={yy} stroke="#eadfd4" strokeDasharray="3 7" /><text x="4" y={yy + 4} fill="#8a8178" fontSize="11">{formatNumber(value, 0)}</text></g>)}
      <path d={area} fill={`url(#${gradient})`} />
      <path d={line} fill="none" stroke="#e65342" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {labels.map((row, index) => <text key={row.date} x={index === 0 ? pad.left : index === 2 ? width - pad.right : width / 2} y={height - 8} textAnchor={index === 0 ? 'start' : index === 2 ? 'end' : 'middle'} fill="#8a8178" fontSize="11">{row.date.slice(0, 7)}</text>)}
    </svg>
  );
}

function Metric({ icon, label, value, detail, accent }: { icon: ReactNode; label: string; value: string; detail: string; accent: string }) {
  return <article className="rounded-xl border border-[#e1d7cc] bg-[#fffdf9] p-4 shadow-[0_8px_20px_rgba(58,47,38,0.03)]"><div className={`flex items-center gap-2 text-xs font-medium ${accent}`}>{icon}{label}</div><p className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#252522]">{value}</p><p className="mt-1 text-xs text-[#81776e]">{detail}</p></article>;
}

export default function Home() {
  const strategy = snapshot.strategy;
  const highlights = snapshot.factor_highlights;
  const navRows = snapshot.nav_daily as NavRow[];
  const daily = snapshot.daily_brief as DailyBrief;
  const latest = navRows.at(-1);
  const endMillis = latest ? Date.parse(`${latest.date}T00:00:00Z`) : 0;
  const oneYearRows = navRows.filter((row) => Date.parse(`${row.date}T00:00:00Z`) >= endMillis - 365 * 24 * 60 * 60 * 1000);
  const indexRows: BenchmarkRow[] = [{ name: '悟空质量价值指数', date: daily.as_of, close: daily.index_points, change: daily.index_daily_change }, ...daily.benchmarks];

  return (
    <main className="min-h-screen bg-[#f8f5f0] text-[#21201e]">
      <div className="mx-auto max-w-6xl px-5 pb-14 pt-6 sm:px-9 sm:pt-8">
        <header className="flex items-center justify-between border-b border-[#e7ded4] pb-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#20252c] text-lg font-bold text-[#f9f4eb]">W</span><div><p className="text-base font-semibold tracking-tight">悟空质量价值指数</p><p className="mt-0.5 text-xs tracking-[0.12em] text-[#837970]">WUKONG QUALITY VALUE INDEX</p></div></div><div className="rounded-full border border-[#e6d6cc] bg-[#fff8f4] px-3 py-1.5 text-xs font-medium text-[#b74738]">收盘更新 · {daily.as_of}</div></header>

        <section className="grid gap-8 py-12 lg:grid-cols-[1.18fr_0.82fr] lg:items-end"><div><p className="mb-4 text-xs font-semibold tracking-[0.18em] text-[#b74738]">DAILY CLOSE BRIEF · QUALITY · VALUE · DISCIPLINE</p><h1 className="max-w-3xl text-4xl font-semibold leading-[1.13] tracking-[-0.045em] text-[#20252c] sm:text-6xl">把每一次收盘，<br />都留在同一条净值曲线上。</h1><p className="mt-5 max-w-xl text-base leading-7 text-[#665f58]">每日公开简报以同一份收盘后数据生成：指数点位、净值、市场对照、行业观察与长期表现同步记录，长期可回溯。</p></div><div className="rounded-2xl border border-[#ddd3c8] bg-[#fffdf9] p-6 shadow-[0_16px_40px_rgba(58,47,38,0.06)]"><div className="flex items-center justify-between text-xs text-[#82786f]"><span>今日模型结论</span><CalendarCheck className="h-4 w-4 text-[#e65342]" /></div><p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#20252c]">{daily.action_text}</p><p className="mt-4 text-sm leading-6 text-[#81776e]">{daily.data_status}</p></div></section>

        <section aria-labelledby="daily-title"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold tracking-[0.16em] text-[#b74738]">DAILY PUBLIC BRIEF</p><h2 id="daily-title" className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{daily.as_of} 收盘简报</h2></div><p className="text-sm text-[#7b7269]">较上一可用账本日 {daily.previous_date}</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={<Activity className="h-4 w-4" />} label="悟空指数点数" value={formatNumber(daily.index_points)} detail={formatPct(daily.index_daily_change, true)} accent={changeClass(daily.index_daily_change)} /><Metric icon={<ChartNoAxesCombined className="h-4 w-4" />} label="账本净值" value={formatMoney(daily.nav_amount)} detail={formatPct(daily.nav_daily_change, true)} accent={changeClass(daily.nav_daily_change)} /><Metric icon={<TrendingUp className="h-4 w-4" />} label="年内收益" value={formatPct(daily.ytd_return, true)} detail={`累计 ${formatPct(daily.cumulative_return, true)}`} accent="text-[#d74b3a]" /><Metric icon={<CalendarCheck className="h-4 w-4" />} label="当日模型动作" value={daily.action_count ? `${daily.action_count} 笔` : '无调仓'} detail={daily.pit_status === 'pass' ? '数据时点校验通过' : '数据校验状态待确认'} accent="text-[#3f6fb3]" /></div><section className="mt-5 rounded-2xl border border-[#e1d7cc] bg-[#fffdf9] p-5 sm:p-7"><p className="text-xs font-semibold tracking-[0.16em] text-[#b74738]">TODAY&apos;S CONCLUSION</p><p className="mt-3 text-base leading-8 text-[#544d46]">{daily.conclusion}</p></section></section>

        <section className="mt-10 grid gap-7 lg:grid-cols-[0.9fr_1.1fr]"><article className="rounded-2xl bg-[#20252c] p-7 text-[#f8f3ea]"><p className="text-xs font-semibold tracking-[0.16em] text-[#e9a296]">INDUSTRY OBSERVATION</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">今日行业观察</h2><p className="mt-5 text-sm leading-7 text-[#c9c2b9]">{daily.industry.observation}</p><div className="mt-7 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[#e7ddd3]"><span className="text-[#f07767]">覆盖范围</span><p className="mt-2 text-2xl font-semibold">{daily.industry.coverage}/{daily.industry.total} 只</p><p className="mt-1 text-xs leading-5 text-[#bfb5aa]">行业涨跌按期末市值加权，并以最近两个可用收盘日计算。</p></div></article><article className="overflow-hidden rounded-2xl border border-[#e1d7cc] bg-[#fffdf9] p-5 sm:p-7"><div><p className="text-xs font-semibold tracking-[0.16em] text-[#b74738]">SECTOR TABLE</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">行业日度表现</h2></div><div className="mt-5 max-h-[440px] overflow-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="sticky top-0 bg-[#fffdf9] text-xs text-[#837970]"><tr className="border-b border-[#e7ded4]"><th className="pb-3 font-medium">行业</th><th className="pb-3 text-right font-medium">持仓数量</th><th className="pb-3 text-right font-medium">市值加权涨跌</th><th className="pb-3 text-right font-medium">上涨占比</th></tr></thead><tbody>{daily.industry.rows.map((row) => <tr key={row.industry} className="border-b border-[#f0e9e1]"><td className="py-3 font-medium">{row.industry}</td><td className="py-3 text-right text-[#665f58]">{row.count}</td><td className={`py-3 text-right font-semibold ${changeClass(row.weighted_return)}`}>{formatPct(row.weighted_return, true)}</td><td className="py-3 text-right text-[#665f58]">{formatPct(row.positive_ratio)}</td></tr>)}</tbody></table></div></article></section>

        <section className="mt-10 rounded-2xl border border-[#e1d7cc] bg-[#fffdf9] p-5 sm:p-7"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold tracking-[0.16em] text-[#b74738]">MARKET CLOSE</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">主要指数收盘对照</h2></div><p className="text-sm text-[#7b7269]">按各自最近可用交易日展示</p></div><div className="overflow-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="text-xs text-[#837970]"><tr className="border-b border-[#e7ded4]"><th className="pb-3 font-medium">指数</th><th className="pb-3 text-right font-medium">收盘点数</th><th className="pb-3 text-right font-medium">当日涨跌</th><th className="pb-3 text-right font-medium">数据日期</th></tr></thead><tbody>{indexRows.map((row) => <tr key={row.name} className="border-b border-[#f0e9e1]"><td className="py-3 font-medium">{row.name}</td><td className="py-3 text-right">{formatNumber(row.close)}</td><td className={`py-3 text-right font-semibold ${changeClass(row.change)}`}>{formatPct(row.change, true)}</td><td className="py-3 text-right text-[#665f58]">{row.date}</td></tr>)}</tbody></table></div></section>

        <section className="mt-10 rounded-2xl border border-[#e1d7cc] bg-[#fffdf9] p-5 sm:p-7"><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold tracking-[0.16em] text-[#b74738]">NET VALUE PATH</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">净值走势与长期记录</h2></div><p className="text-sm text-[#7b7269]">{navRows[0]?.date} → {latest?.date}</p></div><PathChart rows={navRows} title="全历史净值走势（2016-05-03 = 1000）" /><div className="mt-8 border-t border-[#eee5dc] pt-7"><PathChart rows={oneYearRows} title="近一年净值走势（窗口起点 = 1000）" resetAtStart /></div></section>

        <section className="mt-10 grid gap-3 sm:grid-cols-3"><Metric icon={<TrendingUp className="h-4 w-4" />} label="历史年化" value={formatPct(daily.historical_cagr)} detail={`${strategy.start} 至 ${strategy.end}`} accent="text-[#dc4c3b]" /><Metric icon={<TrendingDown className="h-4 w-4" />} label="最大回撤" value={formatPct(daily.historical_max_drawdown)} detail="按历史收盘净值计算" accent="text-[#279461]" /><Metric icon={<BarChart3 className="h-4 w-4" />} label="Sharpe" value={formatNumber(daily.historical_sharpe)} detail="零无风险利率口径" accent="text-[#dc4c3b]" /></section>

        <section className="mt-10 grid gap-7 lg:grid-cols-[0.86fr_1.14fr]"><div className="rounded-2xl bg-[#20252c] p-7 text-[#f8f3ea]"><p className="text-xs font-semibold tracking-[0.16em] text-[#e9a296]">RESEARCH FRAMEWORK</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">把“看好”变成可验证的纪律。</h2><div className="mt-7 space-y-4 text-sm leading-6 text-[#c9c2b9]"><p><span className="mr-2 text-[#f07767]">01</span>质量与价值：以财务稳健、现金创造和估值安全边际形成基础观察。</p><p><span className="mr-2 text-[#f07767]">02</span>股东结构：关注筹码变化与拥挤度，辅助理解市场定价的阶段性特征。</p><p><span className="mr-2 text-[#f07767]">03</span>价格纪律：通过分批建仓、排名缓冲与网格止盈，避免用情绪替代执行。</p></div></div><div className="rounded-2xl border border-[#e1d7cc] bg-[#fffdf9] p-6 sm:p-7"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold tracking-[0.16em] text-[#b74738]">FACTOR EVIDENCE</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">因子研究摘要</h2></div><ShieldCheck className="h-7 w-7 text-[#e65342]" /></div><div className="mt-6 space-y-3">{highlights.map((factor) => <article key={`${factor.name}-${factor.horizon}`} className="rounded-xl border border-[#ebe2d9] bg-[#fdfaf6] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{factor.name} <span className="font-normal text-[#7d746b]">· {factor.label}</span></h3><p className="mt-1 text-sm text-[#756c63]">{factor.horizon} · {factor.months}个月 · 正 IC 比例 {formatPct(factor.positive_ratio)}</p></div><span className="rounded-full bg-[#fff0ec] px-3 py-1 text-sm font-semibold text-[#d74b3a]">Rank IC {factor.mean_rank_ic.toFixed(3)}</span></div><div className="mt-3 flex items-center gap-2 text-sm text-[#615950]"><span className="rounded-md bg-[#eee8e0] px-2 py-1 font-semibold text-[#2e2d2a]">ICIR {factor.icir.toFixed(2)}</span><span>平均 Rank IC / 月度波动率</span></div></article>)}</div></div></section>

        <footer className="mt-12 border-t border-[#e4dace] pt-6 text-center text-xs leading-6 text-[#837970]">悟空质量价值指数 · 研究员 Cade Li · 数据按收盘后版本更新 · 研究资料，不构成投资建议</footer>
      </div>
    </main>
  );
}
