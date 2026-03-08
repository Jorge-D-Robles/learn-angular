import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-endless-mode',
  template: `
    <h1>Endless Mode</h1>
    <p>Game: {{ gameId() }}</p>
  `,
})
export class EndlessModePage {
  private readonly route = inject(ActivatedRoute);

  readonly gameId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('gameId') ?? '')),
    { initialValue: '' },
  );
}
