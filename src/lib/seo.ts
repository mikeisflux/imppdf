// Centralised SEO copy: keyword set (incl. competitor terms) and JSON-LD
// structured data. Imported by the root layout and page metadata.
import type { Metadata } from 'next';
import { siteName, siteUrl, siteContact } from './config';

export const seoDescription =
  'ImpositionPDF lays out print-ready press sheets in your browser: booklets, N-up, step and repeat, gang sheets, tiled posters, numbered tickets and dielines, with bleed, crop and registration marks. The file is imposed on your own device and never uploaded.';

// Search terms + competitor names we want to rank against.
export const seoKeywords: string[] = [
  // core terms
  'PDF imposition software', 'online imposition tool', 'free imposition software',
  'impose PDF online', 'browser PDF imposition', 'prepress software', 'prepress imposition',
  'booklet imposition', 'saddle stitch imposition', 'perfect bound imposition',
  'n-up imposition', 'step and repeat', 'gang sheet builder', 'cut and stack imposition',
  'business card imposition', 'comic book imposition', 'trade paperback imposition',
  'crop marks', 'bleed marks', 'registration marks', 'cutter marks', 'dieline',
  'impose pdf for printing', 'nup pdf', 'booklet maker', 'signature imposition',
  // competitor names
  'Imposition Wizard alternative', 'Montax Imposer alternative', 'Quite Imposing alternative',
  'Quite Imposing Plus alternative', 'Kodak Preps alternative', 'Heidelberg Prinect alternative',
  'Dynagram InpO2 alternative', 'PDF Snake alternative', 'BookletCreator alternative',
  'ImposeOnline alternative', 'Ultimate Imposition alternative', 'Callas pdfToolbox alternative',
  'Enfocus PitStop imposition', 'PDFsam imposition', 'ConTeXt imposition',
];

// Common questions — rendered as FAQPage structured data on the home page so
// Google can show an expandable FAQ rich result.
export const faqs: { q: string; a: string }[] = [
  { q: `Where does ${siteName} process my file?`, a: 'On your own computer, inside the browser tab. Pages are placed and the new PDF is written locally; nothing is uploaded.' },
  { q: `Is ${siteName} free to use?`, a: 'Every tool is available on the free plan. A Pro subscription lifts the cooldown between downloads and adds API access.' },
  { q: 'What layouts can it produce?', a: 'Saddle-stitched and perfect-bound signatures, N-up grids, step and repeat, cut and stack, gang sheets, folded brochures, tiled posters, dielines and per-cell custom impositions.' },
  { q: 'Which finishing marks can it add?', a: 'Crop, bleed, fold, collating, lay and registration marks, colour bars, slug lines and cut-contour spot colours, all placed in the sheet margins.' },
  { q: 'Do I need Acrobat or a plug-in?', a: 'No. It runs on its own in any current browser on Windows, macOS, Linux or ChromeOS.' },
];

export function faqStructuredData() {
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

// Schema.org Organization — the brand node every other node points to. Carries
// the public phone number so it can surface in a knowledge panel.
export function organizationData() {
  return {
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: siteName,
    url: siteUrl,
    logo: { '@type': 'ImageObject', url: `${siteUrl}/favicon.svg` },
    image: `${siteUrl}/opengraph-image`,
    description: seoDescription,
    telephone: siteContact.phoneE164,
    contactPoint: [{
      '@type': 'ContactPoint',
      telephone: siteContact.phoneE164,
      contactType: 'customer support',
      areaServed: 'US',
      availableLanguage: ['English'],
    }],
  };
}

// Schema.org WebSite — ties the domain to the Organization as publisher.
export function websiteData() {
  return {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: siteName,
    url: siteUrl,
    inLanguage: 'en-US',
    publisher: { '@id': `${siteUrl}/#organization` },
  };
}

// Schema.org SoftwareApplication — helps Google render a rich result.
export function softwareAppData() {
  return {
    '@type': 'SoftwareApplication',
    '@id': `${siteUrl}/#app`,
    name: siteName,
    url: siteUrl,
    applicationCategory: 'DesignApplication',
    applicationSubCategory: 'Prepress / PDF Imposition',
    operatingSystem: 'Web browser',
    description: seoDescription,
    publisher: { '@id': `${siteUrl}/#organization` },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Every tool on the free plan; Pro lifts the download cooldown and adds API access.',
    },
    featureList: [
      'Booklet & saddle-stitch imposition', 'Perfect-bound / trade paperback', 'N-up & step-and-repeat',
      'Gang sheets', 'Cut & stack numbering', 'Crop, bleed & registration marks',
      'Business cards, postcards, labels, hang tags', 'Comic book imposition', 'Variable data (CSV)',
    ],
    aggregateRating: {
      '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '126',
    },
  };
}

// Single connected @graph emitted site-wide in the root layout: Organization +
// WebSite + SoftwareApplication, cross-linked by @id.
export function siteGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [organizationData(), websiteData(), softwareAppData()],
  };
}

// ── Reusable page metadata ───────────────────────────────────────────────────
// Builds a consistent Metadata object with canonical URL, Open Graph and Twitter
// cards for every static page, so no page ships without them.
export function pageMetadata(opts: {
  title: string; description: string; path: string; noindex?: boolean;
}): Metadata {
  const { title, description, path, noindex } = opts;
  const canonical = path.startsWith('http') ? path : path || '/';
  const ogTitle = `${title} · ${siteName}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'website', siteName, title: ogTitle, description, url: `${siteUrl}${canonical === '/' ? '' : canonical}` },
    twitter: { card: 'summary_large_image', title: ogTitle, description },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
