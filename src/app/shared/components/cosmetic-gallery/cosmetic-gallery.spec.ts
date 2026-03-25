import { createComponent, getMockProvider } from '../../../../testing/test-utils';
import type { CosmeticItem } from '../../../core/progression/cosmetic.service';
import { CosmeticService } from '../../../core/progression/cosmetic.service';
import type { CosmeticType } from '../../../data/cosmetics.data';
import { CosmeticGalleryComponent } from './cosmetic-gallery';

function makeCosmeticItem(overrides: Partial<CosmeticItem> = {}): CosmeticItem {
  return {
    id: 'skin-ensign-plating',
    name: 'Ensign Plating',
    type: 'skin',
    unlockCondition: 'Reach rank: Ensign',
    isUnlocked: true,
    ...overrides,
  };
}

const TEST_COSMETICS: CosmeticItem[] = [
  // Skins (2 items: 1 unlocked, 1 locked)
  makeCosmeticItem({ id: 'skin-ensign-plating', name: 'Ensign Plating', type: 'skin', isUnlocked: true, unlockCondition: 'Reach rank: Ensign' }),
  makeCosmeticItem({ id: 'skin-commander-hull', name: 'Commander Hull', type: 'skin', isUnlocked: false, unlockCondition: 'Reach rank: Commander' }),
  // Themes (2 items: both unlocked)
  makeCosmeticItem({ id: 'theme-dark', name: 'Deep Space', type: 'theme', isUnlocked: true, unlockCondition: 'none' }),
  makeCosmeticItem({ id: 'theme-station', name: 'Station Standard', type: 'theme', isUnlocked: true, unlockCondition: 'none' }),
  // Badges (1 item: locked)
  makeCosmeticItem({ id: 'badge-first-steps', name: 'Pioneer', type: 'badge', isUnlocked: false, unlockCondition: 'Earn achievement: first-steps' }),
];

describe('CosmeticGalleryComponent', () => {
  function createMockService(
    cosmetics: CosmeticItem[] = TEST_COSMETICS,
    equippedMap: Partial<Record<CosmeticType, CosmeticItem | null>> = {},
  ) {
    return getMockProvider(CosmeticService, {
      getAllCosmetics: vi.fn().mockReturnValue(cosmetics),
      getEquipped: vi.fn().mockImplementation((type: CosmeticType) => equippedMap[type] ?? null),
      equipCosmetic: vi.fn().mockReturnValue(true),
    });
  }

  async function setup(
    cosmetics: CosmeticItem[] = TEST_COSMETICS,
    equippedMap: Partial<Record<CosmeticType, CosmeticItem | null>> = {},
  ) {
    const mockProvider = createMockService(cosmetics, equippedMap);
    const { fixture, component, element } = await createComponent(
      CosmeticGalleryComponent,
      { providers: [mockProvider] },
    );
    const service = fixture.debugElement.injector.get(CosmeticService);
    return { fixture, component, element, service };
  }

  function getItems(element: HTMLElement): HTMLElement[] {
    return Array.from(element.querySelectorAll('.cosmetic-gallery__item'));
  }

  function getSections(element: HTMLElement): HTMLElement[] {
    return Array.from(element.querySelectorAll('.cosmetic-gallery__section'));
  }

  function getSectionHeadings(element: HTMLElement): string[] {
    return Array.from(element.querySelectorAll('.cosmetic-gallery__section h3'))
      .map((el) => el.textContent?.trim() ?? '');
  }

  // 1. Creation
  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  // 2. Renders all cosmetic items
  it('should render all cosmetic items', async () => {
    const { element } = await setup();
    const items = getItems(element);
    expect(items.length).toBe(TEST_COSMETICS.length);
  });

  // 3. Groups items by type
  it('should group items into 3 sections with correct headings', async () => {
    const { element } = await setup();
    const sections = getSections(element);
    expect(sections.length).toBe(3);
    const headings = getSectionHeadings(element);
    expect(headings).toEqual(['Station Skins', 'Themes', 'Badges']);
  });

  // 4. Renders correct count per section
  it('should render correct number of items per section', async () => {
    const { element } = await setup();
    const sections = getSections(element);
    // skins: 2, themes: 2, badges: 1
    const skinItems = sections[0].querySelectorAll('.cosmetic-gallery__item');
    const themeItems = sections[1].querySelectorAll('.cosmetic-gallery__item');
    const badgeItems = sections[2].querySelectorAll('.cosmetic-gallery__item');
    expect(skinItems.length).toBe(2);
    expect(themeItems.length).toBe(2);
    expect(badgeItems.length).toBe(1);
  });

  // 5. Shows "Equip" button for unlocked, non-equipped items
  it('should show "Equip" button for unlocked non-equipped items', async () => {
    const { element } = await setup();
    // skin-ensign-plating is unlocked and not equipped (no equippedMap entry)
    const items = getItems(element);
    const skinItem = items[0]; // first skin
    const equipBtn = skinItem.querySelector('button');
    expect(equipBtn).toBeTruthy();
    expect(equipBtn!.textContent?.trim()).toBe('Equip');
  });

  // 6. Shows "Equipped" indicator for equipped items
  it('should show "Equipped" indicator for the currently equipped item', async () => {
    const equippedTheme = TEST_COSMETICS.find((c) => c.id === 'theme-dark')!;
    const { element } = await setup(TEST_COSMETICS, { theme: equippedTheme });
    // Find the Deep Space theme item
    const sections = getSections(element);
    const themeSection = sections[1];
    const themeItems = Array.from(themeSection.querySelectorAll('.cosmetic-gallery__item'));
    const equippedItem = themeItems[0]; // theme-dark is first theme
    const equippedText = equippedItem.querySelector('.cosmetic-gallery__equipped');
    expect(equippedText).toBeTruthy();
    expect(equippedText!.textContent?.trim()).toContain('Equipped');
    // Should NOT have an Equip button
    const equipBtn = equippedItem.querySelector('button');
    expect(equipBtn).toBeNull();
  });

  // 7. Calls equipCosmetic on Equip click
  it('should call equipCosmetic when Equip button is clicked', async () => {
    const { element, service } = await setup();
    const items = getItems(element);
    const skinItem = items[0]; // skin-ensign-plating, unlocked
    const equipBtn = skinItem.querySelector('button') as HTMLButtonElement;
    equipBtn.click();
    expect(service.equipCosmetic).toHaveBeenCalledWith('skin-ensign-plating');
  });

  // 8. Shows unlock condition for locked items
  it('should show unlock condition text for locked items', async () => {
    const { element } = await setup();
    const items = getItems(element);
    // skin-commander-hull is locked (index 1)
    const lockedItem = items[1];
    const lockText = lockedItem.querySelector('.cosmetic-gallery__lock-condition');
    expect(lockText).toBeTruthy();
    expect(lockText!.textContent?.trim()).toContain('Reach rank: Commander');
  });

  // 9. Does not show Equip button for locked items
  it('should not show Equip button for locked items', async () => {
    const { element } = await setup();
    const items = getItems(element);
    const lockedItem = items[1]; // skin-commander-hull, locked
    const equipBtn = lockedItem.querySelector('button');
    expect(equipBtn).toBeNull();
  });

  // 10. Accessibility: host has aria-label
  it('should have aria-label on host element', async () => {
    const { element } = await setup();
    expect(element.getAttribute('aria-label')).toBe('Cosmetic gallery');
  });

  // 11. Accessibility: section headings exist
  it('should have an h3 heading in each section', async () => {
    const { element } = await setup();
    const sections = getSections(element);
    for (const section of sections) {
      const heading = section.querySelector('h3');
      expect(heading).toBeTruthy();
    }
  });

  // 12. Accessibility: equip buttons have aria-label
  it('should have descriptive aria-labels on equip buttons', async () => {
    const { element } = await setup();
    const items = getItems(element);
    const skinItem = items[0]; // Ensign Plating, unlocked
    const equipBtn = skinItem.querySelector('button');
    expect(equipBtn!.getAttribute('aria-label')).toBe('Equip Ensign Plating');
  });

  // 13. Empty section not rendered
  it('should not render a section for a type with no items', async () => {
    // Only skins and themes, no badges
    const noBadges = TEST_COSMETICS.filter((c) => c.type !== 'badge');
    const { element } = await setup(noBadges);
    const sections = getSections(element);
    expect(sections.length).toBe(2);
    const headings = getSectionHeadings(element);
    expect(headings).toEqual(['Station Skins', 'Themes']);
  });
});
