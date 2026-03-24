import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_30_CONTENT: StoryMissionContent = {
  chapterId: 30,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Nexus Station has been operating in isolation, but deep space operations require communication ' +
        'with Mission Control back on Earth. Data must be sent and received over HTTP — crew manifests ' +
        'uploaded, sensor logs transmitted, and mission directives downloaded. Angular\'s HttpClient ' +
        'provides a typed, observable-based API for making HTTP requests from the browser.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Inject HttpClient and make a GET request to fetch mission directives from the API. ' +
        'The response is an Observable that emits the parsed JSON body.',
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
        'HttpClient is injected using inject(). The .get<T>() method makes a GET request and returns ' +
        'an Observable<T> that emits the response body parsed as JSON. The generic type parameter ' +
        'provides compile-time type safety. Subscribe to the observable to receive the data when the ' +
        'response arrives.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Use HttpClient.post() to send data to Mission Control. The second argument is the request body, ' +
        'automatically serialized as JSON.',
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
        '.post<T>(url, body) sends a POST request with the body serialized as JSON. Angular ' +
        'automatically sets the Content-Type header to application/json. The generic type parameter ' +
        'defines the expected response type. Like all HttpClient methods, the request is not sent ' +
        'until the observable is subscribed to.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Mission Control comms are online. Here is how HttpClient handles HTTP communication.',
      conceptTitle: 'HTTP Client — GET, POST, and Observable Responses',
      conceptBody:
        'Angular\'s HttpClient provides typed methods for HTTP requests: .get<T>(), .post<T>(), ' +
        '.put<T>(), .delete<T>(). Each returns an Observable that emits the response body. Requests ' +
        'are not sent until subscribed. Generic type parameters provide compile-time type safety for ' +
        'response data. Enable HttpClient by adding provideHttpClient() to your app config.',
      keyPoints: [
        'HttpClient.get<T>() and .post<T>() return Observable<T> with typed responses',
        'Requests are cold — they execute only when subscribed',
        'The request body is automatically serialized as JSON',
        'Enable with provideHttpClient() in the application providers',
      ],
    },
  ],
  completionCriteria: {
    description: 'Mission Control comms online!',
    minStepsViewed: 4,
  },
};
