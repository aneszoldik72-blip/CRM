import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AgentInput } from "@/lib/validators/agent";
import type { Database } from "@/types/database";

export type AgentRow = Database["public"]["Tables"]["agents"]["Row"];

export type AgentStatusFilter = "active" | "archived" | "all";

// All queries rely on RLS — never pass user_id from callers.

export async function listAgents(
  filter: AgentStatusFilter = "active",
): Promise<AgentRow[]> {
  const supabase = await createClient();
  let q = supabase.from("agents").select("*").order("name", { ascending: true });
  if (filter === "active") q = q.eq("active", true);
  else if (filter === "archived") q = q.eq("active", false);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getAgent(id: string): Promise<AgentRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createAgent(input: AgentInput): Promise<AgentRow> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data, error } = await supabase
    .from("agents")
    .insert({
      user_id: user.id,
      name: input.name,
      phone: input.phone,
      photo_url: input.photo_url,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateAgent(
  id: string,
  input: AgentInput,
): Promise<AgentRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .update({
      name: input.name,
      phone: input.phone,
      photo_url: input.photo_url,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function setAgentActive(
  id: string,
  active: boolean,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("agents")
    .update({ active })
    .eq("id", id);
  if (error) throw error;
}
