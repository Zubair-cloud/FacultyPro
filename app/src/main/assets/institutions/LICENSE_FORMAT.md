# License Key Format Recommendations

## Option 1: Simple Human-Readable (Recommended for Start)

**Format:** `INSTITUTION-YEAR-TIER-RANDOM`

**Examples:**

- `DSU-2025-PREMIUM-A7F3`
- `DSU-2025-BASIC-B9K2`
- `DSU-2026-TRIAL-C4X8`

**Pros:**
✅ Easy to read and type
✅ Self-documenting (can see institution, year, tier)
✅ Simple to validate
✅ Good for customer support (can identify issues by looking at key)

**Cons:**
⚠️ Easier to guess pattern
⚠️ Less secure

**Structure:**

```
DSU-2025-PREMIUM-A7F3
│   │    │       └── Random 4-char code
│   │    └── Tier (BASIC/PREMIUM/TRIAL)
│   └── Expiry year
└── Institution code
```

---

## Option 2: UUID-Based (More Secure)

**Format:** Standard UUID v4

**Example:**

- `550e8400-e29b-41d4-a716-446655440000`

**Pros:**
✅ Highly secure
✅ Virtually impossible to guess
✅ Standard format

**Cons:**
⚠️ Very long (36 characters)
⚠️ Hard to type manually
⚠️ Needs QR code or copy-paste

---

## Option 3: Hybrid (Recommended for Production)

**Format:** `INSTITUTION-ENCODED_DATA`

**Example:**

- `DSU-A7F3B9K2C4X8M1N5`
- Encoded data contains: institution ID, tier, expiry date, checksum

**Pros:**
✅ Shorter than UUID
✅ Contains embedded data
✅ Has checksum for validation
✅ Reasonably secure

**Cons:**
⚠️ Requires encoding/decoding logic

**Structure:**

```javascript
// Example encoding
function generateLicenseKey(institution, tier, expiryYear) {
  const data = {
    inst: institution, // "dsu"
    tier: tier, // 1=BASIC, 2=PREMIUM
    year: expiryYear, // 2025
    rand: Math.random().toString(36).substring(7),
  };

  const encoded = btoa(JSON.stringify(data)); // Base64 encode
  const checksum = generateChecksum(encoded);

  return `${institution.toUpperCase()}-${encoded.substring(0, 12)}${checksum}`;
}

// Result: DSU-A7F3B9K2C4X8
```

---

## 🎯 Recommended: Option 1 for Phase 1

**Use Simple Format:** `DSU-2025-PREMIUM-XXXX`

**Why?**

1. You're starting with one institution (DSU)
2. Easy for faculty to enter
3. Can upgrade to hybrid/UUID later
4. Good enough security for initial rollout

**Validation:**

```javascript
function validateLicense(key) {
  const validKeys = {
    "DSU-2025-PREMIUM-A7F3": {
      institution: "dsu",
      tier: "premium",
      features: ["attendance", "analytics", "reports"],
      expires: "2025-12-31",
    },
    "DSU-2025-BASIC-B9K2": {
      institution: "dsu",
      tier: "basic",
      features: ["attendance", "reports"],
      expires: "2025-12-31",
    },
  };

  return validKeys[key] || null;
}
```

---

## 📦 Tiers Suggestion

### 🥉 BASIC

- Attendance recording
- Student roster
- PDF reports
- History/Backlog

**Key:** `DSU-2025-BASIC-XXXX`

### 🥈 PREMIUM

- Everything in BASIC +
- Analytics dashboard
- Late entry timer
- Bulk import/export
- Custom fields

**Key:** `DSU-2025-PREMIUM-XXXX`

### 🏆 ENTERPRISE (Future)

- Everything in PREMIUM +
- Cloud sync
- Multi-device
- API access
- Priority support

**Key:** `DSU-2025-ENTERPRISE-XXXX`

---

## 💡 Implementation

### Phase 1: Hardcoded Validation

```javascript
const VALID_LICENSES = {
  "DSU-2025-PREMIUM-A7F3": {
    /* config */
  },
  "DSU-2025-BASIC-B9K2": {
    /* config */
  },
};
```

### Phase 2: Algorithm-Based

```javascript
function validateLicense(key) {
  const parts = key.split("-");
  if (parts.length !== 4) return false;

  const [inst, year, tier, code] = parts;

  // Check checksum
  const expectedChecksum = generateChecksum(`${inst}-${year}-${tier}`);
  if (code !== expectedChecksum) return false;

  return { institution: inst.toLowerCase(), tier, year };
}
```

### Phase 3: Server-Based

```javascript
async function validateLicense(key) {
  const response = await fetch("https://api.facultypro.com/validate", {
    method: "POST",
    body: JSON.stringify({ key }),
  });
  return await response.json();
}
```

---

## 🎁 Sample License Keys for DSU

For testing, I recommend:

```
DSU-2025-PREMIUM-TEST  // For your testing
DSU-2025-PREMIUM-FAC1  // Faculty member 1
DSU-2025-PREMIUM-FAC2  // Faculty member 2
DSU-2025-BASIC-DEMO    // Demo/Trial version
```

---

**My Recommendation:** Start with **Option 1 (Simple)** and migrate to **Option 3 (Hybrid)** when you add more institutions.
