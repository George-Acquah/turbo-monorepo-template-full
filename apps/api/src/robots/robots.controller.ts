import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { SkipHttpResponseEnvelope, SkipRateLimit } from '@workspace/decorators';

// A pure API domain has nothing worth crawling/indexing — block it outright
// rather than leaving search engines to infer that from a bare 404.
const ROBOTS_TXT = 'User-agent: *\nDisallow: /\n';

@Controller()
export class RobotsController {
  @Get('robots.txt')
  @SkipRateLimit()
  @SkipHttpResponseEnvelope()
  @ApiExcludeEndpoint()
  @Header('Content-Type', 'text/plain; charset=utf-8')
  getRobots(): string {
    return ROBOTS_TXT;
  }
}
