"use server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { resolveBusiness } from "@/lib/tenant";
import { db } from "@/lib/db";
import { proposals, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { pdfFileName } from "@/lib/pdf-helpers";
import React from "react";
import { ProposalPDF } from "@/components/pdf/ProposalPDF";

export async function GET(req: Request, { params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  const { businessSlug, id } = await params;
  const session = await auth();

  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
  if (!user[0]) {
    return new Response("User not found", { status: 401 });
  }

  const business = await resolveBusiness(businessSlug, user[0].id);
  if (!business) {
    return new Response("Business not found", { status: 404 });
  }

  const [proposal] = await db
    .select()
    .from(proposals)
    .where(and(eq(proposals.id, id), eq(proposals.businessId, business.business.id)))
    .limit(1);

  if (!proposal) {
    return new Response("Proposal not found", { status: 404 });
  }

  // Cast services array to the shape ProposalPDF expects
  const proposalForPdf = {
    ...proposal,
    services: (proposal.services as any[]) ?? [],
  };

  // @ts-ignore - @react-pdf/renderer has style type conflicts
  const buffer = await renderToBuffer(React.createElement(ProposalPDF, { proposal: proposalForPdf }));
  const fileName = pdfFileName(proposalForPdf);

  return new Response(buffer as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
