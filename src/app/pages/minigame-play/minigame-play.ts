import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-minigame-play',
  template: `
    <h1>Minigame Play</h1>
    <p>Game: {{ gameId() }}</p>
    <p>Level: {{ levelId() }}</p>
  `,
})
export class MinigamePlayPage {
  private readonly route = inject(ActivatedRoute);

  readonly gameId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('gameId') ?? '')),
    { initialValue: '' },
  );

  readonly levelId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('levelId') ?? '')),
    { initialValue: '' },
  );
}
