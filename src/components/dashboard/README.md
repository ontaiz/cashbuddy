# Dashboard Components

## Przegląd

Moduł Dashboard zawiera komponenty do wyświetlania zagregowanych danych finansowych użytkownika.

## Struktura komponentów

```
dashboard/
├── DashboardPage.tsx          # Główny komponent zarządzający stanem
├── DashboardSkeleton.tsx      # Stan ładowania
├── EmptyState.tsx             # Stan pusty (brak wydatków)
├── StatCard.tsx               # Karta ze statystyką
├── MonthlyExpensesChart.tsx   # Wykres miesięcznych wydatków
├── TopExpensesList.tsx        # Lista 5 największych wydatków
├── hooks/
│   └── useDashboardData.ts    # Hook do zarządzania danymi
└── index.ts                   # Eksport wszystkich komponentów
```

## Komponenty

### DashboardPage
Główny kontener zarządzający stanem i renderowaniem odpowiednich komponentów.

**Stany:**
- Loading → renderuje `DashboardSkeleton`
- Error → renderuje komunikat błędu
- Empty → renderuje `EmptyState`
- Success → renderuje pełny dashboard

### StatCard
Wyświetla pojedynczą metrykę finansową.

**Props:**
- `title: string` - tytuł metryki
- `value: number` - wartość liczbowa (automatycznie formatowana jako PLN)
- `icon?: React.ReactNode` - opcjonalna ikona

### MonthlyExpensesChart
Wykres liniowy pokazujący wydatki w poszczególnych miesiącach.

**Props:**
- `data: MonthlySummaryDto[]` - dane miesięczne

**Funkcje:**
- Interaktywne tooltips z kwotami
- Formatowanie polskich nazw miesięcy
- Alternatywa tabelaryczna dla czytników ekranu

### TopExpensesList
Tabela z 5 największymi wydatkami.

**Props:**
- `expenses: TopExpenseDto[]` - lista wydatków

**Funkcje:**
- Responsywność (ukrywa kolumnę "Data" na mobile)
- Formatowanie dat i kwot w PLN

### DashboardSkeleton
Stan ładowania naśladujący docelowy układ.

### EmptyState
Stan pusty zachęcający do dodania pierwszego wydatku.

## Hook: useDashboardData

Hook zarządzający pobieraniem danych z API.

**Zwraca:**
```typescript
{
  data: DashboardDataDto | null;
  isLoading: boolean;
  error: Error | null;
}
```

**Funkcje:**
- Automatyczne pobieranie danych przy montowaniu
- Obsługa błędów sieciowych
- Automatyczne przekierowanie na `/login` przy błędzie 401

## Integracja API

Endpoint: `GET /api/dashboard`

**Odpowiedź:**
```typescript
{
  total_expenses: number;
  current_month_expenses: number;
  top_5_expenses: TopExpenseDto[];
  monthly_summary: MonthlySummaryDto[];
}
```

## Responsywność

- Mobile: layout jednokolumnowy
- Desktop (md+): grid 2-kolumnowy dla StatCards
- Tabela Top Expenses ukrywa kolumnę "Data" na mobile

## Dostępność

- Semantyczny HTML
- ARIA labels dla wykresów
- Alternatywna tabela dla wykresu (screen readers)
- Właściwe komunikaty błędów z role="alert"

