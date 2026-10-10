# 项目：提示词打分系统

## 目标
一个本地运行的 Web 应用。用户输入一条提示词，系统调用 LLM 按固定标准打分，
给出问题诊断、改进版本，并保存历史记录。用户可反复迭代同一条提示词。

## 技术栈（不要替换）
- Next.js 14（App Router）+ TypeScript
- Tailwind CSS + shadcn/ui
- 状态：React useState/useReducer，不引入 Redux/Zustand
- 存储：localStorage（MVP 阶段不接数据库）
- LLM：OpenAI 兼容接口，用户自己填 baseURL + apiKey + model

## 数据模型

```ts
type Dimension = {
  name: string;      // 维度名
  score: number;     // 得分
  max: number;       // 满分
  reason: string;    // 扣分原因
};

type Evaluation = {
  id: string;
  createdAt: number;
  promptText: string;      // 用户提交的提示词
  taskContext?: string;    // 可选：任务背景
  totalScore: number;      // 0-100
  grade: 'S'|'A'|'B'|'C'|'D'|'F';
  summary: string;         // 一句话判断
  dimensions: Dimension[]; // 8 个维度
  criticalIssues: { problem: string; consequence: string; fix: string }[];
  failurePredictions: string[];
  improvedPrompt: string;  // 改写后的提示词
  changes: { point: string; before: string; after: string; benefit: string }[];
  nextStep: string;
  parentId?: string;       // 迭代链：指向上一版
};
```

## 评分维度（固定 8 项，满分 100）
1. 目标与任务清晰度 15
2. 背景与上下文 12
3. 角色与受众 10
4. 约束与边界 13
5. 输出格式 12
6. 示例与风格锚定 10
7. 任务拆解与过程控制 13
8. 精确性与无冲突 15

等级：90-100 S / 80-89 A / 70-79 B / 60-69 C / 40-59 D / 0-39 F

## 页面与布局

### 单页应用，三栏布局

**顶栏**
- 左：Logo「提示词打分系统」
- 右：设置按钮（打开 API 配置弹窗）、历史记录按钮

**左栏（输入区，宽 40%）**
- 提示词输入框（textarea，至少 10 行，支持 ⌘+Enter 提交）
- 任务背景输入框（可选，折叠）
- 「开始评分」按钮（loading 时禁用并显示骨架屏）
- 评分完成后，此区域下方出现「迭代此版本」按钮，点击后把 improvedPrompt 填入输入框

**右栏（结果区，宽 60%）**
按顺序展示：
1. 大号分数环（0-100）+ 等级徽章 + 一句话总评
2. 8 个维度的横向条形图（得分/满分 + 扣分原因 tooltip）
3. 三个最致命扣分点（卡片列表：问题 → 后果 → 改法）
4. 模型会怎么跑偏（预测列表）
5. 改进版提示词（代码块 + 一键复制按钮）
6. 改动说明表格
7. 下一步建议

**历史记录（抽屉）**
- 按时间倒序，显示分数、等级、提示词前 40 字
- 点击加载到右栏
- 支持删除单条、清空全部
- 同一条提示词的多次迭代用缩进或连线显示为一条链

**设置弹窗**
- baseURL / apiKey / model 三个输入框
- 保存到 localStorage
- 「测试连接」按钮

## 核心交互

1. 用户点「开始评分」
2. 前端组装请求：system prompt 用固定的评分教练提示词（见下），
   user message = 提示词 + 任务背景
3. 调用 LLM，**强制要求返回 JSON**（response_format 或要求只输出 JSON）
4. 解析 JSON，校验字段；解析失败时提示用户重试，不要崩溃
5. 存 localStorage，渲染到右栏

## 固定的 System Prompt（内置，不可编辑）

```
你是「提示词教练」，严格按 8 个维度给用户提示词打分。
只输出 JSON，不要任何解释文字，不要 markdown 代码块。
JSON 结构：
{
  "totalScore": number,
  "grade": "S|A|B|C|D|F",
  "summary": string,
  "dimensions": [{"name":string,"score":number,"max":number,"reason":string}],
  "criticalIssues": [{"problem":string,"consequence":string,"fix":string}],
  "failurePredictions": [string],
  "improvedPrompt": string,
  "changes": [{"point":string,"before":string,"after":string,"benefit":string}],
  "nextStep": string
}
8 个维度及满分：目标与任务清晰度15、背景与上下文12、角色与受众10、
约束与边界13、输出格式12、示例与风格锚定10、任务拆解与过程控制13、
精确性与无冲突15。
评分要严格，典型第一版提示词落在 40-70 分。不要分数膨胀。
```

## 边界处理（重要）
- API key 为空时，点评分弹提示引导去设置
- 请求超时 60 秒，超时给友好提示
- JSON 解析失败：尝试提取第一个 `{...}` 块再解析一次，仍失败则显示原始返回文本
- 输入为空时禁用按钮
- 所有网络错误都要 catch 并在 UI 上显示，不能白屏

## 视觉要求
- 深色主题优先，参考 Linear / Vercel Dashboard 的克制风格
- 分数环用 SVG 或 CSS conic-gradient，颜色随分数变化（红→黄→绿）
- 不要花哨动画，只用 transition 做状态过渡
- 中文字体优先，代码块用等宽字体

## 明确不做（MVP 边界）
- 不做用户登录
- 不做后端服务、不接数据库
- 不做多模型对比
- 不做提示词模板市场
- 不做图像生成类提示词