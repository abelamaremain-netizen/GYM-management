export default [{
	files: ['**/*.js', '**/*.jsx', '**/*.mjs'],
	languageOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
		parserOptions: { ecmaFeatures: { jsx: true } },
	},
	rules: {
		'no-constant-condition': 'error',
		'no-duplicate-imports': 'error',
		'no-unreachable': 'error',
	},
}];