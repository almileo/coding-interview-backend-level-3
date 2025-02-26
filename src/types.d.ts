declare module 'hapi-rate-limit' {
    import { Plugin, ServerRegisterOptions } from '@hapi/hapi';
  
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
      limitExceededResponse?: (request: any, h: any, responseOptions: any) => any;
    }
  
    // Define it as a proper Hapi plugin
    interface HapiRateLimitPlugin extends Plugin<Options> {
      name: string;
      version?: string;
      multiple?: boolean;
    }
  
    const hapiRateLimit: HapiRateLimitPlugin;
    export default hapiRateLimit;
  }