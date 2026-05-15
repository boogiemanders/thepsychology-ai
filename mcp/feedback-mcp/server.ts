#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL_FROM = process.env.NOTIFY_EMAIL_FROM;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("[feedback-mcp] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sbHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function sbGet(path: string): Promise<any> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: sbHeaders });
  if (!r.ok) throw new Error(`Supabase GET ${path} -> ${r.status}: ${await r.text()}`);
  return r.json();
}

async function sbPatch(path: string, body: any): Promise<any> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: { ...sbHeaders, Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Supabase PATCH ${path} -> ${r.status}: ${await r.text()}`);
  return r.json();
}

const tools = [
  {
    name: "list_feedback",
    description: "List site feedback (general user complaints/questions). Filter by status. Defaults to 'new'.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["new", "reviewed", "resolved", "all"], default: "new" },
        limit: { type: "integer", default: 20 },
      },
    },
  },
  {
    name: "get_feedback",
    description: "Get a single feedback item with full message and user metadata.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", description: "Feedback UUID" } },
    },
  },
  {
    name: "user_history",
    description: "Pull a user's recent activity (exam attempts, signup, plan) to evaluate whether their complaint is accurate. Pass email OR user_id.",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string" },
        user_id: { type: "string" },
        exam_limit: { type: "integer", default: 10 },
      },
    },
  },
  {
    name: "list_low_rated_questions",
    description: "List question_feedback entries where users rated questions <= max_rating. Shows full question, comment, and metadata so you can fix the question.",
    inputSchema: {
      type: "object",
      properties: {
        max_rating: { type: "integer", default: 2 },
        limit: { type: "integer", default: 20 },
      },
    },
  },
  {
    name: "mark_reviewed",
    description: "Mark a feedback item as reviewed with optional admin_notes.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" },
        admin_notes: { type: "string" },
      },
    },
  },
  {
    name: "mark_resolved",
    description: "Mark a feedback item as resolved with optional admin_notes.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" },
        admin_notes: { type: "string" },
      },
    },
  },
  {
    name: "compare_exam_attempts",
    description: "Diff the questions JSONB between two exam_results rows. Returns overlap count, % overlap, and sample shared question ids. Use to validate 'I got the same exam twice' complaints.",
    inputSchema: {
      type: "object",
      required: ["attempt_id_a", "attempt_id_b"],
      properties: {
        attempt_id_a: { type: "string" },
        attempt_id_b: { type: "string" },
        sample_size: { type: "integer", default: 5, description: "How many shared question ids to include in output as samples." },
      },
    },
  },
  {
    name: "send_reply",
    description: "Send an email reply via Resend to the user who left this feedback, then mark the feedback as resolved with the reply body saved in admin_notes. Use after you've drafted body text and confirmed with the founder.",
    inputSchema: {
      type: "object",
      required: ["feedback_id", "subject", "body"],
      properties: {
        feedback_id: { type: "string" },
        subject: { type: "string" },
        body: { type: "string", description: "Plain-text email body. Newlines auto-converted to <br/> for HTML." },
        to_override: { type: "string", description: "Override recipient (otherwise uses feedback.user_email)." },
      },
    },
  },
];

const server = new Server(
  { name: "feedback-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;
  try {
    const result = await handle(name, args as Record<string, any>);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (e: any) {
    return { content: [{ type: "text", text: `ERROR: ${e.message}` }], isError: true };
  }
});

async function handle(name: string, args: Record<string, any>): Promise<any> {
  switch (name) {
    case "list_feedback": {
      const status = args.status ?? "new";
      const limit = args.limit ?? 20;
      const filter = status === "all" ? "" : `status=eq.${status}&`;
      const rows = await sbGet(`feedback?${filter}order=created_at.desc&limit=${limit}`);
      return rows.map((r: any) => ({
        id: r.id,
        created_at: r.created_at,
        status: r.status,
        user_email: r.user_email ?? "anonymous",
        user_id: r.user_id,
        page_path: r.page_path,
        message: r.message,
      }));
    }

    case "get_feedback": {
      const rows = await sbGet(`feedback?id=eq.${args.id}`);
      if (!rows.length) throw new Error(`No feedback with id ${args.id}`);
      return rows[0];
    }

    case "user_history": {
      let userId = args.user_id;
      let email = args.email;

      if (!userId && email) {
        const fb = await sbGet(`feedback?user_email=eq.${encodeURIComponent(email)}&select=user_id&limit=1`);
        userId = fb[0]?.user_id;
      }
      if (!userId) {
        return { error: "Provide user_id or email of a user with feedback on file." };
      }

      const examLimit = args.exam_limit ?? 10;
      const [exams, scores, activity] = await Promise.all([
        sbGet(
          `exam_results?user_id=eq.${userId}&order=created_at.desc&limit=${examLimit}&select=id,exam_type,exam_mode,score,total_questions,created_at`
        ),
        sbGet(`user_scores?user_id=eq.${userId}&limit=1`).catch(() => []),
        sbGet(
          `user_activity?user_id=eq.${userId}&order=created_at.desc&limit=20&select=activity_type,created_at,metadata`
        ).catch(() => []),
      ]);

      return {
        user_id: userId,
        email,
        recent_exams: exams,
        user_scores: scores[0] ?? null,
        recent_activity: activity,
      };
    }

    case "list_low_rated_questions": {
      const maxRating = args.max_rating ?? 2;
      const limit = args.limit ?? 20;
      const rows = await sbGet(
        `question_feedback?rating=lte.${maxRating}&order=created_at.desc&limit=${limit}`
      );
      return rows.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        confidence: r.confidence,
        question_key: r.question_key,
        question_id: r.question_id,
        question: r.question,
        options: r.options,
        correct_answer: r.correct_answer,
        selected_answer: r.selected_answer,
        was_correct: r.was_correct,
        exam_type: r.exam_type,
        created_at: r.created_at,
        metadata: r.metadata,
      }));
    }

    case "mark_reviewed":
    case "mark_resolved": {
      const status = name === "mark_reviewed" ? "reviewed" : "resolved";
      const patch: any = { status };
      if (args.admin_notes) patch.admin_notes = args.admin_notes;
      const rows = await sbPatch(`feedback?id=eq.${args.id}`, patch);
      return rows[0] ?? { ok: true };
    }

    case "compare_exam_attempts": {
      const [a, b] = await Promise.all([
        sbGet(`exam_results?id=eq.${args.attempt_id_a}&select=id,user_id,exam_type,exam_mode,score,total_questions,created_at,questions`),
        sbGet(`exam_results?id=eq.${args.attempt_id_b}&select=id,user_id,exam_type,exam_mode,score,total_questions,created_at,questions`),
      ]);
      if (!a.length) throw new Error(`No exam_results with id ${args.attempt_id_a}`);
      if (!b.length) throw new Error(`No exam_results with id ${args.attempt_id_b}`);

      const qsA: any[] = Array.isArray(a[0].questions) ? a[0].questions : [];
      const qsB: any[] = Array.isArray(b[0].questions) ? b[0].questions : [];

      const idsA = new Set<string>();
      const byIdA = new Map<string, any>();
      for (const q of qsA) {
        const key = String(q.id ?? q.question_key ?? q.question ?? "");
        if (key) { idsA.add(key); byIdA.set(key, q); }
      }
      const sharedIds: string[] = [];
      for (const q of qsB) {
        const key = String(q.id ?? q.question_key ?? q.question ?? "");
        if (key && idsA.has(key)) sharedIds.push(key);
      }

      const sampleSize = args.sample_size ?? 5;
      const samples = sharedIds.slice(0, sampleSize).map((k) => {
        const q = byIdA.get(k);
        return {
          id: k,
          question: typeof q?.question === "string" ? q.question.slice(0, 140) : null,
          topic: q?.topicName ?? q?.topic ?? null,
        };
      });

      const denominator = Math.min(qsA.length, qsB.length) || 1;
      return {
        attempt_a: { id: a[0].id, created_at: a[0].created_at, score: a[0].score, total: a[0].total_questions, questions_count: qsA.length },
        attempt_b: { id: b[0].id, created_at: b[0].created_at, score: b[0].score, total: b[0].total_questions, questions_count: qsB.length },
        shared_question_count: sharedIds.length,
        overlap_pct: Math.round((sharedIds.length / denominator) * 1000) / 10,
        sample_shared: samples,
      };
    }

    case "send_reply": {
      if (!RESEND_API_KEY || !NOTIFY_EMAIL_FROM) {
        throw new Error("Missing RESEND_API_KEY or NOTIFY_EMAIL_FROM");
      }
      const fb = await sbGet(`feedback?id=eq.${args.feedback_id}`);
      if (!fb.length) throw new Error(`No feedback with id ${args.feedback_id}`);
      const to = args.to_override || fb[0].user_email;
      if (!to) throw new Error("No recipient email on feedback record. Pass to_override.");

      const html = String(args.body).replace(/\n/g, "<br/>");
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: NOTIFY_EMAIL_FROM,
          to: [to],
          subject: args.subject,
          text: args.body,
          html,
        }),
      });
      if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
      const sent = await r.json();

      const adminNotes = `Replied via feedback-mcp on ${new Date().toISOString()}\nSubject: ${args.subject}\n\n${args.body}`;
      await sbPatch(`feedback?id=eq.${args.feedback_id}`, {
        status: "resolved",
        admin_notes: adminNotes,
      });

      return { sent, to, status: "resolved" };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[feedback-mcp] ready");
