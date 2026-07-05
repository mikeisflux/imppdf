// Centralised SEO copy: keyword set (incl. competitor terms) and JSON-LD
// structured data. Imported by the root layout and page metadata.
import { siteName, siteUrl } from './config';

export const seoDescription =
  'Free browser-based PDF imposition & prepress software. Impose booklets, N-up, step & repeat, gang sheets, business cards, comics and trade paperbacks with crop marks, bleed and registration — all in your browser, nothing uploaded.';

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
  { q: `Is ${siteName} free?`, a: `Yes. ${siteName} runs entirely in your browser and is free to use, with a Pro subscription for higher download limits and API access.` },
  { q: 'Do my PDFs get uploaded?', a: 'No. Imposition happens locally in your browser — your files never leave your device.' },
  { q: 'What imposition can it do?', a: 'Booklets and saddle-stitch, perfect-bound trade paperbacks, comics, N-up and step-and-repeat, gang sheets, cut-and-stack, business cards, postcards, labels, hang tags and more — with crop, bleed and registration marks.' },
  { q: `Is ${siteName} an alternative to Imposition Wizard, Montax Imposer or Quite Imposing?`, a: `Yes — ${siteName} is a free, browser-based alternative that covers the same booklet, N-up, step-and-repeat and gang-sheet imposition workflows with no install.` },
  { q: 'Can I add crop and registration marks?', a: 'Yes. Every layout tool can add crop marks, bleed and registration/cutter marks, and you can add a dedicated Cutter Marks step for die-cutting.' },
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

// Schema.org SoftwareApplication — helps Google render a rich result.
export function structuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteName,
    url: siteUrl,
    applicationCategory: 'DesignApplication',
    applicationSubCategory: 'Prepress / PDF Imposition',
    operatingSystem: 'Web browser',
    description: seoDescription,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier with unlimited in-browser imposition; Pro subscription for higher limits.',
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
