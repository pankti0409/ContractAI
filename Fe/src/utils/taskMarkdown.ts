export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

export interface RawTask {
  title: string;
  status: TaskStatus;
  progressPercent?: number;
  priority: TaskPriority;
  deadline?: string;
  notes?: string;
  descriptionBullets?: string[];
  steps?: string[];
  technicalBlock?: string;
  assignee?: string;
  owner?: string;
  tags?: string[];
}

const priorityEmoji = (p: TaskPriority) =>
  p === 'high' ? '🔴 High' : p === 'medium' ? '🟡 Medium' : '🟢 Low';

const statusColor = (s: TaskStatus) =>
  s === 'completed' ? 'green' : s === 'in_progress' ? 'orange' : 'red';

const statusLabel = (s: TaskStatus) =>
  s === 'completed' ? 'Completed' : s === 'in_progress' ? 'In Progress' : 'Not Started';

const checkboxBlock = (s: TaskStatus) => {
  const notStarted = s === 'not_started' ? 'x' : ' ';
  const inProgress = s === 'in_progress' ? 'x' : ' ';
  const completed = s === 'completed' ? 'x' : ' ';
  return [
    `- [${notStarted}] Not Started`,
    `- [${inProgress}] In Progress`,
    `- [${completed}] Completed`,
  ].join('\n');
};

export function renderTaskMarkdown(task: RawTask): string {
  const title = task.title?.trim() || 'Untitled Task';

  const progressBar = typeof task.progressPercent === 'number'
    ? `! https://progress-bar.dev/${Math.max(0, Math.min(100, task.progressPercent))}/?title=Progress`
    : '';

  const deadlineLine = task.deadline ? `📅 Due: ${task.deadline}` : '';
  const notesBlock = task.notes ? `> Notes: ${task.notes}` : '';

  const bullets = (task.descriptionBullets?.length
    ? task.descriptionBullets!.map(b => `- ${b}`).join('\n')
    : '').trim();

  const steps = (task.steps?.length
    ? task.steps!.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : '').trim();

  const codeBlock = task.technicalBlock
    ? `\n\n\`\`\`markdown\n${task.technicalBlock}\n\`\`\`\n`
    : '';

  const assignee = task.assignee ? `👤 Assignee: @${task.assignee.replace(/^@/, '')}` : '';
  const owner = task.owner ? `🏷️ Owner: ${task.owner}` : '';
  const tagsLine = task.tags?.length ? `🔖 Tags: ${task.tags.map(t => `#${t}`).join(' ')}` : '';

  const lines = [
    `## 📝 ${title}`,
    '',
    checkboxBlock(task.status),
    progressBar,
    '',
    `Priority: ${priorityEmoji(task.priority)}`,
    deadlineLine,
    '',
    notesBlock,
    '',
    '**Description**',
    bullets,
    '',
    steps,
    codeBlock,
    '',
    `**Status:** <span style="color:${statusColor(task.status)}">${statusLabel(task.status)}</span>`,
    '',
    assignee,
    owner,
    '',
    tagsLine,
    ''
  ];

  return lines.filter(Boolean).join('\n');
}