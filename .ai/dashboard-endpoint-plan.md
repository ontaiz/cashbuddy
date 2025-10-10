# API Endpoint Implementation Plan: Get Dashboard Data

## 1. Przegląd punktu końcowego
Ten punkt końcowy (`GET /api/dashboard`) jest odpowiedzialny za pobieranie zagregowanych danych i statystyk niezbędnych do wyświetlenia głównego widoku pulpitu nawigacyjnego. Zwraca kluczowe wskaźniki, takie jak łączne wydatki, wydatki w bieżącym miesiącu, listę największych transakcji oraz podsumowanie wydatków z ostatnich miesięcy. Punkt końcowy jest przeznaczony tylko do odczytu i wymaga uwierzytelnienia użytkownika.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/dashboard`
- **Parametry**:
  - **Wymagane**: Brak.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
W celu zapewnienia bezpieczeństwa typów, zostaną zdefiniowane następujące interfejsy DTO w pliku `src/types.ts`:

```typescript
// src/types.ts

export interface TopExpenseDto {
  id: string;
  name: string;
  amount: number;
  date: string;
}

export interface MonthlySummaryDto {
  month: string; // Format: 'YYYY-MM'
  total: number;
}

export interface DashboardDataDto {
  total_expenses: number;
  current_month_expenses: number;
  top_5_expenses: TopExpenseDto[];
  monthly_summary: MonthlySummaryDto[];
}
```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**:
  ```json
  {
    "total_expenses": 12345.67,
    "current_month_expenses": 1450.80,
    "top_5_expenses": [
      {
        "id": "b1c2d3e4-...",
        "name": "New Laptop",
        "amount": 4500.00,
        "date": "2025-09-20T14:30:00Z"
      }
    ],
    "monthly_summary": [
      {
        "month": "2025-08",
        "total": 3200.50
      },
      {
        "month": "2025-09",
        "total": 7700.20
      },
      {
        "month": "2025-10",
        "total": 1450.80
      }
    ]
  }
  ```
- **Kody stanu**:
  - `200 OK`: Żądanie zakończone pomyślnie.
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `500 Internal Server Error`: Wystąpił błąd serwera.

## 5. Przepływ danych
1.  Klient wysyła żądanie `GET` do `/api/dashboard`.
2.  Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje sesję użytkownika i dołącza ją do `Astro.locals`. Jeśli sesja jest nieprawidłowa lub jej brakuje, middleware zwraca odpowiedź `401 Unauthorized`.
3.  Handler punktu końcowego (`src/pages/api/dashboard.ts`) jest wywoływany.
4.  Handler pobiera `userId` oraz instancję klienta Supabase z `Astro.locals`.
5.  Handler wywołuje metodę `getDashboardData(supabase, userId)` z nowego serwisu `DashboardService` (`src/lib/dashboard.service.ts`).
6.  `DashboardService` wykonuje równolegle cztery zapytania do bazy danych Supabase w celu pobrania wymaganych danych. **Każde zapytanie musi zawierać klauzulę `where('user_id', '=', userId)`, aby zapobiec wyciekowi danych.**
7.  Serwis agreguje wyniki zapytań w obiekt `DashboardDataDto`.
8.  Handler otrzymuje DTO, serializuje je do formatu JSON i wysyła do klienta z kodem statusu `200 OK`.
9.  W przypadku błędu w serwisie lub handlerze, błąd jest logowany, a do klienta wysyłana jest odpowiedź z kodem `500 Internal Server Error`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp jest ograniczony wyłącznie do uwierzytelnionych użytkowników. Middleware jest odpowiedzialne za egzekwowanie tej zasady.
- **Autoryzacja**: Ze względu na wyłączony RLS (Row-Level Security), autoryzacja musi być zaimplementowana na poziomie aplikacji. **Jest to krytycznie ważne, aby każde zapytanie do tabeli `expenses` było filtrowane przez `user_id` aktualnie zalogowanego użytkownika.** Należy przeprowadzić weryfikację kodu (code review) pod kątem obecności tych warunków.
- **Walidacja danych**: Punkt końcowy nie przyjmuje danych wejściowych, co minimalizuje ryzyko ataków typu Injection.

## 7. Rozważania dotyczące wydajności
- **Równoległe zapytania**: Aby zminimalizować opóźnienie, wszystkie cztery zapytania do bazy danych w `DashboardService` powinny być wykonywane równolegle przy użyciu `Promise.all`.
- **Indeksy bazodanowe**: Należy upewnić się, że zapytania wykorzystują istniejące indeksy w bazie danych:
  - `idx_expenses_user_id_date_desc` dla podsumowań miesięcznych.
  - `idx_expenses_user_id_amount_desc` dla zapytania o 5 największych wydatków.
- **Ilość danych**: Zapytanie o podsumowanie miesięczne powinno być ograniczone do rozsądnego okresu (np. ostatnich 6-12 miesięcy), aby uniknąć przetwarzania dużej ilości danych.

## 8. Etapy wdrożenia
1.  **Definicja typów DTO**:
    -   W pliku `src/types.ts` dodaj interfejsy `TopExpenseDto`, `MonthlySummaryDto` i `DashboardDataDto` zgodnie z sekcją 3.

2.  **Utworzenie serwisu**:
    -   Utwórz nowy plik `src/lib/dashboard.service.ts`.
    -   Zaimplementuj w nim asynchroniczną funkcję `getDashboardData(supabase: SupabaseClient, userId: string): Promise<DashboardDataDto>`.
    -   Wewnątrz tej funkcji, zrealizuj 4 zapytania do bazy danych (total, current month, top 5, monthly summary) używając `Promise.all`.
    -   **Krytyczne**: Upewnij się, że każde zapytanie zawiera `.eq('user_id', userId)`.
    -   Przetwórz wyniki i zwróć obiekt `DashboardDataDto`.

3.  **Utworzenie punktu końcowego API**:
    -   Utwórz nowy plik `src/pages/api/dashboard.ts`.
    -   Dodaj `export const prerender = false;`.
    -   Zaimplementuj handler `GET({ locals, response }: APIContext)`.
    -   W handlerze:
        -   Pobierz `supabase` i `user` z `locals`.
        -   Sprawdź, czy użytkownik istnieje; jeśli nie, zwróć `401`.
        -   Zaimplementuj blok `try...catch`.
        -   W bloku `try`, wywołaj `dashboardService.getDashboardData` i zwróć wynik z kodem `200`.
        -   W bloku `catch`, zaloguj błąd i zwróć generyczną odpowiedź z kodem `500`.

4.  **Testowanie**:
    -   Dodaj testy jednostkowe dla `DashboardService`, mockując klienta Supabase, aby zweryfikować logikę zapytań i agregacji danych.
    -   Przeprowadź testy integracyjne punktu końcowego, aby zweryfikować poprawność działania całego przepływu, w tym obsługę błędów i uwierzytelniania.
