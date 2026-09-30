#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const endpoint = process.env.INDEXNOW_SUBMIT_URL || 'https://rcwebapp.com/api/indexnow/submit';
const token = process.env.INDEXNOW_SUBMIT_TOKEN;

function extractUrls(input) {
  return input
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter((item) => item.startsWith('https://') || item.startsWith('http://'));
}

async function loadUrls(args) {
  const urls = [];

  for (const arg of args) {
    if (arg.startsWith('https://') || arg.startsWith('http://')) {
      urls.push(arg);
      continue;
    }

    const content = await readFile(arg, 'utf8');
    urls.push(...extractUrls(content));
  }

  return Array.from(new Set(urls));
}

if (!token) {
  console.error('INDEXNOW_SUBMIT_TOKEN is required.');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Pass one or more changed canonical URLs or files containing them.');
  process.exit(1);
}
const urlList = await loadUrls(args);
if (urlList.length === 0) {
  console.error('No changed canonical URLs were found.');
  process.exit(1);
}
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json; charset=utf-8',
  },
  body: JSON.stringify({ urlList }),
});

const text = await response.text();
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log(text);
}

if (!response.ok) {
  process.exit(1);
}
