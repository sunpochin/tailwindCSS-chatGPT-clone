# CLAUDE.md - TailwindCSS ChatGPT Clone

## Build & Development
- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn generate` - Generate static site
- `yarn preview` - Preview production build
- `yarn test` - Run all tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:coverage` - Run tests with coverage

## Testing
- Single test: `yarn test __tests__/path/to/file.spec.ts`
- Test pattern: `yarn test -t "test pattern"`

## Code Style Guidelines
- Use TypeScript interfaces for type definitions
- File header comments should describe the file's purpose
- Component structure: template → script → style
- Use composition API with `<script setup lang="ts">`
- Use Pinia for state management with strong typing
- Error handling with try/catch and specific error messages
- Prefer async/await over Promise chains
- Use kebab-case for component file names and CSS classes
- Use PascalCase for component names and interfaces
- Add JSDoc comments for functions and interfaces
- Tabs indentation: 2 spaces
- Always use TypeScript for type safety