import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { faker } from "@faker-js/faker";

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Test data factories using faker
export const createMockExpense = (overrides = {}) => ({
  id: faker.string.uuid(),
  amount: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
  name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  date: faker.date.recent().toISOString().split("T")[0], // YYYY-MM-DD format
  created_at: faker.date.past().toISOString(),
  user_id: faker.string.uuid(),
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  created_at: faker.date.past().toISOString(),
  ...overrides,
});

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
