import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

// ─────────────────────────────────────────────────────────────────
// DATA  (2023-06 〜 2026-05 / 166 active records)
// ─────────────────────────────────────────────────────────────────
const RAW = [{"ym":"2026-05","broker":"HFM","ac":"35468021","balance":278438,"equity":277605,"credit":0,"closed_pl":-25893,"dep_wd":0,"trades":10},{"ym":"2026-05","broker":"Exness","ac":"19155083","balance":143429,"equity":143429,"credit":0,"closed_pl":-1739,"dep_wd":0,"trades":2},{"ym":"2026-05","broker":"Axiory","ac":"1823716","balance":0,"equity":0,"credit":0,"closed_pl":0,"dep_wd":0,"trades":0},{"ym":"2026-05","broker":"Axiory","ac":"1290643","balance":0,"equity":0,"credit":0,"closed_pl":0,"dep_wd":0,"trades":0},{"ym":"2026-05","broker":"XM Trading","ac":"253063455","balance":0,"equity":0,"credit":0,"closed_pl":0,"dep_wd":0,"trades":0},{"ym":"2026-05","broker":"XM Trading","ac":"41115299","balance":259128,"equity":372940,"credit":56906,"closed_pl":-44982,"dep_wd":-9921,"trades":171},{"ym":"2026-05","broker":"XM Trading","ac":"50109850","balance":96692,"equity":96692,"credit":0,"closed_pl":0,"dep_wd":5534,"trades":0},{"ym":"2026-04","broker":"HFM","ac":"35468021","balance":304331,"equity":298883,"credit":0,"closed_pl":-6246,"dep_wd":0,"trades":8},{"ym":"2026-04","broker":"Exness","ac":"19155083","balance":145168,"equity":145168,"credit":0,"closed_pl":-1842,"dep_wd":0,"trades":5},{"ym":"2026-04","broker":"XM Trading","ac":"41115299","balance":313159,"equity":428715,"credit":57778,"closed_pl":15438,"dep_wd":-8882,"trades":155},{"ym":"2026-04","broker":"XM Trading","ac":"50109850","balance":91158,"equity":91158,"credit":0,"closed_pl":0,"dep_wd":8882,"trades":0},{"ym":"2026-03","broker":"HFM","ac":"35468021","balance":310577,"equity":310577,"credit":0,"closed_pl":-17109,"dep_wd":0,"trades":13},{"ym":"2026-03","broker":"Exness","ac":"19155083","balance":147010,"equity":148258,"credit":0,"closed_pl":-8427,"dep_wd":0,"trades":8},{"ym":"2026-03","broker":"XM Trading","ac":"41115299","balance":305173,"equity":423589,"credit":59208,"closed_pl":17763,"dep_wd":-10423,"trades":264},{"ym":"2026-03","broker":"XM Trading","ac":"50109850","balance":82276,"equity":82276,"credit":0,"closed_pl":0,"dep_wd":6052,"trades":0},{"ym":"2026-02","broker":"Exness","ac":"19155083","balance":155437,"equity":155437,"credit":0,"closed_pl":-13566,"dep_wd":0,"trades":9},{"ym":"2026-02","broker":"XM Trading","ac":"41115299","balance":296807,"equity":417275,"credit":60234,"closed_pl":12103,"dep_wd":-4532,"trades":179},{"ym":"2026-02","broker":"XM Trading","ac":"50109850","balance":76224,"equity":76224,"credit":0,"closed_pl":0,"dep_wd":4532,"trades":0},{"ym":"2026-01","broker":"HFM","ac":"35468021","balance":372742,"equity":350306,"credit":0,"closed_pl":19644,"dep_wd":0,"trades":8},{"ym":"2026-01","broker":"Exness","ac":"19155083","balance":169003,"equity":169003,"credit":0,"closed_pl":-18881,"dep_wd":0,"trades":16},{"ym":"2026-01","broker":"XM Trading","ac":"41115299","balance":288445,"equity":410495,"credit":61025,"closed_pl":9064,"dep_wd":-7436,"trades":198},{"ym":"2026-01","broker":"XM Trading","ac":"50109850","balance":71692,"equity":71692,"credit":0,"closed_pl":0,"dep_wd":7436,"trades":0},{"ym":"2025-12","broker":"HFM","ac":"35468021","balance":353098,"equity":353098,"credit":0,"closed_pl":-28573,"dep_wd":0,"trades":8},{"ym":"2025-12","broker":"Exness","ac":"19155083","balance":187884,"equity":188620,"credit":0,"closed_pl":1512,"dep_wd":0,"trades":22},{"ym":"2025-12","broker":"XM Trading","ac":"41115299","balance":285484,"equity":410200,"credit":62358,"closed_pl":14872,"dep_wd":-7043,"trades":260},{"ym":"2025-12","broker":"XM Trading","ac":"50109850","balance":64256,"equity":64256,"credit":0,"closed_pl":0,"dep_wd":7043,"trades":0},{"ym":"2025-11","broker":"HFM","ac":"35468021","balance":381671,"equity":382961,"credit":0,"closed_pl":-10921,"dep_wd":0,"trades":8},{"ym":"2025-11","broker":"Exness","ac":"19155083","balance":186372,"equity":182949,"credit":0,"closed_pl":-11397,"dep_wd":0,"trades":19},{"ym":"2025-11","broker":"XM Trading","ac":"41115299","balance":276336,"equity":403690,"credit":63677,"closed_pl":14086,"dep_wd":-14740,"trades":344},{"ym":"2025-11","broker":"XM Trading","ac":"50109850","balance":57213,"equity":57213,"credit":0,"closed_pl":0,"dep_wd":14740,"trades":0},{"ym":"2025-10","broker":"Exness","ac":"19155083","balance":197769,"equity":194436,"credit":0,"closed_pl":20813,"dep_wd":0,"trades":13},{"ym":"2025-10","broker":"HFM","ac":"35468021","balance":392592,"equity":394182,"credit":0,"closed_pl":-32098,"dep_wd":0,"trades":15},{"ym":"2025-10","broker":"XM Trading","ac":"41115299","balance":274110,"equity":407224,"credit":66557,"closed_pl":29479,"dep_wd":-42473,"trades":385},{"ym":"2025-10","broker":"XM Trading","ac":"50109850","balance":42473,"equity":42473,"credit":0,"closed_pl":0,"dep_wd":42473,"trades":0},{"ym":"2025-09","broker":"HFM","ac":"35468021","balance":424690,"equity":421755,"credit":0,"closed_pl":-46646,"dep_wd":0,"trades":14},{"ym":"2025-09","broker":"Exness","ac":"19155083","balance":176956,"equity":176996,"credit":0,"closed_pl":-9579,"dep_wd":0,"trades":11},{"ym":"2025-09","broker":"XM Trading","ac":"41115299","balance":278352,"equity":428970,"credit":75309,"closed_pl":15968,"dep_wd":-4121,"trades":185},{"ym":"2025-08","broker":"HFM","ac":"35468021","balance":471336,"equity":466714,"credit":0,"closed_pl":-6922,"dep_wd":0,"trades":12},{"ym":"2025-08","broker":"Exness","ac":"19155083","balance":186535,"equity":186197,"credit":0,"closed_pl":-15654,"dep_wd":0,"trades":12},{"ym":"2025-08","broker":"XM Trading","ac":"41115299","balance":272951,"equity":410677,"credit":68863,"closed_pl":2727,"dep_wd":12459,"trades":42},{"ym":"2025-07","broker":"Exness","ac":"19155083","balance":202189,"equity":202127,"credit":0,"closed_pl":-10307,"dep_wd":0,"trades":17},{"ym":"2025-07","broker":"HFM","ac":"35468021","balance":478258,"equity":478258,"credit":0,"closed_pl":12414,"dep_wd":0,"trades":24},{"ym":"2025-07","broker":"XM Trading","ac":"41115299","balance":247133,"equity":379863,"credit":66365,"closed_pl":13130,"dep_wd":56277,"trades":308},{"ym":"2025-06","broker":"HFM","ac":"35468021","balance":465844,"equity":465592,"credit":0,"closed_pl":12936,"dep_wd":0,"trades":27},{"ym":"2025-06","broker":"Exness","ac":"19155083","balance":212496,"equity":205884,"credit":0,"closed_pl":-26161,"dep_wd":0,"trades":3},{"ym":"2025-06","broker":"XM Trading","ac":"41115299","balance":247133,"equity":379863,"credit":66365,"closed_pl":13026,"dep_wd":0,"trades":345},{"ym":"2025-05","broker":"Exness","ac":"19155083","balance":238657,"equity":238657,"credit":0,"closed_pl":3590,"dep_wd":0,"trades":6},{"ym":"2025-05","broker":"HFM","ac":"35468021","balance":457553,"equity":454511,"credit":0,"closed_pl":-28413,"dep_wd":0,"trades":11},{"ym":"2025-05","broker":"XM Trading","ac":"41115299","balance":234107,"equity":366837,"credit":66365,"closed_pl":20939,"dep_wd":195195,"trades":397},{"ym":"2025-04","broker":"XM Trading","ac":"41115299","balance":17973,"equity":150703,"credit":66365,"closed_pl":15693,"dep_wd":9747,"trades":630},{"ym":"2025-03","broker":"Exness","ac":"19155083","balance":163026,"equity":163026,"credit":0,"closed_pl":136655,"dep_wd":-150000,"trades":13},{"ym":"2025-03","broker":"XM Trading","ac":"41115299","balance":-7467,"equity":125263,"credit":66365,"closed_pl":4563,"dep_wd":0,"trades":234},{"ym":"2025-03","broker":"XM Trading","ac":"50109850","balance":9884,"equity":9884,"credit":0,"closed_pl":-1780,"dep_wd":0,"trades":188},{"ym":"2025-03","broker":"XM Trading","ac":"260018060","balance":199287,"equity":199287,"credit":0,"closed_pl":9030,"dep_wd":5795,"trades":5},{"ym":"2025-02","broker":"Exness","ac":"19155083","balance":176371,"equity":176371,"credit":0,"closed_pl":753,"dep_wd":-50000,"trades":4},{"ym":"2025-02","broker":"Axiory","ac":"1823716","balance":114051,"equity":214051,"credit":100000,"closed_pl":14051,"dep_wd":100000,"trades":6},{"ym":"2025-02","broker":"XM Trading","ac":"41115299","balance":-911,"equity":109581,"credit":55246,"closed_pl":-9116,"dep_wd":8298,"trades":63},{"ym":"2025-02","broker":"XM Trading","ac":"50109850","balance":11664,"equity":11620,"credit":0,"closed_pl":-163077,"dep_wd":71607,"trades":180},{"ym":"2025-02","broker":"XM Trading","ac":"260018060","balance":184462,"equity":184462,"credit":0,"closed_pl":100,"dep_wd":8393,"trades":16},{"ym":"2025-01","broker":"Exness","ac":"19155083","balance":225618,"equity":225320,"credit":0,"closed_pl":-4585,"dep_wd":0,"trades":12},{"ym":"2025-01","broker":"XM Trading","ac":"41115299","balance":1572,"equity":108734,"credit":53581,"closed_pl":3780,"dep_wd":-86642,"trades":199},{"ym":"2025-01","broker":"XM Trading","ac":"260018060","balance":175969,"equity":175969,"credit":0,"closed_pl":9714,"dep_wd":0,"trades":12},{"ym":"2025-01","broker":"XM Trading","ac":"50109850","balance":103134,"equity":103134,"credit":0,"closed_pl":3134,"dep_wd":94799,"trades":203},{"ym":"2024-12","broker":"Exness","ac":"19155083","balance":230203,"equity":230203,"credit":0,"closed_pl":14340,"dep_wd":0,"trades":17},{"ym":"2024-12","broker":"XM Trading","ac":"41115299","balance":61819,"equity":214211,"credit":76196,"closed_pl":6380,"dep_wd":5965,"trades":195},{"ym":"2024-12","broker":"XM Trading","ac":"260018060","balance":166255,"equity":166255,"credit":0,"closed_pl":-2389,"dep_wd":0,"trades":19},{"ym":"2024-11","broker":"Exness","ac":"19155083","balance":215863,"equity":215924,"credit":0,"closed_pl":-32976,"dep_wd":0,"trades":12},{"ym":"2024-11","broker":"XM Trading","ac":"260018060","balance":168644,"equity":168644,"credit":0,"closed_pl":640,"dep_wd":0,"trades":13},{"ym":"2024-11","broker":"XM Trading","ac":"41115299","balance":50670,"equity":200670,"credit":75000,"closed_pl":11625,"dep_wd":0,"trades":382},{"ym":"2024-10","broker":"Exness","ac":"19155083","balance":248839,"equity":248839,"credit":0,"closed_pl":26501,"dep_wd":0,"trades":13},{"ym":"2024-10","broker":"XM Trading","ac":"260018060","balance":168004,"equity":168004,"credit":0,"closed_pl":62268,"dep_wd":-58552,"trades":39},{"ym":"2024-10","broker":"XM Trading","ac":"41115299","balance":39045,"equity":189045,"credit":75000,"closed_pl":11419,"dep_wd":0,"trades":283},{"ym":"2024-09","broker":"Exness","ac":"19155083","balance":222338,"equity":222338,"credit":0,"closed_pl":29417,"dep_wd":-400000,"trades":12},{"ym":"2024-09","broker":"XM Trading","ac":"260018060","balance":164288,"equity":164288,"credit":0,"closed_pl":-25469,"dep_wd":0,"trades":23},{"ym":"2024-09","broker":"XM Trading","ac":"41115299","balance":27626,"equity":177626,"credit":75000,"closed_pl":1050,"dep_wd":0,"trades":448},{"ym":"2024-08","broker":"XM Trading","ac":"260018060","balance":189757,"equity":189757,"credit":0,"closed_pl":6388,"dep_wd":0,"trades":17},{"ym":"2024-08","broker":"XM Trading","ac":"41115299","balance":26576,"equity":176576,"credit":75000,"closed_pl":6995,"dep_wd":0,"trades":394},{"ym":"2024-07","broker":"Exness","ac":"19155083","balance":598649,"equity":607693,"credit":0,"closed_pl":66378,"dep_wd":0,"trades":24},{"ym":"2024-07","broker":"XM Trading","ac":"253063455","balance":-37,"equity":37,"credit":37,"closed_pl":-245021,"dep_wd":12739,"trades":67},{"ym":"2024-07","broker":"XM Trading","ac":"260018060","balance":183369,"equity":183369,"credit":0,"closed_pl":-64475,"dep_wd":147844,"trades":21},{"ym":"2024-07","broker":"XM Trading","ac":"41115299","balance":19581,"equity":169581,"credit":75000,"closed_pl":19581,"dep_wd":0,"trades":510},{"ym":"2024-06","broker":"Exness","ac":"19155083","balance":532271,"equity":542783,"credit":0,"closed_pl":-14816,"dep_wd":0,"trades":7},{"ym":"2024-06","broker":"XM Trading","ac":"253063455","balance":219506,"equity":245058,"credit":12776,"closed_pl":133921,"dep_wd":-160000,"trades":219},{"ym":"2024-06","broker":"XM Trading","ac":"50109850","balance":146135,"equity":146135,"credit":0,"closed_pl":-5977,"dep_wd":60000,"trades":22},{"ym":"2024-06","broker":"XM Trading","ac":"260018060","balance":100000,"equity":100000,"credit":0,"closed_pl":0,"dep_wd":100000,"trades":0},{"ym":"2024-05","broker":"Exness","ac":"19155083","balance":547087,"equity":547087,"credit":0,"closed_pl":7352,"dep_wd":0,"trades":1},{"ym":"2024-05","broker":"XM Trading","ac":"50109850","balance":92112,"equity":92112,"credit":0,"closed_pl":-7888,"dep_wd":100000,"trades":2},{"ym":"2024-05","broker":"XM Trading","ac":"253063455","balance":258354,"equity":258368,"credit":7,"closed_pl":71733,"dep_wd":-100000,"trades":219},{"ym":"2024-04","broker":"Exness","ac":"19155083","balance":539735,"equity":539735,"credit":0,"closed_pl":98,"dep_wd":0,"trades":3},{"ym":"2024-04","broker":"XM Trading","ac":"253063455","balance":286618,"equity":284316,"credit":10,"closed_pl":41816,"dep_wd":244812,"trades":100},{"ym":"2024-03","broker":"XM Trading","ac":"260018060","balance":96392,"equity":96392,"credit":0,"closed_pl":436,"dep_wd":0,"trades":0},{"ym":"2024-03","broker":"XM Trading","ac":"50109850","balance":155768,"equity":155768,"credit":0,"closed_pl":-19496,"dep_wd":45000,"trades":34},{"ym":"2024-03","broker":"Exness","ac":"19155083","balance":539638,"equity":539638,"credit":0,"closed_pl":11446,"dep_wd":0,"trades":5},{"ym":"2024-02","broker":"Exness","ac":"19155083","balance":528192,"equity":528192,"credit":0,"closed_pl":11752,"dep_wd":0,"trades":6},{"ym":"2024-02","broker":"XM Trading","ac":"260018060","balance":95956,"equity":95956,"credit":0,"closed_pl":-2114,"dep_wd":0,"trades":0},{"ym":"2024-02","broker":"XM Trading","ac":"50109850","balance":130264,"equity":130264,"credit":0,"closed_pl":-20250,"dep_wd":50000,"trades":25},{"ym":"2024-02","broker":"XM Trading","ac":"253063455","balance":222956,"equity":259408,"credit":20196,"closed_pl":56814,"dep_wd":-50000,"trades":204},{"ym":"2024-01","broker":"Exness","ac":"19155083","balance":516440,"equity":516440,"credit":0,"closed_pl":218,"dep_wd":0,"trades":6},{"ym":"2024-01","broker":"XM Trading","ac":"260018060","balance":98070,"equity":97967,"credit":0,"closed_pl":-857,"dep_wd":0,"trades":0},{"ym":"2024-01","broker":"XM Trading","ac":"50109850","balance":100514,"equity":100514,"credit":0,"closed_pl":-45597,"dep_wd":100000,"trades":31},{"ym":"2024-01","broker":"XM Trading","ac":"253063455","balance":211554,"equity":261122,"credit":24784,"closed_pl":121947,"dep_wd":-100000,"trades":314},{"ym":"2023-12","broker":"XM Trading","ac":"56080428","balance":63010,"equity":159918,"credit":48454,"closed_pl":14523,"dep_wd":0,"trades":295},{"ym":"2023-12","broker":"XM Trading","ac":"260018060","balance":98927,"equity":98927,"credit":0,"closed_pl":-2721,"dep_wd":0,"trades":0},{"ym":"2023-12","broker":"XM Trading","ac":"253063455","balance":174391,"equity":254391,"credit":40000,"closed_pl":14391,"dep_wd":200000,"trades":65},{"ym":"2023-12","broker":"XM Trading","ac":"50109850","balance":46111,"equity":27768,"credit":0,"closed_pl":-53889,"dep_wd":0,"trades":67},{"ym":"2023-11","broker":"XM Trading","ac":"56080428","balance":48487,"equity":145395,"credit":48454,"closed_pl":-7524,"dep_wd":104465,"trades":394},{"ym":"2023-11","broker":"XM Trading","ac":"50109850","balance":100000,"equity":100000,"credit":0,"closed_pl":0,"dep_wd":100000,"trades":0},{"ym":"2023-11","broker":"XM Trading","ac":"260018060","balance":101648,"equity":101079,"credit":0,"closed_pl":1648,"dep_wd":100000,"trades":0},{"ym":"2023-10","broker":"XM Trading","ac":"56080428","balance":-16640,"equity":16640,"credit":16640,"closed_pl":-33999,"dep_wd":38027,"trades":530},{"ym":"2023-10","broker":"XM Trading","ac":"72009003","balance":57478,"equity":304522,"credit":123522,"closed_pl":0,"dep_wd":-7000,"trades":0},{"ym":"2023-09","broker":"XM Trading","ac":"56080428","balance":-104642,"equity":96586,"credit":100614,"closed_pl":-549659,"dep_wd":185006,"trades":415},{"ym":"2023-09","broker":"XM Trading","ac":"72009003","balance":138283,"equity":237717,"credit":49717,"closed_pl":0,"dep_wd":188000,"trades":0},{"ym":"2023-08","broker":"XM Trading","ac":"56080428","balance":205434,"equity":515816,"credit":155191,"closed_pl":78632,"dep_wd":-100000,"trades":864},{"ym":"2023-08","broker":"XM Trading","ac":"59081436","balance":61480,"equity":79324,"credit":8943,"closed_pl":20423,"dep_wd":0,"trades":859},{"ym":"2023-08","broker":"XM Trading","ac":"257036758","balance":99206,"equity":139206,"credit":20000,"closed_pl":8515,"dep_wd":0,"trades":495},{"ym":"2023-08","broker":"XM Trading","ac":"257042193","balance":398211,"equity":589205,"credit":95497,"closed_pl":74041,"dep_wd":0,"trades":253},{"ym":"2023-07","broker":"XM Trading","ac":"59081436","balance":41057,"equity":58943,"credit":8943,"closed_pl":0,"dep_wd":50000,"trades":0},{"ym":"2023-07","broker":"XM Trading","ac":"257036758","balance":90691,"equity":130691,"credit":20000,"closed_pl":10691,"dep_wd":100000,"trades":911},{"ym":"2023-07","broker":"XM Trading","ac":"56080428","balance":258155,"equity":505831,"credit":123838,"closed_pl":224640,"dep_wd":145648,"trades":514},{"ym":"2023-07","broker":"XM Trading","ac":"257042193","balance":344610,"equity":494724,"credit":75057,"closed_pl":49667,"dep_wd":370000,"trades":191},{"ym":"2023-06","broker":"XM Trading","ac":"72009003","balance":5234,"equity":194766,"credit":94766,"closed_pl":0,"dep_wd":100000,"trades":0},{"ym":"2023-06","broker":"XM Trading","ac":"56080428","balance":-1647,"equity":25057,"credit":13352,"closed_pl":-87943,"dep_wd":99648,"trades":222}];

// ─────────────────────────────────────────────────────────────────
// CONFIG & HELPERS
// ─────────────────────────────────────────────────────────────────
const AC_CFG = {
  "HFM|35468021":         { label: "HFM",    color: "#3B82F6" },
  "Exness|19155083":      { label: "Exness", color: "#10B981" },
  "XM Trading|41115299":  { label: "XM-411", color: "#8B5CF6" },
  "XM Trading|50109850":  { label: "XM-501", color: "#F59E0B" },
  "XM Trading|260018060": { label: "XM-260", color: "#EF4444" },
  "XM Trading|253063455": { label: "XM-253", color: "#EC4899" },
  "XM Trading|56080428":  { label: "XM-560", color: "#14B8A6" },
  "XM Trading|257036758": { label: "XM-257", color: "#F97316" },
  "XM Trading|257042193": { label: "XM-257B",color: "#A78BFA" },
  "XM Trading|72009003":  { label: "XM-720", color: "#6EE7B7" },
  "XM Trading|59081436":  { label: "XM-590", color: "#FB923C" },
};
const getCfg = k => AC_CFG[k] || { label: k.split("|")[1]?.slice(-6) || k, color: "#9CA3AF" };
const fmt    = n => n != null ? Math.round(n).toLocaleString("ja-JP") : "-";
const fmtPL  = n => n == null ? "-" : (n > 0 ? "+" : "") + Math.round(n).toLocaleString("ja-JP");
const totals = rows => ({
  balance: rows.reduce((s, d) => s + (d.balance  || 0), 0),
  equity:  rows.reduce((s, d) => s + (d.equity   || 0), 0),
  credit:  rows.reduce((s, d) => s + (d.credit   || 0), 0),
  pl:      rows.reduce((s, d) => s + (d.closed_pl|| 0), 0),
  trades:  rows.reduce((s, d) => s + (d.trades   || 0), 0),
});

const MONTHS  = [...new Set(RAW.map(d => d.ym))].sort();
const YEARS   = [...new Set(MONTHS.map(m => m.slice(0, 4)))].sort();
const ALL_ACS = [...new Set(RAW.map(d => `${d.broker}|${d.ac}`))];
const BROKERS = [...new Set(RAW.map(d => d.broker))].sort();

const METRIC_CFG = {
  balance:   { label: "全口座 実質残高合計", color: "#38BDF8", fill: true  },
  equity:    { label: "全口座 Equity合計",  color: "#34D399", fill: true  },
  closed_pl: { label: "全口座 月次P/L合計", color: "#A78BFA", fill: false },
};
const PL_GROUPS = {
  HFM:    ["HFM|35468021"],
  Exness: ALL_ACS.filter(k => k.startsWith("Exness")),
  XM:     ALL_ACS.filter(k => k.startsWith("XM")),
};
const PL_COLORS = { HFM: "#3B82F6", Exness: "#10B981", XM: "#8B5CF6" };

// ─────────────────────────────────────────────────────────────────
// STYLE HELPERS  (inline — no Tailwind dependency)
// ─────────────────────────────────────────────────────────────────
const S = {
  page:   { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI','Noto Sans JP',system-ui,sans-serif", fontSize: 13, color: "#1e293b" },
  hdr:    { background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  hdrT:   { fontSize: 14, fontWeight: 600 },
  hdrS:   { fontSize: 10, color: "#94a3b8", fontFamily: "monospace" },
  tabs:   { background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", overflowX: "auto" },
  tab:    (on) => ({ padding: "10px 18px", fontSize: 12, fontWeight: on ? 600 : 400, background: "none", border: "none", borderBottom: on ? "2px solid #3b82f6" : "2px solid transparent", color: on ? "#3b82f6" : "#64748b", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }),
  body:   { padding: "16px 20px", maxWidth: 900, margin: "0 auto" },
  card:   { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 12 },
  cttl:   { fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 },
  grid2:  { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8, marginBottom: 4 },
  met:    { background: "#f1f5f9", borderRadius: 8, padding: "10px 12px" },
  mL:     { fontSize: 10, color: "#64748b", marginBottom: 3 },
  mV:     { fontSize: 15, fontWeight: 600, fontFamily: "monospace" },
  mS:     { fontSize: 9, color: "#94a3b8" },
  row:    { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f1f5f9" },
  rl:     { fontSize: 12, color: "#64748b" },
  rv:     { fontSize: 12, fontFamily: "monospace" },
  seg:    { display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 2, gap: 2, width: "fit-content" },
  segB:   (on) => ({ padding: "5px 14px", borderRadius: 6, fontSize: 11, border: "none", cursor: "pointer", background: on ? "#fff" : "transparent", color: on ? "#1e293b" : "#64748b", fontWeight: on ? 600 : 400, fontFamily: "inherit", boxShadow: on ? "0 1px 3px rgba(0,0,0,.1)" : "none" }),
  frow:   { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 },
  sel:    { fontSize: 11, padding: "5px 8px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontFamily: "inherit", cursor: "pointer" },
  tbl:    { width: "100%", borderCollapse: "collapse", fontSize: 11 },
  th:     { textAlign: "left", padding: "7px 6px", color: "#64748b", fontWeight: 600, borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" },
  thR:    { textAlign: "right", padding: "7px 6px", color: "#64748b", fontWeight: 600, borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" },
  td:     { padding: "6px 6px", borderBottom: "1px solid #f8fafc", fontFamily: "monospace", whiteSpace: "nowrap" },
  tdN:    { padding: "6px 6px", borderBottom: "1px solid #f8fafc", whiteSpace: "nowrap" },
  tdR:    { padding: "6px 6px", borderBottom: "1px solid #f8fafc", fontFamily: "monospace", textAlign: "right", whiteSpace: "nowrap" },
  pos:    { color: "#16a34a" },
  neg:    { color: "#dc2626" },
  dot:    (c) => ({ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: c, marginRight: 4, verticalAlign: "middle" }),
};

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────
function MetCard({ label, value, unit = "円", color }) {
  return (
    <div style={S.met}>
      <div style={S.mL}>{label}</div>
      <div style={{ ...S.mV, ...(color ? { color } : {}) }}>{value}<span style={S.mS}> {unit}</span></div>
    </div>
  );
}

function SummaryTab({ sumMode, setSumMode, sumMonth, setSumMonth, sumYear, setSumYear }) {
  if (sumMode === "month") {
    const rows   = RAW.filter(d => d.ym === sumMonth);
    const tot    = totals(rows);
    const active = RAW.filter(d => d.ym === sumMonth && ((d.balance||0) !== 0 || (d.equity||0) !== 0));
    const zero   = RAW.filter(d => d.ym === sumMonth && (d.balance||0) === 0 && (d.equity||0) === 0);
    return (
      <div>
        <div style={S.card}>
          <div style={S.frow}>
            <div style={S.seg}>
              <button style={S.segB(true)}  onClick={() => setSumMode("month")}>月別</button>
              <button style={S.segB(false)} onClick={() => setSumMode("year")}>年別</button>
            </div>
            <select style={S.sel} value={sumMonth} onChange={e => setSumMonth(e.target.value)}>
              {MONTHS.slice().reverse().map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cttl}>{sumMonth} 月末合計</div>
          <div style={S.grid2}>
            <MetCard label="実質残高" value={fmt(tot.balance)} />
            <MetCard label="Equity"  value={fmt(tot.equity)} />
            <MetCard label="クレジット" value={fmt(tot.credit)} />
            <MetCard label="月次確定P/L" value={fmtPL(tot.pl)} color={tot.pl >= 0 ? "#16a34a" : "#dc2626"} />
          </div>
        </div>
        {active.length > 0 && (
          <div style={S.card}>
            <div style={S.cttl}>口座別（{active.length}）</div>
            {active.map(d => {
              const k = `${d.broker}|${d.ac}`; const cfg = getCfg(k);
              return (
                <div key={k} style={{ ...S.row, borderLeft: `3px solid ${cfg.color}`, paddingLeft: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}><span style={S.dot(cfg.color)}/>{cfg.label} <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: 10 }}>A/C {d.ac}</span></div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{d.broker} | 取引{d.trades}件</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontFamily: "monospace" }}>{fmt(d.balance)} 円</div>
                    {d.credit > 0 && <div style={{ fontSize: 10, color: "#94a3b8" }}>Credit +{fmt(d.credit)}</div>}
                    <div style={{ fontSize: 11, fontFamily: "monospace", color: d.closed_pl >= 0 ? "#16a34a" : "#dc2626" }}>{fmtPL(d.closed_pl)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {zero.length > 0 && (
          <div style={{ ...S.card, opacity: 0.55 }}>
            <div style={S.cttl}>残高ゼロ / 休眠（{zero.length}）</div>
            {zero.map(d => <div key={`${d.broker}|${d.ac}`} style={S.row}><span style={S.rl}>{d.broker} {d.ac}</span><span style={S.rv}>0</span></div>)}
          </div>
        )}
      </div>
    );
  }

  // ── Year mode ─────────────────────────────────────────────────
  const yMths  = MONTHS.filter(m => m.startsWith(sumYear));
  const yRows  = RAW.filter(d => d.ym.startsWith(sumYear));
  const annPL  = yRows.reduce((s, d) => s + (d.closed_pl||0), 0);
  const annT   = yRows.reduce((s, d) => s + (d.trades||0), 0);
  const annDW  = yRows.reduce((s, d) => s + (d.dep_wd||0), 0);
  const endMth = yMths[yMths.length - 1];
  const endRows= RAW.filter(d => d.ym === endMth);
  const endBal = endRows.reduce((s, d) => s + (d.balance||0), 0);
  const endEq  = endRows.reduce((s, d) => s + (d.equity||0), 0);
  const endCr  = endRows.reduce((s, d) => s + (d.credit||0), 0);
  const brks   = [...new Set(yRows.map(d => d.broker))];
  return (
    <div>
      <div style={S.card}>
        <div style={S.frow}>
          <div style={S.seg}>
            <button style={S.segB(false)} onClick={() => setSumMode("month")}>月別</button>
            <button style={S.segB(true)}  onClick={() => setSumMode("year")}>年別</button>
          </div>
          <select style={S.sel} value={sumYear} onChange={e => setSumYear(e.target.value)}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cttl}>{sumYear}年（{yMths.length}ヶ月 / 最終: {endMth}）</div>
        <div style={{ ...S.grid2, gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))" }}>
          <MetCard label="期末実質残高" value={fmt(endBal)} />
          <MetCard label="期末Equity"  value={fmt(endEq)} />
          <MetCard label="年間確定P/L" value={fmtPL(annPL)} color={annPL>=0?"#16a34a":"#dc2626"} />
          <MetCard label="年間入出金"  value={fmtPL(annDW)} color={annDW>=0?"#16a34a":"#dc2626"} />
          <MetCard label="期末クレジット" value={fmt(endCr)} />
          <MetCard label="年間取引件数" value={annT.toLocaleString()} unit="件" />
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cttl}>{sumYear}年 月次推移</div>
        <div style={{ overflowX: "auto" }}>
          <table style={S.tbl}>
            <thead><tr><th style={S.th}>月</th><th style={S.thR}>実質残高合計</th><th style={S.thR}>Equity合計</th><th style={S.thR}>月次P/L</th><th style={S.thR}>取引数</th></tr></thead>
            <tbody>
              {yMths.map(ym => { const t = totals(RAW.filter(d => d.ym === ym)); return (
                <tr key={ym}>
                  <td style={S.tdN}>{ym}</td>
                  <td style={S.tdR}>{fmt(t.balance)}</td>
                  <td style={S.tdR}>{fmt(t.equity)}</td>
                  <td style={{ ...S.tdR, ...(t.pl>=0?S.pos:S.neg) }}>{fmtPL(t.pl)}</td>
                  <td style={S.tdR}>{t.trades}</td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cttl}>ブローカー別 年間集計</div>
        <table style={S.tbl}>
          <thead><tr><th style={S.th}>ブローカー</th><th style={S.thR}>年間確定P/L</th><th style={S.thR}>取引件数</th><th style={S.thR}>期末残高</th></tr></thead>
          <tbody>
            {brks.map(b => {
              const bR = yRows.filter(d => d.broker === b);
              const bPL = bR.reduce((s, d) => s + (d.closed_pl||0), 0);
              const bT  = bR.reduce((s, d) => s + (d.trades||0), 0);
              const bE  = RAW.filter(d => d.ym === endMth && d.broker === b).reduce((s, d) => s + (d.balance||0), 0);
              return (<tr key={b}><td style={S.tdN}>{b}</td><td style={{ ...S.tdR, ...(bPL>=0?S.pos:S.neg) }}>{fmtPL(bPL)}</td><td style={S.tdR}>{bT}</td><td style={S.tdR}>{fmt(bE)}</td></tr>);
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChartTab({ metric, setMetric }) {
  const chartRef  = useRef(null);
  const chartInst = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null; }
    const cfg    = METRIC_CFG[metric];
    const values = MONTHS.map(ym => RAW.filter(d => d.ym === ym).reduce((s, d) => s + (d[metric]||0), 0));
    chartInst.current = new Chart(chartRef.current, {
      type: "line",
      data: { labels: MONTHS.map(m => m.slice(2)), datasets: [{ label: cfg.label, data: values, borderColor: cfg.color, backgroundColor: cfg.color + "22", borderWidth: 2.5, pointRadius: 2.5, pointHoverRadius: 6, tension: 0.3, fill: cfg.fill }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${fmt(c.parsed.y)} 円` } } },
        scales: {
          x: { ticks: { maxTicksLimit: 20, maxRotation: 45, font: { size: 10 } }, grid: { display: false } },
          y: { ticks: { callback: v => (v/1000).toFixed(0)+"K", font: { size: 10 } }, grid: { color: "rgba(128,128,128,.1)" } }
        }
      }
    });
    return () => { if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null; } };
  }, [metric]);

  const latest = MONTHS.includes("2026-05") ? RAW.filter(d => d.ym === "2026-05").reduce((s, d) => s + (d[metric]||0), 0) : 0;
  return (
    <div style={S.card}>
      <div style={S.frow}>
        <div style={S.seg}>
          {Object.entries(METRIC_CFG).map(([k]) => (
            <button key={k} style={S.segB(metric===k)} onClick={() => setMetric(k)}>
              {k==="balance"?"残高":k==="equity"?"Equity":"月次P/L"}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: "auto" }}>最新 (2026-05): {fmt(latest)} 円</span>
      </div>
      <div style={{ position: "relative", height: 320 }}>
        <canvas ref={chartRef} role="img" aria-label="全口座合計残高推移" />
      </div>
      <p style={{ textAlign: "right", fontSize: 10, color: "#94a3b8", marginTop: 6 }}>全ブローカー・全口座の合計 | 単位: 円JPY</p>
    </div>
  );
}

function PLTab() {
  const chartRef  = useRef(null);
  const chartInst = useRef(null);
  const mths = MONTHS.slice(-24);
  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null; }
    chartInst.current = new Chart(chartRef.current, {
      type: "bar",
      data: { labels: mths.map(m => m.slice(2)), datasets: Object.entries(PL_GROUPS).map(([n, acs]) => ({
        label: n, backgroundColor: PL_COLORS[n]+"bb", borderColor: PL_COLORS[n], borderWidth: 1,
        data: mths.map(ym => acs.reduce((s, k) => { const d = RAW.find(r => r.ym===ym && `${r.broker}|${r.ac}`===k); return s+(d?.closed_pl||0); }, 0)),
      })) },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { display: true, position: "top", labels: { font: { size: 10 }, boxWidth: 10 } }, tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${fmtPL(c.parsed.y)}円` } } },
        scales: { x: { stacked: true, ticks: { maxRotation: 45, font:{size:10} }, grid:{display:false} }, y: { stacked: true, ticks: { callback: v=>(v/1000).toFixed(0)+"K", font:{size:10} }, grid:{color:"rgba(128,128,128,.1)"} } }
      }
    });
    return () => { if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null; } };
  }, []);
  return (
    <div style={S.card}>
      <p style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8 }}>直近24ヶ月 月次確定P/L（ブローカー別積み上げ）</p>
      <div style={{ position: "relative", height: 300 }}><canvas ref={chartRef} role="img" aria-label="月次P/L棒グラフ" /></div>
      <p style={{ textAlign: "right", fontSize: 10, color: "#94a3b8", marginTop: 6 }}>単位: 円JPY</p>
    </div>
  );
}

function TableTab() {
  const [fb, setFb] = useState("all");
  const [fz, setFz] = useState(false);
  const data = useMemo(() => {
    let d = [...RAW].sort((a, b) => b.ym.localeCompare(a.ym) || a.broker.localeCompare(b.broker));
    if (fb !== "all") d = d.filter(r => r.broker === fb);
    if (!fz) d = d.filter(r => (r.balance||0) !== 0 || (r.equity||0) !== 0);
    return d;
  }, [fb, fz]);
  return (
    <div>
      <div style={S.frow}>
        <select style={S.sel} value={fb} onChange={e => setFb(e.target.value)}>
          <option value="all">全ブローカー</option>
          {BROKERS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <label style={{ display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#64748b",cursor:"pointer" }}>
          <input type="checkbox" checked={fz} onChange={e => setFz(e.target.checked)} /> 残高ゼロも表示
        </label>
      </div>
      <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={S.tbl}>
            <thead>
              <tr>
                {["年月","口座","A/C No"].map(h => <th key={h} style={S.th}>{h}</th>)}
                {["実質残高","Equity","Credit","確定P/L","入出金","取引数"].map(h => <th key={h} style={S.thR}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map(d => {
                const k = `${d.broker}|${d.ac}`; const cfg = getCfg(k);
                return (
                  <tr key={`${d.ym}-${k}`} style={{ background: "transparent" }} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={S.tdN}>{d.ym}</td>
                    <td style={S.tdN}><span style={S.dot(cfg.color)}/>{cfg.label}</td>
                    <td style={{ ...S.tdN, fontSize: 10, color: "#94a3b8" }}>{d.ac}</td>
                    <td style={S.tdR}>{fmt(d.balance)}</td>
                    <td style={S.tdR}>{fmt(d.equity)}</td>
                    <td style={{ ...S.tdR, color: "#94a3b8" }}>{d.credit > 0 ? fmt(d.credit) : "-"}</td>
                    <td style={{ ...S.tdR, ...(d.closed_pl>0?S.pos:d.closed_pl<0?S.neg:{color:"#94a3b8"}) }}>{fmtPL(d.closed_pl)}</td>
                    <td style={{ ...S.tdR, ...(d.dep_wd>0?S.pos:d.dep_wd<0?S.neg:{color:"#94a3b8"}) }}>{d.dep_wd&&d.dep_wd!==0?fmtPL(d.dep_wd):"-"}</td>
                    <td style={S.tdR}>{d.trades>0?d.trades:"-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────
export default function FXDashboard() {
  const navigate   = useNavigate();
  const [tab,      setTab]      = useState("summary");
  const [sumMode,  setSumMode]  = useState("month");
  const [sumMonth, setSumMonth] = useState("2026-05");
  const [sumYear,  setSumYear]  = useState("2026");
  const [metric,   setMetric]   = useState("balance");

  const TABS = [
    { id: "summary", label: "📊 サマリー" },
    { id: "chart",   label: "📈 残高推移" },
    { id: "pl",      label: "💹 月次P/L"  },
    { id: "table",   label: "📋 全データ" },
  ];

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/")}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "5px 10px", borderRadius: 8,
              border: "1px solid #e2e8f0", background: "#f8fafc",
              fontSize: 12, color: "#64748b", cursor: "pointer",
              fontFamily: "inherit",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#1e293b"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#64748b"; }}
          >
            ← ポータルへ
          </button>
          <div>
            <div style={S.hdrT}>FX 取引履歴ダッシュボード</div>
            <div style={S.hdrS}>2023-06 〜 2026-05 | {RAW.length} レコード</div>
          </div>
        </div>
        <div style={S.hdrS}>最終更新: 2026-06-28</div>
      </div>
      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t.id} style={S.tab(tab===t.id)} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <div style={S.body}>
        {tab === "summary" && <SummaryTab sumMode={sumMode} setSumMode={setSumMode} sumMonth={sumMonth} setSumMonth={setSumMonth} sumYear={sumYear} setSumYear={setSumYear} />}
        {tab === "chart"   && <ChartTab  metric={metric} setMetric={setMetric} />}
        {tab === "pl"      && <PLTab />}
        {tab === "table"   && <TableTab />}
      </div>
    </div>
  );
}
