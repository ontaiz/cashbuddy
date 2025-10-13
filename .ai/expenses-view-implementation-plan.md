# Plan implementacji widoku Wydatki

## 1. Przegląd
Widok "Wydatki" jest centralnym miejscem w aplikacji CashBuddy do zarządzania finansami osobistymi. Umożliwia użytkownikom przeglądanie pełnej historii swoich wydatków w formie tabeli na urządzeniach stacjonarnych i listy kart na urządzeniach mobilnych. Widok ten zapewnia pełną funkcjonalność CRUD (Create, Read, Update, Delete), a także zaawansowane opcje sortowania, filtrowania i paginacji, co pozwala na efektywną analizę i kontrolę danych finansowych. Wszystkie interakcje, takie jak dodawanie, edycja czy usuwanie, odbywają się bez konieczności przeładowywania strony, co zapewnia płynne i nowoczesne doświadczenie użytkownika.

## 2. Routing widoku
Widok będzie dostępny pod następującą ścieżką:
-   **Ścieżka**: `/expenses`

## 3. Struktura komponentów
Komponenty zostaną zorganizowane w logiczną hierarchię, gdzie komponent nadrzędny zarządza stanem i przekazuje dane do komponentów podrzędnych.

```
/src/pages/expenses.astro
└── ExpensesPage.tsx (Client-side Component)
    ├── FilterControls.tsx
    ├── ExpensesDataTable.tsx (Desktop)
    ├── Pagination.tsx
    ├── ExpenseFormModal.tsx
    └── ConfirmationDialog.tsx
```

## 4. Szczegóły komponentów

### `ExpensesPage`
-   **Opis komponentu**: Główny komponent kontenerowy dla widoku wydatków. Odpowiedzialny za zarządzanie stanem (za pomocą hooka `useExpenses`), pobieranie danych z API oraz renderowanie komponentów podrzędnych.
-   **Główne elementy**: Wyświetla tytuł strony, przycisk "Dodaj wydatek" oraz kontenery dla filtrów i listy wydatków.
-   **Obsługiwane interakcje**: Otwieranie modalu dodawania, edycji i usuwania wydatku.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: `PaginatedExpensesDto`, `FilterState`, `SortState`.
-   **Propsy**: Brak.

### `FilterControls`
-   **Opis komponentu**: Zestaw kontrolek formularza umożliwiający filtrowanie listy wydatków według zakresu dat oraz sortowanie według kwoty lub daty.
-   **Główne elementy**: Komponenty `DateRangePicker` do wyboru dat, `Select` do wyboru pola sortowania i `Button` do zmiany kierunku sortowania.
-   **Obsługiwane interakcje**: Zmiana wartości w polach filtrów i sortowania.
-   **Obsługiwana walidacja**: Brak (walidacja może być dodana w celu zapewnienia, że data początkowa nie jest późniejsza niż końcowa).
-   **Typy**: `FilterState`, `SortState`.
-   **Propsy**:
    -   `filters: FilterState`
    -   `sort: SortState`
    -   `onFilterChange: (filters: FilterState) => void`
    -   `onSortChange: (sort: SortState) => void`

### `ExpensesDataTable`
-   **Opis komponentu**: Komponent wyświetlający wydatki w formie tabeli. Kolumny tabeli są interaktywne i umożliwiają sortowanie.
-   **Główne elementy**: Tabela (`<table>`) z `<thead>` i `<tbody>`. Wiersze (`<tr>`) reprezentują poszczególne wydatki, a komórki (`<td>`) zawierają dane oraz przyciski akcji (Edytuj, Usuń).
-   **Obsługiwane interakcje**: Kliknięcie na nagłówek kolumny w celu sortowania, kliknięcie przycisków akcji.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: `ExpenseDto[]`.
-   **Propsy**:
    -   `expenses: ExpenseDto[]`
    -   `onEdit: (expense: ExpenseDto) => void`
    -   `onDelete: (expenseId: string) => void`
    -   `onSort: (sortBy: 'date' | 'amount') => void`

### `Pagination`
-   **Opis komponentu**: Komponent do nawigacji między stronami listy wydatków.
-   **Główne elementy**: Przyciski "Poprzednia", "Następna" oraz wskaźniki numerów stron.
-   **Obsługiwane interakcje**: Kliknięcie przycisków nawigacyjnych.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: `Pagination`.
-   **Propsy**:
    -   `pagination: Pagination`
    -   `onPageChange: (page: number) => void`

### `ExpenseFormModal`
-   **Opis komponentu**: Modal (okno dialogowe) zawierający formularz do dodawania lub edycji wydatku.
-   **Główne elementy**: `Dialog`, `Form` z polami `Input` dla nazwy, kwoty, opisu oraz `DatePicker` dla daty.
-   **Obsługiwane interakcje**: Wprowadzanie danych, przesyłanie formularza, zamykanie modalu.
-   **Obsługiwana walidacja**:
    -   `name`: Wymagane, niepuste.
    -   `amount`: Wymagane, musi być liczbą większą od 0.
    -   `date`: Wymagana, prawidłowa data.
-   **Typy**: `ExpenseDto`, `CreateExpenseCommand`, `UpdateExpenseCommand`.
-   **Propsy**:
    -   `isOpen: boolean`
    -   `onClose: () => void`
    -   `onSave: (data: CreateExpenseCommand | UpdateExpenseCommand) => void`
    -   `initialData?: ExpenseDto`

### `ConfirmationDialog`
-   **Opis komponentu**: Prosty modal do potwierdzania akcji destrukcyjnych, np. usunięcia wydatku.
-   **Główne elementy**: `Dialog` z tytułem, opisem i przyciskami "Potwierdź" i "Anuluj".
-   **Obsługiwane interakcje**: Potwierdzenie lub anulowanie akcji.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: Brak.
-   **Propsy**:
    -   `isOpen: boolean`
    -   `onClose: () => void`
    -   `onConfirm: () => void`
    -   `title: string`
    -   `description: string`

## 5. Typy
Do implementacji widoku wykorzystane zostaną istniejące typy DTO zdefiniowane w `src/types.ts`. Dodatkowo, na poziomie komponentów, zdefiniowane zostaną lokalne typy do zarządzania stanem interfejsu.

-   **`ExpenseDto`**: Reprezentuje pojedynczy wydatek.
-   **`PaginatedExpensesDto`**: Struktura odpowiedzi dla listy wydatków z API.
-   **`CreateExpenseCommand`**: Obiekt danych do tworzenia nowego wydatku.
-   **`UpdateExpenseCommand`**: Obiekt danych do aktualizacji istniejącego wydatku.

-   **`FilterState` (ViewModel)**:
    ```typescript
    interface FilterState {
      startDate: string | null;
      endDate: string | null;
    }
    ```
-   **`SortState` (ViewModel)**:
    ```typescript
    interface SortState {
      sortBy: 'date' | 'amount';
      order: 'asc' | 'desc';
    }
    ```

## 6. Zarządzanie stanem
Zarządzanie stanem zostanie scentralizowane w niestandardowym hooku `useExpenses`. Takie podejście pozwoli na odizolowanie logiki biznesowej od komponentów UI, co zwiększy czytelność i ułatwi testowanie.

-   **Custom Hook: `useExpenses`**:
    -   **Cel**: Abstrakcja logiki pobierania, filtrowania, sortowania, paginacji i modyfikacji danych o wydatkach.
    -   **Zarządzany stan**:
        -   `data: PaginatedExpensesDto | null` - pobrane dane
        -   `filters: FilterState` - aktualny stan filtrów
        -   `sort: SortState` - aktualny stan sortowania
        -   `page: number` - aktualny numer strony
        -   `isLoading: boolean` - status ładowania danych
        -   `error: any` - ewentualny błąd
    -   **Udostępniane funkcje**:
        -   `setFilters`
        -   `setSort`
        -   `setPage`
        -   `addExpense`
        -   `updateExpense`
        -   `deleteExpense`
    -   **Rekomendacja**: Do obsługi zapytań API i cachingu zaleca się użycie biblioteki takiej jak `TanStack Query (React Query)`.

## 7. Integracja API
Integracja z API będzie realizowana poprzez wywołania `fetch` (lub klienta opartego na `axios` lub `TanStack Query`) wewnątrz hooka `useExpenses`.

-   **`GET /api/expenses`**:
    -   **Cel**: Pobranie listy wydatków.
    -   **Parametry**: `page`, `limit`, `sort_by`, `order`, `start_date`, `end_date`.
    -   **Typ odpowiedzi**: `PaginatedExpensesDto`.
-   **`POST /api/expenses`**:
    -   **Cel**: Utworzenie nowego wydatku.
    -   **Typ żądania**: `CreateExpenseCommand`.
    -   **Typ odpowiedzi**: `ExpenseDto`.
-   **`PATCH /api/expenses/{id}`**:
    -   **Cel**: Aktualizacja istniejącego wydatku.
    -   **Typ żądania**: `UpdateExpenseCommand`.
    -   **Typ odpowiedzi**: `ExpenseDto`.
-   **`DELETE /api/expenses/{id}`**:
    -   **Cel**: Usunięcie wydatku.
    -   **Typ odpowiedzi**: `204 No Content`.

## 8. Interakcje użytkownika
-   **Przeglądanie listy**: Użytkownik widzi listę wydatków. Może zmieniać strony za pomocą komponentu `Pagination`.
-   **Filtrowanie**: Użytkownik wybiera zakres dat w `FilterControls`, co powoduje ponowne pobranie i odświeżenie listy.
-   **Sortowanie**: Użytkownik klika na nagłówek kolumny w `ExpensesDataTable` lub zmienia opcje w `FilterControls`, co odświeża listę z nowym porządkiem.
-   **Dodawanie wydatku**: Użytkownik klika przycisk "Dodaj wydatek", co otwiera `ExpenseFormModal`. Po wypełnieniu i zapisaniu formularza, lista jest aktualizowana.
-   **Edycja wydatku**: Użytkownik klika przycisk "Edytuj" przy wydatku, co otwiera `ExpenseFormModal` z wypełnionymi danymi. Po zapisaniu zmian, lista jest aktualizowana.
-   **Usuwanie wydatku**: Użytkownik klika "Usuń", co otwiera `ConfirmationDialog`. Po potwierdzeniu, wydatek jest usuwany z listy (optymistycznie), a żądanie wysyłane jest do API.

## 9. Warunki i walidacja
Walidacja danych wejściowych będzie realizowana po stronie klienta w komponencie `ExpenseFormModal` przed wysłaniem żądania do API.

-   **Komponent**: `ExpenseFormModal`.
-   **Pola i warunki**:
    -   `name`: Musi być niepustym ciągiem znaków.
    -   `amount`: Musi być wartością numeryczną, większą od 0.
    -   `date`: Musi być wybraną, prawidłową datą.
-   **Stan interfejsu**: Przycisk "Zapisz" w formularzu jest nieaktywny, dopóki wszystkie warunki walidacji nie zostaną spełnione. Komunikaty o błędach są wyświetlane pod odpowiednimi polami.

## 10. Obsługa błędów
-   **Błędy sieciowe/API**: W przypadku problemów z komunikacją z serwerem (np. błąd 500), użytkownik zobaczy globalny komunikat o błędzie (np. w formie komponentu `Toast`).
-   **Błędy walidacji (422)**: Jeśli API zwróci błąd walidacji, komunikaty te zostaną wyświetlone pod odpowiednimi polami w `ExpenseFormModal`.
-   **Nie znaleziono zasobu (404)**: Przy próbie edycji/usunięcia nieistniejącego wydatku, użytkownik zobaczy komunikat informujący o sytuacji, a lista zostanie odświeżona.
-   **Błąd optymistycznego UI**: W przypadku niepowodzenia operacji usunięcia po optymistycznym usunięciu elementu z UI, element zostanie przywrócony na listę, a użytkownik otrzyma powiadomienie o błędzie.

## 11. Kroki implementacji
1.  **Struktura plików**: Utworzenie plików dla wszystkich zdefiniowanych komponentów (`ExpensesPage.tsx`, `FilterControls.tsx` itd.) oraz strony Astro (`expenses.astro`).
2.  **Hook `useExpenses`**: Implementacja logiki zarządzania stanem, w tym funkcji do pobierania i modyfikacji danych (początkowo można użyć `useEffect` i `fetch`, docelowo `TanStack Query`).
3.  **Komponent `ExpensesPage`**: Zintegrowanie hooka `useExpenses` i stworzenie szkieletu strony, przekazując stan i funkcje do przyszłych komponentów podrzędnych.
4.  **Komponenty wyświetlające**: Implementacja `ExpensesDataTable`
5.  **Filtrowanie i sortowanie**: Implementacja komponentu `FilterControls` i podłączenie go do stanu zarządzanego przez `useExpenses`.
6.  **Paginacja**: Implementacja komponentu `Pagination` i połączenie go ze stanem.
7.  **Modal formularza**: Stworzenie `ExpenseFormModal` z walidacją po stronie klienta (np. przy użyciu biblioteki `zod` i `react-hook-form`).
8.  **Logika CRUD**: Zaimplementowanie funkcji `addExpense`, `updateExpense` i `deleteExpense` w hooku `useExpenses` i podłączenie ich do interakcji użytkownika (przyciski w modalach i na liście).
9.  **Modal potwierdzenia**: Implementacja `ConfirmationDialog` dla operacji usuwania.
10. **Obsługa stanów UI**: Dodanie obsługi stanów ładowania (np. wyświetlanie spinnerów), pustych (komunikat "Brak wydatków") i błędów.
11. **Stylowanie i dopracowanie**: Finalne stylowanie wszystkich komponentów za pomocą Tailwind CSS, zgodnie z systemem designu `shadcn/ui`.
12. **Testowanie**: Przeprowadzenie manualnych testów wszystkich funkcjonalności, w tym przypadków brzegowych i obsługi błędów.
