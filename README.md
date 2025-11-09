# Fashion-Fusion — Run locally

This repository contains a full-stack Vite + Express app. The server bundles the client in production. Below are instructions to run it locally (PowerShell) and with Docker Compose.

## Prerequisites
- Node.js 18+ (recommended)
- npm (bundled with Node)
- A Postgres-compatible database (local or cloud). Docker is the quickest way to run Postgres locally.
- Docker & Docker Compose (if you want to use Docker)

## Quick: run locally (PowerShell)
1. Install dependencies

```powershell
npm install
```

2. Set environment variables for the session (PowerShell)

```powershell
$env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/fashion'
$env:PORT = '5000'
```

3. Apply migrations

```powershell
npm run db:push
```

4. (Optional) Seed demo data

```powershell
npx tsx server/seed.ts
```

5. Start dev server (backend + vite dev middleware)

```powershell
npm run dev
```

Open http://localhost:5000

## Run with Docker Compose (recommended for reproducible dev)

1. Copy `.env.example` to `.env` and edit if you want. By default compose uses a local Postgres container.

2. Start services

```powershell
cat > .env << 'EOF'
POSTGRES_PASSWORD=SimplePass123
JWT_ACCESS_SECRET=st7NdZ0ajIy2VDgShc+pZl2BpgXwN8ULBUEJoYrVwyM=
JWT_REFRESH_SECRET=We9OJic3RyUZcVOlZknOFtpe/Mc3cpnWEO83D2NtYc0=
EOF

docker compose up --build
```

This will build the `api` and `web` images and start Postgres. The services are mapped to host ports:

- api: http://localhost:5000 (API endpoints)
- web: http://localhost:3000 (static client served by nginx)

The nginx in the `web` container proxies requests under `/api` to the `api` service, so client-side code using relative `/api` paths will continue to work.

3. Seed the database (one-off)

```powershell
docker compose run --rm seed
```

This runs the `db:push` migration and executes the seed script against the `db` service.

## Production build (locally)

Build the client and bundle the server:

```powershell
npm run build
```

Start the built server (ensure `DATABASE_URL` and production JWT secrets are set):

```powershell
$env:DATABASE_URL = '...'
$env:JWT_ACCESS_SECRET = '...'
$env:JWT_REFRESH_SECRET = '...'
npm run start
```

## Notes & troubleshooting
- If you get an error saying `DATABASE_URL must be set`, export the env var in the same shell session before running the app.
- Cloudinary upload requires `CLOUDINARY_*` env vars.
- If `npx tsx` fails, install `tsx` dev dependency: `npm install -D tsx`.

## Files added
- `Dockerfile.api` — multi-stage build for the API/service.
- `Dockerfile.web` — multi-stage build for the client static site (served via nginx) and nginx config.
- `docker-compose.yml` — Postgres, `api`, `web`, and a `seed` one-off service.
- `nginx.conf` — nginx config for the `web` service to proxy `/api` to the `api` service.
- `.env.example` — example env vars.
- `.dockerignore` — reduce build context.
- `README.md` — this file.

## Deploy infra to AWS with CloudFormation

This repository includes a CloudFormation template at `cloudformation/fashion-fusion-infra.yaml` that creates a minimal, parameterized skeleton for:

- ECR repositories (`fashion-frontend`, `fashion-backend`)
- ECS Cluster and TaskDefinition
- IAM roles (ECS execution/task, CodeBuild, CodePipeline)
- A CodeBuild project configured to use the included `buildspec.yml`
- A CodePipeline skeleton wired to a GitHub (CodeStar) connection

Use the instructions below to deploy the template either from the Console or via the AWS CLI (PowerShell examples).

### Prerequisites

- AWS CLI configured with credentials (run `aws configure` or use an assumed role).
- An AWS CodeStar connection for GitHub (Console: Developer Tools → Connections → Create connection → GitHub).
- At least two subnet IDs in the VPC where you want to run Fargate tasks.
- A security group ID to attach to the ECS service ENIs.

### Required template parameters (brief)

- AwsAccountId — your AWS account id (e.g. 123456789012)
- GitHubConnectionArn — the ARN of the CodeStar connection created for GitHub
- GitHubRepo — the GitHub repo in `owner/repo` format (e.g. `Whoisabi/Fashion-Fusion`)
- GitHubBranch — branch to use (default: `main`)
- SubnetIds — comma-separated list of at least two subnet IDs (e.g. `subnet-aaa,subnet-bbb`)
- ServiceSecurityGroup — security group id to attach to the ECS service (e.g. `sg-0123456789abcdef0`)

> NOTE: Replace example values with your real account-specific values. The template is intentionally parameterized so it plugs into an existing VPC.

### Deploy via AWS Console (recommended for first-time use)

1. Open the CloudFormation Console.
2. Click "Create stack" → "With new resources (standard)".
3. Upload `cloudformation/fashion-fusion-infra.yaml` from this repository.
4. Fill the parameter values (AwsAccountId, GitHubConnectionArn, GitHubRepo, GitHubBranch, SubnetIds, ServiceSecurityGroup).
5. Check the box to acknowledge it will create IAM resources (CAPABILITY_NAMED_IAM) and click "Create stack".
6. After the stack completes, check the Outputs to find the created ECR URIs and the pipeline name. Visit CodePipeline to watch the pipeline run.

### Deploy via AWS CLI (PowerShell)

Example (replace values with your real ones):

```powershell
# Set variables (edit these values)
$AccountId = '183631348877'
$ConnectionArn = 'arn:aws:codestar-connections:us-east-1:183631348877:connection/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
$Repo = 'Whoisabi/Fashion-Fusion'
$Branch = 'main'
$SubnetIds = 'subnet-aaa,subnet-bbb'
$ServiceSG = 'sg-0123456789abcdef0'

# Deploy the CloudFormation template (creates IAM resources so we pass the capability flag)
aws cloudformation deploy `
	--template-file cloudformation/fashion-fusion-infra.yaml `
	--stack-name fashion-fusion-infra `
	--parameter-overrides `
		AwsAccountId=$AccountId `
		GitHubConnectionArn=$ConnectionArn `
		GitHubRepo=$Repo `
		GitHubBranch=$Branch `
		SubnetIds="$SubnetIds" `
		ServiceSecurityGroup=$ServiceSG `
	--capabilities CAPABILITY_NAMED_IAM

# Wait for completion (optional)
aws cloudformation wait stack-create-complete --stack-name fashion-fusion-infra

# View outputs
aws cloudformation describe-stacks --stack-name fashion-fusion-infra --query "Stacks[0].Outputs"
```

### After deployment

- Open the CodePipeline console and watch the pipeline run. The pipeline uses the CodeStar connection you provided to pull source code from GitHub.
- CodeBuild will run the repository `buildspec.yml`, build Docker images, push them to the ECR repos created by the template, and write `imagedefinitions.json` so the ECS deploy action updates the service.
- Confirm the ECS service `fashion-service` is created and the task definition is registered. Use the ALB DNS (if you configured an ALB) to access the frontend.

### Troubleshooting tips

- If the pipeline fails at the source stage, verify the CodeStar connection ARN and that the connection is authorized for the repo/branch.
- If CodeBuild fails to push to ECR, ensure the CodeBuild role has ECR permissions (the template creates a role with ECR access, but you may need to tighten or expand it depending on your org policies).
- If tasks cannot access Secrets Manager, verify the ECS Task Execution Role has the correct secret ARNs in its policy.

If you'd like, I can extend the CloudFormation template to also create a new RDS database and the VPC/subnets (I left those out to avoid accidentally creating costly resources). Ask and I will add that as an optional stack parameter.

If you want, I can:
- Add an `npm run seed` script (already added),
- Add a simple `Makefile` or PowerShell script to set env vars automatically on Windows,
- Create a `docker-compose.override.yml` to mount local code for live-editing the app inside the container.
