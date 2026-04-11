# 🛡️ Agentic Fraud Detection Pipeline

> Combining transaction and behavioral signals to identify financial exploitation and automate risk monitoring on Microsoft Fabric.

[![Flow](https://img.shields.io/badge/flow-fraud__detection-blue)](#fraud-detection-flow)
[![Platform](https://img.shields.io/badge/platform-Microsoft%20Fabric-purple)](#runtime-and-platform-model)
[![Status](https://img.shields.io/badge/status-active-brightgreen)](#operational-checklist)

---

## 📋 Table of Contents

- [What this project does](#what-this-project-does)
- [Architecture overview](#architecture-overview)
- [Repository layout](#repository-layout)
- [Runtime and platform model](#runtime-and-platform-model)
- [Connections](#connections)
- [Fraud detection flow](#fraud-detection-flow)
- [Automations and orchestration](#automations-and-orchestration)
- [Local datasets](#local-datasets)
- [How to run the project](#how-to-run-the-project)
- [How to extend the project](#how-to-extend-the-project)
- [Technical design notes](#technical-design-notes)
- [Operational checklist](#operational-checklist)

---

## 🔍 What this project does

This project is organized around a single data plane and a local file source connection:

- `#connection:read_local_files` supplies CSV inputs for the fraud detection flow
- `#flow:fraud_detection` drives end-to-end fraud scoring and monitoring
- `#automation:fraud_detection` schedules the flow to run hourly

At a high level:

1. Source data is read from local CSV files.
2. Transforms evaluate message and transaction risk signals.
3. Both signals are joined and scored per user.
4. Curated fraud risk outputs are materialized for dashboards and alerts.
5. An automation orchestrates scheduled flow execution.

---

## 🏗️ Architecture overview

```mermaid
flowchart TD
    A["📄 Local CSV data\ndata/transactions.csv\ndata/messages.csv"] --> B["⚙️ #flow:fraud_detection"]

    B --> C["📊 #component:fraud_risk_dataset"]
    B --> D["📈 #component:fraud_monitoring_summary"]

    C --> E["🔔 #automation:fraud_detection"]

    subgraph "Data Plane"
      C
      D
    end
```

---

## 📁 Repository layout

| Path | Purpose |
|------|---------|
| `automations/` | Event-driven and scheduled orchestration definitions |
| `connections/` | Source connection definitions |
| `data/` | Local CSV inputs used by the fraud detection flow |
| `flows/` | Business pipeline and component implementations |
| `profiles/` | Workspace and deployment profile templates |
| `screenshots/` | Placeholder for UI screenshots |

---

## ⚙️ Runtime and platform model

The project uses local file ingestion and a configurable data plane set in each profile.

```yaml
# ascend_project.yaml
project:
  name: agentic-fraud-detection-pipeline
```

Profiles in `profiles/` define environment-specific parameters (workspace vs. deployment). This keeps credentials and environment settings out of source control while allowing the same pipeline to run in multiple contexts.

---

## 🔌 Connections

### Source connection

`#connection:read_local_files` reads CSV files from the `data/` directory.

```yaml
# connections/read_local_files.yaml
connection:
  name: read_local_files
  type: local_file
  parameters: {}
```

> [!TIP]
> Swap this for a cloud storage connection (GCS, S3, ADLS) to ingest from a data lake without changing any transform logic.

---

## 🚨 Fraud detection flow

### Flow purpose

`#flow:fraud_detection` is an end-to-end risk-scoring pipeline. It reads two local datasets, independently classifies messaging and transaction behavior, joins them by user, and produces row-level fraud risk outputs.

```yaml
# flows/fraud_detection/fraud_detection.yaml
flow:
  name: fraud_detection
  version: 0.1.0
  description: >-
    End-to-end fraud detection pipeline that joins uploaded transactions and
    messages and computes risk scores.
```

### Flow DAG

```mermaid
flowchart LR
    A["📄 #component:read_transactions"] --> C["🔍 #component:fraud_risk_dataset"]
    B["📄 #component:read_messages"] --> C
    C --> D["📊 #component:fraud_monitoring_summary"]
    C --> E["🔔 #automation:fraud_detection"]
```

### Inputs

The flow reads demo CSV files from the repository:

| File | Component | Purpose |
|------|-----------|---------|
| `data/transactions.csv` | `#component:read_transactions` | Transaction behavior signals |
| `data/messages.csv` | `#component:read_messages` | User message content signals |

```yaml
# flows/fraud_detection/components/read_transactions.yaml
component:
  read:
    connection: read_local_files
    local_file:
      path: data/transactions.csv
```

```yaml
# flows/fraud_detection/components/read_messages.yaml
component:
  read:
    connection: read_local_files
    local_file:
      path: data/messages.csv
```

### Fraud scoring logic

`#component:fraud_risk_dataset` is a pandas-based transform that evaluates two independent risk dimensions and combines them into a single score per user.

#### 🔴 Risk scoring rules

**Message risk** — based on language in `message_text`:

| 🔴 HIGH | 🟡 MEDIUM | 🟢 LOW |
|---------|----------|--------|
| Contains: `urgent`, `wire`, `immediately`, `payment` | Contains: `verify`, `action required` (if not HIGH) | No suspicious terms |

**Transaction risk** — based on `amount` and `is_new_recipient`:

| 🔴 HIGH | 🟡 MEDIUM | 🟢 LOW |
|---------|----------|--------|
| Amount > 1000 **and** new recipient | Amount between 300–1000 | Amount ≤ 300 or known recipient |

**Combined overall score:**

| Message risk | Transaction risk | Overall score |
|-------------|-----------------|--------------|
| 🔴 HIGH | 🔴 HIGH | 🔴 HIGH |
| 🔴 HIGH | any | 🟡 MEDIUM |
| any | 🔴 HIGH | 🟡 MEDIUM |
| 🟡 MEDIUM | 🟡 MEDIUM | 🟡 MEDIUM |
| 🟢 LOW | 🟢 LOW | 🟢 LOW |

#### Output schema

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | string | User identifier (join key) |
| `transaction_id` | string | Transaction identifier |
| `message_id` | string | Message identifier |
| `amount` | float | Transaction dollar amount |
| `message_text` | string | Original message content |
| `transaction_risk_flag` | string | `HIGH` / `MEDIUM` / `LOW` |
| `message_risk_flag` | string | `HIGH` / `MEDIUM` / `LOW` |
| `overall_risk_score` | string | `HIGH` / `MEDIUM` / `LOW` |
| `requires_immediate_review` | bool | `True` when overall score is `HIGH` |
| `risk_reason` | string | Human-readable explanation of the score |

### Fraud monitoring summary

`#component:fraud_monitoring_summary` rolls the dataset into a single-row operational summary suitable for dashboards and health checks.

**Metrics produced:**

- Total processed records
- 🔴 High / 🟡 Medium / 🟢 Low risk counts
- Percentage of high-risk records
- Latest pipeline run timestamp

> [!NOTE]
> `fraud_monitoring_summary` is the recommended source for KPI dashboards. Query it instead of aggregating `fraud_risk_dataset` at query time.

---

## 🤖 Automations and orchestration

| Automation | Trigger | Action |
|------------|---------|--------|
| `#automation:fraud_detection` | Hourly cron (`0 * * * *`) | Runs `#flow:fraud_detection` |

```yaml
# automations/fraud_detection.yaml
automation:
  name: fraud_detection
  enabled: true
  triggers:
    sensors:
      - type: timer
        name: daily-fraud-detection
        config:
          schedule:
            cron: 0 * * * *
  actions:
    - type: run_flow
      name: run-fraud-detection
      config:
        flow: fraud_detection
```

> [!WARNING]
> Review the `enabled: true` flag before deploying to production. Disable automations in environments where scheduled runs are not intended.

---

## 📂 Local datasets

| File | Used by | Columns |
|------|---------|---------|
| `data/transactions.csv` | `#flow:fraud_detection` | `user_id`, `transaction_id`, `amount`, `is_new_recipient` |
| `data/messages.csv` | `#flow:fraud_detection` | `user_id`, `message_id`, `message_text` |

> [!NOTE]
> The CSV files in this repository are demo stubs. Replace the file contents with real data or swap the read components for a cloud storage connection to run the pipeline against production data.

---

## 🚀 How to run the project

### Prerequisites

- Active workspace with profile parameters set
- Source connections valid
- Project in `ready` build state

### Steps

1. Open the workspace tied to this project.
2. Confirm profile parameters are configured.
3. Build the project.
4. Run `#flow:fraud_detection`.
5. Review the `fraud_risk_dataset` output.

### Recommended execution order

```mermaid
flowchart TD
    A["🔨 Build project"] --> B["▶️ Run #flow:fraud_detection"]
    B --> C["📊 Review fraud_risk_dataset output"]
    B --> D["📈 Review fraud_monitoring_summary KPIs"]
```

---

## 🔧 How to extend the project

### Add a new fraud signal

1. Add a new field to `data/transactions.csv` or `data/messages.csv`, or introduce a new read component.
2. Extend `#component:fraud_risk_dataset` with an additional risk flag column.
3. Update `risk_reason` logic to preserve explainability.
4. Add or tighten component tests.

### Add a new input source

1. Add a new connection definition under `connections/`.
2. Add a read component under `flows/fraud_detection/components/`.
3. Wire the new component into `fraud_risk_dataset` as an additional input.

### Add a downstream action

1. Create a new automation under `automations/`.
2. Trigger it from a completed flow run or a threshold condition on `fraud_risk_dataset`.

---

## 🧠 Technical design notes

### Why this project is useful

This repository is a compact working example of several Ascend patterns:

- YAML read components for local file ingestion
- Pandas Python transforms with data quality tests
- Event-driven automations around a central business pipeline
- Explainable risk scoring with `risk_reason` and `requires_immediate_review` flags

### Data modeling style

The project favors:

- Simple, explicit component boundaries
- Curated outputs with clear business meaning
- Small, readable transforms over heavily abstracted logic
- Explainability columns alongside every risk score

### Risk scoring design

Scoring is intentionally two-dimensional and independently computed so that each signal can be adjusted without breaking the other. The `overall_risk_score` is derived last from the two independent flags, making the logic auditable.

---

## ✅ Operational checklist

- [ ] Profile parameters configured in the active workspace
- [ ] `#connection:read_local_files` valid and pointing to `data/`
- [ ] Project build in `ready` state
- [ ] `#flow:fraud_detection` run completed successfully
- [ ] `#component:fraud_risk_dataset` contains expected rows
- [ ] `#component:fraud_monitoring_summary` shows correct KPIs
- [ ] `#automation:fraud_detection` enabled only in appropriate environments

---

## 📄 Related documentation

- [`connections/README.md`](connections/README.md) — connection configuration details

---

## 🗺️ File guide

| File | Why it matters |
|------|----------------|
| `README.md` | Primary project guide (this file) |
| `ascend_project.yaml` | Project name and global defaults |
| `flows/fraud_detection/components/fraud_risk_dataset.py` | Main fraud scoring business logic |
| `flows/fraud_detection/fraud_detection.yaml` | Flow definition and metadata |
| `automations/fraud_detection.yaml` | Hourly scheduling automation |
| `connections/read_local_files.yaml` | Local CSV source connection |
| `data/transactions.csv` | Transaction input data |
| `data/messages.csv` | Message input data |
