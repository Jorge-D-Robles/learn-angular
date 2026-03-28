import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_31_CONTENT: StoryMissionContent = {
  chapterId: 31,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Chapter 30 showed you how to make HTTP requests. But think about what every request needs: ' +
        'an auth token. And every response might be a 401 or a 500. And maybe failed requests should ' +
        'retry automatically. Are you going to copy-paste that logic into every single service method? ' +
        'Interceptors solve this. They sit in the HTTP pipeline like airport security checkpoints — ' +
        'every request passes through them, and each one can inspect, modify, or reject what it sees.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Here is the simplest useful interceptor: one that attaches an auth token to every outgoing ' +
        'request. Instead of manually adding headers in every HTTP call, you write this once and ' +
        'forget about it.',
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
        'A functional interceptor is just a function — it receives the request and a next handler. ' +
        'You clone the request (never mutate the original), add your headers, and pass the clone along. ' +
        'Why functional instead of class-based? Because a function is simpler. The old class-based ' +
        'interceptors required implementing an interface and registering providers — more ceremony ' +
        'for the same result. Register interceptors with withInterceptors() inside provideHttpClient(), ' +
        'and they run in the order you list them.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Interceptors are not just for headers. The logging interceptor below stamps every request ' +
        'with a timestamp (like stamping a boarding pass). The retry interceptor automatically ' +
        'resends failed requests — no try/catch in your service code.',
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
        'Since interceptors return observables, you can transform responses with any RxJS operator. ' +
        'The logging interceptor uses tap() to record timing without touching the response data. ' +
        'The retry interceptor uses retry() to automatically resend up to twice with a 1-second delay. ' +
        'Order matters: auth runs first (outermost), then logging, then retry (innermost). ' +
        'For responses, the order reverses — retry handles errors first, then logging records the timing.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'You now have a complete HTTP pipeline — auth, logging, and retry — without touching a single ' +
        'service method. That is the power of interceptors: cross-cutting concerns, handled once.',
      conceptTitle: 'Interceptors: Write It Once, Apply It Everywhere',
      conceptBody:
        'Interceptors are middleware for Angular HTTP. Each one is a function that receives a request ' +
        'and a next handler, and returns an observable of the response. Clone requests to add headers ' +
        'or params. Use RxJS operators on the response stream to log, retry, cache, or transform. ' +
        'Register them in order with provideHttpClient(withInterceptors([...])), and every HTTP call ' +
        'in your app passes through the chain automatically.',
      keyPoints: [
        'Interceptors eliminate copy-paste — auth tokens, error handling, and retries get written once and apply to all HTTP calls',
        'Always clone the request rather than mutating it, because other interceptors and the runtime may still reference the original',
        'Array order determines execution: first interceptor runs first on requests, last on responses',
        'Functional interceptors replaced class-based ones — same power, less boilerplate',
      ],
    },
  ],
  completionCriteria: {
    description: 'Comm protocols active!',
    minStepsViewed: 4,
  },
};
