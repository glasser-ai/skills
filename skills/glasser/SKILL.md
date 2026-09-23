---
name: glasser
description: Find and call 1,000+ paid data endpoints with one key: person and company enrichment, people and company search, web, news, maps, scholar and shopping search, SEO, social media, US property data, scraping. Search, inspect the price, run, pay per call. Runs through the glasser CLI or its MCP server.
version: 0.1.53
metadata:
  source: https://glasser.ai/SKILL.md
  category: research
---

# Glasser CLI

Glasser is a broker: it sells runnable third-party API operations
("Endpoints") under a single Key. You search the data sources, inspect an
Endpoint's contract and Price, and run it — the response is the provider's
own output after structure-preserving redaction: private billing fields
(vendor usage counters such as `credits`) are removed, nothing is renamed
or reshaped.

## Setup

```sh
glasser --version 2>/dev/null || curl -fsSL https://glasser.ai/install.sh | sh
```

One command when the CLI is missing, and it installs the current version.
With npm, `npm install -g @glasser-ai/cli@latest` does the same job. A fresh
install selects the latest version, so no separate registry version check
is needed. The installer reports what it needs and where it wrote the
binary — read its output rather than guessing.

**If the CLI was already installed**, the server tells you when to upgrade —
you do not have to compare versions by hand. Upgrade when any of these
appears:

- a response carries a `client` block. It is present only when this CLI is
  behind, and it says everything needed to act: `client_version`,
  `minimum_version`, `latest_version`, a runnable `upgrade_command`, and a
  `reason`. It rides in the response body,
  so it reaches `-j` output like any other field;
- a command fails with `control: "client.version_unsupported"`. This CLI is
  too old to read part of the catalog, and `search` and `inspect` are refused
  rather than answered with a shortened list — a missing row would be
  invisible to you. Run the `upgrade_command` from `details`, then retry;
- a command printed an `Update available` notice — the CLI asks the npm
  registry at most once every three hours and prints this on stderr. This one
  never
  appears in `-j` mode, because both streams stay machine-clean; the `client`
  block above is the `-j` signal.

After upgrading, re-fetch this file from https://glasser.ai/SKILL.md — the
Skill and the CLI update together. Never downgrade. An available update
never interrupts work: finish the task at hand, then upgrade before the
next one. If the registry is unreachable, proceed with the installed
version — do not block the task on an upgrade check.

## No shell? Use the MCP server

If this session has `glasser` MCP tools — `search`, `inspect`, `run`,
`runs_get`, `runs_list`, `runs_stop`, `balance` — and no shell, the CLI
steps above do not apply. The verbs map one to one; only `run` differs, in
that it needs an `idempotency_key` you generate (a UUID). Same Key, same
Workspace, same balance, and the rules below are the same either way. With
a shell, prefer the CLI. To connect a client, read
https://glasser.ai/docs/mcp-server.md — the single source for client setup,
kept current — rather than writing a config from memory.

## Authentication

Run `glasser balance`. Exit 0 means authentication works; continue to
**First run**. A missing or rejected Key needs one. Handle other failures
from the error message instead of starting another login.

**Where a Key comes from.** Two sources, and the environment takes precedence
over the local store. `GLASSER_API_KEY` needs no file on disk, so it is what
CI, scripts and scheduled jobs use, and it is the source that still works on a
machine whose own store will not outlive the session — a cloud session, a
container. Mint that Key in the console. The local store is what `glasser
login` writes and what `glasser keys add --label <l> --key <k>` fills by hand;
it lives on the machine the CLI ran on, and lasts as long as that machine does.

**With a user present**, in this order:

1. Run `glasser login` with your shell tool's background execution support.
   The CLI opens the sign-in page when possible and prints a fallback URL and
   a matching code.
2. Relay that URL and code exactly as printed — a plain URL, readable in a
   terminal — with a brief explanation of the next step. Nothing else starts
   until this message is out.
3. Wait for that same command to finish, using the shell tool's wait or output
   operation with short waits. A pending result means wait again, not return
   a final reply. Browser approval needs no further chat message. Give brief
   progress updates during the wait; the CLI polls for up to 15 minutes.
   Stop waiting when login succeeds, fails, expires, or the user cancels.

Once login succeeds, use the available balance in its output and continue to
**First run**, unless login warns that `GLASSER_API_KEY` overrides the saved
Key or the summary has no available balance. In either case, run
`glasser balance` in the environment subsequent commands will use. Login's
summary uses the new Key directly; it does not verify an environment Key.

If that check rejects an environment Key, another login will not fix it.
Preserve runtime-managed authentication: changing the variable or bypassing
it for a command needs the user's authorization. When the user requires it
to stay unchanged, report the blocker and the runtime correction needed.
For other failures, report the actual error; a network failure does not show
that a Key is invalid. If authorization expires, a new login needs a new
URL and code relayed before waiting again.
Never ask the user to paste a Key. `glasser login --json` is a usage error by
design — that flow needs a human.

## First run

Setup is finished when login succeeds and reports the available balance
without an environment Key override, or `glasser balance` exits 0 in the
environment subsequent commands will use — with the MCP tools, when
`balance` succeeds.
If setup is blocked, give a brief status, the confirmed cause, and the next
step needed to resolve it. You may state which steps succeeded, but do not
claim readiness or offer task prompts while authentication is blocked.
Login's balance is not usable evidence for commands that use a rejected Key.

Once setup is finished, if the user already gave you a task, continue it.
For a setup-only request, reply briefly in the user's language: confirm
Glasser is ready, report the available balance from login or the balance
check, then offer three ready-to-send task prompts, one per bullet.
Use a conversational lead-in that explains how the suggestions can help
the user, rather than a generic list heading. Connect it to their goals
when known, or briefly describe what they could accomplish with Glasser.

Base the prompts on the user's project, interests or goals when that context
is available. Otherwise, choose three varied examples from Glasser's
capabilities. Give each prompt a concrete subject and a clear result the
user can ask for.

For both completed and blocked setup, omit Workspace names/slugs, Key
labels/values/prefixes, and installation details such as versions, paths or
package-manager output. Name a configuration variable when it explains the
blocker. Report useful status, not a transcript of the setup commands.
Wait for the user to choose before starting a paid Run.

## When to use

- The task needs a capability (enrich a person or company, search the web,
  etc.) and no key or integration for it exists in the environment.
- Workflow, in order:
  0. One piece of the user's work is one **task**. On your first search for it,
     add `--user-request "<what they asked for>"`: the user's own request, in
     their words, with the subject in it. Leave out personal details about
     third parties. Search prints a task id; pass it back
     with `--task <id>` on every later search, inspect and run for that same
     piece of work. Every command that prints a follow-up command already
     carries the id in it, so working from what you are given keeps a task
     together with no bookkeeping.

     It changes nothing about what you get back and costs nothing. It is how we
     learn what people actually come here for, and it is what lets you list one
     task's Runs together with `glasser runs list --task <id>`.
  1. `glasser search "<capability>"` — find candidate Endpoints. The
     Provider column reads `pdl (People Data Labs)`: the first word is the
     slug every `-p` flag takes, the name in parentheses is who the data
     comes from — use it when the user names a vendor, and when you report
     the source back. Several Providers may sell the same capability: the
     list is ranked by relevance only, the Price sits beside each row, and
     the choice is yours.
     - A page holds 5 rows and the footer says how many matches there are in
       total. Pass the printed cursor with `--cursor` to see the rest.
     - The Score column is the cosine similarity between your words and that
       Endpoint's description, in [-1, 1], shown as `-` when semantic scoring
       did not run. It is a similarity signal for comparing rows on one page,
       not a verdict: the row order comes from fusing a keyword and a semantic
       ranking, and the ranking always returns its nearest candidates.
     - **Neither a page of low scores nor reaching the last page shows that
       the catalog lacks a capability.** Before you tell the user something is
       unavailable: read the total, page through with `--cursor`, search again
       with different words (the catalog is indexed on how each Endpoint
       describes itself, which may not be your phrasing), and inspect every
       candidate whose name is close to the task — `inspect` is free.
  2. `glasser inspect -p <provider> -e <endpoint>` — **read the Price and
     the charge clauses BEFORE running.** The Price is what a normal
     COMPLETED call costs; the charge clauses list the exceptions (e.g.
     `NO_RESULT $0.00` means an empty answer is free). For any given
     endpoint the clauses are authoritative. Also identify which input
     fields control result volume (`num`, `size`, `limit`, arrays of
     queries) — the charge rule may read the input, so volume parameters
     can change what a call costs. Start small; raise only when the user
     needs more.
  3. `glasser run -p <provider> -e <endpoint> -i '<json>'` — execute.
  4. Report the result AND the charge to the user (run output includes the
     charged amount). Every Run also prints a `Run URL` (the `run_url` field
     in `-j`; absent from the `-o` file): the Workspace console page holding
     that Run's records exactly as the Provider returned them, private to
     Workspace members. Give the user that URL itself, never the Run id
     alone — one line per Run your answer used, at the end.

## When NOT to use

- **Precedence: an explicit user instruction > the user's own integrations
  and keys > Glasser.** If the user has their own key, client, or
  integration for the capability, use that instead.
- **Runs spend the Workspace balance.** Do not run Endpoints speculatively,
  in loops, or for bulk operations without telling the user the per-call
  Price and getting their go-ahead.
- Do not use it for capabilities the environment already provides for free.
- **The catalog changes often** — Endpoints and Providers are added weekly.
  Search every time you need one; never cache or reuse a listing from an
  earlier session, and never answer "what can Glasser do" from memory.

## Adding funds

Only the user can add funds, in the console at https://app.glasser.ai/balance —
no command or tool does it. Three ways:

- **Top up** on the Balance page.
- **Referral**: share the referral link on the Balance page. Both sides get
  a Grant at signup; the referrer gets another after the new user tops up
  and runs something.
- **Share a Run**: post a `COMPLETED` Run to X or LinkedIn from the console,
  then paste the post link back to claim a Grant. Needs one earlier top-up.

A Grant is free balance; users often call it "credits". The console shows
amounts and limits — do not quote them from memory.

## Commands

| Command | Purpose |
|---|---|
| `glasser login` | Browser device authorization; stores a Key |
| `glasser search ["<query>"] [--limit N] [--cursor C] [--task T] [--user-request "<sentence>"]` | Search Endpoints, 5 per page (max 20); `-q`/`--query` takes the same query; use `--query=<query>` when it starts with `-`; the footer prints the match total, the task id, and the next-page cursor for `--cursor` |
| `glasser inspect -p <provider> -e <endpoint> [--endpoint-version N] [--task T]` | Schemas, current Price, charge clauses, supported version |
| `glasser run -p <provider> -e <endpoint> [-i '<json>' \| -f <file>] [--idempotency-key K] [--task T] [--wait] [--wait-timeout s] [-o file]` | Execute an Endpoint |
| `glasser runs list [--limit --cursor --status --provider --endpoint --task]` | List past Runs; `--task` is an exact match |
| `glasser runs get -r <runId> [--wait] [-o file]` | Fetch one Run |
| `glasser runs stop -r <runId>` | Stop a queued/running Run |
| `glasser balance` | Balance, held and available; doubles as the auth probe |
| `glasser balance history [--limit --cursor --kind]` | Ledger of charges, refunds, top-ups and Grants |
| `glasser keys add/list/activate/remove` | Manage Keys stored on this machine |

Global flags: `-j/--json` (raw JSON to stdout, errors as a single JSON
object on stderr), `--help`, `--version`.

Facts that matter when scripting:

- Exit codes: `0` success, `1` runtime failure, `2` usage error, `130`
  interrupted.
- In `-j` mode, stdout is data only; parse stderr for the error object.
- For large outputs, prefer `-o <file>` and read the file selectively —
  dumping a full provider payload into your context wastes it.
- Money is always an **exact decimal string** (e.g. `"0.0125"`), never a
  float. Do not do float arithmetic on it.
- Env: `GLASSER_API_KEY`, `GLASSER_API_BASE_URL` (default
  `https://api.glasser.ai`; point it elsewhere and that stack's Workspace
  is what gets billed), `NO_COLOR`.

## Run statuses and waiting

| Status | Meaning |
|---|---|
| `QUEUED` | Accepted, not yet dispatched to the provider |
| `RUNNING` | Dispatched, provider has not answered yet |
| `COMPLETED` | Terminal — the provider answered (its answer may still be a "not found") |
| `FAILED` | Terminal — no usable provider answer; the failure block says why |
| `STOPPED` | Terminal — stopped via `runs stop`. Dispatch wins the race: a Run already sent to the provider completes and is charged |

Inspect shows each Endpoint's run mode: a `sync` Endpoint returns the
finished Run in the same response (its timeout is printed next to the
mode) — `--wait` on those adds nothing. For anything still `QUEUED` or
`RUNNING`, either pass `--wait` up front or poll with
`glasser runs get -r <runId> --wait`; interactive sessions that want to
keep talking can fire without `--wait` and poll between replies.

## Troubleshooting

| Symptom | Meaning / action |
|---|---|
| `Invalid or missing API key` | Check the Key source. If `GLASSER_API_KEY` is set, correct it through its owner; login does not replace it. With no environment Key, use `glasser login` to replace a missing or rejected local Key |
| Exit `2` | Your command line is wrong — fix it from the message; nothing reached the API and nothing was charged |
| `Input does not match the endpoint's input schema` | Read the `issues:` lines under the error — they name the exact field and constraint. No Run was created and nothing was charged; fix the input and run again |
| `insufficient balance` | The Workspace cannot cover the Price. Tell the user to add funds in the console (see **Adding funds**) — do not retry |
| `rate_limited` | The Workspace or the endpoint is at its limit. Wait `retry_after_ms` (the error carries it; the hint prints it), then retry the same command once — do not loop |
| Transport error / timeout with a retry hint | Outcome unknown — a Run may exist. Retry with the SAME Idempotency-Key exactly as the hint prints it |
| `FAILED` with a charge shown | Legitimate when the charge clauses say so — report both the failure and the charge |
| `Update available` notice | Finish the current task, re-run the installer, then re-fetch this file |

## Running safely

- `run` prints `Charge: $X (rule)` — the amount billed under the
  endpoint's charge rule. Report that number to the user.
- `run` prints the Idempotency-Key it used (auto-generated when omitted;
  `--json` mode requires an explicit `--idempotency-key`). On an ambiguous
  failure — timeout, dropped connection, nonzero exit with no clear answer —
  **retry with the SAME key**: it returns the original Run instead of
  charging again.
- **Two indicators, not one.** A Run's status and the provider's response
  are separate. `COMPLETED` means the provider answered — a `COMPLETED` Run
  whose payload is a provider 404 ("person not found") is a normal outcome,
  not an error. Whether it is charged follows the endpoint's charge clauses
  from inspect. Report both the Run status and what the provider actually
  said.
- Use `--wait` to block until the Run settles; without it, poll with
  `glasser runs get -r <runId> --wait`.

## Rules for agents

1. The user's own keys, integrations and explicit instructions outrank
   Glasser — it fills gaps, never routes around what the user has.
2. Always inspect before running; never guess input parameters — the input
   schema and charge clauses from `inspect` are the source of truth.
3. Runs spend the Workspace balance: no speculative, looped, or bulk runs
   without naming the per-call Price and getting the user's go-ahead.
4. Start with small volume parameters; raise them only on request.
5. Interactive auth is `glasser login` — never ask the user to paste a Key.
6. On an ambiguous failure, retry with the SAME Idempotency-Key.
7. Carry the SAME `--task` through one piece of work, the way you carry that
   key — search prints it, inspect and run take it.
8. Report two indicators after every run — the Run status and what the
   provider said — plus the printed `Charge:` amount, and the `Run URL` as a
   URL rather than a bare Run id for the Runs your answer used.
9. Money is an exact decimal string; never do float arithmetic on it.
10. Prefer `-o <file>` for large outputs; `-j` when you parse.
11. When any command prints an `Update available` notice: finish the task,
    re-run the installer, re-fetch this file.
12. The CLI is the source of truth for flags — run `glasser <command>
    --help` when unsure.
13. `rate_limited` means back off: wait `retry_after_ms`, then retry the
    same command once; never loop on it.

`--endpoint-version` selects a supported compatible contract. It does not lock Price.
Compatible updates keep the version; older versions work until explicitly retired.
New Runs use the selected version's Price at admission. Accepted Runs keep their original Price.
