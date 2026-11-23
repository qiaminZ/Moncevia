import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**','extension/**','moncevia.user.js','src/legacy/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['scripts/*.mjs'], languageOptions: { globals: { process: 'readonly', console: 'readonly', Buffer: 'readonly' } } }
);
