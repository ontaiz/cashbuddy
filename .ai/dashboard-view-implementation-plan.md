# Plan implementacji widoku Dashboard

## 1. Przegląd
Widok Dashboard jest głównym panelem informacyjnym dla zalogowanego użytkownika. Jego celem jest przedstawienie zwięzłego, zagregowanego podsumowania finansowego, które pozwala na szybką ocenę aktywności i trendów w wydatkach. Widok ten wizualizuje kluczowe wskaźniki, takie jak suma wszystkich wydatków, wydatki w bieżącym miesiącu, a także przedstawia dane w formie wykresu i listy największych kosztów.

## 2. Routing widoku
Widok będzie dostępny pod chronioną ścieżką, która wymaga autoryzacji użytkownika:
-   **Ścieżka**: `/dashboard`

## 3. Struktura komponentów
Komponenty zostaną zorganizowane w hierarchiczną strukturę, aby zapewnić reużywalność i czytelność kodu. Głównym kontenerem będzie `DashboardPage`, który zarządza stanem i danymi.

```
/dashboard.astro
└── AppLayout.astro
    └── DashboardPage.tsx (client:load)
        ├── if (isLoading) return <DashboardSkeleton />
        ├── if (isError) return <ErrorComponent />
        ├── if (isEmpty) return <EmptyState />
        └── if (data)
            ├── div (grid layout)
            │   ├── StatCard.tsx (Suma wszystkich wydatków)
            │   └── StatCard.tsx (Wydatki w bieżącym miesiącu)
            ├── MonthlyExpensesChart.tsx
            └── TopExpensesList.tsx
```

## 4. Szczegóły komponentów
### `DashboardPage.tsx`
- **Opis komponentu**: Główny komponent widoku Dashboard, renderowany po stronie klienta. Odpowiada za pobieranie danych z API, zarządzanie stanami (ładowanie, błąd, brak danych) oraz renderowanie odpowiednich komponentów podrzędnych.
- **Główne elementy**: Wykorzystuje niestandardowy hook `useDashboardData` do obsługi logiki pobierania danych. Warunkowo renderuje `DashboardSkeleton`, komponent błędu, `EmptyState` lub główny layout z danymi.
- **Obsługiwane interakcje**: Inicjuje pobieranie danych przy montowaniu komponentu.
- **Obsługiwana walidacja**: Sprawdza, czy dane istnieją, aby zdecydować o renderowaniu `EmptyState`.
- **Typy**: `DashboardDataDto`
- **Propsy**: Brak.

### `StatCard.tsx`
- **Opis komponentu**: Reużywalny komponent do wyświetlania pojedynczej, kluczowej metryki (np. sumy wydatków). Składa się z tytułu i sformatowanej wartości.
- **Główne elementy**: `Card` z `shadcn/ui`, zawierający `CardHeader` z `CardTitle` oraz `CardContent` z wartością metryki.
- **Obsługiwane interakcje**: Brak.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `string`, `number`.
- **Propsy**:
    - `title: string` - Tytuł metryki (np. "Suma wydatków").
    - `value: number` - Wartość liczbowa do wyświetlenia.
    - `icon?: React.ReactNode` - Opcjonalna ikona.

### `MonthlyExpensesChart.tsx`
- **Opis komponentu**: Komponent wizualizujący sumę wydatków w poszczególnych miesiącach za pomocą wykresu liniowego. Zapewnia interaktywne etykiety (tooltips) i tekstową alternatywę dla dostępności.
- **Główne elementy**: Wykorzystuje komponenty `Chart` z `shadcn/ui` (oparte na `recharts`). Zawiera również ukrytą tabelę z danymi jako alternatywę dla czytników ekranu.
- **Obsługiwane interakcje**: Podświetlanie punktu danych i wyświetlanie tooltipa po najechaniu myszą.
- **Obsługiwana walidacja**: Poprawnie renderuje wykres nawet przy braku lub jednym punkcie danych.
- **Typy**: `MonthlySummaryDto[]`.
- **Propsy**:
    - `data: MonthlySummaryDto[]` - Tablica obiektów z danymi miesięcznymi.

### `TopExpensesList.tsx`
- **Opis komponentu**: Wyświetla listę 5 największych wydatków użytkownika. Każdy element listy zawiera nazwę wydatku, jego kwotę i datę.
- **Główne elementy**: `Card` z `shadcn/ui`, wewnątrz którego znajduje się lista (`<ul>`, `<li>`) lub komponent `Table` do prezentacji danych.
- **Obsługiwane interakcje**: Brak.
- **Obsługiwana walidacja**: Wyświetla komunikat, jeśli lista wydatków jest pusta.
- **Typy**: `TopExpenseDto[]`.
- **Propsy**:
    - `expenses: TopExpenseDto[]` - Tablica 5 największych wydatków.

### `DashboardSkeleton.tsx`
- **Opis komponentu**: Komponent typu "szkielet", który naśladuje układ docelowego widoku i jest wyświetlany podczas ładowania danych.
- **Główne elementy**: Układ siatki (`grid`) z komponentami `Skeleton` z `shadcn/ui`, które zastępują `StatCard`, `MonthlyExpensesChart` i `TopExpensesList`.
- **Obsługiwane interakcje**: Brak.
- **Obsługiwana walidacja**: Brak.
- **Typy**: Brak.
- **Propsy**: Brak.

### `EmptyState.tsx`
- **Opis komponentu**: Wyświetlany, gdy użytkownik nie ma jeszcze żadnych wydatków. Zachęca do podjęcia pierwszej akcji.
- **Główne elementy**: Komunikat tekstowy (np. "Nie dodałeś jeszcze żadnych wydatków") oraz przycisk (`Button`) z wezwaniem do działania (np. "Dodaj pierwszy wydatek"), który przekierowuje na stronę `/expenses`.
- **Obsługiwane interakcje**: Kliknięcie przycisku nawiguje do innej strony.
- **Obsługiwana walidacja**: Brak.
- **Typy**: Brak.
- **Propsy**: Brak.

## 5. Typy
Widok będzie korzystał z typów zdefiniowanych w `src/types.ts`, które precyzyjnie odpowiadają strukturze danych z API. Nie ma potrzeby tworzenia dodatkowych typów ViewModel, ponieważ DTO są wystarczająco dobrze dopasowane do potrzeb widoku.
-   **`DashboardDataDto`**: Główny obiekt danych dla całego widoku.
    -   `total_expenses: number`
    -   `current_month_expenses: number`
    -   `top_5_expenses: TopExpenseDto[]`
    -   `monthly_summary: MonthlySummaryDto[]`
-   **`TopExpenseDto`**: Reprezentuje pojedynczy wydatek na liście top 5.
    -   `id: string`
    -   `name: string`
    -   `amount: number`
    -   `date: string`
-   **`MonthlySummaryDto`**: Reprezentuje sumę wydatków w danym miesiącu.
    -   `month: string` (format "YYYY-MM")
    -   `total: number`

## 6. Zarządzanie stanem
Zarządzanie stanem będzie realizowane lokalnie w komponencie `DashboardPage.tsx` przy użyciu niestandardowego hooka `useDashboardData`.
-   **Hook `useDashboardData`**:
    -   **Cel**: Enkapsulacja logiki pobierania danych, obsługi stanu ładowania oraz błędów.
    -   **Stany wewnętrzne**:
        -   `data: DashboardDataDto | null`
        -   `isLoading: boolean`
        -   `error: Error | null`
    -   **Funkcjonalność**: Wykorzystuje `useEffect` do jednorazowego pobrania danych z API po zamontowaniu komponentu. Zwraca obiekt ze stanami, które `DashboardPage` wykorzystuje do warunkowego renderowania.

## 7. Integracja API
Integracja z backendem opiera się na pojedynczym punkcie końcowym.
-   **Endpoint**: `GET /api/dashboard`
-   **Opis**: Pobiera wszystkie zagregowane dane potrzebne do wyświetlenia w panelu Dashboard.
-   **Typ żądania**: Brak (dane autoryzacyjne są przesyłane automatycznie, np. w ciasteczku sesyjnym).
-   **Typ odpowiedzi (sukces)**: `DashboardDataDto`
-   **Obsługa w kodzie**: Wywołanie `fetch('/api/dashboard')` zostanie umieszczone w hooku `useDashboardData`. Odpowiedź zostanie sparsowana do formatu JSON i zapisana w stanie.

## 8. Interakcje użytkownika
-   **Wejście na stronę**: Użytkownik nawiguje do `/dashboard`.
    -   **Rezultat**: Wyświetlany jest `DashboardSkeleton`. Po pomyślnym załadowaniu danych, widok jest zastępowany pełną treścią.
-   **Najechanie na wykres**: Użytkownik przesuwa kursor nad punktem danych na wykresie miesięcznym.
    -   **Rezultat**: Pojawia się dymek (tooltip) z dokładną nazwą miesiąca i sumą wydatków.
-   **Kliknięcie "Dodaj wydatek" w stanie pustym**: Użytkownik klika przycisk na ekranie `EmptyState`.
    -   **Rezultat**: Użytkownik jest przekierowywany na stronę `/expenses`, gdzie może dodać nowy wydatek.

## 9. Warunki i walidacja
Widok jest przeznaczony tylko do odczytu, więc nie ma walidacji pól formularza. Główne warunki dotyczą stanu danych:
-   **Stan ładowania**: Weryfikowany przez `isLoading === true`. Dotyczy `DashboardPage` i skutkuje renderowaniem `DashboardSkeleton`.
-   **Stan błędu**: Weryfikowany przez `error !== null`. Dotyczy `DashboardPage` i skutkuje renderowaniem komunikatu o błędzie.
-   **Brak danych (pusty stan)**: Weryfikowany przez `data.total_expenses === 0`. Dotyczy `DashboardPage` i skutkuje renderowaniem `EmptyState`.

## 10. Obsługa błędów
-   **Błąd sieci lub serwera (np. 500)**: Hook `useDashboardData` przechwyci błąd z `fetch`, ustawi stan `error`. Komponent `DashboardPage` wyświetli generyczny komunikat o błędzie, np. "Nie udało się załadować danych. Spróbuj ponownie później."
-   **Brak autoryzacji (401)**: Logika w `useDashboardData` sprawdzi status odpowiedzi. W przypadku kodu `401`, użytkownik zostanie automatycznie przekierowany na stronę logowania (`/login`).
-   **Brak wydatków**: API zwróci kod `200` z zerowymi wartościami. UI poprawnie zinterpretuje ten stan i wyświetli komponent `EmptyState` zamiast pustych wykresów i list.

## 11. Kroki implementacji
1.  **Stworzenie plików**: Utworzenie plików dla nowych komponentów: `DashboardPage.tsx`, `StatCard.tsx`, `MonthlyExpensesChart.tsx`, `TopExpensesList.tsx`, `DashboardSkeleton.tsx`, `EmptyState.tsx` w katalogu `src/components/dashboard/`.
2.  **Stworzenie hooka**: Implementacja hooka `useDashboardData` w osobnym pliku `src/components/dashboard/hooks/useDashboardData.ts` z logiką pobierania danych i zarządzania stanem.
3.  **Implementacja komponentów szkieletu i stanu pustego**: Stworzenie `DashboardSkeleton` z użyciem komponentów `Skeleton` z `shadcn/ui` oraz `EmptyState` z odpowiednim komunikatem i przyciskiem.
4.  **Implementacja komponentów danych**: Implementacja `StatCard`, `MonthlyExpensesChart` (z integracją biblioteki wykresów) i `TopExpensesList`. Zastosowanie funkcji formatujących walutę (`Intl.NumberFormat`) i daty.
5.  **Złożenie widoku w `DashboardPage`**: Połączenie wszystkich komponentów w `DashboardPage.tsx`. Implementacja logiki warunkowego renderowania w zależności od stanu (ładowanie, błąd, dane, stan pusty).
6.  **Utworzenie strony Astro**: Stworzenie strony `/src/pages/dashboard.astro`, która zaimportuje i wyrenderuje komponent `DashboardPage.tsx` z dyrektywą `client:load`. Zastosowanie `AppLayout` do zachowania spójności wizualnej.
7.  **Stylowanie i responsywność**: Dopracowanie stylów za pomocą Tailwind CSS, zapewnienie, że układ jest w pełni responsywny i poprawnie wyświetla się na urządzeniach mobilnych (układ jednokolumnowy).
8.  **Testowanie**: Ręczne przetestowanie wszystkich scenariuszy: pomyślne załadowanie, stan ładowania, stan błędu, brak danych oraz responsywność.
