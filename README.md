# Glasser skills

Business skills for agents working on top of [Glasser](https://glasser.ai): each one is a task an agent is actually asked to do, written as a recipe over the Glasser catalog rather than over one vendor's API. One Key, no contract, pay per call.

Other skill libraries hand you the recipe and leave the plumbing to you. This one does not.

| | Typical skill library | Glasser skills |
|---|---|---|
| **Data access** | One environment variable per vendor; a 35-key `.env` is not unusual | `glasser login`, once |
| **Vendor lock** | Each skill is written against one API; swap the vendor and the skill breaks | Skills name capabilities; the catalog picks the endpoint |
| **Spend control** | Each key bills separately, with no view across them | One balance, price shown before every call, charge reported after |
| **Code in the skill** | Wrapper scripts per vendor to keep in step with each API | Markdown only; no scripts, no install step |

## Prerequisites

Skills here run on Glasser, and Glasser is installed separately so the two repositories can be reviewed and released on their own schedules.

Install one of:

- [glasser-ai/plugins](https://github.com/glasser-ai/plugins), which carries the `glasser` skill and the MCP server for Claude Code and other plugin-aware agents.
- The CLI: `npm i -g @glasser-ai/cli`, then `glasser login`.

How an agent calls Glasser is documented in one place: [glasser.ai/SKILL.md](https://glasser.ai/SKILL.md). Every skill here links to it and none of them repeat it.

`skills/glasser/` is a byte-identical mirror of that document's body, kept for skill catalogs that need a GitHub file to pin (its frontmatter carries a shorter description and `metadata.source`). Refresh it after a CLI release with `node scripts/sync-glasser-skill.mjs`.

## Installation

**With the skills CLI** ([vercel-labs/skills](https://github.com/vercel-labs/skills)):

```bash
npx skills add glasser-ai/skills                       # everything
npx skills add glasser-ai/skills --skill seo-audit     # one skill
npx skills add glasser-ai/skills --list                # see what is available
```

**As a Claude Code plugin:**

```
/plugin marketplace add glasser-ai/skills
/plugin install glasser-skills
```

**By hand:**

```bash
git clone https://github.com/glasser-ai/skills.git
cp -r skills/skills/* .agents/skills/
```

Each skill is one directory with one `SKILL.md` and stands on its own; copy only the ones you want.

## Skills

<!-- SKILLS:START -->
### Research

| Skill | What it does |
|---|---|
| [competitor-research](skills/competitor-research/) | Research competitors in depth from a name or domain: who is behind them, how they are funded, what they sell, where their traffic comes from, what they hire for, and where they spend on ads. |
| [ecommerce-ad-creative-research](skills/ecommerce-ad-creative-research/) | Research ecommerce competitors' public Meta and TikTok ads through Glasser, identify observable creative patterns, and propose evidence-linked ad tests. |
| [ecommerce-amazon-opportunity-scan](skills/ecommerce-amazon-opportunity-scan/) | Screen Amazon product niches through Glasser using multiple sources for search demand, ranked offers, customer reviews, price history, and selling economics. |
| [ecommerce-competitor-price-monitor](skills/ecommerce-competitor-price-monitor/) | Analyze competitor ecommerce price history through Glasser. |
| [ecommerce-review-insights](skills/ecommerce-review-insights/) | Analyze ecommerce product reviews for customer complaints, purchase reasons, and product-page or product-improvement hypotheses. |
| [glasser](skills/glasser/) | Find and call 1,000+ paid data endpoints with one key: person and company enrichment, people and company search, web, news, maps, scholar and shopping search, SEO, social media, US property data, scraping. |
| [investor-diligence](skills/investor-diligence/) | When an investor wants to research a company before putting money in — who runs it, how it is funded, whether the traction is real, what the risks are, and what has changed recently. |
| [product-demand-research](skills/product-demand-research/) | When the user wants to know whether people actually have the problem a product idea solves — what they complain about, what they ask for, what they use instead, and the words they use for it — drawn from public discussion on Reddit, YouTube, TikTok, Hacker-News-style forums and Chinese Q&A platforms. |
| [startup-analysis](skills/startup-analysis/) | When an investor wants to evaluate a startup as a potential investment — is the market big enough, is the team right, is the traction real, does it have a moat — and come away with a verdict. |

### Go-to-market

| Skill | What it does |
|---|---|
| [prospect-list](skills/prospect-list/) | When the user wants a list of companies to sell to and the people to contact at them — from an ICP, a set of filters, a known source such as an investor portfolio or a directory, or a list of company names. |

### SEO/GEO

| Skill | What it does |
|---|---|
| [ai-search-visibility](skills/ai-search-visibility/) | When the user wants to know whether AI search answers mention or cite their brand — in Google AI Overviews, Google AI Mode, ChatGPT, Perplexity, Gemini, Copilot — which questions trigger it, which pages get cited, who else is cited for the same questions, and how that is changing. |
| [seo-audit](skills/seo-audit/) | When the user wants to know how their own website is doing in search and what to do about it — an audit of technical health, rankings, keywords, backlinks and competitors, followed by a prioritised action plan; or a repeat of that audit to see what has changed. |

### Marketing

| Skill | What it does |
|---|---|
| [ad-intelligence](skills/ad-intelligence/) | When the user wants to see what a company is running in paid ads — on Meta (Facebook, Instagram, Threads), Google, LinkedIn and TikTok — what the ads say, which creatives have run longest, where they send people, and how the messaging differs by platform. |
| [influencer-prospecting](skills/influencer-prospecting/) | When the user wants creators to work with — influencers, KOLs, UGC creators, affiliates — for a product or category, across TikTok, Instagram, YouTube, X, Threads and LinkedIn, or Douyin, Xiaohongshu, Bilibili, Kuaishou and Weibo for China. |
| [social-trends](skills/social-trends/) | When the user wants to know what is trending on social platforms — right now across a whole platform, or inside a category they care about — and how those trends move: Douyin, Xiaohongshu, Weibo, Bilibili, Kuaishou and Zhihu on the China side; TikTok, YouTube, Instagram, Reddit and X elsewhere. |
| [youtube-kol-finder](skills/youtube-kol-finder/) | Find and qualify YouTube creators for product partnerships, sponsorships, or affiliate campaigns from a product description or website, a creator brief, or reference channels. |
<!-- SKILLS:END -->

## How the pieces fit

Three things have to be true for an agent to do paid research well, and they live in three places on purpose.

- **The mechanism** lives at [glasser.ai/SKILL.md](https://glasser.ai/SKILL.md): how to search the catalog, inspect an endpoint, run it, and the rules that keep a balance safe.
- **The recipe** lives here: for a given task, which capabilities to search for, what to confirm before spending, how to assemble and report the result.
- **The business context** lives with the user's own agent: their product, their customers, their exclusions. Skills declare what they need; they do not go and ask for it.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The short version: a skill is a repeated task, not a wrapper around one endpoint; it names capabilities, not vendors; it stops at the result and does not send, post, or buy anything.

## License

MIT, see [LICENSE](LICENSE).
