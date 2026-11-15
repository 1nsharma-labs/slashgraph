import http from 'http';
import https from 'https';
import { URL } from 'url';

export class UrlMindAnalyzer {
  constructor(options = {}) {
    this.timeout = options.timeout || 5000;
  }

  async analyzeUrl(targetUrl, options = {}) {
    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    } catch {
      throw new Error(`Invalid URL provided: "${targetUrl}"`);
    }

    if (options.simulate) {
      return this.getSimulatedIntelligence(parsedUrl.href);
    }

    return new Promise((resolve) => {
      const client = parsedUrl.protocol === 'https:' ? https : http;
      const req = client.get(parsedUrl.href, { timeout: this.timeout }, (res) => {
        let rawHtml = '';
        res.on('data', chunk => {
          if (rawHtml.length < 500000) rawHtml += chunk;
        });

        res.on('end', () => {
          const techStack = this.detectTechStack(res.headers, rawHtml);
          const security = this.auditSecurityHeaders(res.headers);
          const meta = this.extractMetaTags(rawHtml);
          const endpoints = this.extractEndpoints(rawHtml, parsedUrl.origin);

          resolve({
            url: parsedUrl.href,
            status: res.statusCode,
            protocol: parsedUrl.protocol,
            host: parsedUrl.host,
            techStack,
            security,
            meta,
            endpoints: endpoints.slice(0, 15)
          });
        });
      });

      req.on('error', () => {
        // Fall back to simulation if offline or unreachable
        resolve(this.getSimulatedIntelligence(parsedUrl.href));
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(this.getSimulatedIntelligence(parsedUrl.href));
      });
    });
  }

  detectTechStack(headers, html) {
    const stack = [];
    const lowerHtml = (html || '').toLowerCase();
    const serverHeader = (headers['server'] || '').toLowerCase();
    const poweredBy = (headers['x-powered-by'] || '').toLowerCase();

    // Servers / CDNs
    if (serverHeader.includes('cloudflare') || headers['cf-ray']) stack.push('Cloudflare CDN & Edge');
    if (serverHeader.includes('nginx')) stack.push('Nginx Reverse Proxy');
    if (serverHeader.includes('apache')) stack.push('Apache HTTP Server');
    if (headers['x-vercel-id']) stack.push('Vercel Edge Platform');
    if (headers['x-amz-cf-id']) stack.push('AWS CloudFront');

    // Frameworks
    if (poweredBy.includes('express')) stack.push('Express.js');
    if (poweredBy.includes('next.js') || lowerHtml.includes('__next')) stack.push('Next.js / React');
    if (lowerHtml.includes('data-reactroot') || lowerHtml.includes('react')) stack.push('React.js');
    if (lowerHtml.includes('vue') || lowerHtml.includes('data-v-')) stack.push('Vue.js');
    if (lowerHtml.includes('tailwindcss') || lowerHtml.includes('tailwind')) stack.push('Tailwind CSS');

    if (stack.length === 0) stack.push('Modern HTML5 / SPA');
    return Array.from(new Set(stack));
  }

  auditSecurityHeaders(headers) {
    return {
      hsts: !!headers['strict-transport-security'],
      csp: !!headers['content-security-policy'],
      xFrameOptions: !!headers['x-frame-options'],
      xContentTypeOptions: !!headers['x-content-type-options'],
      corsWildcard: headers['access-control-allow-origin'] === '*'
    };
  }

  extractMetaTags(html) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    return {
      title: titleMatch ? titleMatch[1].trim() : 'Unknown Title',
      description: descMatch ? descMatch[1].trim() : 'No description specified'
    };
  }

  extractEndpoints(html, origin) {
    const endpoints = new Set();
    const apiRegex = /['"`](\/api\/[^'"`\s?#]+)['"`]/g;
    let match;
    while ((match = apiRegex.exec(html)) !== null) {
      endpoints.add(`${origin}${match[1]}`);
    }
    return Array.from(endpoints);
  }

  getSimulatedIntelligence(url) {
    return {
      url,
      status: 200,
      protocol: 'https:',
      host: new URL(url).host,
      techStack: ['Next.js / React', 'Tailwind CSS', 'Vercel Edge Platform', 'Cloudflare CDN & Edge'],
      security: {
        hsts: true,
        csp: true,
        xFrameOptions: true,
        xContentTypeOptions: true,
        corsWildcard: false
      },
      meta: {
        title: 'Universal System Intelligence Platform',
        description: 'Analyzed using Urlmind & SlashGraph autonomous intelligence engine.'
      },
      endpoints: [
        '/api/auth/session',
        '/api/stats',
        '/api/v1/metrics',
        '/api/health'
      ],
      simulated: true
    };
  }
}
