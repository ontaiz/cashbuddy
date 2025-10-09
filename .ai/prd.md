# Dokument wymagań produktu (PRD) - CashBuddy

## 1. Przegląd produktu
CashBuddy to responsywna aplikacja internetowa zaprojektowana do łatwego i szybkiego śledzenia codziennych wydatków w złotówkach. Aplikacja stawia na intuicyjność i czytelność statystyk, które pomagają użytkownikom lepiej zarządzać domowym budżetem.


## 2. Problem użytkownika
Użytkownicy tracą kontrolę nad codziennymi wydatkami, nie wiedzą ile i na co wydają oraz czy mieszczą się w planowanym budżecie. Brak przejrzystego narzędzia skutkuje:
- Niską świadomością finansową.
- Nieświadomym przekraczaniem budżetu.
- Trudnościami w optymalizacji przyszłych wydatków.
- Chaosem w przechowywaniu paragonów i dokumentów.

## 3. Wymagania funkcjonalne
1. Uwierzytelnianie i zarządzanie kontem
   - Rejestracja e-mail + hasło
   - Logowanie i wylogowanie.
   - Panel użytkownika: zmiana hasła, usunięcie konta.
2. Zarządzanie wydatkami (CRUD)
   - Dodawanie wydatku: kwota (PLN), data, opis tekstowy, nazwa.
   - Edycja i usuwanie wydatków.
   - Lista wydatków z sortowaniem oraz filtrowaniem po dacie i kwocie.
3. Dashboard
   - Suma wszystkich wydatków.
   - Wydatki w bieżącym miesiącu
   - Wykres liniowy miesięcznych wydatków.
   - Lista Top 5 największych wydatków.
4. UI i UX
   - Responsywność (desktop + mobile przeglądarka).
   - Klarowne komunikaty błędów i walidacji.
5. Bezpieczeństwo i prywatność
   - Dane uzytkownika przechowywane zgodnie z RODO.
   - Izolacja danych – każdy użytkownik widzi wyłącznie swoje wydatki.

## 4. Granice produktu
- Waluta: tylko PLN.
- Brak kategorii wydatków, budżetów, przychodów, cyklicznych płatności i integracji bankowych.
- Brak importu i eksportu danych (Excel/PDF).
- Brak aplikacji mobilnych natywnych – tylko PWA/responsywna strona.
- Brak zaawansowanych raportów, prognoz, powiadomień i współdzielenia budżetów.
- Brak resetu hasła (zaplanowany na kolejne iteracje).

## 5. Historyjki użytkowników
ID: US-001
Tytuł: Rejestracja konta
Opis: Jako nowy użytkownik chcę się zarejestrować e-mailem i hasłem, aby uzyskać dostęp do aplikacji.
Kryteria akceptacji:
	1. Formularz wymaga poprawnego e-maila i hasła ≥ 8 znaków.
	2. Po wysłaniu formularza otrzymuję e-mail potwierdzający i zostaje zalogowany.

ID: US-002
Tytuł: Logowanie
Opis: Jako zarejestrowany użytkownik chcę się zalogować, aby uzyskać dostęp do swoich danych.
Kryteria akceptacji:
	1. Podanie poprawnych danych przenosi mnie na dashboard.
	2. Błędne dane zwracają komunikat o błędzie bez ujawniania szczegółów.

ID: US-003
Tytuł: Wylogowanie
Opis: Jako użytkownik chcę się wylogować, aby zabezpieczyć moje dane na współdzielonych urządzeniach.
Kryteria akceptacji:
	1. Kliknięcie „Wyloguj" kończy sesję i przekierowuje na stronę logowania.

ID: US-004
Tytuł: Dodanie wydatku
Opis: Jako użytkownik chcę dodać wydatek z kwotą, datą i opisem, aby śledzić moje wydatki.
Kryteria akceptacji:
	1. Kwota musi być > 0 PLN.
	2. Wszystkie pola wymagane.
	3. Po zapisaniu wydatek pojawia się na liście.

ID: US-005
Tytuł: Edycja wydatku
Opis: Jako użytkownik chcę edytować istniejący wydatek, aby poprawić błędy.
Kryteria akceptacji:
	1. Formularz edycji otwiera się z aktualnymi danymi.
	2. Zmiany zapisują się i aktualizują listę.

ID: US-006
Tytuł: Usunięcie wydatku
Opis: Jako użytkownik chcę usunąć błędnie dodany wydatek, aby utrzymać dokładność danych.
Kryteria akceptacji:
	1. Po potwierdzeniu usunięcia wpis znika z listy i statystyk.

ID: US-007
Tytuł: Lista wydatków
Opis: Jako użytkownik chcę przeglądać tabelę wydatków z sortowaniem i filtrowaniem, aby łatwo analizować dane.
Kryteria akceptacji:
	1. Mogę sortować po dacie i kwocie.
	2. Mogę filtrować zakres dat.
	3. Tabela aktualizuje się bez przeładowania strony.

ID: US-008
Tytuł: Podsumowanie wszystkich wydatków
Opis: Jako użytkownik chcę zobaczyć sumę wszystkich wydatków na dashboardzie, aby ocenić całkowite koszty.
Kryteria akceptacji:
	1. Suma aktualizuje się po dodaniu/edycji/usunięciu wydatku.

ID: US-009
Tytuł: Wydatki w bieżącym miesiącu
Opis: Jako użytkownik chcę widzieć sumę wydatków w bieżącym miesiącu, aby kontrolować aktualny budżet.
Kryteria akceptacji:
	1. Wartość dotyczy tylko wydatków z bieżącego miesiąca.
	2. Aktualizuje się w czasie rzeczywistym.

ID: US-010
Tytuł: Wykres miesięczny
Opis: Jako użytkownik chcę wizualizować wydatki w czasie na wykresie liniowym, aby rozpoznawać trendy.
Kryteria akceptacji:
	1. Oś X – miesiące, oś Y – suma wydatków.
	2. Wykres aktualizuje się przy zmianie danych.

ID: US-011
Tytuł: Top 5 wydatków
Opis: Jako użytkownik chcę zobaczyć listę pięciu największych wydatków, aby identyfikować największe koszty.
Kryteria akceptacji:
	1. Lista zawsze pokazuje najbardziej kosztowne pozycje.

ID: US-012
Tytuł: Zmiana hasła
Opis: Jako użytkownik chcę zmienić hasło w panelu, aby zabezpieczyć konto.
Kryteria akceptacji:
	1. Formularz wymaga starego i nowego hasła (≥ 8 znaków).
	2. Po zapisaniu loguję się nowym hasłem.

ID: US-013
Tytuł: Usunięcie konta
Opis: Jako użytkownik chcę mieć możliwość trwałego usunięcia konta i danych, aby zachować kontrolę nad prywatnością.
Kryteria akceptacji:
	1. Akcja wymaga potwierdzenia.
	2. Dane użytkownika i jego wydatki są nieodwracalnie usunięte.

ID: US-014
Tytuł: Responsywność
Opis: Jako użytkownik chcę korzystać z aplikacji na desktopie i telefonie, aby mieć dostęp w dowolnym miejscu.
Kryteria akceptacji:
	1. UI skaluje się bez błędów na ekranach ≥ 320 px szerokości.

ID: US-015
Tytuł: Izolacja danych
Opis: Jako użytkownik chcę mieć pewność, że widzę tylko swoje dane, aby zachować prywatność.
Kryteria akceptacji:
	1. Użytkownicy nie mają dostępu do rekordów innych kont (również przez API).

ID: US-016
Tytuł: Walidacja danych
Opis: Jako użytkownik chcę otrzymywać jasne komunikaty błędów przy niepoprawnym wprowadzaniu danych, aby szybko je poprawić.
Kryteria akceptacji:
	1. Błędne pola są oznaczone z opisem błędu.
	2. Formularz blokuje wysłanie przy błędach.

## 6. Metryki sukcesu
- Użytkownik zarejestruje się, doda wydatek i zobaczy dashboard 
