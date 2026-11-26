export type RoleId = 'platform' | 'orgAdmin' | 'inspector' | 'planner' | 'safety' | 'dispatcher'

export interface DemoUser {
  id: RoleId
  name: string
  role: string
  org: string
  scope: string
  active: boolean
}

export interface AlertItem {
  id: string
  turbine: string
  title: string
  level: 'critical' | 'warning' | 'info'
  time: string
  status: string
  detail: string
}

export interface SourceDoc {
  id: string
  title: string
  type: string
  version: string
  updated: string
  excerpt: string
  content: string
  keywords: string[]
}

export interface ReviewItem {
  id: string
  title: string
  businessId: string
  sourceId: string
  status: 'pending' | 'approved' | 'rejected'
  owner: string
  createdAt: string
  summary: string
  citations: string[]
  decisionNote?: string
  decidedBy?: string
}

export interface WikiPage {
  id: string
  title: string
  category: string
  version: string
  summary: string
  sections: { heading: string; body: string; sourceId: string }[]
}

export interface GraphNode {
  id: string
  label: string
  kind: string
  x: number
  y: number
  detail: string
  sourceId: string
}

export interface GraphLink {
  from: string
  to: string
  label: string
}

export interface RunRecord {
  id: string
  scenario: string
  status: string
  at: string
}

export const initialUsers: DemoUser[] = [
  { id: 'platform', name: '平台值班员', role: '平台管理员', org: '平台运营中心', scope: '组织配置，不可读业务正文', active: true },
  { id: 'orgAdmin', name: '顾明岚', role: '组织管理员 / 运维总监', org: '青原新能源', scope: '本组织全部试点风场', active: true },
  { id: 'inspector', name: '林亦舟', role: '风场巡检员', org: '青原新能源', scope: '青原风场 A 区 · 5 台试点', active: true },
  { id: 'planner', name: '唐映秋', role: '检修计划员', org: '青原新能源', scope: '工单资料与交接草稿', active: true },
  { id: 'safety', name: '傅景', role: '作业安全经理', org: '青原新能源', scope: '安全审查与风险否决', active: true },
  { id: 'dispatcher', name: '叶书', role: '电站值班长', org: '青原新能源', scope: '服务结果与完成口径', active: true },
]

export const alerts: AlertItem[] = [
  { id: 'ALM-2026-001', turbine: 'QY-A03', title: '振动趋势越限 · 重复告警 7 条', level: 'critical', time: '10:32:18', status: '待人工核对', detail: '同一业务编号下出现 7 条重复振动告警。系统仅执行归并建议，原始记录全部保留。' },
  { id: 'ALM-2026-002', turbine: 'QY-A05', title: '台风前传感器失联', level: 'warning', time: '10:28:41', status: '禁止自动判正常', detail: '数据表面稳定不能作为设备正常依据，必须转授权人员核查并记录接手时间。' },
  { id: 'ALM-2026-003', turbine: 'QY-A01', title: 'SCADA 快照超过更新周期', level: 'warning', time: '10:16:09', status: '待刷新', detail: '当前展示带时间戳的只读快照，不作为实时状态承诺。' },
  { id: 'ALM-2026-004', turbine: 'QY-A02', title: '检修与值班完成口径冲突', level: 'info', time: '09:58:27', status: '待统一分母', detail: '检修按故障处理完成统计，值班按并网恢复统计，同一业务不得重复计成功。' },
]

export const sources: SourceDoc[] = [
  {
    id: 'energy-inspection-f11',
    title: '台风前传感器失联事件记录',
    type: '业务事件样本',
    version: '合成记录 v1',
    updated: '2026-11-12 13:58',
    excerpt: '台风前传感器失联，不能因为数据稳定就判定设备正常。',
    content: '林亦舟提供的合成事件样本：台风前出现传感器失联，趋势图表面稳定并不代表设备正常。建议必须暂停，由检修计划员核对后继续，错误结果不得覆盖原记录。',
    keywords: ['台风', '传感器', '失联', '异常', '稳定', '人工'],
  },
  {
    id: 'energy-inspection-f00',
    title: '运维目标与告警基线',
    type: '访谈事实记录',
    version: '合成记录 v1',
    updated: '2026-11-12 13:52',
    excerpt: '日均 280 条告警，误报 38%；目标误报 15%，有效告警响应 20 分钟。',
    content: '顾明岚提供的合成访谈基线：日均告警 280 条、误报率 38%。误报率 15% 与有效告警响应 20 分钟均为待验证目标，判定来源、响应起算点和统计分母仍需签核。',
    keywords: ['告警', '误报', '基线', '280', '38%', '20 分钟'],
  },
  {
    id: 'energy-inspection-f23',
    title: '检修交接与责任确认规则',
    type: '执行条件记录',
    version: '合成记录 v1',
    updated: '2026-11-12 13:55',
    excerpt: '对方确认接手才结束本岗待办，仅发送消息不算完成。',
    content: '唐映秋提供的合成交接规则：交接至少包含业务编号、当前版本、处理状态、未解决事项和接手人。只有具名人员确认接手后才结束上一岗位待办。',
    keywords: ['交接', '接手', '业务编号', '待办', '责任', '版本'],
  },
  {
    id: 'energy-inspection-f35',
    title: '接口中断与快照恢复说明',
    type: '验证与反馈记录',
    version: '合成记录 v1',
    updated: '2026-11-12 13:56',
    excerpt: '中断时使用带时间戳的只读快照，重连后按业务编号去重补齐。',
    content: '秦芮提供的合成接口规则：来源不可用时显示“暂未更新”，现有人工流程继续运行。重连后按业务编号幂等去重，不反复触发同一待办。',
    keywords: ['接口', '中断', '快照', '重连', '去重', '暂未更新'],
  },
  {
    id: 'energy-inspection-f45',
    title: '审计字段与追溯要求',
    type: '验证与反馈记录',
    version: '合成记录 v1',
    updated: '2026-11-12 13:57',
    excerpt: '保留业务编号、资料版本、事实引用、建议结果、人工改动和签核人。',
    content: '傅景提供的合成审计要求：每次建议保留完整来源、版本、事实引用、输出、人工改动和签核人，能够重建一次处理链路，不记录口令或无关个人信息。',
    keywords: ['审计', '追溯', '签核', '版本', '引用', '人工改动'],
  },
]

export const initialReviews: ReviewItem[] = [
  {
    id: 'REV-001',
    title: 'QY-A03 重复振动告警归并草稿',
    businessId: 'SCENE-energy-inspection-001',
    sourceId: 'energy-inspection-f00',
    status: 'pending',
    owner: '林亦舟',
    createdAt: '2026-11-19 10:36',
    summary: '建议将同一业务编号、同一风机、同一时间窗内的 7 条告警归并为一个核对任务，原始记录保持不变。',
    citations: ['energy-inspection-f00', 'energy-inspection-f45'],
  },
  {
    id: 'REV-002',
    title: 'QY-A05 传感器失联异常交接',
    businessId: 'SCENE-energy-inspection-002',
    sourceId: 'energy-inspection-f11',
    status: 'pending',
    owner: '傅景',
    createdAt: '2026-11-19 10:30',
    summary: '系统已停止自动建议，需授权人员核对现场状态，并补充触发原因、接手人和确认时间。',
    citations: ['energy-inspection-f11', 'energy-inspection-f23'],
  },
  {
    id: 'REV-003',
    title: '只读快照恢复演练记录',
    businessId: 'SCENE-energy-inspection-003',
    sourceId: 'energy-inspection-f35',
    status: 'approved',
    owner: '秦芮',
    createdAt: '2026-11-19 09:48',
    summary: '离线演练确认旧快照有明确时间戳，重连未生成重复待办。',
    citations: ['energy-inspection-f35'],
    decisionNote: '合成测试路径通过，真实接口仍待验证。',
    decidedBy: '傅景',
  },
]

export const wikiPages: WikiPage[] = [
  {
    id: 'WIKI-001',
    title: '台风前传感器失联处置',
    category: '安全与异常',
    version: 'Wiki v1 · 合成摘要',
    summary: '数据稳定不等于设备正常，先停止建议，再完成具名人工交接。',
    sections: [
      { heading: '触发条件', body: '台风前或特殊天气下出现传感器失联、来源中断或资料缺依据时，系统不得根据平稳曲线推断正常。', sourceId: 'energy-inspection-f11' },
      { heading: '交接要求', body: '转人工时必须记录触发原因、接手人和确认时间，仅发送消息不能关闭待办。', sourceId: 'energy-inspection-f23' },
      { heading: '恢复条件', body: '授权人员完成现场核对，来源恢复且回归测试通过后，才可重新生成建议。', sourceId: 'energy-inspection-f35' },
    ],
  },
  {
    id: 'WIKI-002',
    title: '告警归并规则与指标口径',
    category: '业务规则',
    version: 'Wiki v1 · 合成摘要',
    summary: '先确定性去重，再评估模型增量；误报与响应目标必须先统一口径。',
    sections: [
      { heading: '基线', body: '合成访谈记录为日均 280 条告警、误报率 38%，15% 与 20 分钟是待验证目标。', sourceId: 'energy-inspection-f00' },
      { heading: '审计', body: '归并只生成建议，所有原始告警、资料版本、人工改动与签核人均需保留。', sourceId: 'energy-inspection-f45' },
      { heading: '责任', body: '同一业务编号贯穿核对与交接，接手确认是完成待办的前置条件。', sourceId: 'energy-inspection-f23' },
    ],
  },
]

export const graphNodes: GraphNode[] = [
  { id: 'turbine', label: 'QY-A05 风机', kind: '设备', x: 360, y: 190, detail: '试点范围内的合成设备节点，不对应真实资产。', sourceId: 'energy-inspection-f11' },
  { id: 'alarm', label: '传感器失联', kind: '告警', x: 120, y: 90, detail: '特殊天气下的失联告警，禁止自动判定正常。', sourceId: 'energy-inspection-f11' },
  { id: 'event', label: '业务事件 002', kind: '业务事件', x: 120, y: 290, detail: '以唯一业务编号贯穿核对、交接和审计。', sourceId: 'energy-inspection-f23' },
  { id: 'rule', label: '人工兜底规则', kind: '规则', x: 360, y: 50, detail: '资料缺依据、版本冲突或来源不可用时转人工。', sourceId: 'energy-inspection-f11' },
  { id: 'inspector', label: '林亦舟', kind: '角色', x: 610, y: 90, detail: '风场巡检员，负责现场核对与建议复核。', sourceId: 'energy-inspection-f11' },
  { id: 'planner', label: '唐映秋', kind: '角色', x: 610, y: 290, detail: '检修计划员，负责资料校核与交接，不替代安全签核。', sourceId: 'energy-inspection-f23' },
  { id: 'audit', label: '审计记录', kind: '资料', x: 360, y: 340, detail: '保存来源、版本、建议、人工改动与签核。', sourceId: 'energy-inspection-f45' },
]

export const graphLinks: GraphLink[] = [
  { from: 'alarm', to: 'turbine', label: '发生于' },
  { from: 'event', to: 'turbine', label: '关联' },
  { from: 'rule', to: 'turbine', label: '受约束于' },
  { from: 'turbine', to: 'inspector', label: '由谁复核' },
  { from: 'turbine', to: 'planner', label: '交接到' },
  { from: 'turbine', to: 'audit', label: '留痕' },
]

export const flowDetails = [
  { id: 'alarm', label: '告警触发', sub: 'SCADA · 只读', detail: '读取当前组织授权的合成告警，保留原始事件与时间。' },
  { id: 'trend', label: '趋势核查', sub: '巡检员 · 人工', detail: '查看趋势、振动谱与气象，系统只提供引用，不替代判断。' },
  { id: 'field', label: '现场检查', sub: '授权人员 · 人工', detail: '高空、停送电和天气禁限始终由授权人员判断。' },
  { id: 'dispatch', label: '工单交接', sub: '计划员 · 草稿', detail: '生成资料草稿，不写正式工单，具名接手后才关闭待办。' },
  { id: 'repair', label: '检修记录', sub: '处理人 · 留痕', detail: '人工修改形成新版本，原记录与修改原因全部保留。' },
  { id: 'confirm', label: '值班确认', sub: '值班长 · 验收', detail: '按并网恢复记录服务结果，不与检修完成重复计成功。' },
]
