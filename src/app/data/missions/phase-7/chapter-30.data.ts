import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_30_CONTENT: StoryMissionContent = {
  chapterId: 30,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Everything you\'ve built so far runs locally in the browser. No server communication, no API ' +
        'calls, no real data. HttpClient changes that — it\'s how Angular talks to the outside world. ' +
        'Fetch data from a REST API, submit a form, upload a file. Without HttpClient, your app is an ' +
        'island. With it, you can connect to any backend.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Inject HttpClient and make a GET request to fetch data from an API. The response comes back ' +
        'as an Observable — you subscribe to receive the data when it arrives.',
      code: [
        "import { Component, inject } from '@angular/core';",
        "import { HttpClient } from '@angular/common/http';",
        '',
        'interface MissionDirective {',
        '  id: number;',
        '  title: string;',
        '  priority: string;',
        '}',
        '',
        '@Component({',
        "  selector: 'app-mission-comms',",
        '  template: `',
        '    <ul>',
        '      @for (directive of directives; track directive.id) {',
        '        <li>{{ directive.title }} ({{ directive.priority }})</li>',
        '      }',
        '    </ul>',
        '  `,',
        '})',
        'export class MissionCommsComponent {',
        '  private httpClient = inject(HttpClient);',
        '  directives: MissionDirective[] = [];',
        '',
        '  constructor() {',
        '    this.httpClient',
        "      .get<MissionDirective[]>('/api/directives')",
        '      .subscribe(data => {',
        '        this.directives = data;',
        '      });',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [2, 21, 26],
      explanation:
        'inject(HttpClient) gives you the HTTP client. .get<T>() fires a GET request and returns an ' +
        'Observable that emits the response body parsed as JSON. The generic type parameter is how ' +
        'you get type safety — TypeScript knows directives is MissionDirective[], not unknown. ' +
        'Nothing happens until you subscribe; that\'s when the actual HTTP request goes out.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'GET fetches data. POST sends it. The second argument to .post() is your request body, and ' +
        'Angular handles JSON serialization automatically.',
      code: [
        "import { Component, inject } from '@angular/core';",
        "import { HttpClient } from '@angular/common/http';",
        '',
        'interface SensorReport {',
        '  sensorId: string;',
        '  readings: number[];',
        '  timestamp: number;',
        '}',
        '',
        '@Component({',
        "  selector: 'app-sensor-uplink',",
        '  template: `<button (click)="transmit()">Transmit Report</button>`,',
        '})',
        'export class SensorUplinkComponent {',
        '  private httpClient = inject(HttpClient);',
        '',
        '  transmit() {',
        '    const report: SensorReport = {',
        "      sensorId: 'thermal-01',",
        '      readings: [294.1, 294.3, 293.8],',
        '      timestamp: Date.now(),',
        '    };',
        '',
        '    this.httpClient',
        "      .post<{ status: string }>('/api/reports', report)",
        '      .subscribe(response => {',
        "        console.log('Transmission:', response.status);",
        '      });',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [2, 15, 25],
      explanation:
        '.post<T>(url, body) sends the body as JSON — Angular sets the Content-Type header for you. ' +
        'The generic type defines what the server sends back, so your subscribe callback is fully typed. ' +
        'Like .get(), the request is lazy: nothing goes over the wire until you subscribe. This is a ' +
        'core RxJS concept — observables are cold by default.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Your app can now talk to servers. This is a fundamental turning point — static data gives way ' +
        'to real APIs, real persistence, real collaboration between client and server.',
      conceptTitle: 'HttpClient — Connecting Angular to the Outside World',
      conceptBody:
        'HttpClient gives you typed methods for every HTTP verb: .get<T>(), .post<T>(), .put<T>(), ' +
        '.delete<T>(). Each returns an Observable that emits the response body. Requests are lazy — ' +
        'they don\'t fire until subscribed. You enable HttpClient by adding provideHttpClient() to your ' +
        'application\'s providers array. From there, inject it wherever you need server communication.',
      keyPoints: [
        'HttpClient methods return typed Observables — you get compile-time safety on response data',
        'Requests are lazy (cold observables) — subscribing triggers the actual HTTP call',
        'POST, PUT, and DELETE bodies are auto-serialized as JSON with the right Content-Type',
        'Add provideHttpClient() to your app config to enable it — one line of setup',
      ],
    },
  ],
  completionCriteria: {
    description: 'Mission Control comms online!',
    minStepsViewed: 4,
  },
};
