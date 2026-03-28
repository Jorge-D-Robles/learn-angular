import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

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
    {
      stepType: 'code-challenge',
      prompt:
        'Star chart images are causing layout shifts and slow page loads. Convert the image tags to use ' +
        "Angular's optimized image directive with proper dimensions and priority.",
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
        'Replace src with ngSrc on the img tag and add width and height attributes',
        'Add the priority attribute (no value needed) to images that should load immediately',
      ],
      successMessage:
        'Star charts are optimized! Images load efficiently with proper dimensions and priority.',
      explanation:
        'NgOptimizedImage replaces src with ngSrc, enforces width/height to prevent layout shift, and ' +
        'lazy-loads images by default. The priority attribute marks above-the-fold images for immediate loading.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Star charts are optimized and loading fast!',
    minStepsViewed: 4,
  },
};
