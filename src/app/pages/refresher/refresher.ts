import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-refresher-challenge',
  template: `
    <h1>Refresher Challenge</h1>
    <p>Topic: {{ topicId() }}</p>
  `,
})
export class RefresherChallengePage {
  private readonly route = inject(ActivatedRoute);

  readonly topicId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('topicId') ?? '')),
    { initialValue: '' },
  );
}
