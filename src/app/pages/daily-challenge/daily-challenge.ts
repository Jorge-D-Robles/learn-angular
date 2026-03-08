import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-daily-challenge',
  template: `
    <h1>Daily Challenge</h1>
    <p>Game: {{ gameId() }}</p>
  `,
})
export class DailyChallengePage {
  private readonly route = inject(ActivatedRoute);

  readonly gameId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('gameId') ?? '')),
    { initialValue: '' },
  );
}
