import { test, expect } from '@playwright/test';

test.describe('Devoluções e Trocas Flow', () => {
  test('deve ser possível visualizar a lista de devoluções', async ({ page }) => {
    // 1. Fazer o mock do login ou injetar o cookie
    // Para simplificar, o teste tentará acessar a página, que redireciona pro login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'gerente@flavio.com');
    await page.fill('input[type="password"]', 'flavio123');
    await page.click('button[type="submit"]');

    // 2. Aguardar navegação para o dashboard
    await expect(page).toHaveURL('/dashboard');

    // 3. Navegar para a página de devoluções
    await page.click('text=Devoluções e Trocas');
    await expect(page).toHaveURL('/devolucoes');

    // 4. Verificar se a página carregou o título corretamente
    await expect(page.locator('h1')).toContainText('Devoluções e Trocas');
  });
});
