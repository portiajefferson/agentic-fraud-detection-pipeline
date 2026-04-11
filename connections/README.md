# 🔌 Connections

> Data plane and source connection definitions for the **Agentic Fraud Detection Pipeline**.

---

## 🟦 Data Plane Connections

Each platform has a dedicated data plane connection. Set the active platform by selecting the matching profile template.

| Badge | Connection | Platform | Profile template |
|-------|-----------|----------|-----------------|
| 🟦 | `#connection:data_plane_bigquery` | Google BigQuery | `profiles/bigquery_template.yaml` |
| 🟧 | `#connection:data_plane_databricks` | Databricks Unity Catalog | `profiles/databricks_template.yaml` |
| 🟨 | `#connection:data_plane_duckdb` | DuckDB | `profiles/duckdb_template.yaml` |
| 🟩 | `#connection:data_plane_duckdb_postgres` | DuckDB with Postgres metadata | `profiles/duckdb_postgres_template.yaml` |
| 🟪 | `#connection:data_plane_motherduck` | MotherDuck cloud | `profiles/motherduck_template.yaml` |
| 🩵 | `#connection:data_plane_snowflake` | Snowflake | `profiles/snowflake_template.yaml` |

---

## 🟩 Source Connections

| Badge | Connection | Description |
|-------|-----------|-------------|
| 🟨 | `#connection:read_local_files` | Local CSV files in `data/` |
| 🟩 | `#connection:read_gcs_lake` | GCS bucket at `gs://ascend-ottos-expeditions/` |

---

## ⚙️ Configuration

Connection parameters are defined per environment in **profiles**. Each profile template corresponds to a target platform and sets the `data_plane.connection_name` used by `ascend_project.yaml` defaults.

```
profiles/
 ├── agentic_fraud_profile.yaml    → base profile
 ├── bigquery_template.yaml        → Google BigQuery
 ├── databricks_template.yaml      → Databricks Unity Catalog
 ├── duckdb_template.yaml          → DuckDB
 ├── duckdb_postgres_template.yaml → DuckDB with Postgres metadata
 ├── motherduck_template.yaml      → MotherDuck cloud
 ├── snowflake_template.yaml       → Snowflake
 ├── workspace_template.yaml       → generic workspace template
 └── deployment_template.yaml      → generic deployment template
```

To switch platforms, activate the corresponding profile. All flows inherit the data plane from `ascend_project.yaml` automatically — no flow-level changes required.

---

<details>
<summary>💡 Quick Tips</summary>

- Use **data plane connections** to define where transformed data is written and queried.
- Use **source connections** to define where raw input data is read from.
- Profile-level overrides allow the same pipeline to run across environments without code changes.
- Replace `#connection:read_local_files` with `#connection:read_gcs_lake` in any read component to switch from local CSV to GCS parquet inputs.

</details>
