#!/usr/bin/env node
// Local SEO audit script
// Usage: node scripts/seo-audit-local.js --url http://localhost:3000/sitemap.xml

import { argv } from 'process';

function argValue(flag, fallback) {
  const idx = argv.indexOf(flag);
  if (idx === -1) return fallback;
  return argv[idx + 1] || fallback;
}

const SITEMAP_URL = argValue('--url', argValue('-u', 'http://localhost:3000/sitemap.xml'));
const CONCURRENCY = parseInt(argValue('--concurrency', '8'), 10) || 8;

async function fetchText(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch (err) {
    return { ok: false, status: 0, text: '', error: String(err) };
  }
}

function extractTags(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([^]*?)<\/${tag}>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(xml))) out.push(m[1].trim());
  return out;
}

function extractLocsFromSitemap(xml) {
  // handles both <sitemapindex> and <urlset>
  const locs = extractTags(xml, 'loc');
  return locs.map((s) => s.replace(/&amp;/g, '&'));
}

function extractTitle(html) {
  const m = /<title[^>]*>([^<]+)</i.exec(html);
  return m ? m[1].trim() : '';
}

function extractMeta(html, name) {
  const m = new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i').exec(html);
  if (m) return m[1].trim();
  // try attributes in different order
  const m2 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${name}["'][^>]*>`, 'i').exec(html);
  return m2 ? m2[1].trim() : '';
}

function extractCanonical(html) {
  const m = /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i.exec(html);
  return m ? m[1].trim() : '';
}

function extractHreflangHrefs(html) {
  const matches = [...html.matchAll(/<link[^>]*rel=["']alternate["'][^>]*hreflang=["'][^"']+["'][^>]*href=["']([^"']+)["'][^>]*>/gi)];
  return matches.map((match) => match[1].trim());
}

function extractH1(html) {
  const m = /<h1[^>]*>([\s\S]*?)<\/?h1>/i.exec(html);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

async function inspectPage(url) {
  const res = await fetchText(url);
  const out = { url, ok: res.ok, status: res.status, errors: [], warnings: [] };
  if (!res.ok) {
    out.errors.push(`HTTP ${res.status || 'ERR'}`);
    return out;
  }
  const html = res.text;
  const title = extractTitle(html);
  const desc = extractMeta(html, 'description');
  const robots = extractMeta(html, 'robots');
  const canonical = extractCanonical(html);
  const h1 = extractH1(html);
  const bodyLen = html.replace(/<[^>]+>/g, '').trim().length;
  const hreflangHrefs = extractHreflangHrefs(html);
  const isLangParamPage = new URL(url).searchParams.has('lang');
  const hasLoadingTranslation = /Loading translation|Translating\.{3}|Translation is loading/i.test(html);

  if (!title) out.errors.push('Missing <title>');
  if (!desc) out.warnings.push('Missing meta description');
  if (!canonical) out.errors.push('Missing canonical link');
  if (canonical && canonical.includes('?')) out.errors.push('Canonical contains query params');
  if (robots && /noindex/i.test(robots)) out.errors.push('Page is `noindex`');
  if (isLangParamPage) {
    if (!robots || !/noindex/i.test(robots)) out.errors.push('Language parameter page is indexable');
    if (!canonical || canonical.includes('?lang=')) out.errors.push('Language parameter page canonical is not normalized');
  }
  if (hreflangHrefs.some((href) => /[?&]lang=/i.test(href))) {
    out.errors.push('hreflang points to parameter-based translation URL');
  }
  if (!isLangParamPage && !/noindex/i.test(robots || '') && hasLoadingTranslation) {
    out.errors.push('Indexable page exposes translation loading shell');
  }
  if (!h1) out.warnings.push('Missing H1');
  if (bodyLen < 200) out.warnings.push(`Body too short (${bodyLen} chars)`);

  out.title = title;
  out.description = desc;
  out.canonical = canonical;
  out.robots = robots;
  out.h1 = h1;
  out.bodyLength = bodyLen;
  return out;
}

async function main() {
  console.log('Starting local SEO audit for sitemap:', SITEMAP_URL);
  const root = await fetchText(SITEMAP_URL);
  if (!root.ok) {
    console.error('Failed to fetch sitemap index:', root.status, root.error || '');
    process.exit(2);
  }

  const sitemapLocs = extractLocsFromSitemap(root.text);
  let sitemapUrls = [];
  // If the root is a urlset, treat it as single sitemap
  if (/<sitemapindex/i.test(root.text)) {
    sitemapUrls = sitemapLocs;
  } else {
    // urlset returned - treat as page list
    sitemapUrls = [SITEMAP_URL];
  }

  // collect page URLs
  const pageUrls = new Set();
  for (const sUrl of sitemapUrls) {
    const sResp = await fetchText(sUrl);
    if (!sResp.ok) {
      console.warn('Warning: could not fetch sitemap:', sUrl, sResp.status);
      continue;
    }
    const locs = extractLocsFromSitemap(sResp.text);
    for (const l of locs) pageUrls.add(l);
  }

  const pages = Array.from(pageUrls);
  console.log(`Discovered ${pages.length} pages from sitemap(s)`);

  // Detect any URLs in sitemap that contain query params
  const paramUrls = pages.filter((u) => /[?&]lang=/i.test(u));
  if (paramUrls.length) {
    console.warn(`Found ${paramUrls.length} language-parameter URLs in sitemap (must be removed):`);
    paramUrls.slice(0, 10).forEach((u) => console.warn(' -', u));
    results.push({
      url: SITEMAP_URL,
      ok: false,
      status: 200,
      errors: ['Sitemap contains language-parameter URLs'],
      warnings: [],
    });
  }

  // Inspect pages with concurrency
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < pages.length) {
      const i = idx++;
      const url = pages[i];
      try {
        const r = await inspectPage(url);
        results.push(r);
        const summary = [];
        if (!r.ok) summary.push('ERR');
        if (r.errors.length) summary.push('ERROR');
        else if (r.warnings.length) summary.push('WARN');
        else summary.push('OK');
        console.log(`[${summary.join('/')}] ${url}`);
      } catch (e) {
        console.error('Inspect error', url, e);
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, pages.length) }, () => worker());
  await Promise.all(workers);

  const errors = results.filter((r) => r.errors && r.errors.length);
  const warnings = results.filter((r) => (!r.errors || r.errors.length === 0) && r.warnings && r.warnings.length);

  console.log('\nAudit summary:');
  console.log('- Pages checked:', results.length);
  console.log('- Pages with errors:', errors.length);
  console.log('- Pages with warnings:', warnings.length);

  if (errors.length) {
    console.log('\nTop errors (first 20):');
    errors.slice(0, 20).forEach((r) => {
      console.log(`\n${r.url}`);
      console.log('  Status:', r.status);
      r.errors.forEach((e) => console.log('  -', e));
      r.warnings.forEach((w) => console.log('  *', w));
    });
  }

  if (warnings.length && !errors.length) {
    console.log('\nTop warnings (first 20):');
    warnings.slice(0, 20).forEach((r) => {
      console.log(`\n${r.url}`);
      r.warnings.forEach((w) => console.log('  *', w));
    });
  }

  // exit non-zero when critical failures
  if (errors.length) process.exit(2);
  if (warnings.length) process.exit(1);
  console.log('PASS: SEO audit OK');
  process.exit(0);
}

main().catch((err) => {
  console.error('Audit failure', err);
  process.exit(2);
});
