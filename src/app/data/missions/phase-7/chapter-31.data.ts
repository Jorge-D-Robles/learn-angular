import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_31_CONTENT: StoryMissionContent = {
  chapterId: 31,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Raw HTTP traffic between Nexus Station and Mission Control needs protocol layers — ' +
        'authentication tokens must be attached to every outgoing request, responses need error ' +
        'handling, and failed transmissions should retry automatically. Angular interceptors sit in ' +
        'the HTTP pipeline and process requests and responses without modifying individual service calls.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Create a functional interceptor that adds an authorization header to every outgoing request.',
      code: [
        "import { HttpInterceptorFn } from '@angular/common/http';",
        '',
        'export const authInterceptor: HttpInterceptorFn = (req, next) => {',
        "  const token = 'nexus-auth-token-42';",
        '  const authReq = req.clone({',
        '    setHeaders: {',
        '      Authorization: `Bearer ${token}`,',
        '    },',
        '  });',
        '  return next(authReq);',
        '};',
        '',
        '// Register in app.config.ts:',
        '// provideHttpClient(withInterceptors([authInterceptor]))',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 3, 5, 10, 14],
      explanation:
        'A functional interceptor is a function matching HttpInterceptorFn. It receives the request ' +
        'and a next handler. Clone the request with modifications (headers, params, etc.) and pass ' +
        'the clone to next(). Register interceptors with withInterceptors() inside provideHttpClient(). ' +
        'Interceptors run in the order they appear in the array.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Create a logging interceptor that records request timing and a retry interceptor that ' +
        'automatically retransmits failed requests.',
      code: [
        "import { HttpInterceptorFn } from '@angular/common/http';",
        "import { tap, retry } from 'rxjs';",
        '',
        'export const loggingInterceptor: HttpInterceptorFn = (req, next) => {',
        '  const started = Date.now();',
        '  return next(req).pipe(',
        '    tap(() => {',
        '      const elapsed = Date.now() - started;',
        '      console.log(`${req.method} ${req.url} - ${elapsed}ms`);',
        '    }),',
        '  );',
        '};',
        '',
        'export const retryInterceptor: HttpInterceptorFn = (req, next) => {',
        '  return next(req).pipe(',
        '    retry({ count: 2, delay: 1000 }),',
        '  );',
        '};',
        '',
        '// Register order matters:',
        '// withInterceptors([authInterceptor, loggingInterceptor, retryInterceptor])',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 4, 6, 14, 15, 16],
      explanation:
        'Interceptors can transform the response observable using RxJS operators. The logging interceptor ' +
        'uses tap() to record timing without modifying the response. The retry interceptor uses retry() ' +
        'to automatically resend failed requests. Interceptor order matters — auth runs first (outermost), ' +
        'then logging, then retry (innermost).',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Comm protocols are active. Here is how interceptors process the HTTP pipeline.',
      conceptTitle: 'Interceptors — Middleware for HTTP Requests',
      conceptBody:
        'Angular functional interceptors (HttpInterceptorFn) sit in the HTTP pipeline, processing ' +
        'every request and response. Clone requests to add headers or modify params. Transform ' +
        'responses with RxJS operators. Register with provideHttpClient(withInterceptors([...])). ' +
        'Interceptors run in array order for requests and reverse order for responses.',
      keyPoints: [
        'HttpInterceptorFn receives (req, next) and returns an Observable',
        'Clone the request with req.clone() to add headers, params, or body changes',
        'Use RxJS operators (tap, retry, catchError) to transform responses',
        'withInterceptors([...]) registers interceptors in order — first in array runs first on requests',
      ],
    },
  ],
  completionCriteria: {
    description: 'Comm protocols active!',
    minStepsViewed: 4,
  },
};
