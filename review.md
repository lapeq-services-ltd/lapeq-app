# Code Review: Lapeq App

**Date:** April 3, 2026  
**Overall Rating: 6.5/10**

Your app has a **solid foundation** but needs improvements in code organization, reusability, and robustness.

---

## **STRENGTHS ✅**

| Area | Score | Notes |
|------|-------|-------|
| **Architecture & Structure** | 7.5/10 | Well-organized folder hierarchy, excellent use of Expo Router with nested layouts, clear file organization |
| **TypeScript Usage** | 8/10 | Good type safety throughout; proper interface definitions and union types |
| **Design System** | 7/10 | Nice theme implementation with Context API, centralized color constants, dark/light mode support |
| **API Integration** | 7.5/10 | Clean Supabase integration with secure storage adapter, real-time listeners setup correctly |
| **UI/UX Patterns** | 7/10 | Smooth animations, good use of icons, responsive design with SafeAreaView |
| **Authentication Flow** | 7/10 | Proper auth guards in root layout, session persistence, secure storage |

---

## **CRITICAL ISSUES 🔴**

### 1. **No Centralized Style System**
- StyleSheets defined at the bottom of **every** component
- No shared utility styles or spacing constants
- Making global design changes would be extremely time-consuming

```tsx
// ❌ Current: Each component has getStyles(C, theme)
// ✅ Should have: shared/styles.ts with utilities like spacing, typography
```

### 2. **Inconsistent Error Handling**
- Some components handle errors, others silently fail
- No error boundaries or fallback UI
- Missing `?.` operators on optional data properties

```tsx
// ❌ Issue in requests/index.tsx
if (activeRes.data) setActiveRequests(activeRes.data as RequestType[]);
// No error handling for activeRes.error
```

### 3. **Code Duplication**
- `getStrength()` password function only in register.tsx
- `formatDate()` and `fmtDate()` repeated across files
- Status color logic duplicated in multiple places
- SearchInput with debounce logic not reusable

### 4. **Large Component Files**
- `explore.tsx`, `requests/index.tsx`, `register.tsx` exceed 200+ lines
- Should be split into smaller, focused components
- Makes testing and reusability difficult

### 5. **No Global State Management**
- User profile loaded directly in multiple components
- Notification count fetched separately in home screen
- No single source of truth for user data
- Context only handles theme, not app-wide state

---

## **MODERATE ISSUES 🟡**

### 6. **Missing Custom Hooks**
- No `useAsync()` hook for API calls (lots of useState + useEffect patterns)
- No `useLocalStorage()` hook for AsyncStorage operations
- No `useFetch()` for debounced searches
- Potential for unsubscribe memory leaks in real-time listeners

```tsx
// ❌ Repeated pattern (explore.tsx, requests/index.tsx)
const [loading, setLoading] = useState(false);
const [data, setData] = useState([]);
useEffect(() => {
    // fetch...
}, []);

// ✅ Should be: const { data, loading, error } = useAsync(fetchFn);
```

### 7. **Performance Issues**
- `LOOPED` carousel duplicates ads 3x in memory (index.tsx)
- No `virtualization` for large lists
- No `memoization` of expensive computations
- Animations not cleanup properly in some cases

### 8. **Missing Accessibility**
- No `accessibilityLabel` on buttons
- No `accessibilityRole` on interactive elements
- Icon-only buttons lack descriptions

### 9. **Hardcoded Values Scattered**
- Service IDs, status names spread across files
- Category mappings defined inline
- No centralized enum/constant declarations

```tsx
// ❌ Status colors hardcoded multiple places
// ✅ Should be: const StatusConfig = { pending: {...}, approved: {...} }
```

### 10. **Incomplete Features (Per TODO.md)**
- 🔴 Date picker can't be dismissed
- 🔴 White flash between screens (Stack background not set)
- 🟡 Map screen is placeholder only
- 🟡 Venues table not seeded
- 🟡 No real-time push notifications integrated
- 🟡 KYC verification not implemented

---

## **MINOR ISSUES 🟢**

11. **Missing Tests** - Zero test files present
12. **JSX Nesting** - Some deeply nested JSX structures (register.tsx modal)
13. **Magic Numbers** - Hardcoded indices, timeouts (200ms debounce)
14. **Incomplete Error Messages** - Some "unconfirmed" checks are brittle
15. **No .env validation** - Missing environment variable schema checking

---

## **Specific Code Concerns**

### ⚠️ **Search Implementation** (explore.tsx)
```tsx
// Issue: Timer not cleaned up on unmount
searchTimer.current = setTimeout(async () => { ... }, 200);
// Missing cleanup in useEffect return
```

### ⚠️ **Real-time Listener** (requests/index.tsx)
```tsx
// Good: Subscribing to Postgres changes
// Risk: If channel setup fails, app doesn't handle error
channel = supabase.channel(...).on(...).subscribe();
```

### ⚠️ **Modal Animations** (login.tsx, register.tsx)
```tsx
// Alert modal animations are good but not extracted to reusable component
// Duplicated modal pattern across auth screens
```

---

## **Recommendations (Priority Order)**

### 🔴 **BEFORE NEXT RELEASE**
1. Extract reusable custom hooks (`useAsync`, `useDebounce`, `useFetch`)
2. Fix picker dismissal bug (TODO item)
3. Create `<ErrorBoundary>` component
4. Set Stack background color to eliminate white flash
5. Add error handling to all Supabase queries

### 🟡 **SHORT TERM (Next Sprint)**
6. Create style utilities file (`styles/utilities.ts`)
7. Extract common components (ErrorAlert, SearchInput, RequestCard)
8. Implement global user state (Redux/Zustand/Context with useReducer)
9. Add 10-15 unit tests for utilities and hooks
10. Fix hardcoded values → constants

### 🟢 **MEDIUM TERM**
11. Add accessibility labels throughout
12. Implement proper error boundaries
13. Set up E2E tests (Detox/Maestro)
14. Virtualize long lists
15. Complete incomplete features from TODO.md

---

## **Final Assessment**

| Dimension | Rating | Comment |
|-----------|--------|---------|
| **Code Cleanliness** | 5.5/10 | Good structure, but poor style/utility organization; significant duplication |
| **Functionality** | 7/10 | Core features work; several planned features incomplete |
| **Maintainability** | 5/10 | Large files, scattered styles, limited reusability make changes difficult |
| **Testing & QA** | 2/10 | No tests; several known bugs in TODO |
| **Performance** | 6/10 | Works but has optimization opportunities |
| **Security** | 7.5/10 | Good Supabase setup; secure storage handled properly |
| **Overall** | **6.5/10** | Solid MVP foundation; refactor before scaling |

---

## **Summary**

Your app demonstrates **good React Native fundamentals** and **solid architecture**, but needs **refactoring for code reusability** and **proper error handling**. 

**Key priorities:**
- Focus on extracting custom hooks and utility functions before adding more features
- Address the 🔴 critical issues before next release
- Your TODO list shows good awareness of gaps

The foundation is strong—it's time to invest in developer experience and maintainability as you scale.
