"use client";

import React, { useState, useCallback } from "react";
import {
  FileText,
  BookOpen,
  Hammer,
  Settings2,
  Activity,
  Layers,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FileItem } from "@/app/types/types";
import { FileViewDialog } from "@/app/components/FileViewDialog";

interface PlaybookButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const playbooks: PlaybookButton[] = [
  {
    id: "research",
    label: "Research",
    icon: <BookOpen size={24} />,
    description: "Deep research task",
  },
  {
    id: "build",
    label: "Build",
    icon: <Hammer size={24} />,
    description: "Build and create",
  },
  {
    id: "optimize",
    label: "Optimize",
    icon: <Settings2 size={24} />,
    description: "Optimize and improve",
  },
  {
    id: "monitor",
    label: "Monitor",
    icon: <Activity size={24} />,
    description: "Monitor and track",
  },
];

interface RightSidebarProps {
  files: Record<string, string>;
  setFiles: (files: Record<string, string>) => Promise<void>;
  editDisabled: boolean;
  onPlaybookSelect?: (playbookId: string) => void;
}

export const RightSidebar = React.memo<RightSidebarProps>(
  ({ files, setFiles, editDisabled, onPlaybookSelect }) => {
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

    const handleSaveFile = useCallback(
      async (fileName: string, content: string) => {
        await setFiles({ ...files, [fileName]: content });
        setSelectedFile({ path: fileName, content: content });
      },
      [files, setFiles]
    );

    const handlePlaybookClick = (playbookId: string) => {
      onPlaybookSelect?.(playbookId);
    };

    return (
      <div className="flex h-full flex-col p-4 pl-0">
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background">
          {/* Playbooks Module - Top Section (fixed height) */}
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2 px-4 py-3">
              <Layers size={16} className="text-muted-foreground" />
              <span className="text-sm font-semibold tracking-wide">
                Playbooks
              </span>
            </div>
            <div className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-2">
                {playbooks.map((playbook) => (
                  <button
                    key={playbook.id}
                    onClick={() => handlePlaybookClick(playbook.id)}
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent"
                  >
                    <div className="text-muted-foreground">{playbook.icon}</div>
                    <span className="text-sm font-medium">{playbook.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Artefacts Module - Bottom Section (fills remaining space) */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-shrink-0 items-center gap-2 px-4 py-3">
              <FileText size={16} className="text-muted-foreground" />
              <span className="text-sm font-semibold tracking-wide">
                Artefacts
              </span>
              {Object.keys(files).length > 0 && (
                <span className="ml-auto rounded-full bg-[#2F6868] px-2 py-0.5 text-xs font-medium text-white">
                  {Object.keys(files).length}
                </span>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {Object.keys(files).length === 0 ? (
                <div className="flex h-full items-center justify-center px-4 pb-4">
                  <p className="text-xs text-muted-foreground">
                    No artefacts created yet
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-1">
                    {Object.keys(files).map((file) => {
                      const filePath = String(file);
                      const rawContent = files[file];
                      let fileContent: string;
                      if (
                        typeof rawContent === "object" &&
                        rawContent !== null &&
                        "content" in rawContent
                      ) {
                        const contentArray = (rawContent as { content: unknown })
                          .content;
                        if (Array.isArray(contentArray)) {
                          fileContent = contentArray.join("\n");
                        } else {
                          fileContent = String(contentArray || "");
                        }
                      } else {
                        fileContent = String(rawContent || "");
                      }

                      // Extract filename from path
                      const fileName = filePath.split("/").pop() || filePath;

                      return (
                        <button
                          key={filePath}
                          type="button"
                          onClick={() =>
                            setSelectedFile({
                              path: filePath,
                              content: fileContent,
                            })
                          }
                          className="flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2 text-left transition-colors hover:border-border hover:bg-accent"
                        >
                          <FileText
                            size={16}
                            className="flex-shrink-0 text-muted-foreground"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {fileName}
                            </p>
                            {fileName !== filePath && (
                              <p className="truncate text-xs text-muted-foreground">
                                {filePath}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>

        {selectedFile && (
          <FileViewDialog
            file={selectedFile}
            onSaveFile={handleSaveFile}
            onClose={() => setSelectedFile(null)}
            editDisabled={editDisabled}
          />
        )}
      </div>
    );
  }
);

RightSidebar.displayName = "RightSidebar";

