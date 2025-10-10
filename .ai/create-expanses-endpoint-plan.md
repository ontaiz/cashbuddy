# API Endpoint Implementation Plan: Create an Expense

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom tworzenie nowych rekordów wydatków. Otrzymuje dane wydatku w ciele żądania, waliduje je, a następnie zapisuje w bazie danych, przypisując wydatek do zalogowanego użytkownika.

## 2. Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/expenses`
- **Parametry**: Brak (wszystkie dane są przekazywane w ciele żądania).
- **Request Body**: Wymagany jest obiekt JSON o następującej strukturze:
  ```json
  {
    "amount": "number",
    "name": "string",
    "date": "string (ISO 8601)",
    "description": "string (optional)"
  }
  ```

## 3. Wykorzystywane typy
- **Request Command Model**: `CreateExpenseCommand` z `src/types.ts` do typowania przychodzących danych.
- **Response DTO**: Pełny typ `Tables<"expenses">` z `src/db/database.types.ts` dla pomyślnej odpowiedzi.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (`201 Created`)**:
  - Zwraca pełny obiekt nowo utworzonego wydatku, włącznie z `id`, `user_id` i `created_at`.
  ```json
  {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "user_id": "f0e9d8c7-b6a5-4321-fedc-ba9876543210",
    "amount": 150.75,
    "name": "Grocery Shopping",
    "description": "Weekly groceries from the supermarket",
    "date": "2025-10-15T10:00:00Z",
    "created_at": "2025-10-15T10:02:00Z"
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Ciało żądania ma nieprawidłowy format JSON.
  - `401 Unauthorized`: Użytkownik nie jest zalogowany.
  - `422 Unprocessable Entity`: Dane wejściowe nie przeszły walidacji.
  - `500 Internal Server Error`: Wystąpił błąd serwera.

## 5. Przepływ danych
1.  Klient wysyła żądanie `POST` na adres `/api/expenses` z danymi wydatku w ciele.
2.  Middleware Astro weryfikuje token JWT, uwierzytelnia użytkownika i udostępnia sesję w `context.locals`.
3.  Handler API `POST` w `src/pages/api/expenses/index.ts` jest uruchamiany.
4.  Handler sprawdza, czy sesja użytkownika istnieje. Jeśli nie, zwraca `401 Unauthorized`.
5.  Ciało żądania jest parsowane i walidowane przy użyciu predefiniowanego schematu Zod. W przypadku błędu walidacji zwracany jest status `422 Unprocessable Entity` wraz ze szczegółami błędów.
6.  Handler wywołuje funkcję `createExpense` z serwisu `expense.service.ts`, przekazując zweryfikowane dane oraz `user_id` z sesji.
7.  Funkcja serwisowa używa klienta Supabase do wstawienia nowego rekordu do tabeli `expenses`.
8.  Po pomyślnym zapisie do bazy danych, serwis zwraca pełny obiekt nowego wydatku.
9.  Handler API otrzymuje obiekt z serwisu i odsyła go do klienta z kodem statusu `201 Created`.
10. W przypadku błędu na którymkolwiek etapie po stronie serwera (np. błąd bazy danych), proces jest przerywany, a do klienta wysyłana jest odpowiedź `500 Internal Server Error`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do endpointu jest bezwzględnie wymagany i realizowany przez middleware Astro, który weryfikuje sesję Supabase.
- **Autoryzacja**: Identyfikator użytkownika (`user_id`) jest pobierany wyłącznie z zaufanego źródła po stronie serwera (sesja), a nie z danych wejściowych od klienta.
- **Walidacja danych**: Każde pole w ciele żądania jest rygorystycznie walidowane na serwerze za pomocą Zod, aby zapewnić integralność danych i zapobiec błędom.
- **Ochrona przed SQL Injection**: Użycie Supabase JS Client zapewnia ochronę, ponieważ biblioteka ta korzysta z parametryzowanych zapytań do bazy danych.

## 7. Rozważania dotyczące wydajności
- Operacja polega na pojedynczym zapisie (`INSERT`) do bazy danych, co jest operacją o wysokiej wydajności. Chociaż każdy nowy zapis wiąże się z niewielkim narzutem na aktualizację istniejących indeksów, jest to koszt akceptowalny w zamian za znaczące przyspieszenie operacji odczytu.
- Nie przewiduje się problemów wydajnościowych dla tego endpointu przy normalnym obciążeniu.
- Aby zoptymalizować przyszłe operacje odczytu, które będą kluczowe dla aplikacji, w tabeli `expenses` zdefiniowano następujące indeksy:
  1.  **Indeks `(user_id, date DESC)`**: Kluczowy dla szybkiego pobierania listy ostatnich transakcji użytkownika.
  2.  **Indeks `(user_id, amount DESC)`**: Niezbędny do wydajnego wyszukiwania największych wydatków użytkownika, np. na potrzeby dashboardu.

## 8. Etapy wdrożenia
1.  **Utworzenie schematu walidacji**: Stworzyć plik `src/lib/expense.validation.ts` i zdefiniować w nim schemat Zod dla `CreateExpenseCommand`, uwzględniając wszystkie reguły walidacji (typy, wartości minimalne/maksymalne, wymagane pola).
2.  **Stworzenie serwisu**: Utworzyć plik `src/lib/expense.service.ts`.
3.  **Implementacja logiki w serwisie**: W `expense.service.ts` zaimplementować funkcję `createExpense(supabase, userId, data)`, która przyjmuje klienta Supabase, ID użytkownika i zwalidowane dane, a następnie wykonuje operację `insert` na tabeli `expenses`. Funkcja powinna obsługiwać błędy z Supabase i zwracać nowo utworzony obiekt.
4.  **Utworzenie pliku endpointu**: Stworzyć plik `src/pages/api/expenses/index.ts`.
5.  **Implementacja handlera POST**: W pliku endpointu zaimplementować handler dla metody `POST`.
6.  **Uwierzytelnianie**: W handlerze `POST` pobrać sesję użytkownika z `context.locals`. Jeśli sesja nie istnieje, zwrócić odpowiedź `401`.
7.  **Pobranie i walidacja danych**: Sparsować ciało żądania (`await context.request.json()`). Zwalidować otrzymane dane przy użyciu schematu Zod. W przypadku niepowodzenia zwrócić `422` ze szczegółami.
8.  **Wywołanie serwisu**: Wywołać funkcję `createExpense` z serwisu, przekazując jej odpowiednie argumenty.
9.  **Obsługa błędów serwera**: Obudować wywołanie serwisu w blok `try...catch`, aby przechwycić ewentualne błędy i zwrócić odpowiedź `500`.
10. **Zwrócenie odpowiedzi**: W przypadku sukcesu, zwrócić odpowiedź JSON z nowo utworzonym wydatkiem i statusem `201 Created`.
11. **Konfiguracja Astro**: Dodać `export const prerender = false;` w pliku endpointu, aby zapewnić, że jest on renderowany dynamicznie po stronie serwera.
