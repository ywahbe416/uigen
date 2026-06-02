"use client";

import { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

export function getToolStatusLabel(
  toolName: string,
  args?: Record<string, unknown>,
  isComplete?: boolean
): string {
  const command = args?.command as string | undefined;
  const path = args?.path as string | undefined;

  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return isComplete ? `Created ${path}` : `Creating ${path}...`;
      case "str_replace":
      case "insert":
        return isComplete ? `Edited ${path}` : `Editing ${path}...`;
      case "view":
        return isComplete ? `Viewed ${path}` : `Viewing ${path}...`;
      case "undo_edit":
        return isComplete ? `Undid edit on ${path}` : `Undoing edit on ${path}...`;
    }
  }

  if (toolName === "file_manager") {
    const newPath = args?.new_path as string | undefined;
    switch (command) {
      case "rename":
        return isComplete
          ? `Renamed ${path} to ${newPath}`
          : `Renaming ${path} to ${newPath}...`;
      case "delete":
        return isComplete ? `Deleted ${path}` : `Deleting ${path}...`;
    }
  }

  return isComplete ? `Ran ${toolName}` : `Running ${toolName}...`;
}

interface ToolStatusProps {
  toolInvocation: ToolInvocation;
}

export function ToolStatus({ toolInvocation }: ToolStatusProps) {
  const isComplete = toolInvocation.state === "result";
  const label = getToolStatusLabel(
    toolInvocation.toolName,
    toolInvocation.args,
    isComplete
  );

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
