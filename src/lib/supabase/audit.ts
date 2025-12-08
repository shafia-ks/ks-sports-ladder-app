import { supabaseAdmin } from "./server";

export async function createAuditLog(params: {
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
}) {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from("audit_logs").insert({
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    performed_by: params.performedBy,
  });
}
