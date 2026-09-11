#!/usr/bin/env node
/**
 * style-tics.mjs - the scribekit-blog skill's mechanical style meter.
 *
 * WHY THIS IS A SCRIPT: four hardening iterations showed that a model asked to count its own
 * tics under-counts them every time (self-authored regexes, narrowed definitions, skipped
 * locales). Work that must be exact is a script the model runs. The numbers printed here are
 * the meter the caps in house-style.md are enforced against; the model adjudicates individual
 * hits (a flagged false positive is argued in printed output, never by editing this file's
 * patterns mid-run) and fixes the text until every category prints PASS.
 *
 * Usage: node style-tics.mjs <file.mdx> [more files...]
 * Output per file: per-category hits with line numbers, counts vs caps, an extraction section
 * (digits / number-words / quantifiers) for the digit gate's row-mapping step, section-opening
 * shapes, and sentence-length runs. Exit code 1 if any capped category is OVER (extraction and
 * shape sections are informational - their judgement lives in the skill text).
 */

import { readFileSync } from "node:fs";

/** Caps enforced by house-style.md. A category absent here is report-only. */
const CAPS = { emDash: 0, banned: 0, staccato: 0, pivots: 2, tricolons: 1 };

/** Banned vocabulary and filler (EN + NL close variants), matched case-insensitively. */
const BANNED = [
    /\bdelve\b/i, /\btapestry\b/i, /\brealm\b/i, /\bunderscore(?:s|d)?\b/i, /\bseamless(?:ly)?\b/i,
    /\bgame.?changer\b/i, /\brevolutionar(?:y|ies)\b/i, /\bbest.in.class\b/i, /\bcutting.edge\b/i,
    /\bsupercharge\b/i, /\bmultifaceted\b/i, /\bmeticulous(?:ly)?\b/i, /\bpivotal\b/i,
    /\bshowcase(?:s|d)?\b(?![^\]]*\))/i, /\bstreamlin(?:e|ed|ing)\b/i, /\bparadigm\b/i,
    /\bsynergy\b/i, /\btransformative\b/i, /\bvibrant\b/i, /\bever.evolving\b/i,
    /\ba testament to\b/i, /\bnavigate the complexit/i, /\bin the realm of\b/i,
    /\bIn today'?s fast/i, /\bdigital (?:age|landscape)\b/i, /\bIt'?s (?:important|worth) not/i,
    /\bNeedless to say\b/i, /\bAt the end of the day\b/i, /\bLet'?s (?:dive|delve|break|unpack)/i,
    /\bHere'?s the kicker\b/i, /\bRest assured\b/i, /\bplays a (?:crucial|vital|key) role\b/i,
    /\bIn conclusion\b/i, /\bIn summary\b/i, /\bTo sum up\b/i,
    /^(?:Importantly|Interestingly|Notably|Moreover|Furthermore|Additionally)[,:]/,
    /\bserves as\b/i, /\bstands as\b/i, /\bfunctions as\b/i, /\bboasts\b/i,
    /, \w+ing (?:its|the|a|an|broader|their) [^.]*\.$/,
    // NL
    /\bnaadloos\b/i, /\bbaanbrekend\b/i, /\bveelzijdig(?:e)?\b(?=[^.]*oplossing)/i,
    /\bcruciale rol\b/i, /\bIn de snelle wereld\b/i, /\bLaten we (?:duiken|induiken)\b/i,
    /\bKortom[,:]/, /\bSamenvattend\b/i, /\bBovendien[,:]/,
];

/** Negation-pivot shapes - every form that has shipped past a narrower definition. */
const PIVOTS = [
    /\bnot (?:just|only|simply|merely)\b[^.]*,?\s*(?:but|it)\b/i,
    /\b(?:It|That|This)(?:'s| is) not\b[^.]*\b(?:it|that|this)(?:'s| is)\b/i,
    /\bisn'?t about\b[^.]*\bit'?s about\b/i,
    /^[A-Z][^.!?]{0,60}\bnot\b[^.!?]{0,60}[.!?]\s+[A-Z][^.!?]{0,40}\./,          // pivot pair opener
    /^(?:Others|It|That|This|The \w+) (?:do(?:es)? not|did not|will not)[.:]\s*$/m, // standalone
    /(?:^|[.!?]\s+)Not [\w'][^.!?]{0,60}[.!?]/,                                   // any "Not X..." sentence
    /\bNeither\b[^.]{0,80}\bnor\b/i,
    /\bNeither\b[^.]{0,40}\bis\b/i,
    /^[^.!?\n]{0,50}, not [^.!?\n]{0,40}\.$/m,                                    // "X, not Y."
    /[^.!?]{0,50}\b(?:and|but) not\b[^.!?]{0,40}[.!?]/i,
    /\b(?:operates|changes|explains|proves|means|measures|knows|learns) (?:nothing|none)\b/i,
    // NL
    /\bniet (?:alleen|slechts)\b[^.]*\bmaar\b/i,
    /(?:^|[.!?]\s+)(?:Niet|Geen) [\w'][^.!?]{0,60}[.!?]/,
    /\bNoch\b[^.]{0,80}\bnoch\b/i,
    /[^.!?]{0,50}\b(?:en|maar) niet\b[^.!?]{0,40}[.!?]/i,
    /\b(?:bedient|verandert|verklaart|bewijst|betekent|meet|weet|leert) (?:niets|geen)\b/i,
];

/** Tricolons - ANY three-parallel-items rhythm. */
const TRICOLONS = [
    /\b[\w'-]+, [\w'-]+(?:,)? (?:and|or|en|of) [\w'-]+\b(?![^|]*\|)/,
    /\b[\w'-]+ [\w'-]+, [\w'-]+ [\w'-]+(?:,)? (?:and|or|en|of) [\w'-]+ [\w'-]+\b/,
    /(?:\byour [\w-]+, your [\w-]+, (?:and |en )?your [\w-]+)/i,
    /^[^.\n]{2,40}, [^.\n]{2,40}, (?:and |or |en |of )?[^.\n]{2,40}\.$/m,
];

/** Staccato negation closers - banned outright. */
const STACCATO = [
    /\bNo [\w-]+[,.] no [\w-]+[,.]?(?: no [\w-]+[,.]?)?/i,
    /\bNot [\w-]+\. Not [\w-]+\./,
    /\bGeen [\w-]+[,.] geen [\w-]+[,.]?/i,
];

/** Quantifiers/comparatives whose every use must map to a ledger row (EN + NL standard lists). */
const QUANTIFIERS = [
    "most", "majority", "almost", "never", "always", "typical", "typically", "usually",
    "rare", "rarely", "more than", "fewer", "less than", "twice", "half", "every ",
    "meeste", "merendeel", "bijna", "nooit", "altijd", "meestal", "doorgaans", "zelden",
    "vaker", "meer dan", "minder dan", "dubbel", "tweemaal", "helft", "elke ", "iedere ",
];

/** Number-words the \d sweep cannot see (EN + NL). */
const NUMBER_WORDS = [
    "one in ", "two in ", "three in ", "four in ", "a quarter", "a third", "three.quarters",
    "a fifth", "factor of \\w+", "double", "dozens", "hundreds", "thousands",
    "twee op ", "drie op ", "een kwart", "een derde", "driekwart", "een vijfde",
    "verdubbel", "tientallen", "honderden", "duizenden",
];

/** One scanned file's derived structures. */
function scan(path) {
    let raw = readFileSync(path, "utf8");
    // A .js hero-params file is swept over its STRING LITERALS (title/subtitle are sentences).
    if (path.endsWith(".js")) {
        raw = [...raw.matchAll(/["'`]((?:[^"'`\\]|\\.){4,})["'`]/g)].map((m) => m[1]).join("\n");
    }
    const lines = raw.split("\n");
    const hits = { emDash: [], banned: [], pivots: [], tricolons: [], staccato: [] };
    const inFrontmatter = (i) => {
        const fmEnd = lines.indexOf("---", 1);
        return lines[0] === "---" && i > 0 && i < fmEnd;
    };
    lines.forEach((line, i) => {
        const n = i + 1;
        if (/^\s*(?:import |<|```)/.test(line)) return; // code/JSX lines
        if (line.includes("—")) hits.emDash.push({ n, s: line.trim().slice(0, 80) });
        for (const re of BANNED) if (re.test(line)) { hits.banned.push({ n, s: line.match(re)[0] }); break; }
        for (const re of PIVOTS) if (re.test(line)) { hits.pivots.push({ n, s: line.match(re)[0].slice(0, 80) }); break; }
        for (const re of TRICOLONS) if (re.test(line) && !inFrontmatter(i) && !/^\s*(?:keywords|categories)/.test(lines[i - 1] ?? "")) {
            hits.tricolons.push({ n, s: line.match(re)[0].slice(0, 80) }); break;
        }
        for (const re of STACCATO) if (re.test(line)) { hits.staccato.push({ n, s: line.match(re)[0].slice(0, 80) }); break; }
    });

    // Extraction section: digits, number-words, quantifiers (row-mapping is the model's half).
    const extract = [];
    lines.forEach((line, i) => {
        if (/^\s*(?:import |<|```)/.test(line)) return;
        for (const m of line.matchAll(/\d[\d.,:%]*/g)) extract.push({ n: i + 1, kind: "digit", s: m[0] });
        for (const w of NUMBER_WORDS) { const re = new RegExp(w, "i"); const m = line.match(re); if (m) extract.push({ n: i + 1, kind: "numword", s: m[0] }); }
        for (const q of QUANTIFIERS) if (line.toLowerCase().includes(q)) extract.push({ n: i + 1, kind: "quant", s: q.trim() });
    });

    // Sections: heading + opening-line shape; epigram density; sentence-length runs.
    const sections = [];
    lines.forEach((line, i) => {
        if (/^##\s/.test(line)) {
            let j = i + 1;
            while (j < lines.length && lines[j].trim() === "") j++;
            const first = (lines[j] ?? "").trim();
            const sent = first.split(/(?<=[.!?])\s/)[0] ?? "";
            const words = sent.replace(/[*_>#]/g, "").split(/\s+/).filter(Boolean).length;
            const shape = /\?$/.test(sent) ? "question"
                : /^\d|^[A-Z][a-z]* \d/.test(sent.replace(/[*_]/g, "")) ? "number-led"
                : words <= 6 && !/,/.test(sent) ? "terse/fragment"
                : /^(?:Ask|Try|Read|Open|Ring|Check|Start|Vraag|Lees|Open|Bel|Controleer)\b/i.test(sent.replace(/[*_]/g, "")) ? "imperative"
                : "declarative";
            sections.push({ n: i + 1, heading: line.slice(3, 60), shape, first: sent.slice(0, 70) });
        }
    });
    const paras = raw.split(/\n\s*\n/).filter((p) => !/^(?:---|#|>|\||```|import |<)/.test(p.trim()) && p.trim().length > 40);
    let epigrams = 0;
    for (const p of paras) {
        const sents = p.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
        const last = sents[sents.length - 1] ?? "";
        if (sents.length > 1 && last.split(/\s+/).length <= 7) epigrams++;
    }
    const runs = [];
    for (const p of paras) {
        const lens = p.trim().split(/(?<=[.!?])\s+/).map((s) => s.split(/\s+/).length);
        for (let i = 0; i + 2 < lens.length; i++) {
            const [a, b, c] = [lens[i], lens[i + 1], lens[i + 2]];
            if (Math.max(a, b, c) - Math.min(a, b, c) <= 5 && a > 12) { runs.push(`${a}/${b}/${c}w: "${p.trim().slice(0, 60)}..."`); break; }
        }
    }
    return { hits, extract, sections, epigrams, paraCount: paras.length, runs };
}

let failed = false;
for (const path of process.argv.slice(2)) {
    const r = scan(path);
    console.log(`\n=== ${path} ===`);
    for (const [cat, cap] of Object.entries(CAPS)) {
        const arr = r.hits[cat] ?? [];
        const over = arr.length > cap;
        if (over) failed = true;
        console.log(`${cat}: ${arr.length} (cap ${cap}) ${over ? "OVER" : "PASS"}`);
        for (const h of arr) console.log(`    L${h.n}: ${h.s}`);
    }
    console.log(`epigram-final paragraphs: ${r.epigrams}/${r.paraCount} (cap: half) ${r.epigrams * 2 > r.paraCount ? "OVER" : "PASS"}`);
    if (r.epigrams * 2 > r.paraCount) failed = true;
    console.log(`section openings (vary the shapes - 1 shape everywhere is the over-correction trap):`);
    for (const s of r.sections) console.log(`    L${s.n} [${s.shape}] ${s.heading} -> "${s.first}"`);
    if (r.runs.length) { console.log(`flat sentence-length runs (3+ within 5 words):`); for (const x of r.runs) console.log(`    ${x}`); }
    console.log(`extraction for the digit gate (map EVERY token to a ledger row / arithmetic / date-or-config, in printed output):`);
    for (const e of r.extract) console.log(`    L${e.n} ${e.kind}: ${e.s}`);
}
process.exit(failed ? 1 : 0);
