import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_10_CONTENT: StoryMissionContent = {
  chapterId: 10,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'The Star Chart module loads, but the images are massive — nebula photographs, constellation maps, ' +
        'galaxy surveys. They cause layout shifts, slow page loads, and waste bandwidth on images the crew ' +
        'has not scrolled to yet. Angular\'s built-in image directive optimizes all of this automatically.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Replace src with ngSrc and add width/height to enable automatic optimization. Use priority for ' +
        'above-the-fold images and fill for flexible sizing.',
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
        'NgOptimizedImage replaces the native src attribute with ngSrc. It requires width/height (prevents ' +
        'layout shift) or the fill attribute (for CSS-sized containers). The priority attribute marks images ' +
        'that should load immediately (above the fold). All other images are lazy-loaded by default.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Star charts are optimized and loading efficiently. Every image on the station now benefits from ' +
        'automatic performance optimizations.',
      conceptTitle: 'Image Optimization -- NgOptimizedImage',
      conceptBody:
        'NgOptimizedImage is Angular\'s built-in image directive that replaces the native <img src> with ' +
        'an optimized version. It enforces width/height to prevent layout shift, lazy-loads images by default, ' +
        'generates automatic srcset for responsive images, and integrates with CDN image loaders.',
      keyPoints: [
        'Use ngSrc instead of src — requires width/height or fill attribute',
        'priority marks above-the-fold images for immediate loading; all others lazy-load',
        'Import NgOptimizedImage from @angular/common and add to component imports',
      ],
    },
  ],
  completionCriteria: {
    description: 'Star charts are optimized and loading fast!',
    minStepsViewed: 3,
  },
};
