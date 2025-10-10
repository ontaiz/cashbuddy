# API Endpoint Implementation Plan: List Expenses

## 1. Przegląd punktu końcowego
Ten punkt końcowy (`GET /api/expenses`) jest odpowiedzialny za pobieranie listy wydatków dla uwierzytelnionego użytkownika. Umożliwia paginację wyników, sortowanie po dacie lub kwocie oraz filtrowanie na podstawie zdefiniowanego zakresu dat.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/expenses`
- **Parametry zapytania (Query Parameters)**:
    - **Opcjonalne**:
        - `page` (number): Numer strony do wyświetlenia. Domyślnie: `1`.
        - `limit` (number): Liczba wyników na stronie. Domyślnie: `10`.
        - `sort_by` (string): Pole do sortowania. Dozwolone wartości: `date`, `amount`. Domyślnie: `date`.
        - `order` (string): Kierunek sortowania. Dozwolone wartości: `asc`, `desc`. Domyślnie: `desc`.
        - `start_date` (string): Data początkowa filtrowania (włącznie). Format: `YYYY-MM-DD`.
        - `end_date` (string): Data końcowa filtrowania (włącznie). Format: `YYYY-MM-DD`.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
Implementacja będzie wykorzystywać następujące typy zdefiniowane w `src/types.ts`:
- `PaginatedExpensesDto`: Główny typ odpowiedzi.
- `ExpenseDto`: Reprezentacja pojedynczego wydatku.
- `Pagination`: Obiekt zawierający metadane paginacji.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (`200 OK`)**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "amount": 150.75,
        "name": "Grocery Shopping",
        "description": "Weekly groceries",
        "date": "2025-10-15T10:00:00Z",
        "created_at": "2025-10-15T10:02:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total_items": 1,
      "total_pages": 1
    }
  }
  ```
- **Odpowiedzi błędu**:
    - `400 Bad Request`: Nieprawidłowe parametry zapytania.
    - `401 Unauthorized`: Brak lub nieprawidłowy token uwierzytelniający.
    - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych
1.  Żądanie `GET` trafia do endpointu Astro `/api/expenses`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje token JWT użytkownika z Supabase. Jeśli jest nieprawidłowy, zwraca `401 Unauthorized`. W przeciwnym razie dołącza dane użytkownika do `context.locals`.
3.  Handler `GET` w `src/pages/api/expenses.ts` odczytuje parametry zapytania z `Astro.url.searchParams`.
4.  Parametry są walidowane przy użyciu dedykowanego schematu Zod z `src/lib/expense.validation.ts`. W przypadku błędu walidacji zwracany jest status `400 Bad Request`.
5.  Handler wywołuje funkcję z serwisu `expense.service.ts`, przekazując zwalidowane parametry oraz ID użytkownika z `context.locals.user.id`.
6.  Serwis buduje zapytanie do Supabase, dynamicznie dodając klauzule `filter`, `order` i `range` na podstawie przekazanych parametrów. Kluczowym elementem jest dodanie warunku `eq('user_id', userId)`.
7.  Serwis wykonuje dwa zapytania: jedno do pobrania paginowanej listy danych i drugie (z opcją `{ count: 'exact' }`) do uzyskania całkowitej liczby rekordów pasujących do filtrów.
8.  Serwis formatuje wyniki do postaci `PaginatedExpensesDto` i zwraca je do handlera.
9.  Handler serializuje obiekt DTO do formatu JSON i zwraca go z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do endpointu musi być chroniony. Każde żądanie musi zostać zweryfikowane przez middleware Astro, które sprawdzi poprawność tokenu sesji Supabase.
- **Autoryzacja**: Logika w `expense.service.ts` musi bezwzględnie zapewniać, że zapytania do bazy danych filtrują wyniki po `user_id` pochodzącym z obiektu `context.locals.user`. Uniemożliwi to jednemu użytkownikowi dostęp do danych innego.
- **Walidacja danych wejściowych**: Wszystkie parametry zapytania muszą być rygorystycznie walidowane za pomocą Zod, aby zapobiec nieoczekiwanym błędom i zabezpieczyć system przed potencjalnie szkodliwymi danymi wejściowymi.

## 7. Obsługa błędów
- **Błędy walidacji (400)**: Jeśli parametry zapytania nie przejdą walidacji Zod, endpoint zwróci odpowiedź z kodem 400 oraz komunikatem o błędach.
- **Brak autoryzacji (401)**: Jeśli middleware nie znajdzie poprawnej sesji użytkownika, proces zostanie przerwany i zwrócony zostanie kod 401.
- **Błędy serwera (500)**: Wszelkie błędy zgłoszone przez `expense.service.ts` (np. błąd zapytania do bazy danych) zostaną przechwycone w bloku `try...catch` w handlerze endpointu. Błąd zostanie zalogowany na konsoli, a do klienta zostanie zwrócona generyczna odpowiedź z kodem 500.

## 8. Rozważania dotyczące wydajności
- **Indeksy bazodanowe**: Zapytania będą korzystać z istniejących indeksów na kolumnach `(user_id, date)` oraz `(user_id, amount)`, co jest kluczowe dla szybkiego sortowania i filtrowania.
- **Paginacja**: Stosowanie paginacji z rozsądnym limitem (np. 10-25) jest obowiązkowe, aby zapobiec przesyłaniu dużych ilości danych i nadmiernemu obciążeniu zarówno serwera, jak i klienta.
- **Liczba zapytań**: Proces wymaga dwóch zapytań do bazy danych (jedno po dane, drugie po ich całkowitą liczbę). Jest to optymalne i powszechnie stosowane podejście w paginacji.

## 9. Etapy wdrożenia
1.  **Schemat walidacji**: W pliku `src/lib/expense.validation.ts` utwórz nowy eksportowany schemat Zod, `getExpensesSchema`, do walidacji parametrów zapytania `GET`.
2.  **Logika serwisu**: W `src/lib/expense.service.ts` dodaj nową funkcję asynchroniczną, np. `getPaginatedExpenses(supabase, userId, options)`.
3.  **Implementacja serwisu**: Wewnątrz nowej funkcji zaimplementuj logikę budowania i wykonywania zapytań do Supabase. Funkcja powinna zwracać obiekt zgodny z typem `PaginatedExpensesDto`.
4.  **Implementacja endpointu**: W `src/pages/api/expenses.ts` dodaj handler `GET`.
5.  **Walidacja w endpoincie**: W handlerze `GET` użyj `getExpensesSchema.safeParse()` do walidacji `Astro.url.searchParams`. W przypadku błędu zwróć odpowiedź z kodem 400.
6.  **Integracja z serwisem**: Wywołaj funkcję `getPaginatedExpenses`, przekazując do niej klienta Supabase (`context.locals.supabase`), ID użytkownika (`context.locals.user.id`) oraz zwalidowane parametry.
7.  **Obsługa błędów i odpowiedź**: Zaimplementuj blok `try...catch` do obsługi błędów z serwisu. W przypadku powodzenia zwróć dane z serwisu z kodem 200. W przypadku błędu zaloguj go i zwróć kod 500.
8.  **Prerender**: Upewnij się, że w pliku `src/pages/api/expenses.ts` znajduje się `export const prerender = false;`, aby zapewnić dynamiczne renderowanie.
