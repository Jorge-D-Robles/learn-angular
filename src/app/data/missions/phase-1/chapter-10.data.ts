import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_10_CONTENT: StoryMissionContent = {
  chapterId: 10,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'This one\'s practical. Images are usually the heaviest thing on a web page, and they\'re responsible for ' +
        'most of the annoying layout shifts you see, that thing where the page jumps around as images load in. ' +
        'Angular has a built-in directive called NgOptimizedImage that handles the common gotchas: layout shifts, ' +
        'lazy loading, responsive sizing. You swap one attribute and get all of it for free.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'The change is small but the impact is big. Replace src with ngSrc, add width and height (so the browser ' +
        'reserves space before the image loads), and mark above-the-fold images with priority so they load ' +
        'immediately instead of being lazy-loaded.',
      code: [
        "import { Component } from '@angular/core';",
        "import { NgOptimizedImage } from '@angular/common';",
        '',
        '@Component({',
        "  selector: 'app-star-chart',",
        '  imports: [NgOptimizedImage],',
        '  template: `',
        '    <!-- Optimized with explicit dimensions -->',
        '    <img ngSrc="star-chart.png" width="800" height="600" priority />',
        '',
        '    <!-- Fill mode for flexible containers -->',
        '    <div class="chart-container" style="position: relative;">',
        '      <img ngSrc="nebula.png" fill />',
        '    </div>',
        '  `,',
        '})',
        'export class StarChartComponent {}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [2, 6, 9, 13],
      explanation:
        'Two ways to size an image: explicit width/height (the browser reserves that exact space, so nothing ' +
        'jumps when the image loads), or fill (the image stretches to fit its CSS-positioned container). ' +
        'The priority attribute tells Angular "this image is visible immediately, don\'t lazy-load it." ' +
        'Everything without priority gets lazy-loaded automatically, which means images below the fold ' +
        'don\'t waste bandwidth until the user scrolls to them.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Star chart images are optimized. Every image on the station benefits from automatic lazy loading, ' +
        'layout shift prevention, and responsive sizing, all from changing one attribute.',
      conceptTitle: 'Image Optimization with NgOptimizedImage',
      conceptBody:
        'NgOptimizedImage is doing several things behind the scenes: it enforces dimensions to prevent layout ' +
        'shift, lazy-loads offscreen images by default, generates srcset attributes for responsive sizing, ' +
        'and warns you in development if something is misconfigured. It also integrates with CDN image loaders ' +
        'if you use one.',
      keyPoints: [
        'ngSrc replaces src. Angular will warn you in dev mode if you forget width/height or use src by accident on an optimized image',
        'Images are lazy-loaded by default; add priority only to images the user sees immediately (hero banners, above-the-fold content)',
        'Import NgOptimizedImage from @angular/common and add it to your component\'s imports array, since it\'s not available globally',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'The star chart images are causing layout shifts and loading all at once, even the ones below the fold. ' +
        'Convert them to use NgOptimizedImage: swap src for ngSrc, add dimensions, and mark the hero image ' +
        'for immediate loading.',
      starterCode: [
        '<!-- NgOptimizedImage is already imported in the component -->',
        '',
        '<!-- TODO: Convert this image to use the optimized directive with dimensions -->',
        '<img src="star-chart.png" alt="Star Chart" />',
        '',
        '<!-- TODO: Mark this hero image for immediate loading with dimensions -->',
        '<img src="nebula-hero.png" alt="Nebula" />',
      ].join('\n'),
      language: 'html',
      validationRules: [
        {
          type: 'contains',
          value: 'ngSrc',
          errorMessage: "Replace src with ngSrc to enable Angular's image optimization",
        },
        {
          type: 'pattern',
          pattern: 'width=',
          errorMessage: 'Add a width attribute to prevent layout shift',
        },
        {
          type: 'pattern',
          pattern: 'height=',
          errorMessage: 'Add a height attribute to prevent layout shift',
        },
        {
          type: 'contains',
          value: 'priority',
          errorMessage: 'Add the priority attribute to above-the-fold images for immediate loading',
        },
        {
          type: 'notContains',
          value: 'src="star-chart',
          errorMessage: 'Replace the plain src attribute with ngSrc on the first image',
        },
      ],
      hints: [
        'Change src="star-chart.png" to ngSrc="star-chart.png" and add width="800" height="600" (or whatever dimensions make sense)',
        'The hero image needs the priority attribute (just the word, no value): <img ngSrc="nebula-hero.png" width="..." height="..." priority />',
      ],
      successMessage:
        'Images are optimized. No more layout shifts, and offscreen images lazy-load automatically. ' +
        'That wraps up Phase 1. You\'ve got components, templates, control flow, events, inputs, outputs, ' +
        'deferred loading, and image optimization. Phase 2 digs into how Angular apps are structured at scale.',
      explanation:
        'NgOptimizedImage gives you lazy loading, layout shift prevention, and responsive image generation ' +
        'by swapping src for ngSrc. Add width/height so the browser reserves space. Add priority to hero images ' +
        'so they load immediately. Everything else lazy-loads by default.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Star charts are optimized and loading fast!',
    minStepsViewed: 4,
  },
};
