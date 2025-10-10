# API Endpoint Implementation Plan: Get a Single Expense

## 1. Przegląd punktu końcowego
Ten punkt końcowy `GET /api/expenses/{id}` służy do pobierania szczegółowych informacji o pojedynczym wydatku na podstawie jego unikalnego identyfikatora (ID). Dostęp jest ograniczony wyłącznie do uwierzytelnionego użytkownika, który jest właścicielem danego wydatku.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `GET`
-   **Struktura URL**: `/api/expenses/{id}`
-   **Parametry**:
    -   **Wymagane**:
        -   `id` (Parametr ścieżki): Unikalny identyfikator wydatku w formacie UUID.
-   **Request Body**: Brak.

## 3. Wykorzystywane typy
-   **`ExpenseDto`**: Zdefiniowany w `src/types.ts`. Służy jako model danych dla obiektu wydatku zwracanego w odpowiedzi. Typ ten celowo pomija pole `user_id` ze względów bezpieczeństwa.

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu (`200 OK`)**:
    -   Zwraca obiekt JSON zgodny z typem `ExpenseDto`.
    ```json
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "amount": 150.75,
      "name": "Grocery Shopping",
      "description": "Weekly groceries from the supermarket",
      "date": "2025-10-15T10:00:00Z",
      "created_at": "2025-10-15T10:02:00Z"
    }
    ```
-   **Odpowiedzi błędów**:
    -   `400 Bad Request`: Gdy `id` ma nieprawidłowy format.
    -   `401 Unauthorized`: Gdy użytkownik nie jest zalogowany.
    -   `404 Not Found`: Gdy wydatek o podanym `id` nie istnieje lub nie należy do użytkownika.
    -   `500 Internal Server Error`: W przypadku nieoczekiwanych błędów serwera.

## 5. Przepływ danych
1.  Klient wysyła żądanie `GET` na adres `/api/expenses/{id}`.
2.  Middleware w Astro przechwytuje żądanie, weryfikuje sesję użytkownika i dołącza obiekt `user` oraz klienta `supabase` do `context.locals`. W przypadku braku autoryzacji zwraca `401`.
3.  Router Astro kieruje żądanie do handlera `GET` w `src/pages/api/expenses.ts`, przekazując `id` jako parametr.
4.  Handler waliduje `id` przy użyciu schemy Zod (`z.string().uuid()`). Jeśli walidacja się nie powiedzie, zwraca `400`.
5.  Handler wywołuje funkcję `getExpenseById(supabase, id, userId)` z serwisu `expense.service.ts`, przekazując klienta Supabase, ID wydatku oraz ID zalogowanego użytkownika.
6.  Funkcja serwisowa wykonuje zapytanie do tabeli `expenses` w bazie danych, filtrując wyniki po `id` oraz `user_id`.
7.  **Scenariusz sukcesu**: Jeśli rekord zostanie znaleziony, serwis zwraca pełny obiekt wydatku. Handler mapuje go na `ExpenseDto` (usuwając `user_id`) i wysyła odpowiedź `200 OK` z danymi.
8.  **Scenariusz "Nie znaleziono"**: Jeśli zapytanie nie zwróci rekordu, serwis zwraca `null`. Handler interpretuje to jako brak zasobu i zwraca odpowiedź `404 Not Found`.
9.  **Scenariusz błędu serwera**: Jeśli wystąpi błąd podczas komunikacji z bazą danych, serwis zgłosi wyjątek. Handler przechwyci go, zaloguje błąd w konsoli i zwróci odpowiedź `500 Internal Server Error`.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Każde żądanie musi być uwierzytelnione. Middleware jest odpowiedzialne za weryfikację tokena sesji i odrzucenie nieautoryzowanych żądań.
-   **Autoryzacja**: Kluczowym elementem jest weryfikacja własności danych. Zapytanie w `expense.service.ts` musi bezwzględnie zawierać klauzulę `WHERE user_id = :userId`, aby uniemożliwić jednemu użytkownikowi dostęp do danych innego.
-   **Walidacja danych wejściowych**: Parametr `id` musi być rygorystycznie walidowany jako UUID, aby zapobiec potencjalnym atakom (np. SQL Injection) i błędom w zapytaniach.

## 7. Rozważania dotyczące wydajności
-   Zapytanie do bazy danych filtruje po kluczu głównym (`id`), co gwarantuje bardzo wysoką wydajność operacji wyszukiwania (złożoność `O(1)` lub `O(log n)`).
-   Dodatkowy warunek na `user_id` nie powinien znacząco wpłynąć na wydajność, ponieważ relacja `user_id` jest kluczem obcym, a odpowiednie indeksy (`idx_expenses_user_id_date_desc`) mogą dodatkowo optymalizować zapytanie.

## 8. Etapy wdrożenia
1.  **Aktualizacja walidacji (`src/lib/expense.validation.ts`)**:
    -   Dodać nowy eksportowany schemat Zod do walidacji ID wydatku: `export const ExpenseIdSchema = z.string().uuid({ message: "Invalid expense ID format." });`.
2.  **Rozbudowa serwisu (`src/lib/expense.service.ts`)**:
    -   Stworzyć nową funkcję asynchroniczną: `getExpenseById(supabase: SupabaseClient, id: string, userId: string): Promise<Tables<'expenses'> | null>`.
    -   Wewnątrz funkcji zaimplementować zapytanie Supabase: `.from('expenses').select('*').eq('id', id).eq('user_id', userId).single()`.
    -   Dodać obsługę błędów zapytania i zwracać dane lub `null`.
3.  **Modyfikacja API Route (`src/pages/api/expenses.ts`)**:
    -   W handlerze `GET` dodać logikę rozróżniającą żądanie o listę od żądania o pojedynczy element na podstawie obecności parametru `id` w `Astro.params`.
    -   Jeśli `id` jest obecne, zaimportować i użyć `ExpenseIdSchema` do jego walidacji.
    -   Wywołać nową funkcję `getExpenseById` z serwisu.
    -   Na podstawie wyniku zwrócić odpowiedź `200 OK` z `ExpenseDto` lub `404 Not Found`.
    -   Całą logikę handlera objąć blokiem `try...catch` do obsługi nieoczekiwanych błędów i zwracania `500 Internal Server Error`.
