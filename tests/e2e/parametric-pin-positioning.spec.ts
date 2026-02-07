import { test, expect, Page, Locator } from '@playwright/test';

// Component definitions
const COMPONENTS = [
  { type: 'Switch', icon: '⚡', needsDialog: false, title: 'Place Switch' },
  { type: 'AND Gate', icon: '&', needsDialog: true, title: 'Place AND Gate' },
  { type: 'OR Gate', icon: '≥1', needsDialog: true, title: 'Place OR Gate' },
  { type: 'NAND Gate', icon: '⊼', needsDialog: true, title: 'Place NAND Gate' },
  { type: 'NOR Gate', icon: '⊽', needsDialog: true, title: 'Place NOR Gate' },
  { type: 'XOR Gate', icon: '⊕', needsDialog: true, title: 'Place XOR Gate' },
  { type: 'XNOR Gate', icon: '⊙', needsDialog: true, title: 'Place XNOR Gate' },
  { type: 'Buffer', icon: '▷', needsDialog: false, title: 'Place Buffer' },
  { type: 'Inverter', icon: '▷○', needsDialog: false, title: 'Place Inverter' },
  { type: 'Light', icon: '💡', needsDialog: false, title: 'Place Light' },
];

// Helper functions
const getComponent = (type: string) => COMPONENTS.find(c => c.type === type);

const getComponentButton = (page: Page, type: string): Locator => {
  const component = getComponent(type);
  if (!component) throw new Error(`Component ${type} not found`);
  return page.getByRole('button', { name: new RegExp(`^${component.icon}\\s+${component.type}$`) });
};

const getWorkspace = (page: Page) => page.locator('svg').first();

const handleGateDialog = async (page: Page) => {
  const dialog = page.locator('.gate-config-dialog');
  await expect(dialog).toBeVisible({ timeout: 3000 });
  const confirmButton = page.getByRole('button', { name: /create gate/i });
  await confirmButton.click();
  await expect(dialog).not.toBeVisible();
};

const placeComponent = async (page: Page, type: string, x: number, y: number) => {
  const component = getComponent(type);
  if (!component) throw new Error(`Component ${type} not found`);
  
  const button = getComponentButton(page, type);
  await button.click();
  
  const workspace = getWorkspace(page);
  await workspace.click({ position: { x, y } });
  
  if (component.needsDialog) {
    await handleGateDialog(page);
  }
};

test.describe('Logic Circuit Simulator - Component Placement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // Test all components with unified logic
  for (const component of COMPONENTS) {
    const testName = component.needsDialog 
      ? `should place ${component.type} with configuration dialog`
      : `should place ${component.type} on the canvas`;
    
    test(testName, async ({ page }, testInfo) => {
      const button = getComponentButton(page, component.type);
      
      await expect(button).toBeVisible();
      await button.click();
      await expect(button).toHaveClass(/selected/);
      
      const workspace = getWorkspace(page);
      await expect(workspace).toBeVisible();
      await workspace.click({ position: { x: 300, y: 300 } });
      
      if (component.needsDialog) {
        await handleGateDialog(page);
      }
      
      await expect(button).not.toHaveClass(/selected/);
      
      // Attach screenshot to HTML report
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach(`${component.type} placed`, {
        body: screenshot,
        contentType: 'image/png',
      });
    });
  }

  // Palette verification tests
  for (const component of COMPONENTS) {
    test(`should display ${component.type} in palette with correct properties`, async ({ page }) => {
      const button = getComponentButton(page, component.type);
      
      await expect(button).toBeVisible();
      await expect(button).toHaveAttribute('title', component.title);
      await expect(button.locator('.palette-icon')).toContainText(component.icon);
      await expect(button.locator('.palette-label')).toContainText(component.type);
    });
  }

  // Component selection toggling tests
  const selectionPairs = [
    { from: 'Switch', to: 'AND Gate' },
    { from: 'OR Gate', to: 'NAND Gate' },
    { from: 'XOR Gate', to: 'Light' },
    { from: 'Buffer', to: 'Inverter' },
  ];

  for (const pair of selectionPairs) {
    test(`should toggle selection from ${pair.from} to ${pair.to}`, async ({ page }) => {
      const fromButton = getComponentButton(page, pair.from);
      const toButton = getComponentButton(page, pair.to);
      
      await fromButton.click();
      await expect(fromButton).toHaveClass(/selected/);
      
      await toButton.click();
      await expect(fromButton).not.toHaveClass(/selected/);
      await expect(toButton).toHaveClass(/selected/);
    });
  }

  // Circuit building scenario tests
  const circuitScenarios = [
    {
      name: 'simple AND circuit',
      components: [
        { type: 'Switch', x: 100, y: 200 },
        { type: 'Switch', x: 100, y: 300 },
        { type: 'AND Gate', x: 300, y: 250 },
        { type: 'Light', x: 500, y: 250 },
      ],
    },
    {
      name: 'OR gate with inputs',
      components: [
        { type: 'Switch', x: 100, y: 200 },
        { type: 'Switch', x: 100, y: 300 },
        { type: 'OR Gate', x: 300, y: 250 },
        { type: 'Light', x: 500, y: 250 },
      ],
    },
    {
      name: 'inverter chain',
      components: [
        { type: 'Switch', x: 100, y: 250 },
        { type: 'Inverter', x: 250, y: 250 },
        { type: 'Inverter', x: 400, y: 250 },
        { type: 'Light', x: 550, y: 250 },
      ],
    },
  ];

  for (const scenario of circuitScenarios) {
    test(`should build ${scenario.name}`, async ({ page }, testInfo) => {
      const workspace = getWorkspace(page);
      await expect(workspace).toBeVisible();
      
      for (const comp of scenario.components) {
        await placeComponent(page, comp.type, comp.x, comp.y);
      }
      
      // Verify all components were deselected after placement
      const selectedButtons = page.locator('button.palette-item.selected');
      await expect(selectedButtons).toHaveCount(0);
      
      // Attach screenshot to HTML report
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach(`${scenario.name}`, {
        body: screenshot,
        contentType: 'image/png',
      });
    });
  }

  // General UI tests
  test('should display app header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('LogicLy');
    await expect(page.locator('h1')).toContainText('Digital Logic Circuit Simulator');
  });

  test('should display palette instructions', async ({ page }) => {
    const instructions = page.locator('.palette-instructions');
    await expect(instructions).toBeVisible();
    await expect(instructions).toContainText('Click a component');
  });

  test('should have correct number of palette items', async ({ page }) => {
    const paletteButtons = page.locator('button.palette-item');
    await expect(paletteButtons).toHaveCount(COMPONENTS.length);
  });
});
