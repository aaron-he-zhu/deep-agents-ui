"use client";

import React, { useState, useCallback } from "react";
import {
  FileText,
  BookOpen,
  Hammer,
  Settings2,
  Activity,
  Layers,
  Download,
  FolderDown,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FileItem } from "@/app/types/types";
import { FileViewDialog } from "@/app/components/FileViewDialog";
import { PlaybookDialog } from "@/app/components/PlaybookDialog";
import { type Playbook, type PlaybookCategory } from "@/data/playbooks";
import { useChatContext } from "@/providers/ChatProvider";

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
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<PlaybookCategory | null>(null);
    
    // Get sendMessage from context
    const { sendMessage } = useChatContext();

    const handleSaveFile = useCallback(
      async (fileName: string, content: string) => {
        await setFiles({ ...files, [fileName]: content });
        setSelectedFile({ path: fileName, content: content });
      },
      [files, setFiles]
    );

    const handlePlaybookClick = (playbookId: string) => {
      setSelectedCategory(playbookId as PlaybookCategory);
      setDialogOpen(true);
      // Optional: still call the prop if provided
      onPlaybookSelect?.(playbookId);
    };

    const handleRunPlaybook = (playbook: Playbook, customInstructions?: string) => {
      const prompt = `Run the "${playbook.title}" agent (${playbook.agentName}).
        
Category: ${playbook.category}
Task: ${playbook.description}

Auto Actions:
${playbook.autoActions.map(a => `- ${a}`).join('\n')}

Expected Outputs:
${playbook.outputs.map(o => `- ${o}`).join('\n')}

${customInstructions ? `Custom Instructions:\n${customInstructions}` : ''}`;
      
      sendMessage(prompt);
    };

    return (
      <div className="flex h-full flex-col p-2 pl-0">
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background">
          {/* Playbooks Module - Top Section (fixed height) */}
          <div className="group/playbooks flex-shrink-0">
            <div className="flex h-12 items-center gap-2 px-4 border-b border-border bg-muted/30">
              <Layers size={16} className="text-muted-foreground" />
              <span className="text-sm font-semibold tracking-wide">
                Playbooks
              </span>
              <a
                href="https://www.reddit.com/r/SeenOS/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto rounded p-1 opacity-0 transition-opacity hover:bg-muted group-hover/playbooks:opacity-100"
                title="Join SeenOS community on Reddit"
              >
                <img src="/reddit.svg" alt="Reddit" className="h-4 w-4 opacity-60" />
              </a>
            </div>
            <div className="px-4 py-4">
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

          {/* Artifacts Module - Bottom Section (fills remaining space) */}
          {(() => {
            // Filter out internal large_tool_results files
            const visibleFiles = Object.keys(files).filter(
              (f) => !f.startsWith("/large_tool_results/")
            );
            
            const getFileContent = (filePath: string): string => {
              const rawContent = files[filePath];
              if (typeof rawContent === "object" && rawContent !== null && "content" in rawContent) {
                const contentArray = (rawContent as { content: unknown }).content;
                return Array.isArray(contentArray) ? contentArray.join("\n") : String(contentArray || "");
              }
              return String(rawContent || "");
            };
            
            return (
          <div className="group/artifacts flex min-h-0 flex-1 flex-col">
            <div className="flex h-12 flex-shrink-0 items-center gap-2 px-4 border-b border-border bg-muted/30">
              <FileText size={16} className="text-muted-foreground" />
              <span className="text-sm font-semibold tracking-wide">
                Artifacts
              </span>
              {visibleFiles.length > 0 && (
                <span className="rounded-full bg-[#2F6868] px-2 py-0.5 text-xs font-medium text-white">
                  {visibleFiles.length}
                </span>
              )}
              {visibleFiles.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    // Download all visible files
                    visibleFiles.forEach((filePath) => {
                      const fileContent = getFileContent(filePath);
                      const fileName = filePath.split("/").pop() || filePath;
                      const blob = new Blob([fileContent], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = fileName;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    });
                  }}
                  className="ml-auto rounded p-1 opacity-0 transition-opacity hover:bg-muted group-hover/artifacts:opacity-100"
                  title="Download All"
                >
                  <FolderDown size={16} className="text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {visibleFiles.length === 0 ? (
                <div className="flex h-full items-center justify-center px-4 pb-4">
                  <p className="text-xs text-muted-foreground">
                    No artifacts created yet
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-full px-4 py-4">
                  <div className="space-y-1">
                    {visibleFiles.map((filePath) => {
                      const fileContent = getFileContent(filePath);
                      const fileName = filePath.split("/").pop() || filePath;

                      const handleDownload = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        const blob = new Blob([fileContent], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      };

                      return (
                        <div
                          key={filePath}
                          className="group relative flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2 text-left transition-colors hover:border-border hover:bg-accent"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedFile({
                                path: filePath,
                                content: fileContent,
                              })
                            }
                            className="flex flex-1 items-center gap-3 min-w-0"
                          >
                            <FileText
                              size={16}
                              className="flex-shrink-0 text-muted-foreground"
                            />
                            <p className="min-w-0 flex-1 truncate text-sm font-medium text-left">
                              {fileName}
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={handleDownload}
                            className="flex-shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                            title="Download"
                          >
                            <Download size={16} className="text-muted-foreground" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
            );
          })()}
        </div>

        {selectedFile && (
          <FileViewDialog
            file={selectedFile}
            onSaveFile={handleSaveFile}
            onClose={() => setSelectedFile(null)}
            editDisabled={editDisabled}
          />
        )}

        <PlaybookDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          category={selectedCategory}
          onRunPlaybook={handleRunPlaybook}
        />
      </div>
    );
  }
);

RightSidebar.displayName = "RightSidebar";
