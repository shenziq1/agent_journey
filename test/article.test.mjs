import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptArticle, decryptArticle } from '../src/article-crypto.mjs';

test('原文加密可还原中文及段落，密码空白字符必须精确匹配', async () => {
  const original = JSON.stringify(['测试原文 <script>不可执行</script>', '后记\n保留原有换行']);
  const password = ' sample password ';
  const encrypted = await encryptArticle(original, password);
  assert.equal(await decryptArticle(encrypted, password), original);
  await assert.rejects(decryptArticle(encrypted, password.trim()));
  await assert.rejects(decryptArticle(encrypted, ''));
  await assert.rejects(decryptArticle(encrypted, 'wrong'));
  assert.ok(!JSON.stringify(encrypted).includes('测试原文'));
});
test('密文被篡改时不能解锁，重复加密使用独立随机参数', async () => {
  const first = await encryptArticle('test', 'fixture');
  const second = await encryptArticle('test', 'fixture');
  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.iv, second.iv);
  const damaged = { ...first, ciphertext: (first.ciphertext[0] === 'A' ? 'B' : 'A') + first.ciphertext.slice(1) };
  await assert.rejects(decryptArticle(damaged, 'fixture'));
  await assert.rejects(decryptArticle({ ...first, version: 2 }, 'fixture'));
});
