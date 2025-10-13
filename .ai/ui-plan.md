# Architektura UI dla CashBuddy

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika aplikacji CashBuddy została zaprojektowana w celu zapewnienia prostego, responsywnego i intuicyjnego doświadczenia. Opiera się na dwóch głównych, oddzielnych układach (layoutach):

-   **Układ publiczny**: Minimalistyczny, przeznaczony dla niezalogowanych użytkowników, obejmujący strony logowania i rejestracji.
-   **Układ główny aplikacji**: Przeznaczony dla zalogowanych użytkowników, zawierający stały nagłówek z nawigacją i menu użytkownika, który otacza dynamiczną treść poszczególnych widoków.

Aplikacja wykorzystuje architekturę zorientowaną na komponenty, co zapewnia spójność i możliwość ponownego wykorzystania elementów interfejsu. Operacje CRUD (tworzenie, odczyt, aktualizacja, usuwanie) na wydatkach odbywają się w oknach modalnych, co minimalizuje przeładowania strony i utrzymuje użytkownika w kontekście.

Zarządzanie stanem serwera (np. pobieranie danych) będzie obsługiwane przez dedykowaną bibliotekę (np. TanStack Query), co zapewni buforowanie danych, automatyczne odświeżanie interfejsu po mutacjach oraz obsługę stanów ładowania i błędów. Dostęp do chronionych widoków (`/dashboard`, `/expenses`, `/settings`) jest kontrolowany przez oprogramowanie pośredniczące (middleware), które automatycznie przekierowuje niezalogowanych użytkowników do strony logowania.

## 2. Lista widoków

### Widok: Logowanie
-   **Ścieżka**: `/login`
-   **Główny cel**: Uwierzytelnienie istniejącego użytkownika i umożliwienie mu dostępu do aplikacji.
-   **Kluczowe informacje do wyświetlenia**: Formularz logowania z polami na adres e-mail i hasło.
-   **Kluczowe komponenty**: `AuthLayout`, `LoginForm`, `Input`, `Button`, `Toast` (dla błędów).
-   **Pokryte historyjki użytkownika**: `US-002`
-   **UX, dostępność i względy bezpieczeństwa**:
    -   **UX**: Jasne komunikaty o błędach (np. "Nieprawidłowy e-mail lub hasło"). Wskaźnik ładowania na przycisku po wysłaniu formularza. Link do strony rejestracji.
    -   **Dostępność**: Poprawne etykiety (`<label>`) dla pól formularza. Obsługa nawigacji za pomocą klawiatury i fokusu.
    -   **Bezpieczeństwo**: Komunikacja z API odbywa się przez HTTPS. Brak ujawniania informacji, czy to e-mail, czy hasło jest nieprawidłowe.

### Widok: Rejestracja
-   **Ścieżka**: `/register`
-   **Główny cel**: Umożliwienie nowym użytkownikom stworzenia konta w aplikacji.
-   **Kluczowe informacje do wyświetlenia**: Formularz rejestracji z polami na adres e-mail i hasło.
-   **Kluczowe komponenty**: `AuthLayout`, `RegisterForm`, `Input`, `Button`, `Toast`.
-   **Pokryte historyjki użytkownika**: `US-001`
-   **UX, dostępność i względy bezpieczeństwa**:
    -   **UX**: Walidacja hasła w czasie rzeczywistym (np. minimalna długość). Po udanej rejestracji użytkownik jest automatycznie logowany i przekierowywany na Dashboard.
    -   **Dostępność**: Poprawne etykiety dla pól formularza. Walidacja jest komunikowana w sposób dostępny (np. przez `aria-describedby`).
    -   **Bezpieczeństwo**: Wymagania dotyczące siły hasła są jasno określone.

### Widok: Dashboard
-   **Ścieżka**: `/dashboard`
-   **Główny cel**: Przedstawienie zagregowanego podsumowania finansowego, które pozwala użytkownikowi szybko ocenić swoją sytuację.
-   **Kluczowe informacje do wyświetlenia**:
    1.  Suma wszystkich wydatków.
    2.  Suma wydatków w bieżącym miesiącu.
    3.  Wykres liniowy przedstawiający sumę wydatków w poszczególnych miesiącach.
    4.  Lista 5 największych wydatków.
-   **Kluczowe komponenty**: `AppLayout`, `StatCard`, `MonthlyExpensesChart`, `TopExpensesList`, `SkeletonLoader`, `EmptyState`.
-   **Pokryte historyjki użytkownika**: `US-008`, `US-009`, `US-010`, `US-011`
-   **UX, dostępność i względy bezpieczeństwa**:
    -   **UX**: Układ jest w pełni responsywny (komponenty układają się w jednej kolumnie na mobile). `Skeleton screens` są wyświetlane podczas ładowania danych. Jeśli brak danych, wyświetlany jest komunikat z wezwaniem do działania (np. "Dodaj swój pierwszy wydatek").
    -   **Dostępność**: Wykres jest interaktywny, z etykietami (tooltips) i posiada tekstową alternatywę (np. tabela z danymi) dla czytników ekranu. Wszystkie elementy są poprawnie opisane.
    -   **Bezpieczeństwo**: Wszystkie dane są pobierane z `GET /api/dashboard`, który jest chroniony i zwraca dane tylko dla zalogowanego użytkownika.

### Widok: Wydatki
-   **Ścieżka**: `/expenses`
-   **Główny cel**: Umożliwienie przeglądania, dodawania, edytowania i usuwania wszystkich wydatków.
-   **Kluczowe informacje do wyświetlenia**: Lista wydatków z możliwością sortowania, filtrowania i paginacji.
-   **Kluczowe komponenty**: `AppLayout`, `ExpensesDataTable` (desktop), `ExpensesCardList` (mobile), `FilterControls`, `Pagination`, `Button` ("Dodaj wydatek"), `ExpenseFormModal`, `ConfirmationDialog`.
-   **Pokryte historyjki użytkownika**: `US-004`, `US-005`, `US-006`, `US-007`
-   **UX, dostępność i względy bezpieczeństwa**:
    -   **UX**: Responsywna lista (tabela na desktopie, karty na mobile). Dodawanie i edycja w oknie modalnym bez przeładowania strony. Usuwanie zaimplementowane jako optymistyczne UI z potwierdzeniem. Stany ładowania i puste są obsługiwane.
    -   **Dostępność**: Tabela ma odpowiednią strukturę (`<thead>`, `<tbody>`, `scope`). Wszystkie interaktywne elementy (przyciski, linki) są dostępne z klawiatury i poprawnie opisane.
    -   **Bezpieczeństwo**: Wszystkie operacje (CUD) wysyłają żądania do chronionych punktów końcowych API (`/api/expenses`).

### Widok: Ustawienia
-   **Ścieżka**: `/settings`
-   **Główny cel**: Zapewnienie użytkownikowi możliwości zarządzania swoim kontem.
-   **Kluczowe informacje do wyświetlenia**: Formularz zmiany hasła, sekcja "strefa niebezpieczna" z opcją usunięcia konta.
-   **Kluczowe komponenty**: `AppLayout`, `ChangePasswordForm`, `DangerZone`, `Button`, `ConfirmationDialog`.
-   **Pokryte historyjki użytkownika**: `US-012`, `US-013`
-   **UX, dostępność i względy bezpieczeństwa**:
    -   **UX**: Usunięcie konta jest operacją destrukcyjną, dlatego jest wyraźnie oddzielone wizualnie i wymaga dodatkowego potwierdzenia (np. wpisania hasła lub frazy).
    -   **Dostępność**: Wszystkie pola formularzy i przyciski są odpowiednio oetykietowane.
    -   **Bezpieczeństwo**: Zmiana hasła wymaga podania starego hasła. Usunięcie konta jest nieodwracalne i wymaga potwierdzenia.

## 3. Mapa podróży użytkownika

1.  **Rejestracja i Pierwsze Logowanie**:
    -   Nowy użytkownik trafia na `/login`.
    -   Klika link do `/register`.
    -   Wypełnia formularz rejestracyjny. Po pomyślnej walidacji i utworzeniu konta jest automatycznie logowany.
    -   Zostaje przekierowany na `/dashboard`.
2.  **Zarządzanie Wydatkami (Główny Przepływ)**:
    -   Użytkownik z `/dashboard` przechodzi do `/expenses` przez główną nawigację.
    -   Na stronie `/expenses` klika przycisk "Dodaj wydatek".
    -   Otwiera się modal `ExpenseFormModal`, gdzie użytkownik wprowadza dane i zapisuje.
    -   Modal się zamyka, a lista wydatków na `/expenses` automatycznie się odświeża, wyświetlając nowy wpis. Pojawia się powiadomienie "toast" o sukcesie.
    -   Użytkownik znajduje wydatek na liście i klika ikonę "Edytuj".
    -   Otwiera się ten sam modal `ExpenseFormModal`, ale wypełniony danymi edytowanego wydatku. Użytkownik wprowadza zmiany i zapisuje.
    -   Lista ponownie się odświeża.
    -   Użytkownik klika ikonę "Usuń" przy wydatku.
    -   Pojawia się `ConfirmationDialog` z prośbą o potwierdzenie.
    -   Po potwierdzeniu, wydatek znika z listy (optymistyczne UI), a w tle wysyłane jest żądanie `DELETE`.
3.  **Wylogowanie**:
    -   Użytkownik klika na swój awatar w nagłówku, co otwiera menu rozwijane.
    -   Wybiera opcję "Wyloguj".
    -   Sesja jest kończona, a użytkownik zostaje przekierowany na stronę `/login`.

## 4. Układ i struktura nawigacji

-   **Nawigacja dla niezalogowanych użytkowników**: Proste przełączanie między stronami `/login` i `/register` za pomocą linków na formularzach.
-   **Nawigacja główna (dla zalogowanych)**:
    -   Znajduje się w stałym nagłówku (`Header`) w ramach `AppLayout`.
    -   Składa się z linków nawigacyjnych:
        -   **Dashboard** (`/dashboard`)
        -   **Wydatki** (`/expenses`)
    -   Po prawej stronie nagłówka znajduje się awatar użytkownika.
-   **Menu użytkownika**:
    -   Aktywowane przez kliknięcie awatara.
    -   Jest to menu rozwijane (`Dropdown`) zawierające:
        -   Link do **Ustawień** (`/settings`)
        -   Przycisk **Wyloguj**

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów, które będą stanowić podstawę interfejsu użytkownika:

-   **`Button`**: Generyczny przycisk z wariantami (główny, drugorzędny, destrukcyjny) i obsługą stanu ładowania.
-   **`Input`**: Pole formularza z obsługą etykiet, walidacji i komunikatów o błędach.
-   **`Card`**: Komponent do wyświetlania treści w ramce, używany na Dashboardzie i w mobilnej liście wydatków.
-   **`Modal`**: Komponent okna modalnego używany do formularzy dodawania/edycji oraz wyświetlania dodatkowych informacji.
-   **`Toast`**: Globalne powiadomienia (np. o sukcesie lub błędzie), które pojawiają się na krótki czas.
-   **`SkeletonLoader`**: Komponent zastępczy (placeholder) wyświetlany podczas ładowania danych, poprawiający postrzeganą wydajność.
-   **`EmptyState`**: Komponent wyświetlany, gdy lista danych jest pusta, często z wezwaniem do działania (CTA).
-   **`ExpenseForm`**: Formularz do dodawania i edycji wydatków, używany wewnątrz `ExpenseFormModal`.
-   **`ConfirmationDialog`**: Prosty modal z prośbą o potwierdzenie akcji (np. usunięcia).
-   **`UserMenuDropdown`**: Menu rozwijane pod awatarem użytkownika w nagłówku.
-   **`AppLayout` / `AuthLayout`**: Główne komponenty układu strony dla zalogowanych i niezalogowanych użytkowników.
