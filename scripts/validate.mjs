import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function validate(data) {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  const unique = (items, label) => {
    assert(items.every(item => item && text(item.id)), `${label} 必须有 id`);
    assert(new Set(items.map(item => item.id)).size === items.length, `${label} id 不得重复`);
  };
  assert(data && date(data.updatedAt), 'updatedAt 必须是有效日期');
  for (const key of ['projects', 'records', 'skills']) assert(Array.isArray(data[key]), `${key} 必须是数组`);
  unique(data.projects, '项目'); unique(data.records, '记录'); unique(data.skills, '技能');
  const projects = new Set(data.projects.map(project => project.id));
  for (const project of data.projects) {
    assert(['not-started', 'in-progress', 'paused', 'completed'].includes(project.status), '项目状态无效');
    for (const field of ['name', 'description', 'nextAction']) assert(text(project[field]), `项目缺少 ${field}`);
    const records = data.records.filter(record => record.projectId === project.id);
    assert(project.status !== 'not-started' || records.length === 0, '尚未开始的项目不能有完成记录');
    assert(project.status !== 'completed' || records.length > 0, '已完成项目必须有关联成果');
  }
  for (const record of data.records) {
    assert(date(record.date) && record.date <= data.updatedAt, '记录日期无效或晚于更新时间');
    assert(record.projectId === null || projects.has(record.projectId), '记录引用了不存在的项目');
    assert(['writing-planning', 'learning', 'coding', 'business'].includes(record.kind), '成果类别无效');
    assert(text(record.title) && text(record.summary), '记录缺少标题或摘要');
    assert(text(record.verification?.method) && text(record.verification?.result), '完成记录必须包含验证方式及结果');
    assert(Array.isArray(record.evidence), 'evidence 必须是数组');
    for (const evidence of record.evidence) {
      assert(text(evidence.label) && text(evidence.url), '证据缺少说明或链接');
      let url;
      try { url = new URL(evidence.url); } catch { throw new Error('证据链接无效'); }
      assert(url.protocol === 'https:' && !url.username && !url.password, '证据链接必须使用不含凭据的 HTTPS');
    }
  }
  for (const skill of data.skills) {
    assert(text(skill.name) && text(skill.description), '技能缺少名称或说明');
    assert(Array.isArray(skill.recordIds) && skill.recordIds.length > 0, '技能必须关联验证记录');
    assert(skill.recordIds.every(id => data.records.some(record => record.id === id)), '技能引用了不存在的记录');
  }
  return data;
}
export async function loadData() {
  return validate(JSON.parse(await readFile(new URL('../data/journey.json', import.meta.url), 'utf8')));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await loadData();
  console.log('进度数据验证通过');
}
