import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

// Next 16 ships eslint-config-next as a native flat-config array.
// Spread it directly — no más FlatCompat.
const eslintConfig = [...nextCoreWebVitals];

export default eslintConfig;
