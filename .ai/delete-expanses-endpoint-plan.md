# API Endpoint Implementation Plan: Delete an Expense

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionemu użytkownikowi trwałe usunięcie jednego z jego własnych rekordów wydatków. Operacja jest nieodwracalna i wymaga podania unikalnego identyfikatora wydatku.

## 2. Szczegóły żądania
- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/expenses/{id}`
- **Parametry**:
  - **Wymagane**:
    - `id` (parametr ścieżki, `string`): Unikalny identyfikator (UUID) wydatku, który ma zostać usunięty.
  - **Opcjonalne**: Brak
- **Request Body**: Brak

## 3. Wykorzystywane typy
Implementacja tego punktu końcowego nie wymaga definiowania nowych typów DTO ani Command Models, ponieważ zarówno żądanie, jak i odpowiedź w przypadku sukcesu, nie zawierają ciała (body).

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu**:
  - **Kod statusu**: `204 No Content`
  - **Ciało odpowiedzi**: Puste
- **Odpowiedzi błędów**:
  - **Kod statusu**: `400 Bad Request` - W przypadku, gdy `id` w ścieżce nie jest poprawnym UUID.
  - **Kod statusu**: `401 Unauthorized` - Gdy użytkownik nie jest uwierzytelniony.
  - **Kod statusu**: `404 Not Found` - Gdy wydatek o podanym `id` nie istnieje lub nie należy do zalogowanego użytkownika.
  - **Kod statusu**: `500 Internal Server Error` - W przypadku nieoczekiwanych błędów po stronie serwera.
  - **Ciało odpowiedzi (dla błędów)**:
    ```json
    {
      "error": "Komunikat błędu"
    }
    ```

## 5. Przepływ danych
1. Klient wysyła żądanie `DELETE` na adres `/api/expenses/{id}`.
2. Middleware Astro przechwytuje żądanie, weryfikuje sesję użytkownika (np. na podstawie tokena JWT w ciasteczku) i, jeśli jest prawidłowa, dołącza obiekt `user` oraz klienta `supabase` do `context.locals`. W przypadku braku sesji, middleware zwraca `401 Unauthorized`.
3. Handler API w pliku `src/pages/api/expenses/[id].ts` zostaje wywołany.
4. Handler weryfikuje, czy `context.locals.user` istnieje. Jeśli nie, zwraca `401 Unauthorized`.
5. Handler pobiera `id` z `context.params` i waliduje jego format (musi być to UUID) przy użyciu biblioteki Zod. Jeśli walidacja się nie powiedzie, zwraca `400 Bad Request`.
6. Handler wywołuje funkcję `deleteExpense` z serwisu `src/lib/expense.service.ts`, przekazując klienta `supabase`, zweryfikowane `id` wydatku oraz `id` użytkownika z `context.locals.user.id`.
7. Funkcja `deleteExpense` wykonuje zapytanie `DELETE` do tabeli `expenses` w bazie Supabase, używając klauzuli `match` do dopasowania zarówno `id` wydatku, jak i `user_id`.
8. Na podstawie wyniku operacji (liczby usuniętych wierszy), serwis zwraca informację o sukcesie lub porażce (np. "not found").
9. Handler API, w zależności od odpowiedzi z serwisu, zwraca odpowiedni kod statusu HTTP:
   - `204 No Content` w przypadku pomyślnego usunięcia.
   - `404 Not Found`, jeśli serwis zasygnalizował, że żaden rekord nie został usunięty.
   - `500 Internal Server Error`, jeśli serwis zgłosił błąd bazy danych.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do punktu końcowego jest ograniczony wyłącznie do uwierzytelnionych użytkowników. Middleware jest odpowiedzialne za weryfikację tożsamości.
- **Autoryzacja**: Kluczowym mechanizmem bezpieczeństwa jest zapewnienie, że użytkownik może usunąć tylko własne wydatki. Jest to realizowane przez bezwzględne filtrowanie operacji `DELETE` po `user_id` zalogowanego użytkownika (`.match({ id: expenseId, user_id: userId })`). Zapobiega to atakom typu IDOR (Insecure Direct Object Reference).
- **Walidacja danych wejściowych**: Parametr `id` jest walidowany jako UUID, co chroni przed błędami i potencjalnymi atakami na warstwę bazy danych.

## 7. Rozważania dotyczące wydajności
- Operacja `DELETE` jest wykonywana na kolumnie `id`, która jest kluczem głównym, co gwarantuje bardzo wysoką wydajność.
- Dodatkowy warunek na `user_id` może wykorzystać istniejące indeksy (np. `idx_expenses_user_id_date_desc`), co sprawia, że cała operacja jest wysoce zoptymalizowana.
- Nie przewiduje się żadnych wąskich gardeł wydajnościowych związanych z tym punktem końcowym.

## 8. Etapy wdrożenia
1.  **Aktualizacja serwisu `expense.service.ts`**:
    -   Dodaj nową funkcję asynchroniczną `deleteExpense`, która przyjmuje obiekt z `supabase: SupabaseClient`, `expenseId: string` i `userId: string`.
    -   Wewnątrz funkcji wykonaj operację `supabase.from('expenses').delete().match({ id: expenseId, user_id: userId })`.
    -   Przeanalizuj odpowiedź z Supabase. Jeśli wystąpił `error`, rzuć wyjątek. Jeśli `count` wynosi 0, zwróć informację o tym, że zasobu nie znaleziono. W przeciwnym razie zwróć informację o sukcesie.

2.  **Implementacja handlera w `src/pages/api/expenses/[id].ts`**:
    -   Dodaj eksportowaną, asynchroniczną funkcję `DELETE(context: APIContext)`.
    -   Upewnij się, że w pliku znajduje się `export const prerender = false;`.
    -   Pobierz `params` i `locals` z kontekstu. Sprawdź, czy `locals.user` istnieje.
    -   Zdefiniuj schemat walidacji Zod dla `params`, aby upewnić się, że `id` jest typu `uuid`.
    -   Przeprowadź walidację `params`. W przypadku błędu zwróć odpowiedź `400`.
    -   Wywołaj nowo utworzoną funkcję `deleteExpense` z serwisu, przekazując jej wymagane dane.
    -   Na podstawie wyniku zwróconego przez serwis, skonstruuj i zwróć odpowiednią odpowiedź HTTP (`204`, `404` lub `500`).
