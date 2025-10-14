# Specyfikacja Techniczna - Moduł Autentykacji CashBuddy

Na podstawie dokumentu wymagań produktu (PRD) oraz zdefiniowanego stosu technologicznego, niniejszy dokument opisuje architekturę i implementację modułu uwierzytelniania użytkowników w aplikacji CashBuddy.

## 1. Architektura Interfejsu Użytkownika (Frontend)

### 1.1. Strony i Layouty (Astro)

Aplikacja zostanie rozszerzona o dedykowane strony do obsługi procesów autentykacji. Wykorzystany zostanie nowy layout `AuthLayout.astro` dla stron publicznych (logowanie, rejestracja) oraz `MainLayout.astro` dla stron wymagających zalogowania.

#### Nowe strony:
-   `src/pages/login.astro`: Strona logowania, dostępna dla niezalogowanych użytkowników. Będzie renderować komponent `LoginForm`.
-   `src/pages/register.astro`: Strona rejestracji, dostępna dla niezalogowanych użytkowników. Będzie renderować komponent `RegisterForm`.
-   `src/pages/password-reset.astro`: Strona do inicjowania procesu resetowania hasła. Będzie renderować `PasswordResetForm`.
-   `src/pages/update-password.astro`: Strona, na którą użytkownik zostanie przekierowany z maila w celu ustawienia nowego hasła. Będzie renderować `UpdatePasswordForm`.

#### Modyfikacja Layoutów:
-   **`src/layouts/AuthLayout.astro`**: Prosty layout dla stron publicznych, zawierający podstawową strukturę HTML, nagłówek i stopkę, bez elementów nawigacyjnych dla zalogowanego użytkownika.
-   **`src/layouts/MainLayout.astro`**: Główny layout aplikacji dla stron wymagających autentykacji. Logika sprawdzania sesji i przekierowania niezalogowanych użytkowników zostanie umieszczona w middleware. Layout ten będzie renderował swoje `sloty`, a strony go używające (np. `expenses.astro`) będą odpowiedzialne za pobranie danych użytkownika z `Astro.locals` i przekazanie ich jako `props` do komponentów React.

### 1.2. Komponenty Interaktywne (React)

Wprowadzony zostanie kliencki "auth store" (np. oparty o Zustand lub React Context) do globalnego zarządzania stanem uwierzytelnienia w części aplikacji napisanej w React.

Główny komponent React na stronie (np. `ExpensesPage.tsx`) otrzyma dane zalogowanego użytkownika jako `props` z Astro. Na podstawie tych danych zainicjalizuje stan w "auth store". Pozostałe komponenty będą korzystać z tego store'u, aby uzyskać dostęp do informacji o użytkowniku i jego sesji.

-   **`src/components/auth/LoginForm.tsx`**: Formularz logowania z polami na e-mail i hasło. Komponent będzie zarządzał swoim stanem, walidacją pól i komunikacją z Supabase w celu zalogowania użytkownika.
-   **`src/components/auth/RegisterForm.tsx`**: Formularz rejestracji z polami na e-mail i hasło. Będzie odpowiedzialny za walidację (e-mail, siła hasła) i wywołanie funkcji rejestracji w Supabase. Po pomyślnej rejestracji wyświetli komunikat o konieczności potwierdzenia adresu e-mail.
-   **`src/components/auth/PasswordResetForm.tsx`**: Formularz z polem na e-mail, który inicjuje proces odzyskiwania hasła poprzez wysłanie linku resetującego.
-   **`src/components/auth/UpdatePasswordForm.tsx`**: Formularz do ustawienia nowego hasła, dostępny po kliknięciu w link z wiadomości e-mail.
-   **`src/components/auth/AuthStatus.tsx`**: Komponent wyświetlany w nagłówku. Dla niezalogowanych użytkowników pokaże przyciski "Zaloguj" i "Zarejestruj". Dla zalogowanych wyświetli awatar/email użytkownika i przycisk "Wyloguj". Dane o użytkowniku będzie pobierał z "auth store".

### 1.3. Walidacja i Obsługa Błędów

-   **Walidacja Client-Side**: Do walidacji formularzy zostanie użyta biblioteka `zod` w połączeniu z `react-hook-form`. Zapewni to natychmiastową informację zwrotną dla użytkownika (np. niepoprawny format e-maila, zbyt krótkie hasło).
-   **Komunikaty Błędów z API**: Wszelkie błędy zwrócone przez Supabase (np. "Invalid login credentials", "User already registered") będą przechwytywane i wyświetlane użytkownikowi w czytelnej formie, np. przy użyciu komponentu `Sonner` z `shadcn/ui`.

### 1.4. Scenariusze Użytkownika

1.  **Rejestracja**:
    -   Użytkownik wchodzi na `/register`.
    -   Wypełnia formularz. Walidacja `zod` sprawdza dane na bieżąco.
    -   Po wysłaniu, `RegisterForm.tsx` wywołuje `supabase.auth.signUp()`.
    -   Aplikacja wyświetla komunikat o konieczności sprawdzenia skrzynki e-mail i potwierdzenia rejestracji. Użytkownik nie jest jeszcze zalogowany.

2.  **Logowanie**:
    -   Użytkownik wchodzi na `/login`.
    -   Wpisuje e-mail i hasło.
    -   `LoginForm.tsx` wywołuje `supabase.auth.signInWithPassword()`.
    -   W przypadku sukcesu, Supabase tworzy sesję w cookie, a aplikacja przekierowuje użytkownika na stronę główną (`/`).
    -   W przypadku błędu, formularz wyświetla stosowny komunikat.

3.  **Wylogowanie**:
    -   Użytkownik klika przycisk "Wyloguj" w komponencie `AuthStatus.tsx`.
    -   Komponent wywołuje `supabase.auth.signOut()`.
    -   Sesja jest usuwana z cookie, a aplikacja przekierowuje na stronę `/login`.

4.  **Odzyskiwanie hasła**:
    -   Użytkownik wchodzi na `/password-reset`.
    -   Podaje swój adres e-mail i wysyła formularz.
    -   Aplikacja wywołuje `supabase.auth.resetPasswordForEmail()` i wyświetla komunikat o wysłaniu linku.
    -   Użytkownik klika link w mailu, co przenosi go na stronę `/update-password`.
    -   Wprowadza i potwierdza nowe hasło. Aplikacja wywołuje `supabase.auth.updateUser()` w celu jego zmiany.
    -   Po pomyślnej zmianie, użytkownik jest informowany i może się zalogować nowym hasłem.

4.  **Zmiana hasła**:
    -   Zalogowany użytkownik wchodzi na stronę `/settings`.
    -   Wypełnia formularz zmiany hasła, podając stare i nowe hasło.
    -   Komponent `UserSettings.tsx` wywołuje `supabase.auth.updateUser({ password: newPassword })`.
    -   Po pomyślnej zmianie, użytkownik jest informowany i może się zalogować nowym hasłem przy następnej sesji.

5.  **Usuwanie konta**:
    -   Zalogowany użytkownik wchodzi na `/settings` i inicjuje proces usunięcia konta.
    -   Po wpisaniu hasła w celu potwierdzenia, komponent `UserSettings.tsx` wywołuje dedykowaną funkcję RPC w Supabase (np. `delete_user_account`).
    -   Funkcja ta usuwa wszystkie dane użytkownika (w tym wydatki) oraz jego konto w `auth.users`.
    -   Użytkownik jest wylogowywany i przekierowywany na stronę główną.

## 2. Logika Backendowa (Astro & Supabase)

Dzięki wykorzystaniu Supabase jako BaaS (Backend-as-a-Service), większość logiki autentykacji będzie realizowana po stronie klienta przez SDK Supabase. Logika po stronie serwera w Astro będzie głównie odpowiedzialna za ochronę tras.

### 2.1. Ochrona Stron (Server-Side Middleware)

Zgodnie z `astro.config.mjs`, aplikacja działa w trybie `server`, co umożliwia wykorzystanie middleware.

-   **`src/middleware/index.ts`**: Utworzony zostanie plik middleware, który będzie uruchamiany przy każdym żądaniu do serwera.
    -   Middleware będzie odczytywał sesję użytkownika z ciasteczek przy użyciu serwerowego klienta Supabase.
    -   Dla chronionych tras (np. `/`, `/expenses`), jeśli sesja nie istnieje lub jest nieważna, użytkownik zostanie przekierowany na stronę logowania (`/login`).
    -   Trasy publiczne (`/login`, `/register`, etc.) będą dostępne bez autentykacji.
    -   Informacje o sesji i użytkowniku zostaną umieszczone w `Astro.locals`, aby były dostępne wewnątrz komponentów Astro na serwerze.

### 2.2. Model Danych

Nie ma potrzeby tworzenia nowych modeli danych. Wykorzystane zostaną standardowe tabele i obiekty dostarczane przez Supabase Auth:
-   `auth.users`: Przechowuje dane użytkowników.
-   `auth.sessions`: Zarządza sesjami.
-   Obiekt `User` i `Session` z biblioteki `@supabase/supabase-js`.

## 3. System Autentykacji (Supabase Auth)

### 3.1. Konfiguracja

-   **Zmienne Środowiskowe**: Klucze `SUPABASE_URL` i `SUPABASE_ANON_KEY` zostaną dodane do zmiennych środowiskowych projektu.
-   **Klient Supabase**: Zostanie utworzony singleton klienta Supabase (`src/db/supabase.client.ts`), który będzie wykorzystywany zarówno po stronie klienta (w komponentach React), jak i serwera (w middleware i stronach Astro). Klient będzie skonfigurowany do używania `cookies` jako mechanizmu przechowywania sesji, co jest kluczowe dla integracji z renderowaniem serwerowym w Astro.

### 3.2. Implementacja Procesów Autentykacji

Funkcjonalności będą realizowane przez wywołania odpowiednich metod z `supabase-js`:

-   **Rejestracja**: `supabase.auth.signUp({ email, password })`
    -   Opcja "Confirm email" w panelu Supabase powinna być włączona, aby zapewnić, że adresy e-mail są prawdziwe, jednak nie będzie ona blokować początkowego logowania.
-   **Logowanie**: `supabase.auth.signInWithPassword({ email, password })`
-   **Wylogowanie**: `supabase.auth.signOut()`
-   **Zmiana hasła (zalogowany)**: `supabase.auth.updateUser({ password: newPassword })`
-   **Usuwanie konta**: Wywołanie funkcji RPC w Supabase, np. `supabase.rpc('delete_user_account')`, która w bezpieczny sposób usunie dane użytkownika i jego konto.

### 3.3. Zarządzanie Sesją


-   **Dostęp do sesji**:
    -   **Frontend (React)**: Główny komponent React otrzyma dane użytkownika z Astro jako `props` i zainicjalizuje nimi "auth store". Store ten będzie również nasłuchiwał na zdarzenie `onAuthStateChange` od Supabase, aby dynamicznie aktualizować stan sesji (np. po wygaśnięciu tokenu). Pozostałe komponenty będą czerpać dane wyłącznie z tego store'u.
    -   **Backend (Astro)**: Middleware będzie odczytywać sesję z ciasteczek przy każdym żądaniu, umieszczając dane użytkownika w `Astro.locals`, co umożliwi przekazanie ich do komponentów Astro i dalej do Reacta.
