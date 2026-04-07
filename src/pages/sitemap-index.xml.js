export async function GET() {
  return Astro.redirect('/sitemap.xml', 301);
}
