# CI/CD Pipeline Documentation

## Przegląd

Ten projekt wykorzystuje GitHub Actions do automatyzacji procesu CI/CD. Pipeline składa się z dwóch głównych etapów: **testowania** i **budowania**.

## Struktura

### Workflows
- **`ci.yml`** - Główny pipeline CI/CD

### Composite Actions
- **`setup-node-deps`** - Reużywalna akcja do setupu Node.js i instalacji zależności

## Pipeline CI/CD

### Triggery
Pipeline uruchamia się:
- ✅ Automatycznie przy push do brancha `main`
- ✅ Automatycznie przy utworzeniu Pull Request do `main`
- ✅ Manualnie przez GitHub UI (workflow_dispatch)

### Job: Test
**Cel:** Walidacja kodu poprzez linting i testy

**Kroki:**
1. **Checkout kodu** - Pobiera kod z repozytorium
2. **Setup Node.js i zależności** - Wykorzystuje composite action
   - Konfiguruje Node.js v22.14.0 (z `.nvmrc`)
   - Cachuje `npm` dependencies
   - Instaluje zależności przez `npm ci`
3. **Linting** - Uruchamia ESLint (`npm run lint`)
4. **Testy jednostkowe** - Uruchamia Vitest (`npm run test:run`)
5. **Instalacja Playwright** - Instaluje przeglądarki do testów E2E
6. **Testy E2E** - Uruchamia Playwright (`npm run test:e2e`)
7. **Upload raportów** - Zapisuje raporty Playwright jako artefakty (7 dni)

**Zmienne środowiskowe:**
- `SUPABASE_URL` - URL instancji Supabase
- `SUPABASE_ANON_KEY` - Publiczny klucz API Supabase

### Job: Build
**Cel:** Budowa aplikacji w wersji produkcyjnej

**Kroki:**
1. **Checkout kodu** - Pobiera kod z repozytorium
2. **Setup Node.js i zależności** - Wykorzystuje composite action
3. **Build aplikacji** - Uruchamia Astro build (`npm run build`)
4. **Upload artefaktów** - Zapisuje folder `dist/` jako artefakt (7 dni)

**Zależności:**
- Uruchamia się tylko po pomyślnym zakończeniu Job `test`

**Zmienne środowiskowe:**
- `SUPABASE_URL` - URL instancji Supabase
- `SUPABASE_ANON_KEY` - Publiczny klucz API Supabase

## Konfiguracja Secrets

Aby pipeline działał poprawnie, należy skonfigurować następujące secrety w GitHub:

1. Przejdź do **Settings → Secrets and variables → Actions**
2. Dodaj następujące secrety:
   - `SUPABASE_URL` - URL Twojej instancji Supabase
   - `SUPABASE_ANON_KEY` - Publiczny klucz API z Supabase

## Composite Action: setup-node-deps

**Lokalizacja:** `.github/actions/setup-node-deps/action.yml`

**Cel:** Standaryzacja setupu środowiska Node.js i instalacji zależności

**Parametry:**
- `node-version-file` (opcjonalny) - Ścieżka do pliku z wersją Node.js (domyślnie: `.nvmrc`)

**Kroki:**
1. Setup Node.js z wersji z pliku `.nvmrc`
2. Wykorzystuje wbudowane cachowanie npm
3. Instaluje zależności przez `npm ci` (deterministyczna instalacja)

**Użycie w workflow:**
```yaml
- name: Setup Node.js and dependencies
  uses: ./.github/actions/setup-node-deps
```

## Używane Akcje GitHub

Wszystkie publiczne akcje używają najnowszych stabilnych wersji (major version):

- `actions/checkout@v5` - Pobieranie kodu
- `actions/setup-node@v6` - Konfiguracja Node.js
- `actions/upload-artifact@v4` - Upload artefaktów

## Uruchamianie Manualne

1. Przejdź do zakładki **Actions** w repozytorium
2. Wybierz workflow **CI/CD Pipeline**
3. Kliknij **Run workflow**
4. Wybierz branch (domyślnie `main`)
5. Kliknij **Run workflow**

## Best Practices

✅ **Stosowane:**
- Używanie `npm ci` zamiast `npm install` dla deterministycznej instalacji
- Cachowanie zależności npm
- Wykorzystanie composite actions do DRY
- Zmienne środowiskowe na poziomie job, nie global
- Secrets dla wrażliwych danych
- Upload artefaktów dla debugowania
- Job dependencies (`needs`) dla kolejności wykonania

✅ **Zgodność z dokumentacją:**
- Node.js z `.nvmrc`
- Wszystkie testy (unit + E2E) przed buildem
- Tylko major versions dla public actions
- `npm ci` dla instalacji zależności

