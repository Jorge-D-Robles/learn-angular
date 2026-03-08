import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-speed-run',
  template: `
    <h1>Speed Run</h1>
    <p>Game: {{ gameId() }}</p>
  `,
})
export class SpeedRunPage {
  private readonly route = inject(ActivatedRoute);

  readonly gameId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('gameId') ?? '')),
    { initialValue: '' },
  );
}
