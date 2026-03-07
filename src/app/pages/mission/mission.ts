import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-mission',
  template: `
    <h1>Mission</h1>
    <p>Chapter: {{ chapterId() }}</p>
  `,
})
export class MissionPage {
  private readonly route = inject(ActivatedRoute);

  readonly chapterId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('chapterId') ?? '')),
    { initialValue: '' },
  );
}
