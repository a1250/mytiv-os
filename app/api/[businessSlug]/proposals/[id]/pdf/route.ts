/**
 * Renders a proposal to PDF server-side. Branding (name, logo, footer line) is
 * read from the calling business, never hardcoded, so one business's proposals
 * can't go out carrying another's identity.
 */
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { getProposal } from "@/lib/db/queries/proposals";
import { getSettingsForBusiness } from "@/lib/db/queries/settings";
import { pdfFileName } from "@/lib/pdf-helpers";
import { ProposalPDF } from "@/components/pdf/ProposalPDF";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  try {
    const { businessSlug, id } = await params;
    const { businessId, business } = await guard(businessSlug);

    const proposal = await getProposal(businessId, id);
    if (!proposal) return NextResponse.json({ error: "not found" }, { status: 404 });

    const settings = await getSettingsForBusiness(businessId);
    const brand = {
      name: settings.studio_name || business.name,
      logoUrl: business.logoUrl,
      footer: settings.proposal_footer || null,
    };

    const proposalForPdf = {
      ...proposal,
      services: (proposal.services as React.ComponentProps<typeof ProposalPDF>["proposal"]["services"]) ?? [],
    };

    // @ts-expect-error @react-pdf/renderer's Style type conflicts with React.CSSProperties
    const buffer = await renderToBuffer(React.createElement(ProposalPDF, { proposal: proposalForPdf, brand }));

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfFileName(proposalForPdf)}"`,
      },
    });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
