declare module 'hapi-rate-limit' {
    import { Plugin, Request, ResponseToolkit } from '@hapi/hapi';
  
    export interface RateLimitResponseOptions {
      limit: number;
      remaining: number;
      reset: number;
      exceeded: boolean;
    }
  
    export interface Options {
      enabled?: boolean;
      userLimit?: number;
      userCache?: {
        expiresIn: number;
        segment?: string;
      };
      pathLimit?: number;
      pathCache?: {
        expiresIn: number;
        segment?: string;
      };
      headers?: boolean;
      ipWhitelist?: string[];
      trustProxy?: boolean;
      enableRateLimitHeaders?: boolean;
      userAttribute?: string;
      limitExceededResponse?: (
        request: Request, 
        h: ResponseToolkit, 
        responseOptions: RateLimitResponseOptions
      ) => any;
    }
  
    const hapiRateLimit: Plugin<Options>;
    export default hapiRateLimit;
  }