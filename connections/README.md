# 🔌 Connections

> Source connection definitions for the **Agentic Fraud Detection Pipeline**.

---

## 📂 Source Connections

| Badge | Connection | Description |
|-------|-----------|-------------|
| 🟨 | `#connection:read_local_files` | Local CSV files in `data/` |

---

## ⚙️ Configuration

Connection parameters are defined per environment in **profiles**.

```
profiles/
 ├── agentic_fraud_profile.yaml  → base profile
 ├── workspace_template.yaml     → workspace environment template
 └── deployment_template.yaml    → deployment environment template
```

---

<details>
<summary>💡 Quick Tips</summary>

- Use **source connections** to define where raw input data is read from.
- To ingest from cloud storage instead of local files, replace `#connection:read_local_files` with a GCS, S3, or ADLS connection — no changes to transform logic are needed.
- Profile-level overrides allow the same pipeline to run across environments without code changes.

</details>
