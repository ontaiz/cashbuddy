# Diagram Podróży Użytkownika - CashBuddy

## Przegląd
Diagram przedstawia kompleksową podróż użytkownika przez aplikację CashBuddy, od momentu pierwszej wizyty jako niezalogowany użytkownik, przez proces autentykacji, aż po korzystanie z głównych funkcjonalności aplikacji.

## Główne Ścieżki Użytkownika

### 1. Niezalogowany Użytkownik
- Dostęp do strony głównej
- Możliwość rozpoczęcia procesu logowania/rejestracji
- Dostęp do funkcji resetowania hasła

### 2. Proces Autentykacji
- **Logowanie**: Weryfikacja danych, przekierowanie do dashboardu
- **Rejestracja**: Walidacja, wysłanie e-maila, automatyczne zalogowanie
- **Reset hasła**: Proces odzyskiwania dostępu (zaplanowany)

### 3. Zalogowany Użytkownik
- **Dashboard**: Przegląd statystyk i wydatków
- **Zarządzanie wydatkami**: Dodawanie, edycja, usuwanie
- **Panel użytkownika**: Zmiana hasła, usunięcie konta
- **Wylogowanie**: Bezpieczne zakończenie sesji

## Diagram

```mermaid
stateDiagram-v2
    [*] --> StronaGlowna
    
    state "Strona Główna (Niezalogowany)" as StronaGlowna {
        [*] --> WidokPubliczny
        WidokPubliczny --> PrzyciskLogowania: Kliknięcie "Zaloguj się"
    }
    
    StronaGlowna --> WyborAutentykacji: Rozpoczęcie procesu logowania
    
    state if_wybor_auth <<choice>>
    WyborAutentykacji --> if_wybor_auth
    if_wybor_auth --> ProcesLogowania: Mam konto
    if_wybor_auth --> ProcesRejestracji: Nowe konto
    if_wybor_auth --> ProcesResetuHasla: Zapomniałem hasła
    
    state "Proces Logowania" as ProcesLogowania {
        [*] --> FormularzLogowania
        FormularzLogowania --> WalidacjaLogowania
        
        state if_login <<choice>>
        WalidacjaLogowania --> if_login
        if_login --> SesjaZalogowana: Dane poprawne
        if_login --> BladLogowania: Dane niepoprawne
        
        BladLogowania --> FormularzLogowania: Ponów próbę
        BladLogowania --> ProcesResetuHasla: Zapomniałem hasła
    }
    
    note right of FormularzLogowania
        E-mail i hasło
        Link do resetowania hasła
        Link do rejestracji
    end note
    
    state "Proces Rejestracji" as ProcesRejestracji {
        [*] --> FormularzRejestracji
        FormularzRejestracji --> WalidacjaDanychRejestracji
        
        state if_register <<choice>>
        WalidacjaDanychRejestracji --> if_register
        if_register --> WyslanieEmaila: Dane poprawne
        if_register --> BledyWalidacji: Dane niepoprawne
        
        BledyWalidacji --> FormularzRejestracji: Popraw błędy
        WyslanieEmaila --> AutomatyczneLogowanie
        AutomatyczneLogowanie --> SesjaZalogowana
    }
    
    note right of FormularzRejestracji
        E-mail
        Hasło (≥8 znaków)
        Walidacja w czasie rzeczywistym
    end note
    
    state "Proces Resetowania Hasła" as ProcesResetuHasla {
        [*] --> FormularzResetuHasla
        FormularzResetuHasla --> WyslanieLinku
        WyslanieLinku --> PotwierdzenieWyslania
        
        note left of FormularzResetuHasla
            Funkcja zaplanowana
            na kolejne iteracje
        end note
    }
    
    ProcesLogowania --> SesjaZalogowana
    ProcesRejestracji --> SesjaZalogowana
    PotwierdzenieWyslania --> StronaGlowna: Powrót do logowania
    
    state "Sesja Zalogowana" as SesjaZalogowana {
        [*] --> Dashboard
        
        state "Dashboard" as Dashboard {
            [*] --> WidokStatystyk
            WidokStatystyk: Suma wszystkich wydatków
            WidokStatystyk: Wydatki bieżącego miesiąca
            WidokStatystyk: Wykres miesięczny
            WidokStatystyk: Top 5 wydatków
        }
        
        Dashboard --> ZarzadzanieWydatkami: Zarządzaj wydatkami
        Dashboard --> PanelUzytkownika: Panel użytkownika
        
        state "Zarządzanie Wydatkami" as ZarzadzanieWydatkami {
            [*] --> ListaWydatkow
            ListaWydatkow --> DodawanieWydatku: Dodaj nowy
            ListaWydatkow --> EdycjaWydatku: Edytuj istniejący
            ListaWydatkow --> UsuwanieWydatku: Usuń wydatek
            
            state "Dodawanie Wydatku" as DodawanieWydatku {
                [*] --> FormularzDodawania
                FormularzDodawania --> WalidacjaWydatku
                
                state if_expense_valid <<choice>>
                WalidacjaWydatku --> if_expense_valid
                if_expense_valid --> ZapisWydatku: Dane poprawne
                if_expense_valid --> BledyFormularza: Dane niepoprawne
                
                BledyFormularza --> FormularzDodawania
                ZapisWydatku --> AktualizacjaListy
            }
            
            state "Edycja Wydatku" as EdycjaWydatku {
                [*] --> FormularzEdycji
                FormularzEdycji --> WalidacjaEdycji
                WalidacjaEdycji --> AktualizacjaWydatku
                AktualizacjaWydatku --> AktualizacjaListy
            }
            
            state "Usuwanie Wydatku" as UsuwanieWydatku {
                [*] --> DialogPotwierdzenia
                
                state if_confirm_delete <<choice>>
                DialogPotwierdzenia --> if_confirm_delete
                if_confirm_delete --> UsuniecieTrwale: Potwierdzono
                if_confirm_delete --> Anulowano: Anulowano
                
                UsuniecieTrwale --> AktualizacjaListy
                Anulowano --> ListaWydatkow
            }
            
            AktualizacjaListy --> ListaWydatkow
            ListaWydatkow --> Dashboard: Powrót do dashboardu
        }
        
        note right of ListaWydatkow
            Sortowanie po dacie i kwocie
            Filtrowanie zakresu dat
            Aktualizacja bez przeładowania
        end note
        
        state "Panel Użytkownika" as PanelUzytkownika {
            [*] --> MenuPanelu
            MenuPanelu --> ZmianaHasla: Zmień hasło
            MenuPanelu --> UsuwanieKonta: Usuń konto
            
            state "Zmiana Hasła" as ZmianaHasla {
                [*] --> FormularzZmianyHasla
                FormularzZmianyHasla --> WalidacjaHasla
                
                state if_password_valid <<choice>>
                WalidacjaHasla --> if_password_valid
                if_password_valid --> ZapisNowegoHasla: Hasło poprawne (≥8)
                if_password_valid --> BladHasla: Hasło niepoprawne
                
                BladHasla --> FormularzZmianyHasla
                ZapisNowegoHasla --> PotwierdzenieMianyHasla
            }
            
            state "Usuwanie Konta" as UsuwanieKonta {
                [*] --> DialogPotwierdzenia
                
                state if_confirm_account <<choice>>
                DialogPotwierdzenia --> if_confirm_account
                if_confirm_account --> TrwaleUsuniecieDanych: Potwierdzone
                if_confirm_account --> AnulowanieUsuwania: Anulowane
                
                AnulowanieUsuwania --> MenuPanelu
            }
            
            PotwierdzenieMianyHasla --> Dashboard
            MenuPanelu --> Dashboard: Powrót
        }
        
        Dashboard --> Wylogowanie: Przycisk wyloguj
        ZarzadzanieWydatkami --> Wylogowanie
        PanelUzytkownika --> Wylogowanie
    }
    
    note right of Dashboard
        Dostępny tylko dla
        zalogowanych użytkowników
    end note
    
    state "Wylogowanie" as Wylogowanie {
        [*] --> ZakonczenieSesji
        ZakonczenieSesji --> PrzeladowanieStrony
    }
    
    Wylogowanie --> StronaGlowna: Przekierowanie
    TrwaleUsuniecieDanych --> StronaGlowna: Dane usunięte
    
    StronaGlowna --> [*]: Zamknięcie aplikacji
```

## Kluczowe Punkty Decyzyjne

1. **Wybór typu autentykacji**: Użytkownik decyduje czy chce się zalogować, zarejestrować czy odzyskać hasło
2. **Walidacja logowania**: System sprawdza poprawność danych dostępowych
3. **Walidacja rejestracji**: Weryfikacja zgodności danych z wymaganiami (e-mail, hasło ≥8 znaków)
4. **Operacje na wydatkach**: Decyzje dotyczące dodawania, edycji lub usuwania wydatków
5. **Potwierdzenie usunięcia**: Weryfikacja intencji użytkownika przy krytycznych operacjach
6. **Zmiana hasła**: Walidacja nowego hasła zgodnie z wymaganiami bezpieczeństwa
7. **Usunięcie konta**: Finalne potwierdzenie nieodwracalnej operacji

## Zgodność z Historiami Użytkownika

Diagram pokrywa wszystkie kluczowe historie użytkownika z PRD:
- **US-001**: Proces rejestracji z walidacją i wysyłką e-maila
- **US-002**: Proces logowania z obsługą błędów i linkiem do resetowania hasła
- **US-003**: Proces wylogowania z bezpiecznym zakończeniem sesji
- **US-004-006**: Pełne zarządzanie wydatkami (dodawanie, edycja, usuwanie)
- **US-007**: Lista wydatków z filtrowaniem i sortowaniem
- **US-008-011**: Dashboard ze statystykami
- **US-012**: Zmiana hasła w panelu użytkownika
- **US-013**: Usunięcie konta z potwierdzeniem

## Notatki Techniczne

- Wszystkie przejścia między stanami zachodzą bez przeładowania strony (SPA)
- Walidacja odbywa się w czasie rzeczywistym
- Komunikaty błędów są jasne i nie ujawniają szczegółów bezpieczeństwa
- Dane użytkownika są izolowane zgodnie z RODO
- Responsywność zapewniona na wszystkich ekranach ≥320px

