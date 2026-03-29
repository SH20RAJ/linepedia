import fs from 'fs';

const DEFAULT_INDEXNOW_KEY = '2f3a29d127b84110a911375a73d97702';
const DEFAULT_HOST = 'linespedia.com';
const DEFAULT_PROTOCOL = 'https://';
const DEFAULT_BATCH_SIZE = 9000;
const DEFAULT_CHANGED_WINDOW_HOURS = 72;
const DEFAULT_LANGUAGES = ['en', 'es', 'fr', 'de', 'hi', 'ar', 'zh', 'ja', 'ru', 'pt', 'it'];

function toNumberOrFallback(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizePath(routePath) {
    const raw = String(routePath || '').trim();
    if (!raw) return '/';

    const ensuredLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
    const [pathname, query = ''] = ensuredLeadingSlash.split('?');
    const collapsed = pathname.replace(/\/{2,}/g, '/');
    const hasFileExtension = /\.[a-z0-9]+$/i.test(collapsed);
    const normalizedPathname = hasFileExtension || collapsed.endsWith('/') ? collapsed : `${collapsed}/`;

    return query ? `${normalizedPathname}?${query}` : normalizedPathname;
}

function toTimestamp(value) {
    const candidate = String(value || '').trim();
    if (!candidate) return null;

    const parsed = new Date(candidate);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function getUpdateTimestamp(item) {
    const candidate =
        item?.updatedAt ||
        item?.updated_at ||
        item?.modifiedAt ||
        item?.dateModified ||
        item?.createdAt ||
        item?.date;

    return toTimestamp(candidate);
}

function readJsonArray(filePath) {
    if (!fs.existsSync(filePath)) return [];

    try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error(`❌ Could not parse JSON array: ${filePath}`, error.message);
        return [];
    }
}

function getConfig(overrides = {}) {
    const envLanguages = String(process.env.INDEXNOW_LANGUAGES || '')
        .split(',')
        .map((lang) => lang.trim())
        .filter(Boolean);

    const protocol = String(process.env.INDEXNOW_PROTOCOL || DEFAULT_PROTOCOL);
    const host = String(process.env.INDEXNOW_HOST || DEFAULT_HOST);
    const key = String(process.env.INDEXNOW_KEY || DEFAULT_INDEXNOW_KEY);
    const languages = envLanguages.length > 0 ? envLanguages : DEFAULT_LANGUAGES;

    return {
        protocol,
        host,
        key,
        languages,
        batchSize: toNumberOrFallback(overrides.batchSize, toNumberOrFallback(process.env.INDEXNOW_BATCH_SIZE, DEFAULT_BATCH_SIZE)),
        changedSinceHours: toNumberOrFallback(overrides.changedSinceHours, toNumberOrFallback(process.env.INDEXNOW_CHANGED_WINDOW_HOURS, DEFAULT_CHANGED_WINDOW_HOURS)),
    };
}

function addLocalizedUrl(urls, routePath, config) {
    const normalizedPath = normalizePath(routePath);
    for (const lang of config.languages) {
        const langParam = lang === 'en' ? '' : `?lang=${lang}`;
        urls.add(`${config.protocol}${config.host}${normalizedPath}${langParam}`);
    }
}

function collectCoreUrls(urls, config) {
    const coreRoutes = ['/', '/explore/', '/writers/', '/categories/', '/collections/', '/seo/', '/panchtantra/', '/ap/1/'];
    coreRoutes.forEach((route) => addLocalizedUrl(urls, route, config));
}

function collectTaxonomyUrls(urls, config) {
    const writers = readJsonArray('src/data/writers.json');
    const categories = readJsonArray('src/data/categories.json');
    const collections = readJsonArray('src/data/collections.json');

    writers.forEach((writer) => writer?.slug && addLocalizedUrl(urls, writer.slug, config));
    categories.forEach((category) => category?.slug && addLocalizedUrl(urls, category.slug, config));
    collections.forEach((collection) => collection?.slug && addLocalizedUrl(urls, collection.slug, config));

    return {
        writers: writers.length,
        categories: categories.length,
        collections: collections.length,
    };
}

function collectAllPoetryUrls(urls, config, options) {
    const allPoetryPath = 'linespedia-data/automation/all-poems-metadata.json';
    if (!fs.existsSync(allPoetryPath)) {
        return { totalPoems: 0, submittedPoems: 0, submittedPoets: 0, skippedByFreshness: 0 };
    }

    const allPoetry = readJsonArray(allPoetryPath);
    const allPoets = new Set();
    const poetsToSubmit = new Set();

    const freshnessThreshold = Date.now() - config.changedSinceHours * 60 * 60 * 1000;
    let submittedPoems = 0;
    let skippedByFreshness = 0;

    for (const poem of allPoetry) {
        const writerSlug = String(poem?.writerSlug || '').trim();
        const poemSlug = String(poem?.slug || '').trim();

        if (writerSlug) {
            allPoets.add(writerSlug);
        }

        if (!writerSlug || !poemSlug) continue;

        const updatedTimestamp = getUpdateTimestamp(poem);
        if (options.changedOnly && updatedTimestamp !== null && updatedTimestamp < freshnessThreshold) {
            skippedByFreshness += 1;
            continue;
        }

        addLocalizedUrl(urls, `line/ap/${writerSlug}/${poemSlug}`, config);
        poetsToSubmit.add(writerSlug);
        submittedPoems += 1;
    }

    const finalPoets = options.changedOnly ? poetsToSubmit : allPoets;
    finalPoets.forEach((slug) => addLocalizedUrl(urls, `poet/${slug}`, config));

    return {
        totalPoems: allPoetry.length,
        submittedPoems,
        submittedPoets: finalPoets.size,
        skippedByFreshness,
    };
}

async function submitBatches(urlList, config) {
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < urlList.length; i += config.batchSize) {
        const batch = urlList.slice(i, i + config.batchSize);
        const batchNumber = Math.floor(i / config.batchSize) + 1;
        const totalBatches = Math.ceil(urlList.length / config.batchSize);

        console.log(`📤 Submitting batch ${batchNumber}/${totalBatches} (${batch.length} URLs)...`);

        const body = {
            host: config.host,
            key: config.key,
            keyLocation: `${config.protocol}${config.host}/${config.key}.txt`,
            urlList: batch,
        };

        try {
            const response = await fetch('https://api.indexnow.org/indexnow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                console.log(`✅ Batch ${batchNumber} success (${response.status})`);
                successCount += 1;
            } else {
                console.error(`❌ Batch ${batchNumber} failed (${response.status})`);
                failedCount += 1;
            }
        } catch (error) {
            console.error(`❌ Fetch error in batch ${batchNumber}:`, error.message);
            failedCount += 1;
        }
    }

    return { successCount, failedCount };
}

async function submitToIndexNow(options = {}) {
    const config = getConfig(options);
    const changedOnly = Boolean(options.changedOnly);
    const dryRun = Boolean(options.dryRun);
    const maxUrls = toNumberOrFallback(options.maxUrls, 0);

    console.log('🚀 Starting Codebase-Driven IndexNow submission...');
    console.log(`Mode: ${changedOnly ? 'changed-only' : 'full'}${dryRun ? ' (dry-run)' : ''}`);

    const urls = new Set();

    collectCoreUrls(urls, config);
    const taxonomyStats = collectTaxonomyUrls(urls, config);
    const poetryStats = collectAllPoetryUrls(urls, config, { changedOnly });

    let urlList = Array.from(urls);
    if (maxUrls > 0 && urlList.length > maxUrls) {
        urlList = urlList.slice(0, maxUrls);
    }

    console.log(`📚 Taxonomy harvested: writers=${taxonomyStats.writers}, categories=${taxonomyStats.categories}, collections=${taxonomyStats.collections}`);
    console.log(`📝 AllPoetry: total=${poetryStats.totalPoems}, submittedPoems=${poetryStats.submittedPoems}, submittedPoets=${poetryStats.submittedPoets}, skippedByFreshness=${poetryStats.skippedByFreshness}`);
    console.log(`📊 Total localized URLs harvested: ${urlList.length}`);

    if (urlList.length === 0) {
        console.error('No URLs found to submit.');
        return 0;
    }

    if (dryRun) {
        console.log('🧪 Dry run complete. No IndexNow requests were sent.');
        return urlList.length;
    }

    const result = await submitBatches(urlList, config);
    console.log(`🎉 IndexNow submission complete. Success batches=${result.successCount}, Failed batches=${result.failedCount}`);

    return urlList.length;
}

function parseCliOptions(argv) {
    const options = {};

    for (const arg of argv) {
        if (arg === '--changed-only') options.changedOnly = true;
        else if (arg === '--dry-run') options.dryRun = true;
        else if (arg.startsWith('--changed-since-hours=')) {
            options.changedSinceHours = arg.split('=')[1];
        } else if (arg.startsWith('--max-urls=')) {
            options.maxUrls = arg.split('=')[1];
        } else if (arg.startsWith('--batch-size=')) {
            options.batchSize = arg.split('=')[1];
        }
    }

    return options;
}

// Direct execution
if (process.argv[1]?.includes('submit-indexnow.js')) {
    const cliOptions = parseCliOptions(process.argv.slice(2));
    submitToIndexNow(cliOptions).catch((error) => {
        console.error('❌ IndexNow script failed:', error);
        process.exitCode = 1;
    });
}

export { submitToIndexNow };
