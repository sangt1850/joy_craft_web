import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chrome = process.env.CHROME_PATH ?? [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(existsSync);
assert.ok(chrome, 'Set CHROME_PATH to an installed Chrome/Chromium executable.');

const port = Number(process.env.SURVEY_TEST_PORT ?? 5189);
const debugPort = Number(process.env.SURVEY_DEBUG_PORT ?? 9349);
const origin = `http://127.0.0.1:${port}`;
const profile = await mkdtemp(path.join(tmpdir(), 'joycraft-survey-scenarios-'));
const pause = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));
let server;
let browser;
let browserConnection;
const results = [];

async function waitFor(check, label, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await pause(80);
  }
  throw new Error(`Timed out: ${label}`);
}

async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let nextId = 0;
  const requests = new Map();
  socket.addEventListener('message', event => {
    const response = JSON.parse(event.data);
    const request = requests.get(response.id);
    if (!request) return;
    requests.delete(response.id);
    clearTimeout(request.timer);
    if (response.error) request.reject(new Error(JSON.stringify(response.error)));
    else request.resolve(response.result);
  });
  return {
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = ++nextId;
        const timer = setTimeout(() => {
          requests.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }, 15000);
        requests.set(id, { resolve, reject, timer });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() { socket.close(); },
  };
}

async function participant(name, run, options = {}) {
  const { targetId } = await browserConnection.send('Target.createTarget', { url: 'about:blank' });
  const tabs = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
  const client = await connect(tabs.find(tab => tab.id === targetId).webSocketDebuggerUrl);
  const evaluate = async expression => {
    const result = await client.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const until = expression => waitFor(() => evaluate(expression), expression);
  try {
    await client.send('Page.enable');
    await client.send('Page.navigate', { url: `${origin}/s/demo${options.completed ? '?phone_check=COMPLETE' : ''}` });
    await until('!!document.querySelector(".gift-skip-btn")');
    await evaluate(`(async () => {
      const { api } = await import('/src/survey/api/client.ts');
      const { ApiError } = await import('/src/survey/api/types.ts');
      const original = { ...api };
      const config = ${JSON.stringify(options)};
      window.scenario = { current: null, starts: 0, requests: [], responses: [], errors: [], injected: false };
      window.scenario.config = config;
      api.start = async (...args) => {
        window.scenario.starts++;
        return window.scenario.current = await original.start(...args);
      };
      api.submit = async (code, seq, body) => {
        const state = window.scenario;
        state.requests.push(structuredClone({ seq, ...body }));
        const last = state.current?.page?.progressIndex === state.current?.page?.totalPages;
        if (!state.injected && config.error && (config.onLast ? last : seq === 2)) {
          state.injected = true;
          state.errors.push(config.error);
          throw new ApiError(config.error);
        }
        if (config.groupFull && seq === 2) {
          const response = { status: 'QUOTAFULL' };
          state.responses.push(response.status);
          return state.current = response;
        }
        const response = await original.submit(code, seq, body);
        if (config.lostResponse && response.status === 'COMPLETE' && !state.injected) {
          state.injected = true;
          state.errors.push('NETWORK');
          throw new ApiError('NETWORK');
        }
        state.responses.push(response.status);
        return state.current = response;
      };
    })()`);
    const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    const begin = async phone => {
      if (phone) {
        await click('input[type=checkbox]');
        await until('!!document.querySelector("input[type=tel]")');
        await evaluate(`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(
          document.querySelector('input[type=tel]'), ${JSON.stringify(phone)});
          document.querySelector('input[type=tel]').dispatchEvent(new Event('input', { bubbles: true }));`);
        await until('!document.querySelector(".btn-primary").disabled');
        await click('.btn-primary');
      } else {
        await click('.gift-skip-btn');
      }
      if (!options.completed) await until('window.scenario.current?.status === "IN_PROGRESS" && !!document.querySelector(".consent-check input")');
    };
    const step = async overrides => {
      const before = await evaluate('({ seq: window.scenario.current.page.seq, responses: window.scenario.responses.length, errors: window.scenario.errors.length })');
      await evaluate(`(() => {
        const page = window.scenario.current.page;
        const overrides = ${JSON.stringify(overrides ?? {})};
        if (page.pageType === 'CONSENT') {
          const input = document.querySelector('.consent-check input');
          if (!input.checked) input.click();
        }
        for (const [index, question] of page.questions.entries()) {
          const value = overrides[question.code] ?? (question.code === 'Q1' ? 2000 : question.code === 'ATT' ? 1 : question.qtype === 'LIKERT7' ? 4 : null);
          const option = question.options.find(option => option.available && (value === null || option.value === value));
          if (!option) throw new Error('No available answer: ' + question.code);
          const container = document.querySelectorAll('.question')[index];
          if (question.qtype === 'SELECT') {
            const select = container.querySelector('select');
            select.value = String(option.id);
            select.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            const index = question.options.findIndex(candidate => candidate.id === option.id);
            container.querySelectorAll(question.qtype === 'LIKERT7' ? 'button[role=radio]' : 'input[type=radio]')[index].click();
          }
        }
      })()`);
      await until('!!document.querySelector(".btn-primary") && document.querySelector(".btn-primary").getAttribute("aria-disabled") !== "true" && !document.querySelector(".btn-primary").disabled');
      await click('.btn-primary');
      await until(`window.scenario.responses.length > ${before.responses} ||
        (window.scenario.errors.length > ${before.errors} && !['NOT_ENTERED', 'RATE_LIMITED'].includes(window.scenario.errors.at(-1)))`);
      await pause(100);
      await until('!document.querySelector(".btn-primary") || !document.querySelector(".btn-primary").disabled');
      return evaluate('window.scenario.current');
    };
    const finish = async overrides => {
      for (let attempt = 0; attempt < 15; attempt++) {
        const current = await evaluate('window.scenario.current');
        if (current.status !== 'IN_PROGRESS') return current;
        await step(overrides);
      }
      throw new Error('Did not finish');
    };
    await run({ begin, step, finish, evaluate, until, click, client });
    results.push({ name, passed: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, passed: false });
    console.error(`FAIL ${name}: ${error.message}`);
  } finally {
    client.close();
    await browserConnection.send('Target.closeTarget', { targetId });
  }
}

try {
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--mode', 'survey-mock', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: root, windowsHide: true, stdio: 'ignore',
    env: { ...process.env, VITE_APP_MODE: 'survey', VITE_USE_MOCK: 'true', VITE_MOCK_STIMULUS_SECONDS: '0' },
  });
  await waitFor(async () => {
    if (server.exitCode !== null) throw new Error('Vite failed to start. Check SURVEY_TEST_PORT.');
    return fetch(origin).then(response => response.ok).catch(() => false);
  }, 'Vite startup');
  browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  await waitFor(() => fetch(`http://127.0.0.1:${debugPort}/json/version`).then(response => response.ok).catch(() => false), 'Chrome startup');
  const version = await (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json();
  browserConnection = await connect(version.webSocketDebuggerUrl);

  for (const phone of ['01000000001', null]) {
    await participant(phone ? 'A phone + full completion' : 'B anonymous + full completion', async session => {
      await session.begin(phone);
      assert.equal((await session.finish()).status, 'COMPLETE');
      const requests = await session.evaluate('window.scenario.requests');
      assert.equal(requests.length, 6);
      assert.ok(requests.every(request => request.phone === phone));
      assert.equal(await session.evaluate('window.scenario.starts'), 1);
      await session.until('!!document.querySelector(".end__title")');
    });
  }
  await participant('C phone + screening failure', async session => {
    await session.begin('01000000003');
    assert.equal((await session.finish({ Q2: 2 })).status, 'SCREENOUT');
    assert.equal(await session.evaluate('window.scenario.requests.length'), 2);
  });
  await participant('D phone + attention failure at end', async session => {
    await session.begin('01000000004');
    assert.equal((await session.finish({ ATT: 5 })).status, 'COMPLETE');
    assert.equal(await session.evaluate('window.scenario.requests.length'), 6);
    await session.until('!!document.querySelector(".end__title")');
    assert.equal(await session.evaluate('document.querySelector(".end__title").textContent'), '응답이 제출되었습니다');
  });
  await participant('E long idle + expired participant', async session => {
    await session.begin('01000000005');
    await session.step();
    await session.step();
    await session.until('!!document.querySelector(".center-msg .btn-primary")');
    assert.match(await session.evaluate('document.body.innerText'), /참여 시간이 만료/);
    assert.equal(await session.evaluate('window.scenario.responses.includes("COMPLETE")'), false);
  }, { error: 'RESPONDENT_NOT_FOUND' });
  await participant('F refresh halfway clears phone and progress', async session => {
    await session.begin('01000000006');
    await session.step();
    await session.client.send('Page.reload');
    await session.until('!!document.querySelector(".gift-skip-btn")');
    assert.equal(await session.evaluate('document.querySelector("input[type=checkbox]").checked'), false);
    assert.equal(await session.evaluate('!!document.querySelector("input[type=tel]")'), false);
  });
  for (const [name, options] of [
    ['G save error + retry', { error: 'NETWORK', onLast: true }],
    ['H saved but response lost + retry', { lostResponse: true }],
    ['I missing page entry + automatic recovery', { error: 'NOT_ENTERED' }],
    ['J too many requests + automatic retry', { error: 'RATE_LIMITED' }],
  ]) {
    await participant(name, async session => {
      await session.begin('01000000007');
      assert.equal((await session.finish()).status, 'COMPLETE');
      assert.equal(await session.evaluate('window.scenario.errors.length'), 1);
      assert.equal(await session.evaluate('window.scenario.requests.length'), 7);
    }, options);
  }
  await participant('K same phone completed elsewhere during participation', async session => {
    await session.begin('01000000008');
    assert.equal((await session.finish()).status, 'COMPLETE');
    const requests = await session.evaluate('window.scenario.requests');
    assert.equal(requests.at(-2).phone, '01000000008');
    assert.equal(requests.at(-1).phone, null);
  }, { error: 'PHONE_ALREADY_USED', onLast: true });
  await participant('L completed phone blocked at entry', async session => {
    await session.begin('01000000001');
    await session.until('!!document.querySelector(".end__body")');
    assert.equal(await session.evaluate('window.scenario.starts'), 0);
  }, { completed: true });
  await participant('M group quota filled', async session => {
    await session.begin(null);
    assert.equal((await session.finish()).status, 'QUOTAFULL');
  }, { groupFull: true });
  await participant('N missing answers stay on current page', async session => {
    await session.begin(null);
    await session.step();
    await session.click('.btn-primary');
    await session.until('!!document.querySelector(".field-error")');
    assert.equal(await session.evaluate('window.scenario.requests.length'), 1);
  });
  await participant('O birth year options are 1900 through 2026', async session => {
    await session.begin(null);
    await session.step();
    const years = await session.evaluate('window.scenario.current.page.questions.find(question => question.code === "Q1").options.map(option => option.value)');
    assert.deepEqual(years, Array.from({ length: 127 }, (_, index) => 2026 - index));
    assert.equal(await session.evaluate('document.querySelector("select").options.length'), 128);
  });
  console.log(`\n${results.filter(result => result.passed).length}/${results.length} browser scenarios passed.`);
  console.log('Uses isolated mock participants and injected error responses; does not validate database concurrency.');
  if (results.some(result => !result.passed)) process.exitCode = 1;
} finally {
  if (browserConnection) {
    await browserConnection.send('Browser.close').catch(() => {});
    browserConnection.close();
  }
  browser?.kill();
  server?.kill();
  const resolvedProfile = path.resolve(profile);
  if (path.dirname(resolvedProfile) === path.resolve(tmpdir()) && path.basename(resolvedProfile).startsWith('joycraft-survey-scenarios-')) {
    await rm(resolvedProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
  }
}
