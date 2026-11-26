import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Database,
  ExternalLink,
  FileText,
  Info,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  Menu,
  Network,
  Play,
  Radio,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  Wind,
  Workflow,
  X,
  XCircle,
} from 'lucide-react'
import {
  alerts,
  flowDetails,
  graphLinks,
  graphNodes,
  initialReviews,
  initialUsers,
  sources,
  wikiPages,
  type DemoUser,
  type ReviewItem,
  type RoleId,
  type RunRecord,
  type SourceDoc,
} from './demoData'
import './App.css'

type ViewId = 'dashboard' | 'knowledge' | 'wiki' | 'harness' | 'review' | 'admin'
type ScenarioKey = 'normal' | 'missing' | 'conflict' | 'outage' | 'unauthorized' | 'injection'
type ModalState = { title: string; body: ReactNode } | null

const navItems: { id: ViewId; label: string; caption: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: '业务工作台', caption: 'MISSION CONTROL', icon: LayoutDashboard },
  { id: 'knowledge', label: 'RAG 知识库', caption: 'GROUNDED SEARCH', icon: Database },
  { id: 'wiki', label: 'Wiki 与图谱', caption: 'KNOWLEDGE GRAPH', icon: Network },
  { id: 'harness', label: 'Harness 运行', caption: 'AGENT RUNTIME', icon: Workflow },
  { id: 'review', label: '人工复核', caption: 'HUMAN REVIEW', icon: ClipboardCheck },
  { id: 'admin', label: '权限管理', caption: 'SAAS / RBAC', icon: Users },
]

const scenarios: Record<ScenarioKey, { label: string; status: string; title: string; summary: string; sourceId: string }> = {
  normal: { label: '正常业务', status: 'review', title: '待人工复核的工作草稿', summary: '资料与版本核对完成，7 条重复告警形成 1 个归并建议，所有原始记录保留。', sourceId: 'energy-inspection-f00' },
  missing: { label: '材料缺失', status: 'needs-info', title: '资料不足，需要补充', summary: '缺少有效资料来源或具名交接确认，已停止生成确定结论。', sourceId: 'energy-inspection-f23' },
  conflict: { label: '版本冲突', status: 'manual', title: '规则版本冲突，转人工', summary: '两个版本均保留，系统不会自动选择较新或较宽松条款。', sourceId: 'energy-inspection-f23' },
  outage: { label: '来源不可用', status: 'degraded', title: '来源中断，已降级', summary: '继续展示带时间戳的只读快照并提示暂未更新，现有人工流程保持可用。', sourceId: 'energy-inspection-f35' },
  unauthorized: { label: '跨租户访问', status: 'blocked', title: '越权请求已阻止', summary: '目标资料不属于当前组织，检索、正文和审计均未返回。', sourceId: 'energy-inspection-f45' },
  injection: { label: '提示词注入', status: 'blocked', title: '越界动作已阻止', summary: '输入要求忽略权限并控制设备，工具白名单拒绝执行，未产生写入或外发。', sourceId: 'energy-inspection-f45' },
}

function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = window.localStorage.getItem(key)
      return saved ? JSON.parse(saved) as T : initialValue
    } catch {
      return initialValue
    }
  })
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  return [value, setValue] as const
}

function App() {
  const [view, setView] = useState<ViewId>('dashboard')
  const [roleId, setRoleId] = usePersistentState<RoleId>('wind-demo-role', 'orgAdmin')
  const [users, setUsers] = usePersistentState<DemoUser[]>('wind-demo-users', initialUsers)
  const [reviews, setReviews] = usePersistentState<ReviewItem[]>('wind-demo-reviews', initialReviews)
  const [runs, setRuns] = usePersistentState<RunRecord[]>('wind-demo-runs', [])
  const [modal, setModal] = useState<ModalState>(null)
  const [toast, setToast] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [runScenario, setRunScenario] = useState<ScenarioKey>('normal')
  const [runNonce, setRunNonce] = useState(0)
  const toastTimer = useRef<number | undefined>(undefined)
  const currentUser = users.find((user) => user.id === roleId) ?? users[0]

  const notify = (message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 3600)
  }

  const navigate = (next: ViewId) => {
    setView(next)
    setMobileNav(false)
    if (next !== 'harness') setRunNonce(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startHarness = (scenario: ScenarioKey = 'normal') => {
    setRunScenario(scenario)
    setRunNonce((value) => value + 1)
    navigate('harness')
  }

  const openSource = (sourceId: string) => {
    const source = sources.find((item) => item.id === sourceId)
    if (!source) return
    setModal({
      title: source.title,
      body: (
        <div className="source-modal">
          <div className="source-meta"><span>{source.type}</span><span>{source.version}</span><span>{source.updated}</span></div>
          <p className="source-fulltext">{source.content}</p>
          <div className="citation-box"><FileText size={16} /><code>{source.id}</code></div>
          <p className="muted">该材料为课程合成记录，只用于演示，不是实际风电场原始附件。</p>
        </div>
      ),
    })
  }

  const addReviewForSource = (source: SourceDoc) => {
    const existing = reviews.find((review) => review.sourceId === source.id && review.status === 'pending')
    if (existing) {
      notify('该来源已有待复核任务，无需重复创建。')
      return
    }
    const item: ReviewItem = {
      id: `REV-${Date.now().toString().slice(-7)}`,
      title: `${source.title} · 核对草稿`,
      businessId: `SCENE-DEMO-${Date.now().toString().slice(-6)}`,
      sourceId: source.id,
      status: 'pending',
      owner: currentUser.name,
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      summary: `基于“${source.excerpt}”生成的只读核对草稿，等待具名人员确认。`,
      citations: [source.id, 'energy-inspection-f45'],
    }
    setReviews((items) => [item, ...items])
    notify('已创建人工复核任务，未写入任何业务系统。')
  }

  const completeRun = (record: RunRecord) => {
    setRuns((items) => [record, ...items].slice(0, 12))
    const scenario = scenarios[record.scenario as ScenarioKey]
    if (!scenario || record.status === 'blocked' || record.status === 'degraded') return
    const source = sources.find((item) => item.id === scenario.sourceId)
    if (source) addReviewForSource(source)
  }

  const decideReview = (id: string, decision: 'approved' | 'rejected', note: string) => {
    if (!['orgAdmin', 'inspector', 'safety'].includes(roleId) || !currentUser.active) {
      notify('当前角色无业务复核权限，操作已阻止。')
      return
    }
    if (decision === 'rejected' && !note.trim()) {
      notify('退回时必须填写原因。')
      return
    }
    setReviews((items) => items.map((item) => item.id === id ? {
      ...item,
      status: decision,
      decisionNote: note.trim() || '合成演示草稿已由具名人员确认，不代表真实业务验收。',
      decidedBy: currentUser.name,
    } : item))
    notify(decision === 'approved' ? '人工确认已记录，仅限本地演示。' : '退回原因与处理人已记录。')
  }

  const resetDemo = () => {
    setUsers(initialUsers)
    setReviews(initialReviews)
    setRuns([])
    setRoleId('orgAdmin')
    setModal(null)
    navigate('dashboard')
    notify('演示数据已恢复到初始状态。')
  }

  const showHelp = () => {
    setModal({
      title: '静态演示版使用说明',
      body: (
        <div className="help-copy">
          <p><strong>这不是已部署的 FastAPI 后端。</strong>本网站是可公开访问的交互演示，使用合成数据在浏览器内模拟 RAG、Harness、知识图谱和权限流程。</p>
          <ul>
            <li>所有修改仅保存到当前浏览器的 localStorage，不会同步到其他设备。</li>
            <li>不连接真实 SCADA、EAM、模型服务或客户数据库。</li>
            <li>所有运行均为离线确定性模拟，业务写入次数和外发次数始终为 0。</li>
            <li>平台管理员可演示账号管理，但不能执行业务复核；组织管理员、巡检员和安全经理可复核。</li>
          </ul>
          <a className="text-link" href="https://github.com/hahaaa520/open-source-course-homework-hh/tree/main/docs" target="_blank" rel="noreferrer">查看完整技术方案与提示词 <ExternalLink size={15} /></a>
        </div>
      ),
    })
  }

  const pendingCount = reviews.filter((item) => item.status === 'pending').length

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate('dashboard')} aria-label="返回业务工作台">
          <span className="brand-mark"><Wind size={23} /></span>
          <span><strong>青原 · 风电协同</strong><small>WIND OPS / MVP DEMO</small></span>
        </button>
        <div className="topbar-status"><span className="live-dot" /><span>静态演示</span><code>LOCAL / SYNTHETIC</code></div>
        <div className="topbar-actions">
          <label className="role-picker"><span>当前演示身份</span><select value={roleId} onChange={(event) => setRoleId(event.target.value as RoleId)}>{users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.role}</option>)}</select></label>
          <button className="icon-button" onClick={showHelp} aria-label="演示说明" title="演示说明"><Info size={19} /></button>
          <button className="icon-button" onClick={() => setModal({ title: '恢复初始演示数据？', body: <div><p>这会清除当前浏览器中新增的复核任务、运行记录和身份修改。</p><button className="button danger" onClick={resetDemo}><RotateCcw size={16} />确认恢复</button></div> })} aria-label="恢复演示数据" title="恢复演示数据"><RotateCcw size={18} /></button>
          <button className="icon-button mobile-menu" onClick={() => setMobileNav((open) => !open)} aria-label="切换导航"><Menu size={20} /></button>
        </div>
      </header>

      <div className="demo-notice"><AlertTriangle size={15} /><span>合成数据 · 无真实后端 · 修改仅存当前浏览器 · 不连接或控制真实风电设备</span><button onClick={showHelp}>查看边界 <ArrowUpRight size={14} /></button></div>

      <div className="app-body">
        <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
          <div className="org-block"><span>当前组织</span><strong>青原新能源</strong><small><LockKeyhole size={13} />org_qingyuan / 5 台试点</small></div>
          <nav aria-label="主导航">
            {navItems.map((item) => {
              const Icon = item.icon
              return <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}><Icon size={18} /><span><strong>{item.label}</strong><small>{item.caption}</small></span>{item.id === 'review' && pendingCount > 0 ? <b>{pendingCount}</b> : <ChevronRight size={14} />}</button>
            })}
          </nav>
          <div className="sidebar-foot">
            <div className="boundary-title"><ShieldCheck size={16} />只读安全边界</div>
            <p>无写入工具<br />无自动外发<br />人工确认不可跳过</p>
            <div className="counter-row"><span>WRITES <b>0</b></span><span>EXTERNAL SENDS <b>0</b></span></div>
          </div>
        </aside>

        <main className="workspace">
          {view === 'dashboard' && <DashboardView reviews={reviews} onStart={() => startHarness('normal')} onNavigate={navigate} onSource={openSource} />}
          {view === 'knowledge' && <KnowledgeView onSource={openSource} onAdd={addReviewForSource} />}
          {view === 'wiki' && <WikiGraphView onSource={openSource} />}
          {view === 'harness' && <HarnessView initialScenario={runScenario} autoNonce={runNonce} runs={runs} onComplete={completeRun} onSource={openSource} />}
          {view === 'review' && <ReviewView reviews={reviews} canReview={['orgAdmin', 'inspector', 'safety'].includes(roleId) && currentUser.active} currentUser={currentUser} onDecision={decideReview} onSource={openSource} />}
          {view === 'admin' && <AdminView users={users} setUsers={setUsers} currentRole={roleId} onRoleChange={setRoleId} notify={notify} />}
        </main>
      </div>

      <footer className="footer"><span>QY WIND OPS · STATIC MVP DEMONSTRATION</span><span>数据不出本机浏览器 · 无生产授权或客户验收含义</span></footer>
      {toast && <div className="toast" role="status"><CheckCircle2 size={18} />{toast}<button onClick={() => setToast('')} aria-label="关闭提示"><X size={15} /></button></div>}
      {modal && <Modal title={modal.title} onClose={() => setModal(null)}>{modal.body}</Modal>}
    </div>
  )
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function DashboardView({ reviews, onStart, onNavigate, onSource }: { reviews: ReviewItem[]; onStart: () => void; onNavigate: (view: ViewId) => void; onSource: (id: string) => void }) {
  const [selectedAlert, setSelectedAlert] = useState(alerts[0].id)
  const [selectedFlow, setSelectedFlow] = useState('alarm')
  const activeAlert = alerts.find((alert) => alert.id === selectedAlert) ?? alerts[0]
  const activeFlow = flowDetails.find((node) => node.id === selectedFlow) ?? flowDetails[0]
  const positions = [{ x: 90, y: 100 }, { x: 330, y: 65 }, { x: 570, y: 100 }, { x: 570, y: 300 }, { x: 330, y: 345 }, { x: 90, y: 300 }]
  return (
    <div>
      <PageHeading eyebrow="MISSION CONTROL / 合成试点" title="风电巡检与运维协同" description="从重复告警到具名人工交接，保留每一步证据、版本与责任。" action={<button className="button primary" onClick={onStart}><Play size={17} />发起 Harness 核对</button>} />
      <div className="metric-strip">
        <div><span>日均告警 / 合成基线</span><strong>280<small>条</small></strong><em>来源 f00</em></div>
        <div><span>误报率 / 待样本复核</span><strong>38<small>%</small></strong><em>目标 15%</em></div>
        <div><span>重复归并 / 每日</span><strong>3<small>小时</small></strong><em>60 台 · 120 次点检</em></div>
        <div className="safe"><span>重大漏报 / 停止线</span><strong>0<small>例</small></strong><em>不可放宽</em></div>
      </div>
      <div className="dashboard-grid">
        <section className="panel alert-panel">
          <div className="panel-title"><div><span>WATCHLIST</span><h2>现场关注</h2></div><b>{alerts.length}</b></div>
          <div className="alert-list">{alerts.map((alert) => <button key={alert.id} className={`alert-item ${selectedAlert === alert.id ? 'selected' : ''}`} onClick={() => setSelectedAlert(alert.id)}><span className={`severity ${alert.level}`} /><span><code>{alert.turbine} · {alert.time}</code><strong>{alert.title}</strong><small>{alert.status}</small></span></button>)}</div>
          <div className="alert-detail"><span className="eyebrow">当前事件</span><code>{activeAlert.id}</code><p>{activeAlert.detail}</p><button className="text-link" onClick={() => onSource(activeAlert.id === 'ALM-2026-002' ? 'energy-inspection-f11' : activeAlert.id === 'ALM-2026-003' ? 'energy-inspection-f35' : 'energy-inspection-f00')}>查看对应证据 <ArrowUpRight size={14} /></button></div>
        </section>
        <section className="panel flow-panel">
          <div className="panel-title"><div><span>PROCESS TOPOLOGY</span><h2>业务闭环</h2></div><span className="status-tag"><Radio size={13} />可点击节点</span></div>
          <div className="flow-canvas">
            <svg viewBox="0 0 720 430" role="img" aria-label="六节点风电巡检业务流程图">
              <defs><marker id="flow-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="none" stroke="currentColor" /></marker></defs>
              {positions.map((position, index) => { const next = positions[(index + 1) % positions.length]; return <line key={flowDetails[index].id} className="flow-line" x1={position.x + 60} y1={position.y} x2={next.x - 60} y2={next.y} markerEnd="url(#flow-arrow)" /> })}
              {flowDetails.map((node, index) => { const position = positions[index]; return <g key={node.id} className={`flow-node ${selectedFlow === node.id ? 'selected' : ''}`} transform={`translate(${position.x},${position.y})`} role="button" tabIndex={0} aria-label={`${node.label}：${node.sub}`} onClick={() => setSelectedFlow(node.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedFlow(node.id) }}><rect x="-67" y="-34" width="134" height="68" /><circle cx="-48" cy="-13" r="4" /><text className="node-title" textAnchor="middle" y="3">{node.label}</text><text className="node-sub" textAnchor="middle" y="22">{node.sub}</text></g> })}
            </svg>
          </div>
          <div className="flow-detail"><span>{activeFlow.sub}</span><strong>{activeFlow.label}</strong><p>{activeFlow.detail}</p></div>
        </section>
        <section className="panel review-panel">
          <div className="panel-title"><div><span>HUMAN GATE</span><h2>待人工复核</h2></div><b>{reviews.filter((item) => item.status === 'pending').length}</b></div>
          <p className="panel-intro">任何建议都不能自行成为业务结论。</p>
          <div className="review-list">{reviews.filter((item) => item.status === 'pending').slice(0, 3).map((review) => <button key={review.id} onClick={() => onNavigate('review')}><Clock3 size={16} /><span><strong>{review.title}</strong><small>{review.owner} · {review.id}</small></span><ChevronRight size={15} /></button>)}</div>
          <button className="button secondary full" onClick={() => onNavigate('review')}><ClipboardCheck size={16} />进入复核队列</button>
          <div className="mini-boundary"><ShieldCheck size={17} /><p><strong>零业务写入</strong><br />所有演示输出均为草稿，重大漏报、越权和来源断链均停止。</p></div>
        </section>
      </div>
      <div className="bottom-grid">
        <section className="panel compact"><div><span className="eyebrow">RAG / GROUNDED</span><h3>知识检索不是凭空回答</h3><p>每条结论返回原分块、版本和来源；没有资料就明确拒答。</p></div><button className="text-link" onClick={() => onNavigate('knowledge')}>测试证据检索 <ArrowUpRight size={15} /></button></section>
        <section className="panel compact"><div><span className="eyebrow">WIKI / GRAPH</span><h3>知识关系可解释</h3><p>节点、边与 Wiki 段落都能回到原始证据，候选关系不直接触发动作。</p></div><button className="text-link" onClick={() => onNavigate('wiki')}>打开知识图谱 <ArrowUpRight size={15} /></button></section>
      </div>
    </div>
  )
}

function KnowledgeView({ onSource, onAdd }: { onSource: (id: string) => void; onAdd: (source: SourceDoc) => void }) {
  const [input, setInput] = useState('台风 失联')
  const [query, setQuery] = useState('台风 失联')
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  const results = sources.filter((source) => {
    const haystack = `${source.title} ${source.excerpt} ${source.content} ${source.keywords.join(' ')}`.toLowerCase()
    return tokens.length === 0 || tokens.some((token) => haystack.includes(token))
  })
  const suggestions = ['台风 失联', '告警 误报', '交接 接手', '接口 中断', '审计 追溯']
  return (
    <div>
      <PageHeading eyebrow="RAG / GROUNDED RETRIEVAL" title="先给证据，再生成建议" description="本地模拟组织与关键词过滤，演示引用、版本和无资料拒答；未调用真实 Embedding 或模型。" />
      <form className="search-bar" onSubmit={(event) => { event.preventDefault(); setQuery(input.trim()) }}><Search size={20} /><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="搜索告警、异常、交接、快照或审计" aria-label="知识库检索词" /><button className="button primary" type="submit">检索证据</button></form>
      <div className="suggestion-row"><span>推荐检索</span>{suggestions.map((item) => <button key={item} onClick={() => { setInput(item); setQuery(item) }}>{item}</button>)}</div>
      <div className="knowledge-summary"><span>查询 <strong>{query || '全部合成资料'}</strong></span><span>组织 <code>org_qingyuan</code></span><span>命中 <strong>{results.length}</strong> 条</span><span className="safe-text"><ShieldCheck size={14} />跨组织召回 0</span></div>
      <div className="knowledge-layout">
        <section className="search-results">
          {results.length === 0 ? <div className="empty-state"><Database size={30} /><span className="status-needs-info">NEEDS-INFO</span><h2>没有可用于回答的授权资料</h2><p>系统不会依据常识补写风电业务事实。请调整检索词，或补充有来源、版本和权限的资料。</p></div> : results.map((source, index) => <article className="result-row" key={source.id}><div className="result-index">{String(index + 1).padStart(2, '0')}</div><div className="result-main"><div className="result-meta"><span>{source.type}</span><code>{source.id}</code><b>{Math.min(98, 76 + tokens.length * 7)}% 匹配</b></div><h2>{source.title}</h2><p>{source.excerpt}</p><div className="source-version"><span>{source.version}</span><span>{source.updated}</span></div><div className="row-actions"><button className="text-link" onClick={() => onSource(source.id)}>读取原分块 <ArrowUpRight size={14} /></button><button className="button secondary small" onClick={() => onAdd(source)}><ClipboardCheck size={15} />加入人工复核</button></div></div></article>)}
        </section>
        <aside className="panel retrieval-aside"><div className="panel-title"><div><span>RETRIEVAL CHAIN</span><h2>检索链路</h2></div></div>{['组织与数据范围过滤', '来源版本与有效期校验', '本地关键词相似度计算', '引用回原分块', '证据不足则拒答'].map((step, index) => <div className="chain-step" key={step}><b>{index + 1}</b><span>{step}</span><Check size={14} /></div>)}<div className="notice-block"><Info size={17} /><p>演示版不包含真实向量检索或在线大模型。匹配百分比仅用于展示界面，不构成检索质量评估。</p></div></aside>
      </div>
    </div>
  )
}

function WikiGraphView({ onSource }: { onSource: (id: string) => void }) {
  const [pageId, setPageId] = useState(wikiPages[0].id)
  const [nodeId, setNodeId] = useState('turbine')
  const page = wikiPages.find((item) => item.id === pageId) ?? wikiPages[0]
  const node = graphNodes.find((item) => item.id === nodeId) ?? graphNodes[0]
  return (
    <div>
      <PageHeading eyebrow="LLM WIKI / KNOWLEDGE GRAPH" title="从资料到可解释的知识关系" description="Wiki 段落、图节点和关系均保留来源；这里展示已确认的演示关系，不触发任何业务动作。" />
      <div className="wiki-layout">
        <aside className="wiki-index"><span className="eyebrow">WIKI INDEX</span>{wikiPages.map((item) => <button key={item.id} className={item.id === pageId ? 'active' : ''} onClick={() => setPageId(item.id)}><small>{item.category}</small><strong>{item.title}</strong><span>{item.version}</span></button>)}<div className="wiki-note"><BookOpen size={17} /><p>合成摘要只组织已有资料，不新增业务事实。</p></div></aside>
        <article className="wiki-article"><div className="wiki-article-head"><span>{page.category}</span><code>{page.id}</code></div><h2>{page.title}</h2><p className="wiki-lead">{page.summary}</p>{page.sections.map((section, index) => <section key={section.heading}><div className="section-number">{String(index + 1).padStart(2, '0')}</div><div><h3>{section.heading}</h3><p>{section.body}</p><button className="citation" onClick={() => onSource(section.sourceId)}><FileText size={13} />{section.sourceId}<ArrowUpRight size={13} /></button></div></section>)}<div className="version-line"><span>{page.version}</span><span>修订保留历史 · 不覆盖原文</span></div></article>
        <section className="panel graph-panel"><div className="panel-title"><div><span>TRACEABLE GRAPH</span><h2>知识图谱</h2></div><Network size={19} /></div><div className="graph-canvas"><svg viewBox="0 0 720 400" role="img" aria-label="风电异常处置知识图谱">{graphLinks.map((link) => { const from = graphNodes.find((item) => item.id === link.from)!; const to = graphNodes.find((item) => item.id === link.to)!; return <g key={`${link.from}-${link.to}`}><line className="graph-edge" x1={from.x} y1={from.y} x2={to.x} y2={to.y} /><text className="edge-label" x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 7} textAnchor="middle">{link.label}</text></g> })}{graphNodes.map((item) => <g key={item.id} className={`graph-node ${nodeId === item.id ? 'selected' : ''}`} transform={`translate(${item.x},${item.y})`} role="button" tabIndex={0} onClick={() => setNodeId(item.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setNodeId(item.id) }}><circle r="33" /><circle className="node-core" r="5" /><text y="49" textAnchor="middle">{item.label}</text><text className="graph-kind" y="64" textAnchor="middle">{item.kind}</text></g>)}</svg></div><div className="graph-detail"><span>{node.kind} / {node.id}</span><strong>{node.label}</strong><p>{node.detail}</p><button className="text-link" onClick={() => onSource(node.sourceId)}>回溯来源 <ArrowUpRight size={14} /></button></div></section>
      </div>
    </div>
  )
}

function HarnessView({ initialScenario, autoNonce, runs, onComplete, onSource }: { initialScenario: ScenarioKey; autoNonce: number; runs: RunRecord[]; onComplete: (record: RunRecord) => void; onSource: (id: string) => void }) {
  const [scenario, setScenario] = useState<ScenarioKey>(initialScenario)
  const [running, setRunning] = useState(false)
  const [visibleSteps, setVisibleSteps] = useState(0)
  const [result, setResult] = useState<ScenarioKey | null>(null)
  const [runId, setRunId] = useState('尚未运行')
  const timers = useRef<number[]>([])
  const steps = ['校验输入与合成样本范围', '校验组织、角色与数据权限', '核对资料来源、版本与新鲜度', '执行确定性告警去重', '生成带引用的只读草稿', '等待具名人员复核']
  const clearTimers = () => { timers.current.forEach((timer) => window.clearTimeout(timer)); timers.current = [] }
  useEffect(() => () => clearTimers(), [])

  const execute = (key: ScenarioKey) => {
    clearTimers()
    const id = `RUN-${Date.now().toString().slice(-7)}`
    setRunId(id)
    setRunning(true)
    setResult(null)
    setVisibleSteps(0)
    steps.forEach((_, index) => {
      const timer = window.setTimeout(() => {
        setVisibleSteps(index + 1)
        if (index === steps.length - 1) {
          const final = scenarios[key]
          setResult(key)
          setRunning(false)
          onComplete({ id, scenario: key, status: final.status, at: new Date().toLocaleString('zh-CN', { hour12: false }) })
        }
      }, 420 * (index + 1))
      timers.current.push(timer)
    })
  }

  useEffect(() => {
    if (autoNonce > 0) {
      // 该视图由工作台导航后重新挂载，初始场景已由 useState 同步，无需在 effect 中再次级联 setState。
      execute(initialScenario)
    }
    // autoNonce 是父页面显式发起运行的一次性触发器；其余输入在触发时读取，不因渲染重复执行。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoNonce])

  const output = result ? scenarios[result] : null
  return (
    <div>
      <PageHeading eyebrow="AGENT HARNESS / OFFLINE FIXTURE" title="受限运行，而不是自主执行" description="离线确定性模拟显式状态机、工具边界和人工关卡，不调用在线模型或真实接口。" action={<button className="button primary" disabled={running} onClick={() => execute(scenario)}>{running ? <LoaderCircle className="spin" size={17} /> : <Play size={17} />}{running ? '正在核对' : '运行当前场景'}</button>} />
      <div className="scenario-grid">{(Object.keys(scenarios) as ScenarioKey[]).map((key) => <button key={key} className={scenario === key ? 'active' : ''} disabled={running} onClick={() => { setScenario(key); setResult(null); setVisibleSteps(0); setRunId('尚未运行') }}><span>{scenarios[key].label}</span><code>{scenarios[key].status}</code></button>)}</div>
      <div className="harness-layout">
        <section className="panel run-panel"><div className="run-meta"><span><Radio size={14} />OFFLINE FIXTURE</span><code>{runId}</code></div><div className="state-machine">{steps.map((step, index) => { const done = index < visibleSteps; const failed = done && result && ['blocked', 'degraded', 'manual', 'needs-info'].includes(scenarios[result].status) && index >= 2; return <div key={step} className={`state-step ${done ? 'done' : ''} ${failed ? 'stopped' : ''}`}><span className="state-marker">{done ? failed ? <X size={14} /> : <Check size={14} /> : index + 1}</span><div><small>STATE {String(index + 1).padStart(2, '0')}</small><strong>{step}</strong></div><code>{done ? failed ? 'STOP' : 'PASS' : running && index === visibleSteps ? 'RUNNING' : 'WAITING'}</code></div> })}</div><div className="human-gate"><UserCheck size={21} /><div><strong>人工关卡不可跳过</strong><p>模型、管理员和前端参数均不能直接将状态改为 approved。</p></div></div></section>
        <section className="panel run-output"><div className="panel-title"><div><span>RUN OUTPUT</span><h2>运行结果</h2></div>{output && <span className={`status-${output.status}`}>{output.status}</span>}</div>{!output && !running && <div className="empty-state compact"><Workflow size={30} /><h3>选择一个场景并运行</h3><p>每次运行会保留状态轨迹、来源、版本与输出。</p></div>}{running && <div className="empty-state compact"><LoaderCircle className="spin" size={30} /><h3>正在按白名单迁移状态</h3><p>已完成 {visibleSteps} / {steps.length} 个节点。</p></div>}{output && <div className="output-content"><span className="eyebrow">{scenarios[result!].label}</span><h2>{output.title}</h2><p>{output.summary}</p><div className="output-counters"><span>WRITES <b>0</b></span><span>EXTERNAL SENDS <b>0</b></span><span>TOOLS <b>READ ONLY</b></span></div><button className="citation" onClick={() => onSource(output.sourceId)}><FileText size={14} />{output.sourceId}<ArrowUpRight size={13} /></button><div className="audit-block"><h3>审计摘要</h3><code>run_id={runId}</code><code>org_id=org_qingyuan</code><code>rules=demo-hard-rules@v1</code><code>model=offline-deterministic</code><code>human_approval=NOT_GRANTED</code></div></div>}</section>
      </div>
      <section className="panel history-panel"><div className="panel-title"><div><span>LOCAL RUN HISTORY</span><h2>本机运行记录</h2></div><b>{runs.length}</b></div>{runs.length === 0 ? <p className="muted">尚无运行记录。记录只保存到当前浏览器。</p> : <div className="history-table">{runs.map((run) => <div key={`${run.id}-${run.at}`}><code>{run.id}</code><span>{scenarios[run.scenario as ScenarioKey]?.label}</span><strong>{run.status}</strong><time>{run.at}</time></div>)}</div>}</section>
    </div>
  )
}

function ReviewView({ reviews, canReview, currentUser, onDecision, onSource }: { reviews: ReviewItem[]; canReview: boolean; currentUser: DemoUser; onDecision: (id: string, decision: 'approved' | 'rejected', note: string) => void; onSource: (id: string) => void }) {
  const [selectedId, setSelectedId] = useState(reviews[0]?.id ?? '')
  const [reason, setReason] = useState('')
  const selected = reviews.find((item) => item.id === selectedId) ?? reviews[0]
  const statusLabel = { pending: '待复核', approved: '已确认', rejected: '已退回' }
  return (
    <div>
      <PageHeading eyebrow="HUMAN REVIEW / NAMED ACCOUNTABILITY" title="建议只有经过具名确认才可交接" description="审批仅改变当前浏览器中的演示状态，不写正式工单，不形成真实客户验收。" />
      <div className="review-permission"><ShieldCheck size={17} /><span>当前身份：<strong>{currentUser.name} · {currentUser.role}</strong></span><b>{canReview ? '可执行演示复核' : '只读，无业务复核权'}</b></div>
      <div className="review-layout">
        <aside className="review-queue">{reviews.map((review) => <button key={review.id} className={selected?.id === review.id ? 'active' : ''} onClick={() => { setSelectedId(review.id); setReason('') }}><span className={`review-status ${review.status}`}>{statusLabel[review.status]}</span><strong>{review.title}</strong><small>{review.id} · {review.owner}</small></button>)}</aside>
        {selected ? <article className="review-document"><div className="document-head"><div><span className="eyebrow">REVIEW DOCUMENT</span><h2>{selected.title}</h2></div><span className={`review-status ${selected.status}`}>{statusLabel[selected.status]}</span></div><div className="document-meta"><div><span>业务编号</span><code>{selected.businessId}</code></div><div><span>复核任务</span><code>{selected.id}</code></div><div><span>创建人</span><strong>{selected.owner}</strong></div><div><span>创建时间</span><strong>{selected.createdAt}</strong></div></div><section className="draft-section"><span className="eyebrow">只读草稿</span><p>{selected.summary}</p></section><section className="draft-section"><span className="eyebrow">事实引用</span><div className="citation-list">{selected.citations.map((id) => <button className="citation" key={id} onClick={() => onSource(id)}><FileText size={14} />{id}<ArrowUpRight size={13} /></button>)}</div></section><div className="audit-block"><h3>硬约束</h3><code>source_version=SYNTHETIC@v1</code><code>writes=0</code><code>external_sends=0</code><code>original_records=UNCHANGED</code></div>{selected.status === 'pending' ? canReview ? <div className="decision-area"><label>复核意见<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="确认可填写说明；退回必须写明原因" rows={3} /></label><div className="decision-actions"><button className="button danger" onClick={() => { onDecision(selected.id, 'rejected', reason); if (reason.trim()) setReason('') }}><XCircle size={17} />退回并记录原因</button><button className="button primary" onClick={() => onDecision(selected.id, 'approved', reason)}><CheckCircle2 size={17} />确认演示草稿</button></div></div> : <div className="permission-block"><LockKeyhole size={18} />当前身份只能查看。请切换到组织管理员、巡检员或安全经理演示复核。</div> : <div className="decision-record"><CheckCircle2 size={20} /><div><strong>{selected.decidedBy} · {statusLabel[selected.status]}</strong><p>{selected.decisionNote}</p></div></div>}</article> : <div className="empty-state"><ClipboardCheck size={30} /><h2>暂无复核任务</h2></div>}
      </div>
    </div>
  )
}

function AdminView({ users, setUsers, currentRole, onRoleChange, notify }: { users: DemoUser[]; setUsers: (value: DemoUser[] | ((items: DemoUser[]) => DemoUser[])) => void; currentRole: RoleId; onRoleChange: (role: RoleId) => void; notify: (message: string) => void }) {
  const [tested, setTested] = useState(false)
  const isAdmin = currentRole === 'platform' || currentRole === 'orgAdmin'
  const toggleUser = (id: RoleId) => {
    if (!isAdmin) { notify('当前角色无账号管理权限，操作已阻止。'); return }
    if (id === 'platform' && currentRole !== 'platform') { notify('组织管理员不能修改平台管理员。'); return }
    setUsers((items) => items.map((user) => user.id === id ? { ...user, active: !user.active } : user))
    notify('账号状态已更新，仅保存于当前浏览器。')
  }
  return (
    <div>
      <PageHeading eyebrow="SAAS / LAYERED ACCESS" title="管理权限与业务审批分开" description="组织、角色、数据范围三层过滤；管理员不会因为拥有账号管理权就获得安全或业务签核权。" action={<button className="button primary" onClick={() => setTested(true)}><ShieldCheck size={17} />运行越权检查</button>} />
      <div className="tenant-strip"><div><span>PLATFORM</span><strong>平台运营中心</strong><small>组织配置，不读业务正文</small></div><ChevronRight size={20} /><div><span>ORGANIZATION</span><strong>青原新能源</strong><small>独立知识与用户边界</small></div><ChevronRight size={20} /><div><span>DATA SCOPE</span><strong>A 区 · 5 台试点</strong><small>按风场和资料进一步授权</small></div></div>
      {tested && <div className="access-test"><div><CheckCircle2 size={23} /><span><strong>6 / 6 项越权请求已阻止</strong><small>跨组织文档、Wiki、图节点、运行、审计与直接 ID 访问均未返回数据</small></span><button onClick={() => setTested(false)} aria-label="关闭检查结果"><X size={17} /></button></div>{['DOCUMENT', 'WIKI', 'GRAPH NODE', 'AGENT RUN', 'AUDIT', 'DIRECT ID'].map((item) => <span key={item}>{item}<b>BLOCKED</b></span>)}</div>}
      <section className="panel users-panel"><div className="panel-title"><div><span>DEMO IDENTITIES</span><h2>身份与数据范围</h2></div><b>{users.filter((user) => user.active).length} 活跃</b></div><div className="users-table"><div className="table-head"><span>用户</span><span>角色</span><span>数据范围</span><span>状态</span><span>操作</span></div>{users.map((user) => <div className="table-row" key={user.id}><span><strong>{user.name}</strong><small>{user.org}</small></span><span>{user.role}</span><span>{user.scope}</span><span><button className={`account-status ${user.active ? 'active' : ''}`} onClick={() => toggleUser(user.id)}>{user.active ? '启用' : '停用'}</button></span><span><button className="text-link" onClick={() => { onRoleChange(user.id); notify(`已切换为 ${user.name} 的演示视角。`) }}>以此身份预览 <ArrowUpRight size={13} /></button></span></div>)}</div></section>
      <section className="panel matrix-panel"><div className="panel-title"><div><span>PERMISSION MATRIX</span><h2>关键动作矩阵</h2></div></div><div className="matrix-table"><div className="table-head"><span>角色</span><span>检索知识</span><span>生成草稿</span><span>业务复核</span><span>账号管理</span><span>设备控制</span></div>{[['平台管理员', '默认不可读', '否', '否', '平台级', '禁止'], ['组织管理员', '本组织', '是', '是', '本组织', '禁止'], ['巡检员', '授权风场', '是', '本人任务', '否', '禁止'], ['检修计划员', '授权资料', '是', '发起复核', '否', '禁止'], ['安全经理', '授权资料', '是', '安全否决', '否', '禁止']].map((row) => <div className="table-row" key={row[0]}>{row.map((cell, index) => <span key={`${row[0]}-${index}`} className={cell === '禁止' ? 'danger-text' : ''}>{index === 0 ? <strong>{cell}</strong> : cell}</span>)}</div>)}</div></section>
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><h2 id="modal-title">{title}</h2><button ref={closeRef} className="icon-button" onClick={onClose} aria-label="关闭对话框"><X size={20} /></button></div><div className="modal-body">{children}</div></section></div>
}

export default App
