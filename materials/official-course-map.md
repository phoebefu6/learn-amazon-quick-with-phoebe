# Official course map - learn-amazon-quick-with-phoebe

Three-session crash course on Amazon Quick (AWS's agentic workspace, launched October 2025 as Amazon Quick
Suite, documented today as "AWS Quick" / "Amazon Quick"). Sources read 2026-11-26.

**Re-verify the pricing page, regions page and What's New feed before every delivery.** Quick has been renamed
twice, absorbed Q Business, and reshaped its pricing during 2026. re:Invent 2026 falls the week after this build.

Running case: **Oakmere Insurance**, constructed. A regional insurer with an in-house knowledge platform
("Compass": S3 lake, Glue catalog, Lake Formation PII tiers, read-only Athena text-to-SQL, a RAG chatbot,
an MCP server for AI agents, all inside its own AWS account in Singapore). Every Oakmere number is invented.

## Tiers

- **T1** read on an AWS page (docs.aws.amazon.com, aws.amazon.com) on 2026-11-26
- **T2** independent source, named
- **UNVERIFIED** looked for, not found; never stated as fact on a page

## Session coverage

| Session | Covers | Sources |
|---|---|---|
| 01 What Quick is | lineage (QuickSight + Q Business, rename, Q Business closed); the parts (Sight, Index, Spaces, chat agents, Research, Flows, Automate, actions, MCP client); plans and who can build what | Quick product page, FAQs, Spaces docs, knowledge-base docs, MCP docs, Q Business availability page, pricing page |
| 02 Cost, data path, controls | agent hours and the account fee; where data is stored and where prompts are processed; Enterprise-only controls; document ACLs; Lake Formation reach; audit logs; action risk | pricing page, regions page, outbound connections, security best practices, agentic security, data protection, Athena trusted identity propagation, compliance |
| 03 Build or buy | lock-in (asset export, MCP direction, model choice); total cost framing; three options; the bench | asset bundle export, MCP docs, Automate custom agents, Bedrock global CRIS, Topic curation blog |

## Verified facts (T1 unless marked)

- GA 2025-10-09 as Amazon Quick Suite (T2 GeekWire, atlan). Docs now at docs.aws.amazon.com/quick/.
- Q Business closed to new customers; AWS pages give 30 or 31 July 2026 (they differ by a day).
- Plans (organization, need an AWS account): Essentials $3, Professional $20, Enterprise $40 per user per month.
  Agent hours included per user per month: 1 (3 until 2027-01-31), 8, 18. Pooled index storage per user: 1, 25, 50 GB.
- $250 per AWS account per month infrastructure fee on every organization plan.
- Overage $3 per agent hour; index storage $5 per GB-month beyond the pool (original file size at source).
- Agent hours metered per second while Quick is active, including waiting on external tool calls; scheduled
  tasks consume hours on every run. Fast/Balanced/Smart modes burn at different, unpublished rates.
- Professional cannot create dashboards or Quick Sight datasets; Enterprise adds those, Automate, certified assets.
- Individual plans: Free $0, Plus $20 annual / $25 monthly (up to 300 users), Max $100 / $125. No account fee.
- SPICE $0.38 per GB-month. Trial: 30 days, up to 25 Enterprise users, fee waived, then bills.
- Legacy QuickSight Readers map to Essentials; Authors to Enterprise until 2027-03-31.
- Spaces: up to 10,000 files, under 10 GB each; uploads 500 MB PDF/Word/PowerPoint, 50 MB other.
- Knowledge base connectors include S3, SharePoint, OneDrive, Google Drive, Confluence, web crawler; daily
  sync default; a sync run capped at 14 days. Index auto-scales to 2 TB per account.
- Document ACLs honoured for S3, Google Drive, SharePoint, Confluence Cloud, OneDrive only; chosen permanently
  at knowledge-base creation; fails closed; permission changes sync every 24 h by default; ACL knowledge
  bases do not work with Quick Research.
- MCP: Quick is an MCP client. Enterprise only, remote servers only (streamable HTTP or SSE, no stdio),
  private servers through a VPC connection, 100 tools per server, OAuth (PKCE + DCR) or service auth.
  No documented way for outside agents to call Quick over MCP (UNVERIFIED that none exists).
- MCP timeout: AWS docs say 5 minutes; T2 ecorpit says 60 seconds. Contested - taught as "test it".
- Dataset Q&A (text-to-SQL) GA 2026-05-04: SPICE, Redshift, Athena, Aurora PostgreSQL, Iceberg in S3 table
  buckets; respects row- and column-level security; "Explain" shows the SQL.
- Accuracy of natural-language questions depends on curated synonyms and verified questions (AWS BI blog).
- Stored customer data does not leave the Quick home Region. Prompts can be processed cross-Region within a
  geography; customers cannot disable it, and CloudTrail/CloudWatch do not record the inference Region.
- Regions table lists Singapore, Mumbai and Sao Paulo as "Global" cross-Region inference. Bedrock defines
  global inference as any commercial Region.
- Agentic features in 12 Regions: us-east-1, us-west-2, ap-south-1, ap-southeast-1, ap-southeast-2,
  ap-northeast-1, eu-central-1, eu-west-1, eu-west-2, eu-west-3, sa-east-1, us-gov-west-1.
  Not in Ohio, Seoul, Jakarta, Malaysia, Canada, Stockholm, Zurich, Milan, Spain, UAE, Hong Kong.
- No training on customer data on any plan.
- Customer-managed KMS keys: Enterprise only, registered before any resource exists, the "Amazon Q data" key
  can never be changed, chat memory is off with CMK.
- VPC connections to private sources, private MCP servers: Enterprise. IP/VPC-endpoint rules restrict the web
  app, not the public API.
- Lake Formation per-user rules apply only through IAM Identity Center trusted identity propagation on
  direct Athena queries; same Region; SPICE not supported. Chat/agent enforcement of LF: UNVERIFIED.
- CloudTrail logs metadata only; chat logs ship to CloudWatch/S3/Firehose, off by default, exclude retrieved
  text; no real-time alerting.
- Automations run with service-level sign-in, not the creator's permissions; web actions run with no human
  review by default; MCP/HTTP connectors can be added without auth; new AI features on for all users unless
  deny-by-default (Enterprise).
- Compliance: SOC, ISO 9001/27001/27018/27019, PCI DSS, HIPAA-eligible, FedRAMP; agentic in GovCloud West.
- Dashboards, analyses, datasets, data sources, themes export as JSON or CloudFormation asset bundles, data
  not included, 20 MB compressed cap. No export found for agents, flows, spaces (UNVERIFIED that none exists).
- Chat offers speed modes, no model list. Automate custom agents can use a chosen Bedrock model, billed apart.
- Identity: IAM Identity Center recommended; switching away from it means ending the subscription.

## UNVERIFIED (never stated as fact)

Whose AWS account holds the Quick index and embeddings; the model behind each mode; burn rate per mode;
whether Enterprise-only controls cover Professional users in a mixed account; total connector count; whether
agent hours pool across users.

## Seams with siblings

- `learn-aws` owns S3, IAM, Glue, Athena, Redshift. Linked, not retaught.
- `learn-rag` owns retrieval design; `learn-mcp` owns the protocol; `learn-data-access-control` owns
  masking and row/column policy theory; `learn-business-intelligence` owns dashboard design.
- Planned AWS platform series (medallion lake, Lake Formation and Athena, agent-ready platform) owns
  building the in-house side.

## Not covered

Hands-on dashboard authoring in Quick Sight; Quick Automate build; the desktop app; Microsoft 365, Slack and
browser extensions; the custom app builder (preview); GovCloud specifics; any certification.
