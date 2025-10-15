# Plan Testów Aplikacji Cashbuddy

## 1. Przegląd projektu

**Cashbuddy** to aplikacja internetowa do zarządzania finansami osobistymi. Umożliwia użytkownikom rejestrację, logowanie oraz śledzenie swoich wydatków. Główne funkcjonalności obejmują:

*   **Zarządzanie użytkownikami:** Rejestracja, logowanie, wylogowywanie, resetowanie i aktualizacja hasła.
*   **Zarządzanie wydatkami (CRUD):** Tworzenie, odczytywanie, aktualizowanie i usuwanie wpisów o wydatkach.
*   **Dashboard analityczny:** Wizualizacja danych finansowych w postaci statystyk (np. suma wydatków) oraz wykresów (np. wydatki w skali miesiąca).
*   **Filtrowanie i paginacja:** Możliwość filtrowania wydatków i dzielenia wyników na strony w celu łatwiejszej nawigacji.

Aplikacja zbudowana jest w oparciu o Astro z interaktywnymi komponentami w React. Backend opiera się na Supabase (BaaS), który dostarcza bazę danych PostgreSQL oraz usługi autentykacji.

## 2. Środowisko testowe

Środowisko testowe powinno jak najwierniej odzwierciedlać środowisko produkcyjne, aby zapewnić wiarygodność wyników.

*   **System operacyjny:** Dowolny system wspierający Node.js (Linux, macOS, Windows).
*   **Runtime:** Node.js w wersji 20.x lub nowszej.
*   **Przeglądarka:** Testy E2E będą uruchamiane na najnowszych wersjach przeglądarek Chrome, Firefox i Safari (WebKit).
*   **Baza danych:** Dedykowana, odizolowana instancja Supabase (lub lokalny kontener Docker z PostgreSQL) przeznaczona wyłącznie do celów testowych. Baza danych powinna być czyszczona i wypełniana danymi testowymi (seedowana) przed każdym cyklem testowym.
*   **Infrastruktura CI/CD:** GitHub Actions (zgodnie z dokumentacją projektu).

## 3. Zakres testów

### Co będzie testowane (In Scope):

*   **Logika biznesowa:** Wszystkie funkcje w `src/lib/**/*.service.ts`, w tym walidacja danych wejściowych.
*   **Komponenty UI (React):** Interaktywne komponenty w `src/components/`, w tym ich renderowanie, stany i interakcje użytkownika.
*   **API Endpoints:** Wszystkie punkty końcowe zdefiniowane w `src/pages/api/`, w tym obsługa metod HTTP, autoryzacja i walidacja zapytań.
*   **Pełne przepływy użytkownika (E2E):** Krytyczne ścieżki, takie jak rejestracja, logowanie, dodanie wydatku i weryfikacja jego obecności na dashboardzie.
*   **Integracja z Supabase:** Poprawność interakcji z klientem Supabase (operacje na bazie danych i autentykacja).

### Co nie będzie testowane (Out of Scope):

*   **Infrastruktura Supabase:** Nie testujemy samego Supabase – zakładamy, że działa poprawnie. Testujemy jedynie *integrację* naszej aplikacji z Supabase.
*   **Zewnętrzne biblioteki:** Nie testujemy funkcjonalności zewnętrznych bibliotek (np. `shadcn/ui`, `react-chartjs-2`), a jedynie ich poprawną implementację w naszej aplikacji.
*   **Testy wydajnościowe i obciążeniowe:** W ramach tego planu nie przewiduje się testów sprawdzających działanie aplikacji pod dużym obciążeniem.
*   **Szczegółowe testy responsywności (RWD):** Podstawowa weryfikacja w testach E2E, ale bez szczegółowych testów na dziesiątkach rozdzielczości.
*   **Testy bezpieczeństwa:** Poza podstawową weryfikacją autoryzacji, zaawansowane testy penetracyjne są poza zakresem.

## 4. Typy testów

Zastosujemy strategię piramidy testów, aby zapewnić solidne pokrycie przy optymalnym koszcie utrzymania.

1.  **Testy jednostkowe (Unit Tests):** Weryfikacja małych, izolowanych fragmentów kodu – pojedynczych funkcji lub komponentów React. Będą stanowić podstawę piramidy.
2.  **Testy integracyjne (Integration Tests):** Sprawdzanie współpracy kilku modułów, np. formularza z serwisem wysyłającym dane do API lub komponentu strony pobierającego dane z serwisu.
3.  **Testy API:** Bezpośrednie odpytywanie endpointów API w celu weryfikacji logiki backendowej, schematów odpowiedzi i obsługi błędów.
4.  **Testy End-to-End (E2E):** Symulacja rzeczywistych interakcji użytkownika z aplikacją w przeglądarce w celu weryfikacji całych przepływów funkcjonalnych.

## 5. Strategia testowania

### Testy jednostkowe

*   **Cel:** Weryfikacja poprawności logiki pojedynczych funkcji i komponentów.
*   **Narzędzia:** **Vitest** (silnik testowy), **React Testing Library** (do testowania komponentów React), **@testing-library/user-event** (realistyczna symulacja interakcji użytkownika).
*   **Podejście:**
    *   **Funkcje pomocnicze (`src/lib/utils.ts`):** Testowanie czystych funkcji z różnymi danymi wejściowymi i weryfikacja wyników.
    *   **Logika serwisów (`src/lib/*.service.ts`):** Testowanie logiki biznesowej z zamockowanym klientem Supabase, aby uniknąć realnych zapytań do bazy danych.
    *   **Komponenty React (`src/components`):** Renderowanie komponentów w izolacji, testowanie ich wyglądu w zależności od przekazanych `props` oraz symulowanie interakcji użytkownika (np. kliknięcie przycisku) przy użyciu `user-event` zamiast `fireEvent` dla bardziej realistycznych testów, oraz weryfikacja reakcji komponentu.
    *   **Dane testowe:** Wykorzystanie **@faker-js/faker** do generowania realistycznych danych testowych (np. kwoty wydatków, daty, opisy), co zapewnia lepszą jakość testów i unikanie hardcodowanych wartości.

### Testy integracyjne

*   **Cel:** Zapewnienie, że połączone moduły działają poprawnie jako grupa.
*   **Narzędzia:** **Vitest**, **React Testing Library**, **Mock Service Worker (MSW)**, **@faker-js/faker** (dane testowe).
*   **Podejście:**
    *   **Frontend-Backend:** Testowanie komponentów "stron" (np. `ExpensesPage.tsx`), które wykonują zapytania do API. Użycie MSW do przechwytywania zapytań `fetch` i zwracania kontrolowanych odpowiedzi z realistycznymi danymi generowanymi przez Faker, co pozwala testować logikę aplikacji bez angażowania prawdziwego backendu.
    *   **Współpraca komponentów:** Testowanie interakcji między komponentem nadrzędnym a podrzędnym (np. czy kliknięcie przycisku w `FilterControls` powoduje aktualizację danych w `ExpensesDataTable`).

### Testy API

*   **Cel:** Weryfikacja poprawności działania endpointów API niezależnie od frontendu.
*   **Narzędzia:** **Vitest** (z wykorzystaniem np. `supertest` lub natywnego `fetch`).
*   **Podejście:**
    *   Wysyłanie zapytań HTTP (GET, POST, PUT, DELETE) do endpointów w `src/pages/api`.
    *   Weryfikacja kodów statusu odpowiedzi (200, 201, 400, 401, 404 itd.).
    *   Sprawdzanie struktury i zawartości odpowiedzi JSON.
    *   Testowanie ścieżek błędów (np. wysłanie niekompletnych danych).
    *   Weryfikacja mechanizmów autoryzacji (dostęp do chronionych zasobów).

### Testy End-to-End

*   **Cel:** Weryfikacja krytycznych ścieżek użytkownika w działającej aplikacji.
*   **Narzędzia:** **Playwright**.
*   **Podejście:**
    *   Uruchomienie aplikacji w trybie testowym.
    *   Napisanie skryptów, które automatyzują kroki wykonywane przez użytkownika w przeglądarce.
    *   Testy będą obejmować cały przepływ: od interakcji w UI, przez wywołanie API, aż po zapis i odczyt danych z testowej bazy danych.

## 6. Przykłady użycia narzędzi testowych

### Przykład 1: Test jednostkowy z user-event i faker

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { faker } from '@faker-js/faker';
import { ExpenseFormModal } from '@/components/expenses/ExpenseFormModal';

describe('ExpenseFormModal', () => {
  it('should submit form with valid expense data', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = vi.fn();
    
    // Generowanie danych testowych
    const testExpense = {
      title: faker.commerce.productName(),
      amount: faker.number.float({ min: 10, max: 1000, precision: 0.01 }),
      category: faker.helpers.arrayElement(['Food', 'Transport', 'Entertainment']),
      date: faker.date.recent().toISOString().split('T')[0]
    };
    
    render(<ExpenseFormModal open={true} onSubmit={mockOnSubmit} />);
    
    // Użycie user-event zamiast fireEvent dla realistycznej symulacji
    await user.type(screen.getByLabelText(/title/i), testExpense.title);
    await user.type(screen.getByLabelText(/amount/i), testExpense.amount.toString());
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      title: testExpense.title,
      amount: testExpense.amount
    }));
  });
});
```

### Przykład 2: Test integracyjny z MSW i faker

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { faker } from '@faker-js/faker';
import { ExpensesPage } from '@/components/expenses/ExpensesPage';

// Generowanie mocków danych
const generateMockExpenses = (count: number) => 
  Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    title: faker.commerce.productName(),
    amount: faker.number.float({ min: 10, max: 1000, precision: 0.01 }),
    date: faker.date.recent(),
    category: faker.helpers.arrayElement(['Food', 'Transport', 'Entertainment'])
  }));

const server = setupServer(
  http.get('/api/expenses', () => {
    return HttpResponse.json({
      data: generateMockExpenses(10),
      total: 10
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ExpensesPage Integration', () => {
  it('should fetch and display expenses from API', async () => {
    render(<ExpensesPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('row')).toHaveLength(11); // header + 10 rows
    });
  });
});
```

### Przykład 3: Uruchomienie Vitest UI

```bash
# W package.json dodaj skrypt:
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}

# Uruchom interfejs graficzny:
npm run test:ui
```

## 7. Przypadki testowe (przykłady)

### Moduł: Autentykacja

| ID    | Scenariusz                                          | Typ testu | Kroki do wykonania                                                                                                | Oczekiwany rezultat                                                                             |
| :---- | :-------------------------------------------------- | :-------- | :---------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| AUTH-01 | Pomyślne logowanie użytkownika                        | E2E       | 1. Otwórz /login. 2. Wpisz poprawny email/hasło. 3. Kliknij "Zaloguj".                                           | Użytkownik zostaje przekierowany na /dashboard.                                                 |
| AUTH-02 | Logowanie z błędnym hasłem                          | E2E       | 1. Otwórz /login. 2. Wpisz poprawny email i błędne hasło. 3. Kliknij "Zaloguj".                                  | Pod formularzem pojawia się komunikat o błędnych danych logowania. Użytkownik pozostaje na /login. |
| AUTH-03 | Pomyślna rejestracja nowego użytkownika               | E2E       | 1. Otwórz /register. 2. Wypełnij formularz poprawnymi danymi. 3. Kliknij "Zarejestruj".                         | Użytkownik jest zalogowany i przekierowany na /dashboard. Nowy użytkownik istnieje w bazie.        |
| AUTH-04 | Próba rejestracji na zajęty adres e-mail              | API       | 1. Wyślij POST na `/api/auth/register` z emailem, który już istnieje.                                             | Odpowiedź ma status 409 (Conflict) i zawiera stosowny komunikat błędu.                          |
| AUTH-05 | Wylogowanie użytkownika                             | E2E       | 1. Zaloguj się. 2. Kliknij przycisk "Wyloguj".                                                                    | Użytkownik zostaje przekierowany na stronę główną lub /login.                                    |

### Moduł: Zarządzanie wydatkami

| ID    | Scenariusz                                          | Typ testu | Kroki do wykonania                                                                                                | Oczekiwany rezultat                                                                                                 |
| :---- | :-------------------------------------------------- | :-------- | :---------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| EXP-01 | Pomyślne dodanie nowego wydatku                     | E2E       | 1. Zaloguj się i przejdź do /expenses. 2. Otwórz modal dodawania wydatku. 3. Wypełnij i zatwierdź formularz.      | Modal zostaje zamknięty. Nowy wydatek pojawia się na liście.                                                        |
| EXP-02 | Walidacja formularza dodawania wydatku (pusta kwota)  | Integr.   | 1. Zrenderuj komponent `ExpenseFormModal`. 2. Symuluj próbę wysłania formularza bez podawania kwoty.                 | Pod polem kwoty pojawia się komunikat błędu. Zapytanie POST nie jest wysyłane.                                     |
| EXP-03 | Usunięcie istniejącego wydatku                      | E2E       | 1. Zaloguj się i przejdź do /expenses. 2. Kliknij ikonę usuwania przy wydatku. 3. Potwierdź usunięcie w dialogu. | Wydatek znika z listy.                                                                                              |
| EXP-04 | Pobranie wszystkich wydatków zalogowanego użytkownika | API       | 1. Wyślij GET na `/api/expenses` z poprawnym tokenem autoryzacyjnym.                                              | Odpowiedź ma status 200 i zawiera listę wydatków należących wyłącznie do tego użytkownika.                         |

## 7. Kryteria akceptacji

Testy zostaną uznane za zakończone pomyślnie, gdy:

*   **Pokrycie kodu (Code Coverage):** Pokrycie kodu testami jednostkowymi i integracyjnymi wynosi co najmniej **80%**.
*   **Status testów:** **100%** testów jednostkowych, integracyjnych i API musi zakończyć się sukcesem (PASS).
*   **Testy E2E:** Wszystkie zdefiniowane krytyczne ścieżki użytkownika w testach E2E muszą zakończyć się sukcesem.
*   **Brak krytycznych błędów:** W trakcie testów nie zidentyfikowano żadnych błędów blokujących lub krytycznych.
*   **CI/CD:** Wszystkie testy są zintegrowane z pipeline'em CI/CD i automatycznie uruchamiane przy każdym pushu do głównej gałęzi.

## 8. Harmonogram

Testy powinny być tworzone równolegle z rozwojem nowych funkcjonalności. Proponowana kolejność wdrożenia frameworków testowych:

1.  **Tydzień 1:** Konfiguracja Vitest (wraz z Vitest UI), React Testing Library, @testing-library/user-event oraz @faker-js/faker. Napisanie pierwszych testów jednostkowych dla istniejących funkcji z `lib/` i kluczowych komponentów.
2.  **Tydzień 2:** Wdrożenie testów integracyjnych z MSW. Stworzenie testów dla głównych stron (`ExpensesPage`, `DashboardPage`) z wykorzystaniem Faker do generowania danych testowych.
3.  **Tydzień 3:** Konfiguracja Playwright. Stworzenie pierwszych testów E2E dla ścieżek autentykacji.
4.  **Tydzień 4 i kolejne:** Systematyczne dodawanie testów dla każdej nowej funkcjonalności i naprawianego błędu. Integracja z GitHub Actions.
5.  **Opcjonalnie (równolegle):** Konfiguracja Storybook dla komponentów UI, co ułatwi rozwój i dokumentację komponentów oraz umożliwi visual regression testing.

## 9. Zasoby i narzędzia

### Narzędzia podstawowe

*   **Framework testowy:** [Vitest](https://vitest.dev/) – nowoczesny, szybki runner testów, kompatybilny z Vite (używanym przez Astro).
*   **Vitest UI:** [@vitest/ui](https://vitest.dev/guide/ui.html) – interfejs graficzny do wizualizacji testów w przeglądarce, znacznie ułatwiający debugging i analizę wyników testów.
*   **Testowanie komponentów:** [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) – do testowania komponentów React w sposób zbliżony do interakcji użytkownika.
*   **User Event:** [@testing-library/user-event](https://testing-library.com/docs/user-event/intro) – zaawansowana biblioteka do symulacji interakcji użytkownika, bardziej realistyczna niż standardowy `fireEvent`.
*   **Testy E2E:** [Playwright](https://playwright.dev/) – nowoczesne narzędzie do testów E2E, oferujące dużą szybkość i niezawodność.
*   **Mockowanie API:** [Mock Service Worker (MSW)](https://mswjs.io/) – do przechwytywania i mockowania zapytań sieciowych na poziomie sieci, co czyni testy integracyjne bardziej realistycznymi.
*   **Dane testowe:** [@faker-js/faker](https://fakerjs.dev/) – generowanie realistycznych, losowych danych testowych (daty, kwoty, teksty), co pozwala uniknąć hardcodowania i zwiększa jakość testów.
*   **CI/CD:** [GitHub Actions](https://github.com/features/actions) – do automatyzacji uruchamiania testów.
*   **Zarządzanie danymi testowymi:** Skrypty do seedowania bazy danych (np. w TypeScript, uruchamiane przed testami E2E).

### Narzędzia opcjonalne (rekomendowane)

*   **Storybook:** [Storybook](https://storybook.js.org/) – narzędzie do izolowanego rozwijania i dokumentowania komponentów UI. Umożliwia tworzenie "living documentation", testowanie edge cases oraz visual regression testing z integracją Chromatic. Szczególnie przydatne dla zespołów pracujących nad wieloma komponentami React.

## 10. Zarządzanie ryzykiem

| Ryzyko                                      | Prawdopodobieństwo | Wpływ    | Plan mitygacji                                                                                             |
| :------------------------------------------ | :----------------- | :------- | :--------------------------------------------------------------------------------------------------------- |
| **Flaky tests** (niestabilne testy E2E)     | Średnie            | Wysoki   | Stosowanie dobrych praktyk w Playwright (np. oczekiwanie na elementy zamiast `setTimeout`), dedykowana, stabilna baza testowa, regularny przegląd i refaktoryzacja testów. |
| Brak czasu na pisanie testów              | Wysokie            | Wysoki   | Wprowadzenie polityki "no new feature without tests". Skupienie się na testowaniu krytycznych ścieżek. Automatyzacja tam, gdzie to możliwe, aby oszczędzić czas. |
| Złożoność mockowania zależności (Supabase)  | Średnie            | Średni   | Stworzenie dedykowanych, reużywalnych mocków dla klienta Supabase. Używanie MSW do mockowania API na wyższym poziomie abstrakcji. |
| Rozbieżność środowiska testowego i prod | Niskie             | Wysoki   | Używanie zmiennych środowiskowych do konfiguracji bazy danych. Budowanie obrazów Docker w CI/CD w sposób identyczny dla obu środowisk. |
| Niska kultura jakości w zespole             | Średnie            | Wysoki   | Regularne przeglądy kodu (code review) z naciskiem na jakość testów. Szkolenia i praca w parach nad pisaniem dobrych testów. |
