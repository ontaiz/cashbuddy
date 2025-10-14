<architecture_analysis>
Na podstawie analizy pliku `prd.md`, zidentyfikowałem kluczowe elementy architektury UI dla modułu uwierzytelniania i zarządzania kontem w aplikacji CashBuddy. Poniżej znajduje się szczegółowy opis komponentów, stron i przepływu danych.

### 1. Komponenty

- **`MainLayout.astro`**: Główny layout aplikacji, który zarządza wyświetlaniem treści chronionych oraz publicznych. Będzie zawierał komponent `AuthButton`.
- **`AuthLayout.astro`**: Specjalny layout dla stron logowania i rejestracji, posiadający uproszczoną strukturę bez elementów nawigacyjnych dla zalogowanych użytkowników.
- **`LoginForm.tsx`**: Formularz logowania z polami na e-mail i hasło. Odpowiedzialny za walidację danych i komunikację z API w celu uwierzytelnienia użytkownika.
- **`RegisterForm.tsx`**: Formularz rejestracji, zbierający e-mail i hasło. Podobnie jak `LoginForm`, waliduje dane i wysyła je do API.
- **`UserPanel.tsx`**: Komponent na stronie profilu użytkownika, który umożliwia dostęp do formularza zmiany hasła i opcji usunięcia konta.
- **`ChangePasswordForm.tsx`**: Formularz do zmiany hasła, wymagający podania starego i nowego hasła.
- **`DeleteAccountDialog.tsx`**: Dialog potwierdzający usunięcie konta, aby zapobiec przypadkowemu usunięciu danych.
- **`AuthButton.tsx`**: Komponent w nagłówku, który dynamicznie wyświetla przycisk "Zaloguj" dla gości lub "Wyloguj" i awatar dla zalogowanych użytkowników.
- **`Welcome.astro`**: Komponent powitalny, który jest widoczny dla niezalogowanych użytkowników.

### 2. Strony

- **`/` (Strona Główna)**: Przekierowuje do `/login`, jeśli użytkownik nie jest zalogowany, lub do `/expenses`, jeśli jest zalogowany.
- **`/login`**: Strona logowania, wykorzystująca `AuthLayout.astro` i zawierająca komponent `LoginForm.tsx`.
- **`/register`**: Strona rejestracji, oparta na `AuthLayout.astro` z komponentem `RegisterForm.tsx`.
- **`/expenses`**: Główna strona aplikacji z listą wydatków, dostępna tylko dla zalogowanych użytkowników. Korzysta z `MainLayout.astro`.
- **`/account`**: Strona profilu użytkownika, gdzie znajduje się `UserPanel.tsx`, dostępna tylko po zalogowaniu.

### 3. Przepływ Danych

1.  Użytkownik wchodzi na stronę główną. Middleware sprawdza stan sesji.
2.  Jeśli użytkownik nie jest zalogowany, zostaje przekierowany na stronę `/login`.
3.  Na stronie `/login` komponent `LoginForm.tsx` wysyła dane do API. Po pomyślnym zalogowaniu, sesja jest tworzona, a użytkownik jest przekierowywany na stronę `/expenses`.
4.  Podobnie działa proces rejestracji na stronie `/register` z użyciem `RegisterForm.tsx`.
5.  Zalogowany użytkownik widzi w nagłówku przycisk "Wyloguj" (`AuthButton.tsx`), który po kliknięciu kończy sesję i przekierowuje na `/login`.
6.  Na stronie `/account` komponent `UserPanel.tsx` zarządza stanem formularzy zmiany hasła i dialogu usunięcia konta.

### 4. Aktualizacje

- **Nowe komponenty**: `LoginForm`, `RegisterForm`, `UserPanel`, `ChangePasswordForm`, `DeleteAccountDialog`, `AuthButton`.
- **Nowe strony**: `/login`, `/register`, `/account`.
- **Nowe layouty**: `AuthLayout`.
- **Zmiany w istniejącej strukturze**: `MainLayout` zostanie zaktualizowany o logikę sesji i komponent `AuthButton`. Middleware będzie zarządzać routingiem w zależności od stanu uwierzytelnienia.
</architecture_analysis>
<mermaid_diagram>
```mermaid
flowchart TD
    classDef newComponent fill:#cce5ff,stroke:#333,stroke-width:2px;
    classDef updatedComponent fill:#fff2cc,stroke:#333,stroke-width:2px;
    classDef page fill:#e5f7e5,stroke:#333,stroke-width:1px;
    classDef layout fill:#f0e6ff,stroke:#333,stroke-width:1px;
    classDef shared fill:#ffe6e6,stroke:#333,stroke-width:1px;

    subgraph "Strony (Astro)"
        LoginPage["/login"]:::page
        RegisterPage["/register"]:::page
        ExpensesPage["/expenses"]:::page
        AccountPage["/account"]:::page
    end

    subgraph "Layouty (Astro)"
        MainLayout["MainLayout.astro"]:::layout
        AuthLayout["AuthLayout.astro"]:::layout
    end

    subgraph "Komponenty Współdzielone (React)"
        AuthButton["AuthButton.tsx"]:::newComponent
        Header["Header (w MainLayout)"]:::updatedComponent
    end

    subgraph "Komponenty Stron (React)"
        subgraph "Strona Logowania"
            LoginForm["LoginForm.tsx"]:::newComponent
        end
        subgraph "Strona Rejestracji"
            RegisterForm["RegisterForm.tsx"]:::newComponent
        end
        subgraph "Strona Profilu"
            UserPanel["UserPanel.tsx"]:::newComponent
            ChangePasswordForm["ChangePasswordForm.tsx"]:::newComponent
            DeleteAccountDialog["DeleteAccountDialog.tsx"]:::newComponent
        end
        subgraph "Strona Główna (Niezalogowany)"
            Welcome["Welcome.astro"]:::shared
        end
    end

    subgraph "Zarządzanie Stanem i Logiką"
        SessionState["Zarządzanie Sesją (Supabase)"]
        Middleware["Middleware (Astro)"]
        ApiEndpoints["API Endpoints (Astro)"]
    end

    %% Relacje
    User -- "Wchodzi na stronę" --> Middleware
    Middleware -- "Niezalogowany" --> LoginPage
    Middleware -- "Zalogowany" --> ExpensesPage

    LoginPage -- "Używa" --> AuthLayout
    RegisterPage -- "Używa" --> AuthLayout
    ExpensesPage -- "Używa" --> MainLayout
    AccountPage -- "Używa" --> MainLayout

    AuthLayout -- "Renderuje" --> LoginForm
    AuthLayout -- "Renderuje" --> RegisterForm
    
    LoginPage -- "Zawiera" --> LoginForm
    RegisterPage -- "Zawiera" --> RegisterForm
    AccountPage -- "Zawiera" --> UserPanel

    MainLayout -- "Zawiera" --> Header
    Header -- "Zawiera" --> AuthButton
    
    UserPanel -- "Otwiera" --> ChangePasswordForm
    UserPanel -- "Otwiera" --> DeleteAccountDialog

    LoginForm -- "Wysyła dane" --> ApiEndpoints
    RegisterForm -- "Wysyła dane" --> ApiEndpoints
    ChangePasswordForm -- "Wysyła dane" --> ApiEndpoints
    DeleteAccountDialog -- "Wysyła dane" --> ApiEndpoints

    ApiEndpoints -- "Modyfikuje" --> SessionState

    AuthButton -- "Czyta stan" --> SessionState
    Middleware -- "Czyta stan" --> SessionState
```
</mermaid_diagram>
