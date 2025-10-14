# Diagram Autentykacji - CashBuddy

Ten diagram przedstawia pełną architekturę i przepływ autentykacji w aplikacji CashBuddy wykorzystującej Astro, React i Supabase Auth.

## Przepływ Autentykacji

```mermaid
sequenceDiagram
    autonumber
    participant Przeglądarka
    participant Middleware
    participant AstroAPI
    participant SupabaseAuth

    Note over Przeglądarka,SupabaseAuth: Scenariusz 1: Dostęp do chronionej strony

    Przeglądarka->>Middleware: GET /expenses
    activate Middleware
    Middleware->>Middleware: Odczytaj cookie z żądania
    Middleware->>SupabaseAuth: auth.getUser()
    activate SupabaseAuth
    
    alt Brak sesji lub token wygasł
        SupabaseAuth-->>Middleware: Error: Unauthorized
        deactivate SupabaseAuth
        Middleware-->>Przeglądarka: Redirect /login
        deactivate Middleware
    else Sesja ważna
        SupabaseAuth-->>Middleware: User data
        deactivate SupabaseAuth
        Middleware->>Middleware: Ustaw Astro.locals.user
        Middleware-->>Przeglądarka: Zwróć stronę
        deactivate Middleware
    end

    Note over Przeglądarka,SupabaseAuth: Scenariusz 2: Logowanie użytkownika

    Przeglądarka->>Przeglądarka: Użytkownik wchodzi na /login
    Przeglądarka->>Przeglądarka: Wypełnia formularz
    Przeglądarka->>AstroAPI: POST /api/auth/login
    activate AstroAPI
    AstroAPI->>SupabaseAuth: signInWithPassword()
    activate SupabaseAuth
    
    alt Nieprawidłowe dane
        SupabaseAuth-->>AstroAPI: Error: Invalid credentials
        deactivate SupabaseAuth
        AstroAPI-->>Przeglądarka: 400: Błąd logowania
        deactivate AstroAPI
        Przeglądarka->>Przeglądarka: Wyświetl komunikat błędu
    else Dane prawidłowe
        SupabaseAuth-->>AstroAPI: Session token + User data
        deactivate SupabaseAuth
        AstroAPI->>AstroAPI: Ustaw httpOnly cookie
        AstroAPI-->>Przeglądarka: 200: Success
        deactivate AstroAPI
        Przeglądarka->>Przeglądarka: Redirect /
    end

    Note over Przeglądarka,SupabaseAuth: Scenariusz 3: Rejestracja nowego użytkownika

    Przeglądarka->>Przeglądarka: Użytkownik wchodzi na /register
    Przeglądarka->>Przeglądarka: Wypełnia formularz rejestracji
    Przeglądarka->>AstroAPI: POST /api/auth/register
    activate AstroAPI
    AstroAPI->>SupabaseAuth: signUp()
    activate SupabaseAuth
    
    alt Email już istnieje
        SupabaseAuth-->>AstroAPI: Error: User exists
        deactivate SupabaseAuth
        AstroAPI-->>Przeglądarka: 400: Użytkownik istnieje
        deactivate AstroAPI
    else Rejestracja udana
        SupabaseAuth-->>AstroAPI: User created + Session
        deactivate SupabaseAuth
        par Wysłanie emaila weryfikacyjnego
            SupabaseAuth->>Przeglądarka: Email weryfikacyjny
        and Ustaw sesję
            AstroAPI->>AstroAPI: Ustaw httpOnly cookie
        end
        AstroAPI-->>Przeglądarka: 200: Success
        deactivate AstroAPI
        Przeglądarka->>Przeglądarka: Komunikat: sprawdź email
    end

    Note over Przeglądarka,SupabaseAuth: Scenariusz 4: Resetowanie hasła

    Przeglądarka->>Przeglądarka: Użytkownik na /password-reset
    Przeglądarka->>AstroAPI: POST /api/auth/reset-password
    activate AstroAPI
    AstroAPI->>SupabaseAuth: resetPasswordForEmail()
    activate SupabaseAuth
    SupabaseAuth->>Przeglądarka: Email z linkiem resetującym
    SupabaseAuth-->>AstroAPI: Email wysłany
    deactivate SupabaseAuth
    AstroAPI-->>Przeglądarka: 200: Email wysłany
    deactivate AstroAPI
    
    Przeglądarka->>Przeglądarka: Użytkownik klika link w emailu
    Przeglądarka->>Przeglądarka: Otwiera /update-password
    Przeglądarka->>AstroAPI: POST /api/auth/update-password
    activate AstroAPI
    AstroAPI->>SupabaseAuth: updateUser()
    activate SupabaseAuth
    SupabaseAuth-->>AstroAPI: Hasło zaktualizowane
    deactivate SupabaseAuth
    AstroAPI-->>Przeglądarka: 200: Success
    deactivate AstroAPI
    Przeglądarka->>Przeglądarka: Redirect /login

    Note over Przeglądarka,SupabaseAuth: Scenariusz 5: Wylogowanie

    Przeglądarka->>Przeglądarka: Użytkownik klika Wyloguj
    Przeglądarka->>AstroAPI: POST /api/auth/logout
    activate AstroAPI
    AstroAPI->>SupabaseAuth: signOut()
    activate SupabaseAuth
    SupabaseAuth-->>AstroAPI: Sesja usunięta
    deactivate SupabaseAuth
    AstroAPI->>AstroAPI: Usuń cookie sesji
    AstroAPI-->>Przeglądarka: 200: Success
    deactivate AstroAPI
    Przeglądarka->>Przeglądarka: Redirect /login

    Note over Przeglądarka,SupabaseAuth: Scenariusz 6: Automatyczne odświeżanie tokenu

    loop Co 55 minut (przed wygaśnięciem)
        Przeglądarka->>SupabaseAuth: Sprawdź ważność tokenu
        activate SupabaseAuth
        alt Token wkrótce wygaśnie
            SupabaseAuth->>SupabaseAuth: Odśwież token automatycznie
            SupabaseAuth-->>Przeglądarka: Nowy token w cookie
            deactivate SupabaseAuth
        else Token ważny
            SupabaseAuth-->>Przeglądarka: Token OK
            deactivate SupabaseAuth
        end
    end

    Note over Przeglądarka,SupabaseAuth: Scenariusz 7: Zmiana hasła w ustawieniach

    Przeglądarka->>Przeglądarka: Zalogowany w /settings
    Przeglądarka->>AstroAPI: POST /api/auth/update-password
    activate AstroAPI
    AstroAPI->>SupabaseAuth: updateUser()
    activate SupabaseAuth
    SupabaseAuth-->>AstroAPI: Hasło zmienione
    deactivate SupabaseAuth
    AstroAPI-->>Przeglądarka: 200: Hasło zaktualizowane
    deactivate AstroAPI
    Przeglądarka->>Przeglądarka: Wyświetl komunikat sukcesu

    Note over Przeglądarka,SupabaseAuth: Scenariusz 8: Usunięcie konta

    Przeglądarka->>Przeglądarka: Użytkownik w /settings
    Przeglądarka->>Przeglądarka: Potwierdza usunięcie konta
    Przeglądarka->>AstroAPI: POST /api/auth/delete-account
    activate AstroAPI
    AstroAPI->>SupabaseAuth: rpc delete_user_account
    activate SupabaseAuth
    SupabaseAuth->>SupabaseAuth: Usuń wydatki użytkownika
    SupabaseAuth->>SupabaseAuth: Usuń konto z auth.users
    SupabaseAuth-->>AstroAPI: Konto usunięte
    deactivate SupabaseAuth
    AstroAPI->>AstroAPI: Wyloguj i usuń cookie
    AstroAPI-->>Przeglądarka: 200: Konto usunięte
    deactivate AstroAPI
    Przeglądarka->>Przeglądarka: Redirect /
```

## Opis Aktorów

### Przeglądarka
- Interfejs użytkownika (React + Astro)
- Wyświetla formularze logowania, rejestracji
- Zarządza lokalnym stanem UI
- Przechowuje cookie sesji

### Middleware
- Warstwa ochrony tras
- Weryfikuje sesję przy każdym żądaniu
- Przekierowuje niezalogowanych na /login
- Ustawia dane użytkownika w Astro.locals

### Astro API
- Endpointy autentykacji (/api/auth/*)
- Komunikacja z Supabase Auth
- Zarządzanie cookie sesji
- Obsługa błędów i walidacja

### Supabase Auth
- Serwis autentykacji
- Zarządzanie użytkownikami
- Generowanie i weryfikacja tokenów
- Wysyłka emaili weryfikacyjnych

## Bezpieczeństwo

1. **Sesje** - przechowywane w httpOnly cookies
2. **Tokeny** - automatyczne odświeżanie przez Supabase
3. **Trasy chronione** - middleware weryfikuje przy każdym żądaniu
4. **Hasła** - hashowane przez Supabase (bcrypt)
5. **Izolacja danych** - RLS w Supabase zapewnia dostęp tylko do własnych danych

