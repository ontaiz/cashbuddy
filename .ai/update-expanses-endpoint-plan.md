# API Endpoint Implementation Plan: Update an Expense

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia częściową aktualizację istniejącego wydatku na podstawie jego unikalnego identyfikatora (`id`). Operacja wykorzystuje metodę `PATCH`, co pozwala na modyfikację jednego lub więcej pól bez konieczności przesyłania całego obiektu. Endpoint zapewnia, że użytkownicy mogą modyfikować wyłącznie własne wydatki.

## 2. Szczegóły żądania
- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/expenses/{id}`
- **Parametry ścieżki**:
  - `id` (wymagany): Unikalny identyfikator (`uuid`) wydatku, który ma zostać zaktualizowany.
- **Ciało żądania**: Obiekt JSON zawierający co najmniej jedno z poniższych pól.
  ```json
  {
    "amount": 160.00,
    "name": "Nowa nazwa wydatku",
    "description": "Zaktualizowany opis",
    "date": "2025-10-15T10:00:00Z"
  }
  ```

## 3. Wykorzystywane typy
- **Command Model (Request)**: `UpdateExpenseCommand` z `src/types.ts`. Służy do typowania danych przychodzących w ciele żądania.
- **DTO (Response)**: `ExpenseDto` z `src/types.ts`. Służy do typowania danych wychodzących w odpowiedzi na żądanie.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**: Zwraca pełny, zaktualizowany obiekt wydatku w formacie `ExpenseDto`.
  ```json
  {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "amount": 160.00,
    "name": "Grocery Shopping",
    "description": "Updated description",
    "date": "2025-10-15T10:00:00Z",
    "created_at": "2025-10-15T10:02:00Z"
  }
  ```
- **Odpowiedzi błędów**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych
1.  Żądanie `PATCH` trafia do endpointu Astro w `src/pages/api/expenses/[id].ts`.
2.  Middleware (`src/middleware/index.ts`) weryfikuje sesję użytkownika. W przypadku braku sesji zwraca `401 Unauthorized`.
3.  Handler w pliku `[id].ts` pobiera `id` z parametrów ścieżki (`Astro.params`) oraz dane z ciała żądania (`Astro.request.json()`).
4.  Waliduje, czy `id` jest poprawnym formatem UUID. Jeśli nie, zwraca `400 Bad Request`.
5.  Waliduje ciało żądania za pomocą schematu Zod zdefiniowanego w `src/lib/expense.validation.ts`. W przypadku błędu walidacji zwraca `422 Unprocessable Entity`.
6.  Jeśli walidacja przebiegnie pomyślnie, wywoływana jest funkcja `updateExpense` z serwisu `src/lib/expense.service.ts`. Przekazywane są do niej: `id` wydatku, zwalidowane dane, `id` użytkownika (z `Astro.locals.session`) oraz instancja klienta Supabase (`Astro.locals.supabase`).
7.  Funkcja `updateExpense` wykonuje zapytanie `UPDATE` do tabeli `expenses`, używając klauzuli `WHERE id = :id AND user_id = :userId`.
8.  Serwis sprawdza, czy operacja `UPDATE` zmodyfikowała jakikolwiek wiersz. Jeśli nie, oznacza to, że wydatek nie istnieje lub nie należy do użytkownika, i serwis zwraca odpowiedni sygnał błędu.
9.  Handler na podstawie odpowiedzi z serwisu zwraca:
    -   `200 OK` wraz ze zaktualizowanym obiektem `ExpenseDto` w przypadku sukcesu.
    -   `404 Not Found`, jeśli serwis zasygnalizował, że zasób nie został znaleziony.
    -   `500 Internal Server Error`, jeśli wystąpił nieoczekiwany błąd.

## 6. Względy bezpieczeństwa
- **Autoryzacja**: Logika biznesowa w `expense.service.ts` musi bezwzględnie filtrować zapytania po `user_id` pobranym z aktywnej sesji. Zapobiegnie to modyfikacji zasobów należących do innych użytkowników (IDOR).
- **Walidacja danych wejściowych**: Wszystkie dane pochodzące od klienta (`id` i ciało żądania) muszą być rygorystycznie walidowane za pomocą Zod, aby zapobiec błędom i atakom (np. SQL Injection, chociaż Supabase SDK używa parametryzacji).
- **Zasada minimalnych uprawnień**: Odpowiedź API (`ExpenseDto`) nie zawiera pól, które nie powinny być eksponowane na frontendzie, takich jak `user_id`.

## 7. Obsługa błędów
| Kod statusu | Znaczenie | Przyczyna |
| :--- | :--- | :--- |
| `400 Bad Request` | Nieprawidłowe żądanie | ID w adresie URL nie jest w formacie UUID. |
| `401 Unauthorized` | Brak autoryzacji | Użytkownik nie jest zalogowany (brak lub nieważny token sesji). |
| `404 Not Found` | Nie znaleziono zasobu | Wydatek o podanym ID nie istnieje lub nie należy do zalogowanego użytkownika. |
| `422 Unprocessable Entity`| Nieprzetwarzalna treść | Ciało żądania jest puste lub dane w nim zawarte nie przechodzą walidacji (np. ujemna kwota, nieprawidłowy format daty). |
| `500 Internal Server Error`| Wewnętrzny błąd serwera | Problem z połączeniem z bazą danych lub inny nieoczekiwany błąd po stronie serwera. |

## 8. Rozważania dotyczące wydajności
Operacja `UPDATE` na tabeli `expenses` wykorzystuje klucz główny (`id`) oraz indeksowaną kolumnę (`user_id`). Dzięki temu zapytanie jest wysoce zoptymalizowane i nie powinno stanowić wąskiego gardła wydajnościowego, nawet przy dużej liczbie rekordów.

## 9. Etapy wdrożenia
1.  **Walidacja**: W pliku `src/lib/expense.validation.ts` zdefiniuj nowy schemat Zod (`updateExpenseSchema`) do walidacji ciała żądania `PATCH`. Schemat powinien uwzględniać opcjonalność pól i sprawdzać, czy obiekt nie jest pusty.
2.  **Serwis**: W pliku `src/lib/expense.service.ts` zaimplementuj funkcję `updateExpense(id, data, userId, supabase)`. Funkcja ta powinna zawierać logikę aktualizacji rekordu w bazie danych, w tym kluczowe sprawdzenie `user_id`.
3.  **Endpoint**: W pliku `src/pages/api/expenses/[id].ts` utwórz handler dla metody `PATCH`.
    -   Zintegruj walidację `id` oraz ciała żądania przy użyciu schematu Zod.
    -   Wywołaj funkcję `updateExpense` z serwisu.
    -   Zaimplementuj obsługę odpowiedzi (sukces i błędy) zgodnie z opisanym przepływem danych.
4.  **Testy (opcjonalnie)**: Dodaj testy integracyjne dla nowego endpointu, aby zweryfikować poprawność działania, obsługę błędów i zabezpieczenia.
