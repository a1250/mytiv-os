"use client";

import { ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MarketingPanel } from "./marketing-panel";
import type { MarketingPlan } from "@/lib/marketing/contract";
import { Copilot } from "./copilot";
import { SpecEditor } from "./spec-editor";
import { TaskTable } from "./task-table";
import type { OpsTask, WorkspaceMember } from "@/lib/clickup";
import type { ProjectRow } from "@/lib/db/queries/projects";

type Props = {
  businessSlug: string;
  project: ProjectRow;
  tasks: OpsTask[];
  bugs: OpsTask[];
  decisions: OpsTask[];
  members: WorkspaceMember[];
  statusesByList: Record<string, string[]>;
  marketing: { binding: string | null; plan: MarketingPlan | null; canImport: boolean; unavailable: boolean; now: string };
};

function Count({ n }: { n: number }) {
  if (n === 0) return null;
  return <span className="text-muted-foreground ml-1.5 text-xs tabular-nums">{n}</span>;
}

export function ClientWorkspace({
  businessSlug,
  project,
  tasks,
  bugs,
  decisions,
  members,
  statusesByList,
  marketing,
}: Props) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">סקירה</TabsTrigger>
        <TabsTrigger value="tasks">
          משימות
          <Count n={tasks.length} />
        </TabsTrigger>
        <TabsTrigger value="bugs">
          תקלות
          <Count n={bugs.length} />
        </TabsTrigger>
        <TabsTrigger value="decisions">
          החלטות
          <Count n={decisions.length} />
        </TabsTrigger>
        <TabsTrigger value="marketing">שיווק</TabsTrigger>
        <TabsTrigger value="copilot">קופיילוט</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <SpecEditor businessSlug={businessSlug} project={project} />
      </TabsContent>

      <TabsContent value="tasks">
        <TaskTable
          businessSlug={businessSlug}
          projectId={project.id}
          tasks={tasks}
          members={members}
          statusesByList={statusesByList}
          emptyMessage={
            project.folderState === "unauthorized"
              ? "This project's ClickUp folder is not authorized for this business — tasks were not read."
              : project.clickupFolderId
              ? "No open tasks in this folder."
              : "This project is not linked to a ClickUp folder yet — add the folder ID in סקירה."
          }
        />
      </TabsContent>

      <TabsContent value="bugs">
        <TaskTable
          businessSlug={businessSlug}
          projectId={project.id}
          tasks={bugs}
          members={members}
          statusesByList={statusesByList}
          emptyMessage={project.folderState === "unauthorized" ? "This project's ClickUp folder is not authorized for this business — bugs were not read." : "No open bugs."}
        />
      </TabsContent>

      <TabsContent value="decisions">
        {decisions.length === 0 ? (
          <div className="bg-card border-border text-muted-foreground rounded-xl border px-6 py-10 text-center text-sm">
            No decisions recorded yet.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {decisions.map((d) => (
              <li key={d.id} className="bg-card border-border rounded-xl border p-3.5">
                <div className="flex items-start gap-2">
                  <span className="flex-1 text-sm leading-snug font-medium">{d.title}</span>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open in ClickUp"
                    className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </div>
                <div className="mt-2">
                  <Badge variant={d.statusType === "closed" || d.statusType === "done" ? "done" : "neutral"}>
                    {d.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-muted-foreground mt-3 text-xs">
          Read-only here. Decisions are written in ClickUp until the Copilot can add them under confirmation.
        </p>
      </TabsContent>

      <TabsContent value="marketing">
        <MarketingPanel businessSlug={businessSlug} projectId={project.id} tasks={[...tasks, ...bugs]} {...marketing} />
      </TabsContent>

      <TabsContent value="copilot">
        <Copilot businessSlug={businessSlug} projectId={project.id} />
      </TabsContent>
    </Tabs>
  );
}
