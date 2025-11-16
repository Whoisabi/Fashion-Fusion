# CloudFormation Templates

This directory contains Infrastructure as Code (IaC) templates for deploying Fashion Fusion to AWS.

## Templates

### `complete-stack.yaml` (RECOMMENDED)
**100% automated deployment** with zero manual configuration.

**Creates:**
- ✅ RDS PostgreSQL database with auto-generated password
- ✅ Secrets Manager secrets (auto-generated)
- ✅ Security Groups with proper rules
- ✅ ECS Fargate cluster and service
- ✅ Application Load Balancer
- ✅ ECR repositories
- ✅ CodePipeline CI/CD
- ✅ CloudWatch logging

**Cost:** ~$98/month (can be reduced to ~$66/month with optimizations)

**Deployment time:** 15-20 minutes

### `fashion-fusion-infra.yaml` (LEGACY)
Original template requiring manual setup of RDS and Secrets Manager.

**Use this only if** you need to manage RDS and secrets separately.

---

## Quick Start

### 1. Prerequisites

- AWS CLI configured
- Existing VPC with public and private subnets
- GitHub CodeStar connection ARN

### 2. Create Parameters File

Copy and customize `parameters-template.json`:

```bash
cp parameters-template.json parameters.json
# Edit parameters.json with your values
```

### 3. Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name fashion-fusion \
  --template-body file://cloudformation/complete-stack.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### 4. Monitor Deployment

```bash
aws cloudformation wait stack-create-complete --stack-name fashion-fusion
```

### 5. Get Application URL

```bash
aws cloudformation describe-stacks \
  --stack-name fashion-fusion \
  --query 'Stacks[0].Outputs[?OutputKey==`ApplicationURL`].OutputValue' \
  --output text
```

---

## What Gets Automated

### ✅ Zero Manual Configuration

All these are **auto-created and auto-configured**:

1. **Database Password** - Auto-generated 32-character secure password
2. **JWT Secrets** - Auto-generated access & refresh token secrets
3. **DATABASE_URL** - Auto-constructed from RDS endpoint
4. **Security Groups** - Correct ingress/egress rules configured
5. **IAM Roles** - Least privilege permissions set
6. **Network Routing** - ECS can reach RDS and internet
7. **Health Checks** - Properly configured for both containers
8. **Log Groups** - CloudWatch logs with 30-day retention

### ⚠️ One Manual Step

**GitHub Connection** - Must be created once via AWS Console:

1. Go to: AWS Console → Developer Tools → Connections
2. Create connection to GitHub
3. Copy the ARN
4. Use in `parameters.json`

This is a **one-time setup** that works for all deployments.

---

## Parameter Reference

| Parameter | Description | Example |
|-----------|-------------|---------|
| `GitHubConnectionArn` | CodeStar connection ARN | `arn:aws:codestar-connections:...` |
| `GitHubRepo` | Repository in owner/repo format | `Whoisabi/Fashion-Fusion` |
| `GitHubBranch` | Branch to deploy | `main` |
| `VpcId` | VPC ID | `vpc-0ed2789...` |
| `PublicSubnetIds` | 2+ public subnet IDs (comma-separated) | `subnet-xxx,subnet-yyy` |
| `PrivateSubnetIds` | 2+ private subnet IDs (comma-separated) | `subnet-aaa,subnet-bbb` |
| `DBInstanceClass` | RDS instance type | `db.t3.micro` |
| `DBAllocatedStorage` | Database storage in GB | `20` |
| `DBName` | PostgreSQL database name | `fashion_db` |
| `DBMasterUsername` | Master DB username | `postgres` |
| `DesiredTaskCount` | Number of ECS tasks | `1` |
| `TaskCpu` | Task CPU units | `1024` (1 vCPU) |
| `TaskMemory` | Task memory in MB | `2048` (2 GB) |

---

## Outputs

After deployment, get outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name fashion-fusion \
  --query 'Stacks[0].Outputs' \
  --output table
```

**Important outputs:**
- `ApplicationURL` - Your app's public URL
- `RDSEndpoint` - Database endpoint
- `FrontendECRUri` - ECR repository for frontend
- `BackendECRUri` - ECR repository for backend

---

## Updating the Stack

To update infrastructure (e.g., scale up):

```bash
# Edit parameters.json with new values

aws cloudformation update-stack \
  --stack-name fashion-fusion \
  --template-body file://cloudformation/complete-stack.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM
```

---

## Deleting the Stack

```bash
aws cloudformation delete-stack --stack-name fashion-fusion
```

⚠️ **Note:** RDS will create a final snapshot before deletion (DeletionPolicy: Snapshot)

---

## Troubleshooting

### Stack creation failed

```bash
# Check failure reason
aws cloudformation describe-stack-events \
  --stack-name fashion-fusion \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]' \
  --output table
```

### Common issues:

1. **Invalid subnet IDs** - Verify subnets exist in your VPC
2. **GitHub connection not authorized** - Complete CodeStar connection setup
3. **Missing ECR images** - Push initial Docker images before stack creates

---

## Cost Breakdown

Default configuration (~$98/month):

- RDS db.t3.micro: $15/month
- Fargate (1 vCPU, 2GB): $30/month
- ALB: $16/month
- NAT Gateway: $32/month (if using private subnets for ECS)
- Other: $5/month

**Optimization tips:**
- Use public subnets for ECS (remove NAT): save $32/month
- Use Fargate Spot: save ~$20/month
- Use RDS reserved instances: save 30-40%

---

## Architecture Diagram

```
                                Internet
                                   ↓
                      ┌─────────────────────┐
                      │  Application Load   │
                      │     Balancer        │ (Public Subnets)
                      └──────────┬──────────┘
                                 ↓
                      ┌─────────────────────┐
                      │   ECS Fargate Tasks │
                      │  Frontend + Backend │ (Public Subnets)
                      └──────────┬──────────┘
                                 ↓
                      ┌─────────────────────┐
                      │   RDS PostgreSQL    │ (Private Subnets)
                      └─────────────────────┘
                                 ↑
                      ┌─────────────────────┐
                      │  Secrets Manager    │
                      └─────────────────────┘
```

---

## Support

For detailed documentation, see: `../CLOUDFORMATION_DEPLOYMENT_GUIDE.md`

For AWS-specific troubleshooting: `../AWS_TROUBLESHOOTING_CHECKLIST.md`

For manual deployment: `../AWS_ECS_FARGATE_DEPLOYMENT.md`
