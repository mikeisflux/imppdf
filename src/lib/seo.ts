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
