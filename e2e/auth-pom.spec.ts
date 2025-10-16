import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects";

test.describe("Authentication with Page Object Model", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("should login with valid credentials", async ({ page }) => {
    await loginPage.loginWithTestCredentials();

    // Check if redirected to dashboard
    await expect(page).toHaveURL("/dashboard");
  });

  test("should show error for invalid credentials", async () => {
    await loginPage.login("invalid@example.com", "wrongpassword");

    await expect(loginPage.errorMessage).toBeVisible();
  });

  test("should navigate to sign up page", async ({ page }) => {
    await loginPage.goToSignUp();

    await expect(page).toHaveURL("/register");
  });

  test("should navigate to forgot password page", async ({ page }) => {
    await loginPage.goToForgotPassword();

    await expect(page).toHaveURL("/password-reset");
  });
});
