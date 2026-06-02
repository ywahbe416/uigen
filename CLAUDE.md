# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

UIGen is an AI-powered React component generator with live preview. Users describe components in natural language, Claude generates them in real-time, and they render in a sandboxed iframe preview. No files are written to disk — everything runs through an in-memory virtual file system.

## Commands

```bash
npm run setup          # Install deps + generate Prisma client + run migrations
npm run dev            # Dev server with Turbopack (http://localhost:3000)
npm run build          # Production build
npm run test           # Run Vitest suite
npm run lint           # ESLint
npm run db:reset       # Reset SQLite database
npx prisma migrate dev # Run pending migrations after schema changes
npx prisma generate    # Regenerate Prisma client after schema changes
```

Do NOT run `npm audit fix` — dependencies are pinned to compatible versions and audit fix can break them.

## Architecture

### Core Data Flow

1. User sends a chat message via `ChatInterface`
2. `ChatContext` sends messages + serialized file system state to `POST /api/chat`
3. The API injects a system prompt, calls Claude (or mock provider), and streams back responses with tool calls
4. Tool calls (`str_replace_editor`, `file_manager`) modify a server-side `VirtualFileSystem` instance
5. Client-side `FileSystemContext` applies the same tool calls to its own VFS copy
6. `PreviewFrame` transforms the VFS files through `jsx-transformer.ts` (Babel + import map generation) and renders them in a sandboxed iframe
7. On completion, authenticated users' projects are saved to the database

### Virtual File System (`src/lib/file-system.ts`)

The `VirtualFileSystem` class is the central data structure. It implements an in-memory Unix-like file system with create, read, update, delete, rename, serialize/deserialize, and string replacement operations. All generated components live here — nothing touches disk.

### AI Integration

- **Provider** (`src/lib/provider.ts`): Uses `claude-haiku-4-5` via `@ai-sdk/anthropic`. Falls back to `MockLanguageModel` if no API key is set — the mock returns canned counter/form/card components.
- **Tools**: Two tools are exposed to Claude:
  - `str_replace_editor` (`src/lib/tools/str-replace.ts`) — create files, view files, replace strings, insert at line numbers
  - `file_manager` (`src/lib/tools/file-manager.ts`) — rename and delete files
- **System prompt** (`src/lib/prompts/generation.tsx`): Instructs Claude to always create `/App.jsx` as entrypoint, use Tailwind for styling, use `@/` import alias for local files

### Code Transformation Pipeline (`src/lib/transform/jsx-transformer.ts`)

Transforms VFS files into a runnable preview:
1. Parses imports and detects missing dependencies
2. Babel transforms JSX to browser-compatible code
3. Builds an import map: third-party packages resolve to esm.sh CDN URLs, local files to blob URLs
4. Collects CSS and injects it into the preview HTML
5. Renders inside an iframe with React/ReactDOM loaded from esm.sh

### State Management

Two React contexts (no Redux/Zustand):
- **`FileSystemContext`** (`src/lib/contexts/file-system-context.tsx`) — owns the VFS instance, selected file, exposes mutation methods, handles tool call application
- **`ChatContext`** (`src/lib/contexts/chat-context.tsx`) — wraps Vercel AI SDK's `useChat`, manages messages/input/streaming status, delegates tool calls to FileSystemContext

### Authentication

JWT sessions stored in httpOnly cookies (jose for signing, bcrypt for passwords). Server actions in `src/actions/` handle signUp/signIn/signOut. Anonymous users can use the app but state isn't persisted.

### Database

Prisma with SQLite. Two models: `User` and `Project`. Projects store messages and file system state as JSON strings. Prisma client is generated to `src/generated/prisma/`. The database schema is defined in `prisma/schema.prisma` — always reference it to understand the structure of data stored in the database.

## Project Layout

- `src/app/` — Next.js App Router pages and API routes
- `src/components/chat/` — Chat interface (MessageList, MessageInput, ChatInterface)
- `src/components/editor/` — Code editor (FileTree, CodeEditor with Monaco)
- `src/components/preview/` — iframe preview rendering
- `src/components/auth/` — Sign in/up forms and dialog
- `src/components/ui/` — shadcn/ui primitives (Radix UI + Tailwind, new-york style)
- `src/lib/` — Core logic: file system, contexts, tools, transformer, prompts, auth, prisma
- `src/actions/` — Next.js server actions for auth and project CRUD
- `src/hooks/` — Custom React hooks
- `prisma/` — Database schema and SQLite file

## Key Conventions

- Path alias: `@/*` maps to `./src/*`
- UI components use shadcn/ui (Radix UI + CVA + tailwind-merge)
- Tests use Vitest + React Testing Library + jsdom, colocated in `__tests__/` directories
- The app's main layout (`src/app/main-content.tsx`) uses `react-resizable-panels` for a three-panel split: chat (35%), preview/code (65%)
- Use comments sparingly. Only comment complex code.
