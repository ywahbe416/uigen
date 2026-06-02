import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getToolStatusLabel, ToolStatus } from "../ToolStatus";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// --- Pure function tests for getToolStatusLabel ---

test("str_replace_editor create in-progress", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "create", path: "/App.jsx" }, false)
  ).toBe("Creating /App.jsx...");
});

test("str_replace_editor create completed", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "create", path: "/App.jsx" }, true)
  ).toBe("Created /App.jsx");
});

test("str_replace_editor str_replace in-progress", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "str_replace", path: "/Button.jsx" }, false)
  ).toBe("Editing /Button.jsx...");
});

test("str_replace_editor str_replace completed", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "str_replace", path: "/Button.jsx" }, true)
  ).toBe("Edited /Button.jsx");
});

test("str_replace_editor insert in-progress", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "insert", path: "/utils.js" }, false)
  ).toBe("Editing /utils.js...");
});

test("str_replace_editor insert completed", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "insert", path: "/utils.js" }, true)
  ).toBe("Edited /utils.js");
});

test("str_replace_editor view in-progress", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "view", path: "/App.jsx" }, false)
  ).toBe("Viewing /App.jsx...");
});

test("str_replace_editor view completed", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "view", path: "/App.jsx" }, true)
  ).toBe("Viewed /App.jsx");
});

test("str_replace_editor undo_edit in-progress", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" }, false)
  ).toBe("Undoing edit on /App.jsx...");
});

test("str_replace_editor undo_edit completed", () => {
  expect(
    getToolStatusLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" }, true)
  ).toBe("Undid edit on /App.jsx");
});

test("file_manager rename in-progress", () => {
  expect(
    getToolStatusLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" }, false)
  ).toBe("Renaming /old.jsx to /new.jsx...");
});

test("file_manager rename completed", () => {
  expect(
    getToolStatusLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" }, true)
  ).toBe("Renamed /old.jsx to /new.jsx");
});

test("file_manager rename without new_path", () => {
  expect(
    getToolStatusLabel("file_manager", { command: "rename", path: "/old.jsx" }, true)
  ).toBe("Renamed /old.jsx to undefined");
});

test("file_manager delete in-progress", () => {
  expect(
    getToolStatusLabel("file_manager", { command: "delete", path: "/trash.jsx" }, false)
  ).toBe("Deleting /trash.jsx...");
});

test("file_manager delete completed", () => {
  expect(
    getToolStatusLabel("file_manager", { command: "delete", path: "/trash.jsx" }, true)
  ).toBe("Deleted /trash.jsx");
});

test("unknown tool fallback in-progress", () => {
  expect(getToolStatusLabel("some_other_tool", {}, false)).toBe(
    "Running some_other_tool..."
  );
});

test("unknown tool fallback completed", () => {
  expect(getToolStatusLabel("some_other_tool", {}, true)).toBe(
    "Ran some_other_tool"
  );
});

test("undefined args falls back gracefully", () => {
  expect(getToolStatusLabel("str_replace_editor", undefined, false)).toBe(
    "Running str_replace_editor..."
  );
});

test("missing command in args falls back gracefully", () => {
  expect(getToolStatusLabel("str_replace_editor", { path: "/App.jsx" }, false)).toBe(
    "Running str_replace_editor..."
  );
});

// --- Component rendering tests ---

test("ToolStatus renders completed state with green dot", () => {
  const invocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "result",
    result: "Success",
  };

  const { container } = render(<ToolStatus toolInvocation={invocation} />);

  expect(screen.getByText("Created /App.jsx")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
});

test("ToolStatus renders in-progress state with spinner", () => {
  const invocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "call",
  };

  const { container } = render(<ToolStatus toolInvocation={invocation} />);

  expect(screen.getByText("Creating /App.jsx...")).toBeDefined();
  expect(container.querySelector(".animate-spin")).not.toBeNull();
});

test("ToolStatus renders partial-call state with spinner", () => {
  const invocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: {},
    state: "partial-call",
  };

  const { container } = render(<ToolStatus toolInvocation={invocation} />);

  expect(container.querySelector(".animate-spin")).not.toBeNull();
});

test("ToolStatus renders file_manager rename with both paths", () => {
  const invocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "file_manager",
    args: { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
    state: "result",
    result: { success: true },
  };

  render(<ToolStatus toolInvocation={invocation} />);

  expect(screen.getByText("Renamed /old.jsx to /new.jsx")).toBeDefined();
});

test("ToolStatus renders unknown tool with fallback", () => {
  const invocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "unknown_tool",
    args: {},
    state: "result",
    result: "done",
  };

  render(<ToolStatus toolInvocation={invocation} />);

  expect(screen.getByText("Ran unknown_tool")).toBeDefined();
});
