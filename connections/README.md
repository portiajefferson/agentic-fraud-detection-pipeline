# 🔌 Connections

> Data plane and source connections for **Otto's Expeditions**.

---

## 🟦 Data Plane Connections

Each platform has a dedicated data plane connection:

| Badge | Connection | Platform |
|-------|-----------|----------|
| 🟦 | `#connection:data_plane_bigquery` | Google BigQuery |
| 🟧 | `#connection:data_plane_databricks` | Databricks Unity Catalog |
| 🟨 | `#connection:data_plane_duckdb` | DuckDB with DuckLake |
| 🟩 | `#connection:data_plane_duckdb_postgres` | DuckDB with Postgres metadata |
| 🟪 | `#connection:data_plane_motherduck` | MotherDuck cloud |
| 🩵 | `#connection:data_plane_snowflake` | Snowflake |

---

## 🟩 Source Connections

| Badge | Connection | Description |
|-------|-----------|-------------|
| 🟩 | `#connection:read_gcs_lake` | GCS bucket for source data |
| 🟨 | `#connection:read_local_files` | Local files in `data/` |

---

## ⚙️ Configuration

> Connection parameters are defined in **profiles**.

Each workspace/deployment profile specifies the appropriate **catalog**, **schema**, or **dataset** for data isolation.

```
profiles/
 ├── dev      → development catalog/schema
 ├── staging  → staging catalog/schema
 └── prod     → production catalog/schema
```

---

<details>
<summary>💡 Quick Tips</summary>

- Use **data plane connections** to define where transformed data is written and queried.
- Use **source connections** to define where raw input data is read from.
- Profile-level overrides allow the same pipeline to run across environments without code changes.

</details>
